import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { word } = await req.json();

    if (!word || typeof word !== 'string' || word.length > 50) {
      return new Response(
        JSON.stringify({ error: 'word is required (max 50 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check DB cache first
    const { data: cached } = await supabase
      .from('example_sentences')
      .select('japanese, english')
      .eq('word', word)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ japanese: cached.japanese, english: cached.english }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    // 2. Fetch from Tatoeba
    const url = `https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=${encodeURIComponent(word)}&limit=3`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error('Tatoeba API error:', res.status);
      return new Response(
        JSON.stringify({ japanese: null, english: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    const results = data.results;

    let bestJapanese: string | null = null;
    let bestEnglish: string | null = null;

    if (Array.isArray(results)) {
      for (const sentence of results) {
        const jpText = sentence.text;
        if (!jpText) continue;
        const directTranslations = sentence.translations?.[0] || [];
        for (const t of directTranslations) {
          if (t?.lang === 'eng' && t?.text) {
            bestJapanese = jpText;
            bestEnglish = t.text;
            break;
          }
        }
        if (bestEnglish) break;
      }
    }

    // 3. Store in DB cache (even null results to avoid re-fetching)
    if (bestJapanese) {
      await supabase.from('example_sentences').upsert({
        word,
        japanese: bestJapanese,
        english: bestEnglish || '',
      });
    }

    return new Response(
      JSON.stringify({ japanese: bestJapanese, english: bestEnglish }),
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
