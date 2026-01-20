import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[Realtime] No authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("[Realtime] Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[Realtime] Session requested by user:", user.id);

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
        instructions: instructions || buildInstructions(gameName, houseRules),
        // VAD settings for natural conversation pauses
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,              // Speech detection sensitivity (0-1)
          prefix_padding_ms: 300,      // Audio to include before speech detected
          silence_duration_ms: 2500    // Wait 2.5 seconds of silence before responding
        },
        input_audio_transcription: {
          model: "whisper-1"           // Enable speech-to-text for transcript display
        }
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
  
  // Voice chat limitation instructions
  instructions += `\n\nIMPORTANT LIMITATION: You are in voice chat mode. In this mode, you can ONLY answer questions about rules - you CANNOT create rule sets, add rules, create tournaments, or make any changes to the app.

If the user asks you to:
- Create a new rule set
- Add a rule to a rule set
- Create a tournament
- Make any changes or modifications

You must politely respond with something like: "I'd love to help with that, but in voice chat mode I can only answer questions about rules. To create or modify rule sets, you have two options: you can type or dictate your request into the text chat below and I'll be able to create it for you, or you can manually add it through the House Rules page. Would you like me to explain the rules for any game instead?"

Always be helpful and redirect them to the text chat or manual UI for actions.`;
  
  instructions += "\n\nKeep responses under 3 sentences unless more detail is requested.";
  
  return instructions;
}
