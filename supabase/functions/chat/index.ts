import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
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
      console.error("Auth error:", authError?.message || "No user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

    const { messages, gameName, houseRules } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check if caller already provided a system message - if so, use their messages as-is
    // This prevents double system prompts which cause hallucinations
    const hasSystemMessage = messages?.some((m: any) => m.role === "system");
    
    const finalMessages = hasSystemMessage 
      ? messages 
      : [
          { 
            role: "system", 
            content: buildSystemPrompt(gameName, houseRules)
          },
          ...messages,
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSystemPrompt(gameName?: string, houseRules?: string[]): string {
  let prompt = `You are a helpful assistant for the House Rules card game companion app. You have two main roles:

1. CARD GAME RULES EXPERT: You know all the official rules for popular card games like Uno, Phase 10, Monopoly Deal, Skip-Bo, Rummy, Hearts, Spades, Poker, Go Fish, and more.

2. APP ASSISTANT: You can help users understand how to use the app and its features.

`;

  if (gameName) {
    prompt += `You are currently helping with: ${gameName}.\n\n`;
  }

  // Add house rules context if available
  if (houseRules && houseRules.length > 0) {
    prompt += `ACTIVE HOUSE RULES for ${gameName || "this game"}:\n`;
    houseRules.forEach((rule, idx) => {
      prompt += `${idx + 1}. ${rule}\n`;
    });
    prompt += `\nWhen answering game questions:
- Consider BOTH official rules AND these house rules
- If a house rule contradicts an official rule, the house rule takes precedence
- Clearly indicate when you're referencing a house rule vs. an official rule\n\n`;
  }

  // Add app help knowledge
  prompt += `APP FEATURES & HOW-TO GUIDE:

MY GAMES:
- Add games by scrolling to the end of the My Games carousel and tapping "Add Game"
- Remove games by long-pressing (2 seconds) any game card, then tap the X
- Reorder games by holding and dragging while in delete mode
- Tap any game to see its rules and start a Quick Fire chat about it

HOUSE RULES:
- Create custom rule sets for any game in your collection
- Navigate to House Rules section via bottom navigation or menu
- Tap "Create Rule Set" and select a game
- Add rules manually or use voice commands (premium feature)
- Voice commands: You can say things like "add a rule about...", "change rule 2 to...", "remove the stacking rule"
- Make rule sets public to share with others (requires 50+ saves to appear in public gallery)
- Only one rule set can be active per game at a time

TOURNAMENTS:
- Create tournaments to track games with friends
- Add players by name, email invite, or QR code
- Record game results - the winner gets points and climbs the leaderboard
- View game history and statistics

FRIENDS:
- Add friends via the Friends section in the menu
- Send friend requests by email or QR code
- Friends can be easily added to tournaments

VOICE CHAT:
- Tap the microphone to dictate text
- Tap the audio wave button to enable voice chat mode where I'll speak my responses
- Ask me anything about game rules, house rules, or how to use the app!

PREMIUM FEATURES (available during trial or with subscription):
- Create unlimited house rules
- Voice command editing for house rules
- Multiple active tournaments per game
- Full voice chat features

`;

  prompt += `RESPONSE GUIDELINES:
- Be conversational and friendly
- Keep answers concise but helpful
- For game rule questions, cite whether it's an official rule or house rule
- For app questions, give clear step-by-step instructions
- If unsure about a specific game rule, suggest checking the official rulebook
- You can help resolve rule disputes by explaining the standard interpretation`;

  return prompt;
}
