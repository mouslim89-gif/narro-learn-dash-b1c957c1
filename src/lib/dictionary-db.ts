/**
 * Dictionary loader: hydrates the in-memory jisho cache for a book.
 *
 * Strategy (option B + D):
 * 1. On first ever load → fetch the words this book needs from the global
 *`dictionary`table in DB, store them in IndexedDB keyed by word.
 * 2. On subsequent loads → read straight from IndexedDB (offline-friendly).
 * 3. Mark each book as"hydrated"so we skip the per-word fetch entirely
 * next time and just read everything cached locally.
 *
 * We keep IndexedDB as a flat word→entry store (shared across books) so that
 * a new book mostly hits warm cache when its vocabulary overlaps existing books.
 */
import { get, set, getMany, setMany, createStore } from'idb-keyval';
import { supabase } from'@/integrations/supabase/client';
import { seedCache, type CacheEntry } from'@/lib/jisho';
import { loadBookTokens } from'@/data/book-tokens';

const wordStore = createStore('yomimasu-dict','words');
const metaStore = createStore('yomimasu-dict-meta','meta');

/** Persist a single entry to IndexedDB so a token-edit lookup survives reloads. */
export async function persistWordEntry(word: string, entry: CacheEntry): Promise<void> {
  if (!word || !entry?.results?.length) return;
  await ensureCacheVersion();
  try {
    await set(word, entry, wordStore);
  } catch {
    /* ignore */
  }
}

/** Read a single entry from IndexedDB (returns undefined on miss). */
export async function readWordEntry(word: string): Promise<CacheEntry | undefined> {
  if (!word) return undefined;
  try {
    await ensureCacheVersion();
    const entry = await get<CacheEntry>(word, wordStore);
    if (entry && entry.results && entry.results.length > 0) return entry;
  } catch {
    /* ignore */
  }
  return undefined;
}

// Bump this whenever cached dictionary entries become invalid (e.g. after fixing
// polluted entries like 三 → 三人 or 一 → 一歩). On bump, we clear IndexedDB once.
const DICT_CACHE_VERSION = 2;

let cacheCleanupPromise: Promise<void> | null = null;
async function ensureCacheVersion(): Promise<void> {
 if (cacheCleanupPromise) return cacheCleanupPromise;
 cacheCleanupPromise = (async () => {
 const stored = await get<number>('dictCacheVersion', metaStore);
 if (stored === DICT_CACHE_VERSION) return;
 const { clear } = await import('idb-keyval');
 await clear(wordStore);
 await clear(metaStore);
 await set('dictCacheVersion', DICT_CACHE_VERSION, metaStore);
 })();
 return cacheCleanupPromise;
}

/** Collect every unique surface + base form a book actually uses across difficulties. */
async function collectBookWords(bookId: string): Promise<string[]> {
  const set = new Set<string>();
  const rootId = bookId.includes('__') ? bookId.split('__')[0] : bookId;
  const map = await loadBookTokens(rootId);
  // Fallback: If map[bookId] doesn't exist (e.g. part-based book), use the root book entry
  // which contains the full tokens (Reader will slice them, but we hydrate all).
  const byDiff = map[bookId] || map[rootId];
  if (!byDiff) return [];

  for (const diff of Object.keys(byDiff)) {
    for (const tok of byDiff[diff]) {
      if (!tok.j) continue;
      if (tok.t) set.add(tok.t);
      if (tok.b) set.add(tok.b);
    }
  }
  return [...set];
}


/** Fetch entries from Supabase in chunks (PostgREST .in() limit safety). */
async function fetchFromDb(words: string[]): Promise<Map<string, CacheEntry>> {
 const out = new Map<string, CacheEntry>();
 if (words.length === 0) return out;
 const CHUNK = 200;
 for (let i = 0; i < words.length; i += CHUNK) {
 const chunk = words.slice(i, i + CHUNK);
 const { data, error } = await supabase
 .from('dictionary')
 .select('word, entry')
 .in('word', chunk);
 if (error) {
 console.warn('[dictionary] DB fetch error', error);
 continue;
 }
 for (const row of data || []) {
 out.set(row.word, row.entry as unknown as CacheEntry);
 }
 }
 return out;
}

/**
 * Try to hydrate from a pre-built static shard at /dict/<key>.json.
 * Returns true if the shard was successfully loaded (cache hit or fresh fetch),
 * false on 404 / network error so the caller can fall back to the DB path.
 */
