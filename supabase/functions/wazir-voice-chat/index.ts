import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wazir dialect context and examples for the AI
const WAZIR_SYSTEM_PROMPT = `You are a helpful AI assistant that speaks Wazir Pashto dialect. 
You are helping preserve and teach the Wazir dialect of Pashto, spoken primarily in South Waziristan, Pakistan.

Key characteristics of Wazir dialect:
- Uses distinctive vocabulary compared to standard Pashto
- Has unique phonetic patterns
- Spoken by the Wazir tribe (Waziristan region)

When responding:
1. ALWAYS respond in Wazir Pashto dialect using Pashto script (نسخ)
2. Keep responses conversational and natural
3. Use authentic Wazir vocabulary and expressions
4. If asked about language/dialect, explain in Wazir dialect
5. Be helpful, friendly, and encourage learning

Common Wazir Pashto phrases to use:
- سلام علیکم (Salam Alaikum) - Greeting
- څنګه یې؟ (Tsanga ye?) - How are you?
- زه ښه یم (Za sha yam) - I am fine
- مننه (Manana) - Thank you
- په خیر (Pa khair) - Goodbye

Remember: You represent the Wazir dialect and culture. Be respectful and authentic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, audioBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userMessage = "";
    
    // If audio is provided, we'll include a note (in future, we'd transcribe it)
    if (audioBase64) {
      // For now, we'll note that audio was received
      // In production, this would be sent to a speech-to-text service
      console.log("Audio received, length:", audioBase64.length);
      userMessage = messages[messages.length - 1]?.content || "";
    } else {
      userMessage = messages[messages.length - 1]?.content || "";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: WAZIR_SYSTEM_PROMPT },
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
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Wazir voice chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
