const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JISHO_API = 'https://jisho.org/api/v1/search/words';

// Simple deinflection rules: try to find the dictionary form
function getDeinflections(word: string): string[] {
  const forms: string[] = [word];

  const rules: [RegExp, string][] = [
    // Masu-form
    [/います$/, 'う'], [/きます$/, 'く'], [/ぎます$/, 'ぐ'], [/します$/, 'す'],
    [/ちます$/, 'つ'], [/にます$/, 'ぬ'], [/びます$/, 'ぶ'], [/みます$/, 'む'],
    [/ります$/, 'る'], [/えます$/, 'える'], [/けます$/, 'ける'], [/せます$/, 'せる'],
    [/てます$/, 'てる'], [/ねます$/, 'ねる'], [/べます$/, 'べる'], [/めます$/, 'める'],
    [/れます$/, 'れる'],
    [/ます$/, 'る'],
    // Past tense
    [/った$/, 'う'], [/った$/, 'つ'], [/った$/, 'る'],
    [/いた$/, 'く'], [/いだ$/, 'ぐ'],
    [/した$/, 'す'], [/んだ$/, 'む'], [/んだ$/, 'ぶ'], [/んだ$/, 'ぬ'],
    // Te-form
    [/って$/, 'う'], [/って$/, 'つ'], [/って$/, 'る'],
    [/いて$/, 'く'], [/いで$/, 'ぐ'],
    [/して$/, 'す'], [/んで$/, 'む'], [/んで$/, 'ぶ'], [/んで$/, 'ぬ'],
    // Negative
    [/ない$/, 'る'], [/わない$/, 'う'], [/かない$/, 'く'], [/がない$/, 'ぐ'],
    [/さない$/, 'す'], [/たない$/, 'つ'], [/ばない$/, 'ぶ'], [/まない$/, 'む'],
    [/らない$/, 'る'],
    // Tai-form
    [/たい$/, 'る'], [/いたい$/, 'く'], [/ぎたい$/, 'ぐ'], [/したい$/, 'す'],
    [/ちたい$/, 'つ'], [/びたい$/, 'ぶ'], [/みたい$/, 'む'], [/りたい$/, 'る'],
    // Continuous
    [/ている$/, 'る'], [/ていた$/, 'る'], [/ておる$/, 'る'], [/ており$/, 'る'],
    // Polite past
    [/ました$/, 'る'],
    // Passive/causative
    [/られる$/, 'る'], [/られた$/, 'る'], [/させる$/, 'る'], [/させた$/, 'る'],
    // Ichidan simple
    [/て$/, 'る'],
    // i-adj
    [/かった$/, 'い'], [/くない$/, 'い'], [/くて$/, 'い'],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      forms.push(word.replace(pattern, replacement));
    }
  }

  // Remove duplicates
  return [...new Set(forms)];
}

async function fetchWord(keyword: string) {
  try {
    // Try the word as-is first
    const res = await fetch(`${JISHO_API}?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) return { keyword, results: [], deinflected: null };
    const json = await res.json();
    let results = (json.data || []).slice(0, 5).map(mapResult);

    // If no results, try deinflected forms
    let deinflectedForm: string | null = null;
    if (results.length === 0) {
      const forms = getDeinflections(keyword);
      for (const form of forms) {
        if (form === keyword) continue;
        const res2 = await fetch(`${JISHO_API}?keyword=${encodeURIComponent(form)}`);
        if (!res2.ok) continue;
        const json2 = await res2.json();
        const altResults = (json2.data || []).slice(0, 5).map(mapResult);
        if (altResults.length > 0) {
          results = altResults;
          deinflectedForm = form;
          break;
        }
      }
    }

    return { keyword, results, deinflected: deinflectedForm };
  } catch {
    return { keyword, results: [], deinflected: null };
  }
}

function mapResult(item: any) {
  return {
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
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const keyword = url.searchParams.get('keyword');
    const keywords = url.searchParams.get('keywords');

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
      JSON.stringify({ results: result.results, deinflected: result.deinflected }),
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
