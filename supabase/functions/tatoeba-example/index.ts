import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface Sentence { japanese: string; english: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

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
    const matchesTarget = (jp: string) =>
      jp.includes(word) || (altWord ? jp.includes(altWord) : false);
    const isShortEnough = (jp: string) => [...jp].length <= MAX_JP_LEN;
    const pickBest = (arr: Sentence[], n: number): Sentence[] => {
      const short = arr.filter((s) => isShortEnough(s.japanese));
      const pool = short.length > 0 ? short : arr;
      return [...pool].sort((a, b) => [...a.japanese].length - [...b.japanese].length).slice(0, n);
    };

    // 1. DB cache
    const { data: cached } = await supabase
      .from('example_sentences')
      .select('japanese, english, sentences')
      .eq('word', word)
      .maybeSingle();

    if (cached) {
      const cachedSentences: Sentence[] = Array.isArray(cached.sentences) && cached.sentences.length
        ? cached.sentences as Sentence[]
        : cached.japanese
          ? [{ japanese: cached.japanese, english: cached.english || '' }]
          : [];

      const filtered = cachedSentences.filter((s) => matchesTarget(s.japanese));
      const best = pickBest(filtered, limit);

      if (best.length >= limit) {
        return new Response(
          JSON.stringify({
            japanese: best[0]?.japanese ?? null,
            english: best[0]?.english ?? null,
            sentences: best,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
        );
      }
      // else fall through to refetch
    }

    // Query Tatoeba for both forms when altWord present, merge results.
    const queries = [word, ...(altWord ? [altWord] : [])];
    const collected: Sentence[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
      const url = `https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=${encodeURIComponent(q)}&limit=${Math.max(8, limit + 4)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Tatoeba API error:', res.status);
        continue;
      }
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
        if (collected.length >= limit) break;
      }
      if (collected.length >= limit) break;
    }

    if (collected.length > 0) {
      await supabase.from('example_sentences').upsert({
        word,
        japanese: collected[0].japanese,
        english: collected[0].english,
        sentences: collected,
      });
    }

    return new Response(
      JSON.stringify({
        japanese: collected[0]?.japanese ?? null,
        english: collected[0]?.english ?? null,
        sentences: collected,
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
