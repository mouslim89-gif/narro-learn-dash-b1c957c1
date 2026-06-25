import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { requireUser } from "../_shared/auth.ts";
import { createLovableAiGatewayProvider, getLovableAiGatewayRunId, getLovableAiGatewayResponseHeaders } from "../_shared/ai-gateway.ts";
import { generateText } from "npm:ai";
import { z } from "npm:zod";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface Token {
  t: string; // text
  r?: string; // reading (hiragana)
}

interface Sentence {
  japanese: string;
  english: string;
  tokens?: Token[];
}

async function tokenizeWithAI(japanese: string, apiKey: string): Promise<Token[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: "You are a Japanese linguistics expert. Tokenize the given Japanese sentence and provide readings for words containing Kanji. Format the output as a JSON array of tokens where each token is {t: 'surface', r: 'reading'}. Only include 'r' for tokens containing Kanji. Reading should be in Hiragana. Return ONLY the JSON array." },
        { role: "user", content: japanese }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", errorText);
    return [{ t: japanese }];
  }

  const data = await response.json();
  try {
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    // Handle both cases: direct array or object with 'tokens' property
    return Array.isArray(parsed) ? parsed : (parsed.tokens || [{ t: japanese }]);
  } catch (err) {
    console.error("AI parsing error:", err);
    return [{ t: japanese }];
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: corsHeaders });
  }

  const initialRunId = getLovableAiGatewayRunId(req);
  const gateway = createLovableAiGatewayProvider(key, initialRunId);

  try {
    const body = await req.json();
    const word: unknown = body.word;
    const altWordRaw: unknown = body.altWord;
    const altWord = typeof altWordRaw === 'string' && altWordRaw.length > 0 && altWordRaw.length <= 50 ? altWordRaw : null;
    const rawLimit = Number(body.limit ?? 1);
    const limit = Math.max(1, Math.min(5, Number.isFinite(rawLimit) ? rawLimit : 1));

    if (!word || typeof word !== 'string' || word.length > 50) {
      return new Response(
        JSON.stringify({ error: 'word is required (max 50 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MAX_JP_LEN = 60;
    const isKanji = (ch: string) => !!ch && /[\u4e00-\u9fff]/.test(ch);
    const matchesTarget = (jp: string) => {
      const check = (target: string) => {
        if (!target || !jp.includes(target)) return false;
        if (/^[\u4e00-\u9fff]+$/.test(target)) {
          let idx = -1;
          while ((idx = jp.indexOf(target, idx + 1)) !== -1) {
            const charBefore = jp[idx - 1];
            const charAfter = jp[idx + target.length];
            if (!isKanji(charBefore) && !isKanji(charAfter)) return true;
          }
          return false;
        }
        return true;
      };
      return check(word) || (altWord ? check(altWord) : false);
    };
    const isShortEnough = (jp: string) => [...jp].length <= MAX_JP_LEN;
    const pickBest = (arr: Sentence[], n: number): Sentence[] => {
      const short = arr.filter((s) => isShortEnough(s.japanese));
      const pool = short.length > 0 ? short : arr;
      return [...pool].sort((a, b) => [...a.japanese].length - [...b.japanese].length).slice(0, n);
    };

    // 1. DB cache
    const { data: cached } = await supabase
      .from('example_sentences')
      .select('japanese, english, sentences, tokens')
      .eq('word', word)
      .maybeSingle();

    if (cached) {
      let cachedSentences: Sentence[] = Array.isArray(cached.sentences) && cached.sentences.length
        ? cached.sentences as Sentence[]
        : cached.japanese
          ? [{ japanese: cached.japanese, english: cached.english || '', tokens: cached.tokens as Token[] }]
          : [];

      const filtered = cachedSentences.filter((s) => matchesTarget(s.japanese));
      const shorts = filtered.filter((s) => isShortEnough(s.japanese));
      const best = pickBest(filtered, limit);

      if (shorts.length > 0 && best.length >= limit && best.every(b => !!b.tokens)) {
        return new Response(
          JSON.stringify({
            japanese: best[0]?.japanese ?? null,
            english: best[0]?.english ?? null,
            tokens: best[0]?.tokens ?? null,
            sentences: best,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
        );
      }
      // If we have cached sentences but no tokens, we proceed to re-tokenize
    }

    // 2. Query Tatoeba or use existing cache
    let collected: Sentence[] = [];
    if (cached && Array.isArray(cached.sentences) && cached.sentences.length > 0) {
      collected = cached.sentences as Sentence[];
    } else {
      const queries = [word, ...(altWord ? [altWord] : [])];
      const seen = new Set<string>();

      for (const q of queries) {
        const url = `https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=${encodeURIComponent(q)}&sort=words&limit=20`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        const results = Array.isArray(data.results) ? data.results : [];

        for (const sentence of results) {
          const jpText = sentence.text;
          if (!jpText || seen.has(jpText)) continue;
          if (!matchesTarget(jpText)) continue;
          const directTranslations = sentence.translations?.[0] || [];
          for (const t of directTranslations) {
            if (t?.lang === 'eng' && t?.text) {
              collected.push({ japanese: jpText, english: t.text });
              seen.add(jpText);
              break;
            }
          }
        }
      }
    }

    const best = pickBest(collected, limit);

    // 3. Tokenize best sentences
    for (const s of best) {
      if (!s.tokens) {
        s.tokens = await tokenizeWithAI(s.japanese, key);
      }
    }

    if (best.length > 0) {
      await supabase.from('example_sentences').upsert({
        word,
        japanese: best[0].japanese,
        english: best[0].english,
        tokens: best[0].tokens,
        sentences: best,
      });
    }

    return new Response(
      JSON.stringify({
        japanese: best[0]?.japanese ?? null,
        english: best[0]?.english ?? null,
        tokens: best[0]?.tokens ?? null,
        sentences: best,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch (err) {
    console.error('Tatoeba function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

