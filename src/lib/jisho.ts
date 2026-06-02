import { supabase } from "@/integrations/supabase/client";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Authorization': `Bearer ${token}`,
  };
}

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

// CJK Unified Ideographs range — used to detect single-kanji keywords that need strict validation.
const CJK = /[\u3400-\u9FFF\uF900-\uFAFF]/;

function entryMatchesKeyword(keyword: string, entry: CacheEntry): boolean {
  return entry.results.some((r) =>
    r.japanese.some((j) => j.word === keyword || j.reading === keyword),
  );
}

function isKnownStaleEntry(keyword: string, entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  if (keyword === 'なる') {
    return !entry.results.some((result) => {
      const matchesNaru = result.japanese.some((j) => j.word === '成る' || j.word === '為る' || j.reading === 'なる');
      const isVerb = result.senses.some((sense) => sense.parts_of_speech.some((pos) => pos.includes('verb')));
      return matchesNaru && isVerb;
    });
  }
  // For short keywords (1-2 chars), reject entries where no result actually matches the keyword.
  // Catches polluted cache like 三 → [三人, 三人組...] or 一 → [一歩...].
  if (keyword.length <= 2 && CJK.test(keyword)) {
    return !entryMatchesKeyword(keyword, entry);
  }
  return false;
}

function isUsableForKeyword(keyword: string, entry: CacheEntry | undefined): entry is CacheEntry {
  return isUsable(entry) && !isKnownStaleEntry(keyword, entry);
}

export function getCached(keyword: string): CacheEntry | undefined {
  const entry = cache.get(keyword);
  // Treat empty cached entries as a miss so callers fall back to a live lookup.
  return isUsableForKeyword(keyword, entry) ? entry : undefined;
}

export function seedCache(entries: Record<string, CacheEntry>): void {
  for (const [word, entry] of Object.entries(entries)) {
    if (isKnownStaleEntry(word, entry)) continue;
    if (!entry?.results || entry.results.length === 0) continue;
    cache.set(word, entry);
  }
}

export async function lookupWord(keyword: string): Promise<CacheEntry> {
  const existing = cache.get(keyword);
  // Use cache only if the entry actually has results, OR if we've already
  // attempted a live lookup for this keyword (to avoid hammering the API).
  if (isUsableForKeyword(keyword, existing) || (existing && !isKnownStaleEntry(keyword, existing) && liveAttempted.has(keyword))) {
    return existing;
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jisho-lookup?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  liveAttempted.add(keyword);
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

// Map a Kuromoji POS prefix to Jisho parts_of_speech keywords.
const POS_KEYWORDS: { match: (p: string) => boolean; needles: string[] }[] = [
  { match: (p) => p.startsWith('助詞'), needles: ['Particle'] },
  { match: (p) => p.startsWith('助動詞'), needles: ['Auxiliary', 'Copula', 'Particle'] },
  { match: (p) => p.startsWith('動詞'), needles: ['Verb'] },
  { match: (p) => p.startsWith('形容詞'), needles: ['Adjective'] },
  { match: (p) => p.startsWith('連体詞'), needles: ['Pre-noun', 'Adnominal'] },
  { match: (p) => p.startsWith('副詞'), needles: ['Adverb'] },
  { match: (p) => p.startsWith('接続詞'), needles: ['Conjunction'] },
  { match: (p) => p.startsWith('感動詞'), needles: ['Interjection'] },
  { match: (p) => p === '表現', needles: ['Expression'] },
  // Numeric must come before generic 名詞 so 三/一/百 don't pick 三つ/一つ/百貨店.
  { match: (p) => p.includes('数'), needles: ['Numeric', 'Counter'] },
  { match: (p) => p.startsWith('名詞'), needles: ['Noun', 'Pronoun', 'Suffix', 'Prefix', 'Na-adjective', 'No-adjective', 'Adjectival noun'] },
];

/** True if any sense (or tag) of the result is marked "Usually written using kana alone". */
export function isUsuallyKana(result: JishoResult | null | undefined): boolean {
  if (!result) return false;
  const re = /usually written using kana|^uk$/i;
  if (result.tags?.some((t) => re.test(t))) return true;
  return (result.senses ?? []).some((s) =>
    s.parts_of_speech.some((p) => re.test(p)),
  );
}

const KANA_ONLY = /^[\u3040-\u309F\u30A0-\u30FF\u30FC]+$/;

/** Returns the form to display: kana when the entry is usually-kana or surface is kana, else kanji form. */
export function getDisplayWord(
  result: JishoResult | null | undefined,
  surface?: string,
): { word: string; reading?: string } {
  if (!result) return { word: '' };
  const j = result.japanese[0];
  if (!j) return { word: '' };
  if (surface && KANA_ONLY.test(surface)) {
    const match = result.japanese.find((x) => x.reading === surface || x.word === surface);
    if (match?.reading) return { word: match.reading };
  }
  if (isUsuallyKana(result) && j.reading) {
    return { word: j.reading };
  }
  return { word: j.word || j.reading, reading: j.reading };
}

/** Pick the result whose form best matches the surface, falling back to POS matching. */
export function pickBestResult(
  results: JishoResult[] | undefined,
  kuromojiPos?: string,
  surface?: string,
): JishoResult | null {
  if (!results || results.length === 0) return null;

  const rule = kuromojiPos ? POS_KEYWORDS.find((r) => r.match(kuromojiPos)) : undefined;
  const matchesPos = (result: JishoResult) => {
    if (!rule) return false;
    const pos = result.senses.flatMap((s) => s.parts_of_speech).join(' ');
    return rule.needles.some((n) => pos.includes(n));
  };

  // 1. If Kuromoji/token override gives a POS, use it first so kana homonyms like に
  // don't pick the reading of 二 before the particle entry.
  if (rule) {
    const posMatches = results.filter(matchesPos);
    if (posMatches.length > 0) {
      if (surface) {
        const exactWord = posMatches.find((r) => r.japanese.some((j) => j.word === surface));
        if (exactWord) return exactWord;
        const exactForm = posMatches.find((r) =>
          r.japanese.some((j) => j.word === surface || j.reading === surface),
        );
        if (exactForm) return exactForm;
      }
      return posMatches[0];
    }
  }

  // 2. Prefer an entry whose word or reading exactly matches the surface from the text.
  if (surface) {
    const exact = results.find((r) =>
      r.japanese.some((j) => j.word === surface || j.reading === surface),
    );
    if (exact) return exact;
  }

  return results[0];
}

