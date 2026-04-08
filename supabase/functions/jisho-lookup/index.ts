const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JISHO_API = 'https://jisho.org/api/v1/search/words';

async function fetchWord(keyword: string) {
  try {
    const res = await fetch(`${JISHO_API}?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) return { keyword, results: [] };
    const json = await res.json();
    const results = (json.data || []).slice(0, 5).map((item: any) => ({
      slug: item.slug,
      is_common: item.is_common || false,
      jlpt: item.jlpt || [],
      tags: item.tags || [],
      japanese: (item.japanese || []).slice(0, 3).map((j: any) => ({
        word: j.word || '',
        reading: j.reading || '',
      })),
      senses: (item.senses || []).slice(0, 3).map((s: any) => ({
        english_definitions: s.english_definitions || [],
        parts_of_speech: s.parts_of_speech || [],
      })),
    }));
    return { keyword, results };
  } catch {
    return { keyword, results: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const keyword = url.searchParams.get('keyword');
    const keywords = url.searchParams.get('keywords');

    // Batch mode: fetch multiple words in one request
    if (keywords) {
      const words = keywords.split(',').map(w => w.trim()).filter(Boolean).slice(0, 50);
      const results = await Promise.all(words.map(fetchWord));
      return new Response(JSON.stringify({ batch: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'Missing keyword parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await fetchWord(keyword);
    return new Response(
      JSON.stringify({ results: result.results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});