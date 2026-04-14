const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const url = `https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=${encodeURIComponent(word)}&limit=1`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error('Tatoeba API error:', res.status, await res.text());
      return new Response(
        JSON.stringify({ japanese: null, english: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    const data = await res.json();
    const results = data.results;

    if (!Array.isArray(results) || results.length === 0) {
      return new Response(
        JSON.stringify({ japanese: null, english: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    // Pick a sentence that has a direct English translation and is reasonably long
    let bestJapanese: string | null = null;
    let bestEnglish: string | null = null;

    for (const sentence of results) {
      const jpText = sentence.text;
      if (!jpText) continue;

      // translations is [[direct...], [indirect...]]
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

    return new Response(
      JSON.stringify({ japanese: bestJapanese, english: bestEnglish }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      }
    );
  } catch (err) {
    console.error('Tatoeba function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
