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
      model: "google/gemini-3-flash-preview",
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

  // Auth is optional: cached examples are public read-only data and must stay
  // available even when the client has no user session (anon key only).
  // Only AI generation (tokenization) is restricted to signed-in users.
  const auth = await requireUser(req, corsHeaders);
  const isUser = !("error" in auth);
  const unauthorized = () => new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: corsHeaders });
  }

  const initialRunId = getLovableAiGatewayRunId(req);
  const gateway = createLovableAiGatewayProvider(key, initialRunId);

  try {
    const body = await req.json();
    const mode = body.mode || 'examples';

    if (mode === 'tokenize') {
      const sentence = body.sentence;
      if (!sentence || typeof sentence !== 'string' || sentence.length > 500) {
        return new Response(JSON.stringify({ error: 'sentence is required (max 500 chars)' }), { status: 400, headers: corsHeaders });
      }

      // 1. Check if we already have these tokens cached anywhere (check example_sentences)
      const { data: cached } = await supabase
        .from('example_sentences')
        .select('tokens')
        .eq('japanese', sentence)
        .not('tokens', 'is', null)
        .limit(1)
        .maybeSingle();

      if (cached?.tokens) {
        return new Response(JSON.stringify({ tokens: cached.tokens }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 2. Tokenize with AI, then persist so this sentence is never re-tokenized.
      const tokens = await tokenizeWithAI(sentence, key);
      if (Array.isArray(tokens) && tokens.length > 0 && !(tokens.length === 1 && !tokens[0].r)) {
        await supabase.from('example_sentences').upsert({
          word: `tok:${sentence}`,
          japanese: sentence,
          english: '',
          tokens,
        });
      }
      return new Response(JSON.stringify({ tokens }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const word: unknown = body.word;
    const altWordRaw: unknown = body.altWord;
    const altWord = typeof altWordRaw === 'string' && altWordRaw.length > 0 && altWordRaw.length <= 50 ? altWordRaw : null;
    const rawLimit = Number(body.limit ?? 1);
    const limit = Math.max(1, Math.min(12, Number.isFinite(rawLimit) ? rawLimit : 1));

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
        if (!target) return false;
        
        // If the target has no Kanji, simple include check is usually fine for Tatoeba results
        const targetKanji = [...target].filter(isKanji).join('');
        if (!targetKanji) return jp.includes(target);

        // If target has Kanji, we must ensure it's not part of a larger Kanji compound
        // But we must also allow for inflections if it's a verb/adjective (e.g. 解く -> 解いた)
        // We look for the Kanji part of the target in the sentence.
        let idx = -1;
        while ((idx = jp.indexOf(targetKanji, idx + 1)) !== -1) {
          const charBefore = jp[idx - 1];
          const charAfter = jp[idx + targetKanji.length];
          // standalone means not preceded or followed by another Kanji
          if (!isKanji(charBefore) && !isKanji(charAfter)) {
            // For verbs/adjectives, we also check if the kana following the Kanji
            // in the target matches the start of the kana following the Kanji in the sentence.
            // This is a bit complex, so we'll be lenient: as long as it's the right Kanji 
            // and standalone, and the sentence was found by Tatoeba for this word, it's likely correct.
            return true;
          }
        }
        return false;
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

      const filtered = cachedSentences.filter((s) => matchesTarget(s.japanese) && !!s.tokens);
      const best = pickBest(filtered, limit);

      // Serve straight from cache as soon as we have enough tokenized matches.
      // (Previously we also required a "short" sentence, and the client inflated
      // the limit ×4, so almost every request missed the cache and re-ran
      // Tatoeba + AI tokenization.)
      if (best.length >= limit) {

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
      // Merge with whatever was already cached so a small request (e.g. the word
      // popup asking for 1 example) never shrinks the stored set.
      const previous: Sentence[] = Array.isArray(cached?.sentences) ? cached!.sentences as Sentence[] : [];
      const merged: Sentence[] = [];
      const seenJp = new Set<string>();
      for (const s of [...best, ...previous]) {
        if (!s?.japanese || seenJp.has(s.japanese)) continue;
        seenJp.add(s.japanese);
        merged.push(s);
      }

      await supabase.from('example_sentences').upsert({
        word,
        japanese: best[0].japanese,
        english: best[0].english,
        tokens: best[0].tokens,
        sentences: merged,
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

