import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a Japanese grammar teacher. Analyze the given Japanese text and extract every grammar point a learner should study.

HARD RULE — NO ROMAJI ANYWHERE IN THE OUTPUT. Never transliterate Japanese into Latin letters (no "tabeta", "ikimasu", "te-iru", "kuru", "na-adjective" romaji). Whenever you refer to a Japanese word, particle, ending, or pattern, write it in kana/kanji. An English gloss in parentheses after the kana/kanji is fine (e.g. 食べる (to eat)).

For each grammar point, provide:
- pattern: the grammar pattern in kana/kanji only (e.g. ～ている, ～たら, ～のに)
- meaning: a brief English explanation of what this grammar does (no romaji)
- example: an exact phrase from the text that uses this pattern (kana/kanji, copied verbatim)
- jlpt: estimated JLPT level (N5, N4, N3, N2, or N1)
- tip: a short practical tip for remembering or using this grammar (English, no romaji)

Return every distinct grammar point that appears in the text — no fixed minimum or maximum. Deduplicate: include each pattern only once even if it appears many times. Order from easiest (N5) to hardest (N1). Skip nothing important; do not pad with trivial repeats.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_grammar_notes",
                description: "Return structured grammar notes extracted from text",
                parameters: {
                  type: "object",
                  properties: {
                    notes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          pattern: { type: "string" },
                          meaning: { type: "string" },
                          example: { type: "string" },
                          jlpt: {
                            type: "string",
                            enum: ["N5", "N4", "N3", "N2", "N1"],
                          },
                          tip: { type: "string" },
                        },
                        required: [
                          "pattern",
                          "meaning",
                          "example",
                          "jlpt",
                          "tip",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["notes"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_grammar_notes" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add funds in Settings.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const notes = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(notes), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grammar-notes error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
