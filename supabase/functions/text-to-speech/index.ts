import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[TTS] Function started");
    const { text, voice = "alloy" } = await req.json();
    console.log("[TTS] Request received:", { textLength: text?.length, voice });

    if (!text) {
      console.error("[TTS] No text provided");
      throw new Error("No text provided");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("[TTS] OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("[TTS] Calling OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    console.log("[TTS] OpenAI API success, converting to buffer...");
    const audioBuffer = await response.arrayBuffer();
    console.log("[TTS] Audio buffer size:", audioBuffer.byteLength);

    // Convert audio buffer to base64 for safe JSON transport
    const uint8Array = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binary);
    console.log("[TTS] Audio encoded to base64, length:", base64Audio.length);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
      }
    );
  } catch (error) {
    console.error("[TTS] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
