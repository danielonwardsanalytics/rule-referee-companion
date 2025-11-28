import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { instructions, voice = "alloy", gameName, houseRules } = await req.json();

    // Request an ephemeral token from OpenAI Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        instructions: instructions || buildInstructions(gameName, houseRules)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Realtime session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildInstructions(gameName?: string, houseRules?: string[]): string {
  let instructions = "You are a helpful card game rules expert. ";
  
  if (gameName) {
    instructions += `You are specifically answering questions about ${gameName}. `;
  }
  
  instructions += "Answer questions clearly and concisely about game rules, strategies, and common questions. ";
  
  if (houseRules && houseRules.length > 0) {
    instructions += `\n\nIMPORTANT: The user has these custom HOUSE RULES active for ${gameName || "this game"}:\n`;
    houseRules.forEach((rule, idx) => {
      instructions += `${idx + 1}. ${rule}\n`;
    });
    instructions += "\nWhen answering questions, consider BOTH the official rules AND these house rules. ";
    instructions += "If a house rule contradicts an official rule, the house rule takes precedence. ";
    instructions += "Always mention when you're referencing a house rule vs. an official rule. ";
  }
  
  instructions += "Keep responses under 3 sentences unless more detail is requested.";
  
  return instructions;
}
