import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RuleCommand {
  action: "add" | "edit" | "delete" | "reorder" | "none";
  ruleText?: string;
  ruleIndex?: number;
  newPosition?: number;
  ruleSetName?: string;
  elaboration?: string;
  needsConfirmation?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check premium access
    const { data: premiumData } = await supabase.rpc("has_premium_access", {
      _user_id: user.id,
    });

    if (!premiumData) {
      return new Response(
        JSON.stringify({ 
          error: "Premium feature",
          message: "Voice rule editing is a premium feature. Upgrade to continue!" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { command, ruleSetId, currentRules, userRuleSets, mode = "parse" } = await req.json();

    // Build context about user's rule sets for name matching
    const ruleSetContext = userRuleSets && userRuleSets.length > 0 
      ? `\nUser's available rule sets:\n${userRuleSets.map((rs: any) => `- "${rs.name}" (ID: ${rs.id}, Game: ${rs.game_name})`).join("\n")}`
      : "";

    // Use Lovable AI to parse the natural language command
    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an intelligent house rules command parser for a card game app. You understand natural language requests about managing custom game rules.

IMPORTANT: Users can phrase their requests in many different ways. Understand the INTENT, not just specific keywords.

Current rule set being edited:
${currentRules && currentRules.length > 0 
  ? currentRules.map((r: any, i: number) => `${i + 1}. ${r.rule_text}`).join("\n")
  : "(No rules yet)"}
${ruleSetContext}

UNDERSTAND THESE TYPES OF REQUESTS:

ADD RULES - User wants to create a new rule:
- "add a rule: no skipping turns"
- "can you add that players must draw 2 cards when they skip?"
- "I want a new rule where you can't stack draw fours"
- "put in a rule about..."
- "create a rule for..."
- "we should have a rule that..."

EDIT RULES - User wants to change an existing rule:
- "change rule 2 to draw 4 cards instead"
- "update the rule about stacking"
- "can you modify rule 3 to say..."
- "fix the second rule to..."
- "edit rule 1"

DELETE RULES - User wants to remove a rule:
- "remove rule 3"
- "delete the stacking rule"
- "get rid of rule 1"
- "take out the rule about..."

REORDER RULES - User wants to move a rule:
- "move rule 1 to position 3"
- "put the first rule at the end"
- "reorder so rule 2 comes first"

RULE SET SWITCHING - User mentions a different rule set:
- "in Dan's rules, add..."
- "for my Friday night UNO rules..."
- "switch to the family rules and..."

Parse the command and return a JSON object:
{
  "action": "add" | "edit" | "delete" | "reorder" | "none",
  "ruleText": "the full rule text (for add/edit)",
  "ruleIndex": 0, // 0-based index (for edit/delete/reorder)
  "newPosition": 0, // 0-based position (for reorder)
  "ruleSetName": "name of rule set if user mentions one different from current",
  "elaboration": "A friendly confirmation message describing what you understood. Example: 'I understood you want to add the rule: Players must draw 2 cards when they skip a turn. Should I add this?'",
  "needsConfirmation": true // always true for parse mode
}

If you can't understand the request or it's not about rule management, return:
{
  "action": "none",
  "elaboration": "I'm not sure what you'd like me to do. Could you try rephrasing? For example, you can say 'add a rule about...' or 'change rule 2 to...'",
  "needsConfirmation": false
}

Return ONLY the JSON object, no other text.`,
          },
          {
            role: "user",
            content: command,
          },
        ],
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("AI parse error:", errorText);
      throw new Error("Failed to parse command");
    }

    const aiResult = await parseResponse.json();
    let parsedCommand: RuleCommand;
    
    try {
      const content = aiResult.choices[0].message.content;
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedCommand = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError, aiResult.choices[0].message.content);
      throw new Error("Failed to parse AI response");
    }

    // If mode is "parse", return the parsed command without executing
    if (mode === "parse") {
      return new Response(
        JSON.stringify({
          success: true,
          needsConfirmation: true,
          elaboration: parsedCommand.elaboration || `I understood you want to ${parsedCommand.action} a rule. Should I proceed?`,
          command: parsedCommand,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mode is "execute" - carry out the command
    if (parsedCommand.action === "none") {
      return new Response(
        JSON.stringify({
          success: false,
          message: parsedCommand.elaboration || "I couldn't understand that command.",
          command: parsedCommand,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;
    let responseMessage = "";

    switch (parsedCommand.action) {
      case "add": {
        const { data, error } = await supabase
          .from("house_rules")
          .insert({
            rule_set_id: ruleSetId,
            rule_text: parsedCommand.ruleText!,
            sort_order: currentRules.length,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        responseMessage = `Done! I've added the rule: "${parsedCommand.ruleText}"`;
        break;
      }

      case "edit": {
        const ruleToEdit = currentRules[parsedCommand.ruleIndex!];
        if (!ruleToEdit) throw new Error("Rule not found");

        const { data, error } = await supabase
          .from("house_rules")
          .update({ rule_text: parsedCommand.ruleText! })
          .eq("id", ruleToEdit.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        responseMessage = `Done! I've updated rule ${parsedCommand.ruleIndex! + 1} to: "${parsedCommand.ruleText}"`;
        break;
      }

      case "delete": {
        const ruleToDelete = currentRules[parsedCommand.ruleIndex!];
        if (!ruleToDelete) throw new Error("Rule not found");

        const { error } = await supabase
          .from("house_rules")
          .delete()
          .eq("id", ruleToDelete.id);

        if (error) throw error;

        // Reorder remaining rules
        const remainingRules = currentRules.filter(
          (_: any, i: number) => i !== parsedCommand.ruleIndex
        );
        for (let i = 0; i < remainingRules.length; i++) {
          await supabase
            .from("house_rules")
            .update({ sort_order: i })
            .eq("id", remainingRules[i].id);
        }

        responseMessage = `Done! I've removed rule ${parsedCommand.ruleIndex! + 1}`;
        break;
      }

      case "reorder": {
        const ruleToMove = currentRules[parsedCommand.ruleIndex!];
        if (!ruleToMove) throw new Error("Rule not found");

        // Update sort orders
        const updatedRules = [...currentRules];
        const [movedRule] = updatedRules.splice(parsedCommand.ruleIndex!, 1);
        updatedRules.splice(parsedCommand.newPosition!, 0, movedRule);

        for (let i = 0; i < updatedRules.length; i++) {
          await supabase
            .from("house_rules")
            .update({ sort_order: i })
            .eq("id", updatedRules[i].id);
        }

        responseMessage = `Done! I've moved rule ${parsedCommand.ruleIndex! + 1} to position ${parsedCommand.newPosition! + 1}`;
        break;
      }
    }

    // Update the rule set's updated_at timestamp
    await supabase
      .from("house_rule_sets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ruleSetId);

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        command: parsedCommand,
        result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error parsing rule command:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
