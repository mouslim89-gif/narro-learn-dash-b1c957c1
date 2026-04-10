export interface JishoResult {
  slug: string;
  is_common: boolean;
  jlpt: string[];
  tags: string[];
  japanese: { word: string; reading: string }[];
  senses: { english_definitions: string[]; parts_of_speech: string[] }[];
}

export interface CacheEntry {
  results: JishoResult[];
  deinflected?: string | null;
}

const cache = new Map<string, CacheEntry>();

export function getCached(keyword: string): CacheEntry | undefined {
  return cache.get(keyword);
}

export function seedCache(entries: Record<string, CacheEntry>): void {
  for (const [word, entry] of Object.entries(entries)) {
    cache.set(word, entry);
  }
}

export async function lookupWord(keyword: string): Promise<CacheEntry> {
  if (cache.has(keyword)) return cache.get(keyword)!;

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jisho-lookup?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) throw new Error(`Jisho lookup failed: ${response.status}`);
  const data = await response.json();
  const entry: CacheEntry = {
    results: data.results || [],
    deinflected: data.deinflected || null,
  };
  cache.set(keyword, entry);
  return entry;
}

async function batchLookup(words: string[]): Promise<void> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jisho-lookup?keywords=${encodeURIComponent(words.join(','))}`;
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) return;
  const data = await response.json();
  for (const entry of data.batch || []) {
    cache.set(entry.keyword, {
      results: entry.results || [],
      deinflected: entry.deinflected || null,
    });
  }
}

export async function preloadWords(
  words: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const toFetch = words.filter((w) => !cache.has(w));
  const total = toFetch.length;
  if (total === 0) { onProgress?.(1, 1); return; }

  const BATCH_SIZE = 30;
  let loaded = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    await batchLookup(batch);
    loaded += batch.length;
    onProgress?.(loaded, total);
  }
}

export async function searchJisho(query: string): Promise<JishoResult[]> {
  const entry = await lookupWord(query);
  return entry.results;
}
