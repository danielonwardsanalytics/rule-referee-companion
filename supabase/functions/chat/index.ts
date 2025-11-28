import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, gameName, houseRules } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: buildSystemPrompt(gameName, houseRules)
          },
          ...messages,
        ],
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
  let prompt = "You are a helpful card game rules expert. ";
  
  if (gameName) {
    prompt += `You are specifically answering questions about ${gameName}. `;
  }
  
  prompt += "You know all the official rules for popular card games like Uno, Phase 10, Monopoly Deal, and Skip-Bo. ";
  
  if (houseRules && houseRules.length > 0) {
    prompt += `\n\nIMPORTANT: The user has these custom HOUSE RULES active for ${gameName || "this game"}:\n`;
    houseRules.forEach((rule, idx) => {
      prompt += `${idx + 1}. ${rule}\n`;
    });
    prompt += "\nWhen answering questions, consider BOTH the official rules AND these house rules. ";
    prompt += "If a house rule contradicts an official rule, the house rule takes precedence. ";
    prompt += "Always mention when you're referencing a house rule vs. an official rule.";
  } else {
    prompt += "Provide clear, concise answers about game rules and help resolve disputes. ";
    prompt += "If you're not sure about a specific rule, recommend checking the official rulebook.";
  }
  
  return prompt;
}
