import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RuleCommand {
  action: "add" | "edit" | "delete" | "reorder";
  ruleText?: string;
  ruleIndex?: number;
  newPosition?: number;
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

    const { command, ruleSetId, currentRules } = await req.json();

    // Use Lovable AI to parse the natural language command
    const parseResponse = await fetch("https://api.lovable.app/ai/chat", {
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
            content: `You are a house rules command parser. Parse natural language commands about card game house rules.
            
Current rules in the set:
${currentRules.map((r: any, i: number) => `${i + 1}. ${r.rule_text}`).join("\n")}

Parse the user's command and return a JSON object with:
- action: "add" | "edit" | "delete" | "reorder"
- ruleText: the full rule text (for add/edit)
- ruleIndex: the rule number (0-based, for edit/delete/reorder)
- newPosition: the new position (0-based, for reorder)

Examples:
"add a rule: no skipping turns" -> {"action": "add", "ruleText": "No skipping turns"}
"change rule 2 to draw 4 cards" -> {"action": "edit", "ruleIndex": 1, "ruleText": "Draw 4 cards"}
"remove rule 3" -> {"action": "delete", "ruleIndex": 2}
"move rule 1 to position 3" -> {"action": "reorder", "ruleIndex": 0, "newPosition": 2}

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
      throw new Error("Failed to parse command");
    }

    const aiResult = await parseResponse.json();
    const parsedCommand: RuleCommand = JSON.parse(
      aiResult.choices[0].message.content
    );

    // Execute the command
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
        responseMessage = `I've added the new rule: "${parsedCommand.ruleText}"`;
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
        responseMessage = `I've updated rule ${parsedCommand.ruleIndex! + 1} to: "${parsedCommand.ruleText}"`;
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

        responseMessage = `I've removed rule ${parsedCommand.ruleIndex! + 1}`;
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

        responseMessage = `I've moved rule ${parsedCommand.ruleIndex! + 1} to position ${parsedCommand.newPosition! + 1}`;
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
