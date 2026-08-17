import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  sentences: z.array(z.string().trim().min(1).max(800)).min(1).max(50),
});

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function translateOne(apiKey: string, japanese: string): Promise<string> {
  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "You translate Japanese sentences into natural, fluent English. Preserve literary tone. Return only the translation via the provided tool.",
        },
        { role: "user", content: japanese },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_translation",
            description: "Return the English translation of the Japanese sentence.",
            parameters: {
              type: "object",
              properties: {
                english: { type: "string", description: "The English translation." },
              },
              required: ["english"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_translation" } },
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    throw new Error(`AI gateway ${aiRes.status}: ${t.slice(0, 200)}`);
  }

  const aiJson = await aiRes.json();
  const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
  let english = "";
  if (toolCall?.function?.arguments) {
    try {
      english = JSON.parse(toolCall.function.arguments).english ?? "";
    } catch {
      /* ignore */
    }
  }
  if (!english) {
    english = aiJson?.choices?.[0]?.message?.content?.trim?.() ?? "";
  }
  return english;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  const isUser = !("error" in auth);

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { sentences } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Normalize + hash unique sentences
    const norm = sentences.map((s) => s.trim());
    const hashes = await Promise.all(norm.map((s) => sha256Hex(s)));
    const uniqueMap = new Map<string, string>(); // hash -> japanese
    norm.forEach((s, i) => uniqueMap.set(hashes[i], s));
    const uniqueHashes = Array.from(uniqueMap.keys());

    // Bulk cache lookup
    const { data: cached } = await supabase
      .from("sentence_translations")
      .select("hash, english")
      .in("hash", uniqueHashes);

    const results = new Map<string, string>();
    for (const row of cached ?? []) {
      if (row?.english) results.set(row.hash, row.english);
    }

    // Missing sentences → translate (parallel, capped)
    const missing = uniqueHashes.filter((h) => !results.has(h));
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (missing.length > 0 && !apiKey) {
      return new Response(JSON.stringify({ error: "Translation service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const CONCURRENCY = 5;
    const toInsert: { hash: string; japanese: string; english: string }[] = [];
    let rateLimited = false;
    let creditsExhausted = false;

    for (let i = 0; i < missing.length; i += CONCURRENCY) {
      const batch = missing.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (h) => {
          const jp = uniqueMap.get(h)!;
          try {
            const english = await translateOne(apiKey!, jp);
            if (english) {
              results.set(h, english);
              toInsert.push({ hash: h, japanese: jp, english });
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("429")) rateLimited = true;
            else if (msg.includes("402")) creditsExhausted = true;
            else console.error("translate fail:", msg);
          }
        }),
      );
    }

    if (toInsert.length > 0) {
      await supabase
        .from("sentence_translations")
        .upsert(toInsert, { onConflict: "hash" });
    }

    return new Response(
      JSON.stringify({
        results: Array.from(results.entries()).map(([hash, english]) => ({ hash, english })),
        rateLimited,
        creditsExhausted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("translate-sentences-batch error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
