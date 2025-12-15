import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { actionType, params } = await req.json();
    console.log("Executing action:", actionType, params);

    let result: any = null;
    let successMessage = "";

    switch (actionType) {
      case "create_house_rule_set": {
        // First, find the game by name
        const { data: games, error: gameError } = await supabaseClient
          .from("games")
          .select("id, name")
          .ilike("name", `%${params.game_name}%`)
          .limit(1);

        if (gameError || !games || games.length === 0) {
          return new Response(JSON.stringify({ 
            error: `Could not find game "${params.game_name}". Please make sure it's in your games list.` 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const gameId = games[0].id;
        const gameName = games[0].name;

        // Create the house rule set
        const { data: ruleSet, error: ruleSetError } = await supabaseClient
          .from("house_rule_sets")
          .insert({
            user_id: user.id,
            game_id: gameId,
            name: params.name,
            is_active: false,
            is_public: false,
          })
          .select()
          .single();

        if (ruleSetError) {
          console.error("Error creating rule set:", ruleSetError);
          return new Response(JSON.stringify({ error: "Failed to create rule set" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { ruleSet, gameName };
        successMessage = `Created "${params.name}" house rule set for ${gameName}!`;
        break;
      }

      case "create_tournament": {
        // Find the game by name
        const { data: games, error: gameError } = await supabaseClient
          .from("games")
          .select("id, name")
          .ilike("name", `%${params.game_name}%`)
          .limit(1);

        if (gameError || !games || games.length === 0) {
          return new Response(JSON.stringify({ 
            error: `Could not find game "${params.game_name}". Please make sure it's in your games list.` 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const gameId = games[0].id;
        const gameName = games[0].name;

        // Create the tournament
        const { data: tournament, error: tournamentError } = await supabaseClient
          .from("tournaments")
          .insert({
            admin_id: user.id,
            game_id: gameId,
            name: params.name,
            is_active: true,
          })
          .select()
          .single();

        if (tournamentError) {
          console.error("Error creating tournament:", tournamentError);
          return new Response(JSON.stringify({ error: "Failed to create tournament" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { tournament, gameName };
        successMessage = `Created "${params.name}" tournament for ${gameName}!`;
        break;
      }

      case "add_house_rule": {
        if (!params.rule_set_id) {
          return new Response(JSON.stringify({ 
            error: "No active rule set selected. Please select or create a rule set first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get the current max sort_order
        const { data: existingRules } = await supabaseClient
          .from("house_rules")
          .select("sort_order")
          .eq("rule_set_id", params.rule_set_id)
          .order("sort_order", { ascending: false })
          .limit(1);

        const nextSortOrder = existingRules && existingRules.length > 0 
          ? (existingRules[0].sort_order || 0) + 1 
          : 0;

        // Add the rule
        const { data: rule, error: ruleError } = await supabaseClient
          .from("house_rules")
          .insert({
            rule_set_id: params.rule_set_id,
            rule_text: params.rule_text,
            title: params.title || null,
            sort_order: nextSortOrder,
          })
          .select()
          .single();

        if (ruleError) {
          console.error("Error adding rule:", ruleError);
          return new Response(JSON.stringify({ error: "Failed to add rule" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { rule };
        successMessage = `Added new rule to your house rules!`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: successMessage,
      result 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("execute-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
