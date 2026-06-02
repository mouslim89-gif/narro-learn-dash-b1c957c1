import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ITEMS = 20;
const MAX_FIELD = 500;

interface InItem {
  idx: number;
  pattern: string;
  example: string;
  meaning: string;
  tip: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

  try {
    const { items } = (await req.json()) as { items: InItem[] };
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "items[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (items.length > MAX_ITEMS) {
      return new Response(JSON.stringify({ error: `max ${MAX_ITEMS} items` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const it of items) {
      for (const f of ["pattern", "example", "meaning", "tip"] as const) {
        const v = (it as any)?.[f];
        if (typeof v !== "string" || v.length > MAX_FIELD) {
          return new Response(JSON.stringify({ error: `invalid item field ${f}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = `You rewrite Japanese-grammar study notes to remove ALL romaji (Latin-letter transliterations of Japanese).
Rules:
- Keep the same meaning. Do not change difficulty or scope.
- Replace any romaji word (e.g. "tabeta", "te-iru", "kuru", "na-adjective", "wa", "ga") with the kana/kanji equivalent. An English gloss in parentheses is fine (e.g. 食べる (to eat)).
- English explanation words (verb, particle, conditional, etc.) stay in English.
- Keep punctuation and length similar.
- Only rewrite "meaning" and "tip". Return them for each item by idx.`;

    const user = `Rewrite these notes. Return one entry per input idx.\n\n${JSON.stringify(items, null, 2)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_rewritten",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        idx: { type: "number" },
                        meaning: { type: "string" },
                        tip: { type: "string" },
                      },
                      required: ["idx", "meaning", "tip"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_rewritten" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${resp.status} ${t}` }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No tool call in response");
    return new Response(args, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("rewrite-grammar-notes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
