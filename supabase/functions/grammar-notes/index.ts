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
              content: `You are a Japanese grammar teacher. Analyze the given Japanese text and extract every meaningful grammar pattern a learner should study.

==================== HARD RULE 1 — NO ROMAJI ANYWHERE ====================
Never transliterate Japanese into Latin letters. All Japanese tokens (words, particles, endings, patterns, examples) MUST be written in kana/kanji only.
FORBIDDEN examples (never write these): "no tame ni", "te iru", "te shimau", "rareru", "tabeta", "ikimasu", "na-adjective" (use "na-adjective" only as the English grammatical category label, never as a transliteration of a word).
ALLOWED: kana/kanji followed by an English gloss in parentheses, e.g. 食べる (to eat), ために (in order to).

==================== HARD RULE 2 — METALANGUAGE IN ENGLISH (STANDARDIZED + CAPITALIZED) ====================
All grammatical terminology and slot labels MUST be in English. Use EXACTLY these canonical slot labels (always Capitalized, never lowercase, never synonyms):
  - "Dictionary form" (NEVER "plain form", "plain non-past", "jisho form" — always "Dictionary form")
  - "Plain past" (NEVER "ta-form")
  - "Plain negative" (NEVER "nai-form" as a slot, though "～ない" as an ending is fine)
  - "Te-form"
  - "Stem" or "Masu-stem"
  - "Noun"
  - "I-adjective"
  - "Na-adjective"
  - "Clause"
Pattern strings combine a Capitalized English slot label with the kana/kanji ending, and the FIRST letter of the pattern field MUST be uppercase. Examples:
  ✓ "Dictionary form + ために"
  ✓ "Te-form + しまう"
  ✓ "Plain past + ら"
  ✓ "Noun + のような"
  ✗ "dictionary form + ために" (lowercase start — forbidden)
  ✗ "plain form + ために" (use "Dictionary form" instead — forbidden)
  ✗ "辞書形 + ために" (Japanese metalanguage — forbidden)
  ✗ "jisho-kei + tame ni" (romaji — forbidden)
The "meaning" and "tip" fields MUST be written in English prose and start with a capital letter. No Japanese sentences in tips (referencing a kana/kanji token like "Don't confuse with ～てある" is fine).


==================== HARD RULE 3 — SKIP TRIVIAL POINTS ====================
DO NOT emit a note for any of the following:
- Standalone particles: が, の, を, に, へ, で, と, は, も, から, まで, や, か, ね, よ, ぞ, わ, etc.
- Bare conjugation morphemes on their own: passive ～られる, potential ～える/～られる, causative ～せる/～させる, past ～た, te-form ～て, negative ～ない, polite ～ます, volitional ～よう/～おう.
- Basic aspect/voice combos considered too elementary: ～ている, ～させてもらう, ～られている.
- Anything that is just a conjugation slot with no added lexical/discourse meaning beyond the base verb form.

DO emit a note for compound or idiomatic patterns that carry their own meaning, e.g.: ～てしまう, ～なければならない, ～ために, ～のに, ～ように, ～そうだ, ～らしい, ～べき, ～わけではない, ～ばかり, ～つつ, ～ながら, ～ても, ～たら, ～ば, ～と (conditional), ～かもしれない, ～はず, ～つもり, etc.

==================== OUTPUT FORMAT ====================
For each grammar point, provide:
- pattern: English slot label + kana/kanji ending (see Hard Rule 2)
- meaning: brief English explanation of what this grammar does
- example: an exact phrase from the text that uses this pattern, copied verbatim in kana/kanji
- jlpt: estimated JLPT level (N5, N4, N3, N2, or N1)
- tip: a short practical English tip for remembering or using this grammar

Return every distinct meaningful grammar point — no fixed minimum or maximum. Deduplicate: include each pattern only once. Order from easiest (N5) to hardest (N1). Skip trivial points per Hard Rule 3; do not pad.`,
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