async function hydrateDictionaryFromShard(key: string): Promise<boolean> {
 await ensureCacheVersion();
 try {
 const url =`/dict/${encodeURIComponent(key)}.json`;
 const res = await fetch(url, { cache:'force-cache'});
 if (!res.ok) return false;
 const payload = (await res.json()) as {
 v?: number;
 entries?: Record<string, CacheEntry>;
 };
 if (!payload || payload.v !== DICT_CACHE_VERSION || !payload.entries) return false;

 const entries = payload.entries;
 const seed: Record<string, CacheEntry> = {};
 const idbPairs: [string, CacheEntry][] = [];
 for (const [word, entry] of Object.entries(entries)) {
 if (!entry?.results?.length) continue;
 seed[word] = entry;
 idbPairs.push([word, entry]);
 }
 if (Object.keys(seed).length === 0) return false;
 seedCache(seed);
 // Persist for offline; fire-and-forget — memory cache is already warm.
 setMany(idbPairs, wordStore).catch(() => {});
 return true;
 } catch {
 return false;
 }
}

/**
 * Helper to hydrate a specific list of words.
 * Checks memory cache -> IndexedDB -> Supabase.
 */
export async function hydrateWords(words: string[]): Promise<void> {
  if (words.length === 0) return;
  await ensureCacheVersion();

  // 1. Filter out what's already in the memory cache.
  const { getCached } = await import('@/lib/jisho');
  const missingFromMemory = words.filter(w => !getCached(w));
  if (missingFromMemory.length === 0) return;

  // 2. Read whatever is already cached in IndexedDB.
  const cached = await getMany<CacheEntry | undefined>(missingFromMemory, wordStore);
  const seed: Record<string, CacheEntry> = {};
  const missingFromIdb: string[] = [];

  missingFromMemory.forEach((w, i) => {
    const entry = cached[i];
    if (entry && entry.results && entry.results.length > 0) seed[w] = entry;
    else missingFromIdb.push(w);
  });

  // 3. Already-cached entries -> seed memory.
  if (Object.keys(seed).length > 0) {
    seedCache(seed);
  }

  // 4. Skip the DB fetch if everything is present locally.
  if (missingFromIdb.length === 0) return;

  // 5. Fetch the missing words from DB.
  const fetched = await fetchFromDb(missingFromIdb);
  if (fetched.size > 0) {
    const fetchedObj: Record<string, CacheEntry> = {};
    const idbPairs: [string, CacheEntry][] = [];
    fetched.forEach((entry, word) => {
      if (!entry?.results?.length) return;
      fetchedObj[word] = entry;
      idbPairs.push([word, entry]);
    });
    seedCache(fetchedObj);
    await setMany(idbPairs, wordStore);
  }

  // 6. If words are still missing (not in DB), use preloadWords to hit the Jisho edge function.
  const stillMissing = missingFromIdb.filter(w => !fetched.has(w));
  if (stillMissing.length > 0) {
    const { preloadWords } = await import('@/lib/jisho');
    // Preload in background, don't necessarily await the whole thing if it's huge,
    // but for 20-30 words it's fine to await.
    await preloadWords(stillMissing);
  }
}


/** Hydrate dictionary from a list of tokens (e.g. after merges/rules). */
export async function hydrateDictionaryFromTokens(tokens: { t: string; b?: string; j?: boolean }[]): Promise<void> {
  const set = new Set<string>();
  for (const tok of tokens) {
    if (!tok.j) continue;
    if (tok.t) set.add(tok.t);
    if (tok.b) set.add(tok.b);
  }
  await hydrateWords([...set]);
}

/** Public: hydrate the jisho in-memory cache for a given book/chapter. */
export async function hydrateDictionaryForBook(
  bookId: string,
  chapterId?: string
): Promise<void> {
  await ensureCacheVersion();

  // 1. Prefer the static shard — single fetch, instant warm cache.
  const key =
    chapterId && chapterId !== 'main' ? `${bookId}__${chapterId}` : bookId;
  const shardOk =
    (await hydrateDictionaryFromShard(key)) ||
    // Fallback to the bookId-only shard for content that hasn't been split per chapter.
    (key !== bookId && (await hydrateDictionaryFromShard(bookId)));
  if (shardOk) return;

  // 2. No shard available → legacy IndexedDB + PostgREST path.
  const allWords = await collectBookWords(key);
  await hydrateWords(allWords);
}

