export interface KanjiDetails {
  character: string;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  jlpt: number | null;
  grade: number | null;
  stroke_count: number | null;
}

const cache = new Map<string, KanjiDetails | null>();

const KANJI_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

export function extractKanji(word: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const ch of word) {
    if (KANJI_RE.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  return out;
}

export async function fetchKanji(char: string): Promise<KanjiDetails | null> {
  if (cache.has(char)) return cache.get(char)!;
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kanji-lookup`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ kanji: char }),
    });
    if (!res.ok) {
      cache.set(char, null);
      return null;
    }
    const data = (await res.json()) as KanjiDetails;
    cache.set(char, data);
    return data;
  } catch {
    cache.set(char, null);
    return null;
  }
}
