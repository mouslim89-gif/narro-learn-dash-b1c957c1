/**
 * Dictionary loader: hydrates the in-memory jisho cache for a book.
 *
 * Strategy (option B + D):
 *   1. On first ever load → fetch the words this book needs from the global
 *      `dictionary` table in DB, store them in IndexedDB keyed by word.
 *   2. On subsequent loads → read straight from IndexedDB (offline-friendly).
 *   3. Mark each book as "hydrated" so we skip the per-word fetch entirely
 *      next time and just read everything cached locally.
 *
 * We keep IndexedDB as a flat word→entry store (shared across books) so that
 * a new book mostly hits warm cache when its vocabulary overlaps existing books.
 */
import { get, set, getMany, setMany, createStore } from 'idb-keyval';
import { supabase } from '@/integrations/supabase/client';
import { seedCache, type CacheEntry } from '@/lib/jisho';
import { bookTokens } from '@/data/book-tokens';

const wordStore = createStore('yomimasu-dict', 'words');
const metaStore = createStore('yomimasu-dict-meta', 'meta');

/** Collect every unique surface + base form a book actually uses across difficulties. */
function collectBookWords(bookId: string): string[] {
  const set = new Set<string>();
  const byDiff = bookTokens[bookId];
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

/** Public: hydrate the jisho in-memory cache for a given book. */
export async function hydrateDictionaryForBook(bookId: string): Promise<void> {
  const allWords = collectBookWords(bookId);
  if (allWords.length === 0) return;

  // 1. Read whatever is already cached in IndexedDB.
  const cached = await getMany<CacheEntry | undefined>(allWords, wordStore);
  const seed: Record<string, CacheEntry> = {};
  const missing: string[] = [];
  allWords.forEach((w, i) => {
    const entry = cached[i];
    if (entry) seed[w] = entry;
    else missing.push(w);
  });

  // 2. Already-cached entries → seed memory immediately so popups feel instant.
  if (Object.keys(seed).length > 0) seedCache(seed);

  // 3. Skip network entirely if nothing is missing OR book is marked hydrated.
  const hydrated = await get<boolean>(`book:${bookId}:hydrated`, metaStore);
  if (missing.length === 0 || hydrated) {
    if (!hydrated) await set(`book:${bookId}:hydrated`, true, metaStore);
    return;
  }

  // 4. Fetch the missing words from DB and persist.
  const fetched = await fetchFromDb(missing);
  if (fetched.size > 0) {
    const fetchedObj: Record<string, CacheEntry> = {};
    const idbPairs: [string, CacheEntry][] = [];
    fetched.forEach((entry, word) => {
      fetchedObj[word] = entry;
      idbPairs.push([word, entry]);
    });
    seedCache(fetchedObj);
    await setMany(idbPairs, wordStore);
  }

  // 5. Mark the book hydrated so we skip the missing-words check next time.
  await set(`book:${bookId}:hydrated`, true, metaStore);
}
