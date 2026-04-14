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

    const url = `https://api.tatoeba.org/unstable/sentences?lang=jpn&q=${encodeURIComponent(word)}&trans=eng&limit=1&sort=relevance`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error('Tatoeba API error:', res.status, await res.text());
      return new Response(
        JSON.stringify({ japanese: null, english: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    const data = await res.json();
    const sentences = data.data || data.results || data;

    if (!Array.isArray(sentences) || sentences.length === 0) {
      return new Response(
        JSON.stringify({ japanese: null, english: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    const sentence = sentences[0];
    const japaneseText = sentence.text || null;

    let englishText: string | null = null;
    const translations = sentence.translations || [];
    for (const group of translations) {
      const arr = Array.isArray(group) ? group : [group];
      for (const t of arr) {
        if (t && t.lang === 'eng' && t.text) {
          englishText = t.text;
          break;
        }
      }
      if (englishText) break;
    }

    return new Response(
      JSON.stringify({ japanese: japaneseText, english: englishText }),
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
