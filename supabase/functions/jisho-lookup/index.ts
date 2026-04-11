const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JISHO_API = 'https://jisho.org/api/v1/search/words';

// Comprehensive deinflection rules for Japanese verbs and adjectives
function getDeinflections(word: string): string[] {
  const forms: string[] = [word];

  const rules: [RegExp, string][] = [
    // ===== Polite past (ました) - godan stems =====
    [/きました$/, 'く'], [/ぎました$/, 'ぐ'], [/しました$/, 'す'],
    [/ちました$/, 'つ'], [/にました$/, 'ぬ'], [/びました$/, 'ぶ'],
    [/みました$/, 'む'], [/りました$/, 'る'], [/いました$/, 'う'],
    // Ichidan polite past
    [/ました$/, 'る'],

    // ===== Polite present (ます) - godan stems =====
    [/きます$/, 'く'], [/ぎます$/, 'ぐ'], [/します$/, 'す'],
    [/ちます$/, 'つ'], [/にます$/, 'ぬ'], [/びます$/, 'ぶ'],
    [/みます$/, 'む'], [/ります$/, 'る'], [/います$/, 'う'],
    // Ichidan polite
    [/えます$/, 'える'], [/けます$/, 'ける'], [/せます$/, 'せる'],
    [/てます$/, 'てる'], [/ねます$/, 'ねる'], [/べます$/, 'べる'],
    [/めます$/, 'める'], [/れます$/, 'れる'],
    [/ます$/, 'る'],

    // ===== Polite negative (ません) - godan stems =====
    [/きません$/, 'く'], [/ぎません$/, 'ぐ'], [/しません$/, 'す'],
    [/ちません$/, 'つ'], [/にません$/, 'ぬ'], [/びません$/, 'ぶ'],
    [/みません$/, 'む'], [/りません$/, 'る'], [/いません$/, 'う'],
    [/ません$/, 'る'],

    // ===== Polite past negative (ませんでした) =====
    [/きませんでした$/, 'く'], [/ぎませんでした$/, 'ぐ'], [/しませんでした$/, 'す'],
    [/ちませんでした$/, 'つ'], [/にませんでした$/, 'ぬ'], [/びませんでした$/, 'ぶ'],
    [/みませんでした$/, 'む'], [/りませんでした$/, 'る'], [/いませんでした$/, 'う'],
    [/ませんでした$/, 'る'],

    // ===== Polite volitional (ましょう) =====
    [/きましょう$/, 'く'], [/ぎましょう$/, 'ぐ'], [/しましょう$/, 'す'],
    [/ちましょう$/, 'つ'], [/にましょう$/, 'ぬ'], [/びましょう$/, 'ぶ'],
    [/みましょう$/, 'む'], [/りましょう$/, 'る'], [/いましょう$/, 'う'],
    [/ましょう$/, 'る'],

    // ===== Continuous (ている etc) =====
    [/ていました$/, 'る'], [/ています$/, 'る'],
    [/ている$/, 'る'], [/ていた$/, 'る'],
    [/ておる$/, 'る'], [/ており$/, 'る'], [/ておりました$/, 'る'],

    // ===== Past tense =====
    [/った$/, 'う'], [/った$/, 'つ'], [/った$/, 'る'],
    [/いた$/, 'く'], [/いだ$/, 'ぐ'],
    [/した$/, 'す'], [/んだ$/, 'む'], [/んだ$/, 'ぶ'], [/んだ$/, 'ぬ'],

    // ===== Te-form =====
    [/って$/, 'う'], [/って$/, 'つ'], [/って$/, 'る'],
    [/いて$/, 'く'], [/いで$/, 'ぐ'],
    [/して$/, 'す'], [/んで$/, 'む'], [/んで$/, 'ぶ'], [/んで$/, 'ぬ'],

    // ===== Negative =====
    [/わない$/, 'う'], [/かない$/, 'く'], [/がない$/, 'ぐ'],
    [/さない$/, 'す'], [/たない$/, 'つ'], [/ばない$/, 'ぶ'],
    [/まない$/, 'む'], [/らない$/, 'る'], [/なない$/, 'ぬ'],
    [/ない$/, 'る'],

    // ===== Tai-form (want to) =====
    [/きたい$/, 'く'], [/ぎたい$/, 'ぐ'], [/したい$/, 'す'],
    [/ちたい$/, 'つ'], [/びたい$/, 'ぶ'], [/みたい$/, 'む'],
    [/りたい$/, 'る'], [/いたい$/, 'う'],
    [/たい$/, 'る'],

    // ===== Volitional =====
    [/こう$/, 'く'], [/ごう$/, 'ぐ'], [/そう$/, 'す'],
    [/とう$/, 'つ'], [/のう$/, 'ぬ'], [/ぼう$/, 'ぶ'],
    [/もう$/, 'む'], [/ろう$/, 'る'], [/おう$/, 'う'],
    [/よう$/, 'る'],

    // ===== Conditional (ば) =====
    [/けば$/, 'く'], [/げば$/, 'ぐ'], [/せば$/, 'す'],
    [/てば$/, 'つ'], [/ねば$/, 'ぬ'], [/べば$/, 'ぶ'],
    [/めば$/, 'む'], [/れば$/, 'る'], [/えば$/, 'う'],

    // ===== Conditional (たら) =====
    [/ったら$/, 'う'], [/ったら$/, 'つ'], [/ったら$/, 'る'],
    [/いたら$/, 'く'], [/いだら$/, 'ぐ'],
    [/したら$/, 'す'], [/んだら$/, 'む'], [/んだら$/, 'ぶ'],
    [/たら$/, 'る'],

    // ===== Passive =====
    [/かれる$/, 'く'], [/がれる$/, 'ぐ'], [/されるる$/, 'す'],
    [/たれる$/, 'つ'], [/ばれる$/, 'ぶ'], [/まれる$/, 'む'],
    [/われる$/, 'う'], [/られる$/, 'る'],
    [/かれた$/, 'く'], [/がれた$/, 'ぐ'],
    [/われた$/, 'う'], [/られた$/, 'る'],

    // ===== Causative =====
    [/かせる$/, 'く'], [/がせる$/, 'ぐ'], [/させる$/, 'す'],
    [/たせる$/, 'つ'], [/ばせる$/, 'ぶ'], [/ませる$/, 'む'],
    [/わせる$/, 'う'], [/らせる$/, 'る'],
    [/かせた$/, 'く'], [/がせた$/, 'ぐ'],
    [/わせた$/, 'う'], [/させた$/, 'る'],

    // ===== Potential =====
    [/ける$/, 'く'], [/げる$/, 'ぐ'], [/せる$/, 'す'],
    [/てる$/, 'つ'], [/ねる$/, 'ぬ'], [/べる$/, 'ぶ'],
    [/める$/, 'む'], [/れる$/, 'る'], [/える$/, 'う'],

    // ===== Imperative =====
    [/け$/, 'く'], [/げ$/, 'ぐ'], [/せ$/, 'す'],
    [/て$/, 'つ'], [/ね$/, 'ぬ'], [/べ$/, 'ぶ'],
    [/め$/, 'む'], [/れ$/, 'る'], [/え$/, 'う'],
    [/ろ$/, 'る'], [/よ$/, 'る'],

    // ===== i-adjective =====
    [/くなかった$/, 'い'],
    [/かった$/, 'い'], [/くない$/, 'い'], [/くて$/, 'い'],
    [/く$/, 'い'],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      forms.push(word.replace(pattern, replacement));
    }
  }

  return [...new Set(forms)];
}

async function fetchWord(keyword: string) {
  try {
    const res = await fetch(`${JISHO_API}?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) return { keyword, results: [], deinflected: null };
    const json = await res.json();
    let results = (json.data || []).slice(0, 5).map(mapResult);

    let deinflectedForm: string | null = null;

    // If Jisho found results but the matched word differs from keyword, mark as deinflected
    if (results.length > 0) {
      const matchedWord = results[0]?.japanese?.[0]?.word || results[0]?.japanese?.[0]?.reading;
      if (matchedWord && matchedWord !== keyword) {
        deinflectedForm = matchedWord;
      }
    }

    // If no results, try deinflection
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
