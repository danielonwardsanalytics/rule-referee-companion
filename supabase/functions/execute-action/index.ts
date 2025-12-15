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

      case "add_tournament_player": {
        if (!params.tournament_id) {
          return new Response(JSON.stringify({ 
            error: "No tournament selected. Please select a tournament first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Add the player to the tournament
        const { data: player, error: playerError } = await supabaseClient
          .from("tournament_players")
          .insert({
            tournament_id: params.tournament_id,
            display_name: params.player_name,
            status: "active",
            wins: 0,
            losses: 0,
            points: 0,
          })
          .select()
          .single();

        if (playerError) {
          console.error("Error adding player:", playerError);
          return new Response(JSON.stringify({ error: "Failed to add player to tournament" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { player };
        successMessage = `Added "${params.player_name}" to the tournament!`;
        break;
      }

      case "record_game_result": {
        if (!params.tournament_id) {
          return new Response(JSON.stringify({ 
            error: "No tournament selected. Please select a tournament first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find the player by name (fuzzy match)
        const { data: players, error: playersError } = await supabaseClient
          .from("tournament_players")
          .select("id, display_name, wins, points")
          .eq("tournament_id", params.tournament_id)
          .eq("status", "active");

        if (playersError || !players || players.length === 0) {
          return new Response(JSON.stringify({ 
            error: "No players found in this tournament. Please add players first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find the closest match for winner name
        const winnerNameLower = params.winner_name.toLowerCase();
        const matchedPlayer = players.find(p => 
          p.display_name.toLowerCase().includes(winnerNameLower) ||
          winnerNameLower.includes(p.display_name.toLowerCase())
        );

        if (!matchedPlayer) {
          return new Response(JSON.stringify({ 
            error: `Could not find player "${params.winner_name}". Available players: ${players.map(p => p.display_name).join(", ")}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Record the game result
        const { data: gameResult, error: resultError } = await supabaseClient
          .from("game_results")
          .insert({
            tournament_id: params.tournament_id,
            winner_id: matchedPlayer.id,
            recorded_by: user.id,
            notes: params.notes || null,
          })
          .select()
          .single();

        if (resultError) {
          console.error("Error recording result:", resultError);
          return new Response(JSON.stringify({ error: "Failed to record game result" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update player stats
        const { error: updateError } = await supabaseClient
          .from("tournament_players")
          .update({
            wins: matchedPlayer.wins ? matchedPlayer.wins + 1 : 1,
            points: matchedPlayer.points ? matchedPlayer.points + 1 : 1,
          })
          .eq("id", matchedPlayer.id);

        if (updateError) {
          console.error("Error updating player stats:", updateError);
        }

        result = { gameResult, winner: matchedPlayer };
        successMessage = `Recorded win for "${matchedPlayer.display_name}"!`;
        break;
      }

      case "update_player_status": {
        if (!params.tournament_id) {
          return new Response(JSON.stringify({ 
            error: "No tournament selected. Please select a tournament first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find the player by name
        const { data: players, error: playersError } = await supabaseClient
          .from("tournament_players")
          .select("id, display_name, status")
          .eq("tournament_id", params.tournament_id);

        if (playersError || !players || players.length === 0) {
          return new Response(JSON.stringify({ 
            error: "No players found in this tournament." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find the closest match
        const playerNameLower = params.player_name.toLowerCase();
        const matchedPlayer = players.find(p => 
          p.display_name.toLowerCase().includes(playerNameLower) ||
          playerNameLower.includes(p.display_name.toLowerCase())
        );

        if (!matchedPlayer) {
          return new Response(JSON.stringify({ 
            error: `Could not find player "${params.player_name}". Available players: ${players.map(p => p.display_name).join(", ")}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update the player status
        const { error: updateError } = await supabaseClient
          .from("tournament_players")
          .update({ status: params.status })
          .eq("id", matchedPlayer.id);

        if (updateError) {
          console.error("Error updating player status:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update player status" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const statusText = params.status === 'inactive' ? 'marked as inactive' : 'reactivated';
        result = { player: matchedPlayer, newStatus: params.status };
        successMessage = `"${matchedPlayer.display_name}" has been ${statusText}${params.reason ? ` (${params.reason})` : ''}!`;
        break;
      }

      case "add_tournament_note": {
        if (!params.tournament_id) {
          return new Response(JSON.stringify({ 
            error: "No tournament selected. Please select a tournament first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Add the note to the tournament
        const { data: note, error: noteError } = await supabaseClient
          .from("tournament_notes")
          .insert({
            tournament_id: params.tournament_id,
            user_id: user.id,
            title: params.title,
            content: params.content,
          })
          .select()
          .single();

        if (noteError) {
          console.error("Error adding note:", noteError);
          return new Response(JSON.stringify({ error: "Failed to add tournament note" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { note };
        successMessage = `Added note "${params.title}" to the tournament!`;
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
