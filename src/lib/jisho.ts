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
// Tracks keywords whose cached entry is empty but a live API attempt has already been made.
// Prevents infinite retries while still allowing one live attempt past stale empty seeds.
const liveAttempted = new Set<string>();

function isUsable(entry: CacheEntry | undefined): entry is CacheEntry {
  return !!entry && Array.isArray(entry.results) && entry.results.length > 0;
}

export function getCached(keyword: string): CacheEntry | undefined {
  const entry = cache.get(keyword);
  // Treat empty cached entries as a miss so callers fall back to a live lookup.
  return isUsable(entry) ? entry : undefined;
}

export function seedCache(entries: Record<string, CacheEntry>): void {
  for (const [word, entry] of Object.entries(entries)) {
    cache.set(word, entry);
  }
}

export async function lookupWord(keyword: string): Promise<CacheEntry> {
  const existing = cache.get(keyword);
  // Use cache only if the entry actually has results, OR if we've already
  // attempted a live lookup for this keyword (to avoid hammering the API).
  if (isUsable(existing) || (existing && liveAttempted.has(keyword))) {
    return existing;
  }

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
