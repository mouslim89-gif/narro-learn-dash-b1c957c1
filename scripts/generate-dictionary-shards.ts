/**
 * Build-time generator: produces per-(book|chapter) dictionary shards as
 * static JSON files under `public/dict/`. The reader fetches these once on
 * chapter open and seeds the in-memory + IndexedDB caches, so every tap
 * resolves a definition synchronously.
 *
 * The generator simulates the runtime token pipeline so that **merged**
 * surfaces (九時, ように, について, かもしれない, …) are also pre-cached:
 *   1. cleanRubyTokens
 *   2. applyTokenOverrides (static rules)
 *   3. applyRules(sharedRules)        — fetched from Supabase
 *   4. splitNoParticleNouns → mergeConjugatedTokens → gluePhrasalCompounds → mergeCounterCompounds
 *   5. applyRules again (post-processing pass, mirrors Reader.tsx)
 *
 * For words missing from the global `dictionary` table, we call the
 * `jisho-lookup` edge function at build time and embed the result in the shard
 * (and upsert into `dictionary` to warm the global cache for everyone).
 *
 * Run: bun run scripts/generate-dictionary-shards.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { BookToken } from '../src/data/book-tokens';
import { applyTokenOverrides, applyRules, type Rule } from '../src/data/token-overrides';
import {
  splitNoParticleNouns,
  mergeConjugatedTokens,
  gluePhrasalCompounds,
  mergeCounterCompounds,
} from '../src/lib/merge-tokens';

const base = process.cwd();
const SUPABASE_URL = 'https://bjkftxbbfxjyezrjzlmw.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2Z0eGJiZnhqeWV6cmp6bG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzExNTUsImV4cCI6MjA5MTI0NzE1NX0.DLGXEWor58Uz3RwWbLKDxNQLMdh2ylqZrP0AjjnQ7LE';
const USER_JWT = process.env.SUPABASE_USER_JWT || ANON_KEY;

// Must match DICT_CACHE_VERSION in src/lib/dictionary-db.ts
const SHARD_VERSION = 2;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ---------------------------------------------------------------------------
// cleanRubyTokens — duplicated from src/pages/Reader.tsx (pure function,
// can't import a .tsx React module from a Node-side script cheaply).
// ---------------------------------------------------------------------------
function cleanRubyTokens(raw: BookToken[]): BookToken[] {
  const out: BookToken[] = [];
  const isHorizontalSpace = (text: string) => /^[ \t　]+$/.test(text);
  const isOpen = (text: string) => text === '（' || text === '(';
  const isClose = (text: string) => text === '）' || text === ')';
  const isKanaReading = (text: string) => /^[\s　\u3040-\u309f\u30a0-\u30ffー・]+$/.test(text);
  const hasKanji = (text: string) => /[\u3400-\u9fff]/.test(text);
  const isJapaneseText = (text: string) => /[\u3040-\u30ff\u3400-\u9fff、。！？「」『』]/.test(text);

  for (let i = 0; i < raw.length;) {
    let j = i;
    while (j < raw.length && isHorizontalSpace(raw[j].t)) j++;

    if (j < raw.length && isOpen(raw[j].t)) {
      let k = j + 1;
      while (k < raw.length && !isClose(raw[k].t)) k++;
      if (k < raw.length) {
        const reading = raw.slice(j + 1, k).map((tk) => tk.t).join('').trim();
        const previous = out.at(-1);
        if (previous && hasKanji(previous.t) && reading && isKanaReading(reading)) {
          previous.r = reading;
        }
        i = k + 1;
        while (i < raw.length && isHorizontalSpace(raw[i].t)) i++;
        continue;
      }
    }

    const token = raw[i];
    if (
      isHorizontalSpace(token.t) &&
      out.length > 0 &&
      i + 1 < raw.length &&
      isJapaneseText(out[out.length - 1].t) &&
      isJapaneseText(raw[i + 1].t)
    ) {
      i++;
      continue;
    }
    out.push({ ...token });
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Load shared rules grouped by book_id (mirrors useSharedRulesStore).
// ---------------------------------------------------------------------------
async function loadSharedRules(): Promise<Record<string, Rule[]>> {
  const { data, error } = await supabase
    .from('shared_token_rules')
    .select('book_id, rule, position')
    .order('position', { ascending: true });
  if (error) {
    console.warn('[shared-rules] load error', error.message);
    return {};
  }
  const out: Record<string, Rule[]> = {};
  for (const row of data ?? []) {
    const bookId = row.book_id as string;
    (out[bookId] ??= []).push(row.rule as unknown as Rule);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Apply the full pipeline on raw kuromoji tokens for a given (bookId, key).
// ---------------------------------------------------------------------------
function processTokens(bookId: string, raw: BookToken[], sharedRules: Record<string, Rule[]>): BookToken[] {
  let out = applyTokenOverrides(bookId, cleanRubyTokens(raw));
  const allRules: Rule[] = [
    ...(sharedRules[bookId] ?? []),
    ...(sharedRules['*'] ?? []),
  ];
  if (allRules.length > 0) out = applyRules(allRules, out);
  out = gluePhrasalCompounds(mergeCounterCompounds(mergeConjugatedTokens(splitNoParticleNouns(out))));
  if (allRules.length > 0) out = applyRules(allRules, out);
  return out;
}

// Extract bookId from a tokens key like "konbini-ningen__ch3" → "konbini-ningen".
function bookIdFromKey(key: string): string {
  const idx = key.indexOf('__');
  return idx === -1 ? key : key.slice(0, idx);
}

function collectMergedWords(
  byDiff: Record<string, BookToken[]>,
  bookId: string,
  sharedRules: Record<string, Rule[]>
): string[] {
  const set = new Set<string>();
  for (const diff of Object.keys(byDiff)) {
    const processed = processTokens(bookId, byDiff[diff], sharedRules);
    for (const tok of processed) {
      if (!tok.j) continue;
      if (tok.t) set.add(tok.t);
      if (tok.b) set.add(tok.b);
    }
  }
  return [...set];
}

// ---------------------------------------------------------------------------
// Dictionary fetch + miss-fill via jisho-lookup edge function.
// ---------------------------------------------------------------------------
type Entry = { results: unknown[]; deinflected: unknown };

async function fetchFromDictionary(words: string[]): Promise<Map<string, Entry>> {
  const out = new Map<string, Entry>();
  if (words.length === 0) return out;
  const CHUNK = 200;
  for (let i = 0; i < words.length; i += CHUNK) {
    const chunk = words.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('dictionary')
      .select('word, entry')
      .in('word', chunk);
    if (error) {
      console.warn('  DB fetch error', error.message);
      continue;
    }
    for (const row of data || []) {
      const e = row.entry as Entry;
      if (e && Array.isArray(e.results) && e.results.length > 0) {
        out.set(row.word, e);
      }
    }
  }
  return out;
}

async function lookupViaEdge(word: string): Promise<Entry | null> {
  try {
    const url = `${SUPABASE_URL}/functions/v1/jisho-lookup?keyword=${encodeURIComponent(word)}`;
    const res = await fetch(url, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${USER_JWT}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.results) || data.results.length === 0) return null;
    return { results: data.results, deinflected: data.deinflected ?? null };
  } catch (e) {
    console.warn(`  edge lookup failed for ${word}:`, (e as Error).message);
    return null;
  }
}

async function upsertDictionary(rows: { word: string; entry: Entry }[]): Promise<void> {
  if (rows.length === 0) return;
  // Anon role does NOT have insert on `dictionary`; this is a no-op upsert.
  // The edge function path itself already persists into `dictionary` server-side
  // (jisho-lookup writes through), so the second-time generator run will pick
  // them up from `fetchFromDictionary` directly.
  // Kept as a safety net in case RLS is opened up later.
  try {
    await supabase.from('dictionary').upsert(rows as never, { onConflict: 'word' } as never);
  } catch {
    /* ignore — read path is what matters */
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const outDir = path.join(base, 'public/dict');
fs.mkdirSync(outDir, { recursive: true });

console.log('Loading shared token rules from Supabase…');
const sharedRules = await loadSharedRules();
const sharedCount = Object.values(sharedRules).reduce((n, arr) => n + arr.length, 0);
console.log(`  → ${sharedCount} shared rules across ${Object.keys(sharedRules).length} scopes\n`);

const manifest: Record<
  string,
  { file: string; size: number; hash: string; words: number; covered: number; filled: number }
> = {};

// Load all per-book token files at build time.
const booksDir = path.join(base, 'src/data/book-tokens/books');
const bookTokens: Record<string, Record<string, BookToken[]>> = {};
for (const file of fs.readdirSync(booksDir)) {
  if (!file.endsWith('.ts')) continue;
  const src = fs.readFileSync(path.join(booksDir, file), 'utf-8');
  const s = src.indexOf('= {') + 2;
  const e = src.lastIndexOf('};') + 1;
  Object.assign(bookTokens, JSON.parse(src.slice(s, e)));
}

const keys = Object.keys(bookTokens);
console.log(`Generating shards for ${keys.length} book/chapter keys…\n`);

// Cache edge lookups across keys (same merged surface may appear in multiple chapters).
const liveLookupCache = new Map<string, Entry | null>();

for (const key of keys) {
  const bookId = bookIdFromKey(key);
  const words = collectMergedWords(bookTokens[key] as Record<string, BookToken[]>, bookId, sharedRules);
  if (words.length === 0) continue;

  const fromDb = await fetchFromDictionary(words);

  // Fill misses via edge function
  const missing = words.filter((w) => !fromDb.has(w));
  let filled = 0;
  const newlyFetched: { word: string; entry: Entry }[] = [];
  for (const w of missing) {
    let entry: Entry | null;
    if (liveLookupCache.has(w)) {
      entry = liveLookupCache.get(w)!;
    } else {
      entry = await lookupViaEdge(w);
      liveLookupCache.set(w, entry);
    }
    if (entry) {
      fromDb.set(w, entry);
      newlyFetched.push({ word: w, entry });
      filled++;
    }
  }
  if (newlyFetched.length > 0) await upsertDictionary(newlyFetched);

  const obj: Record<string, Entry> = {};
  for (const [w, e] of fromDb) obj[w] = e;
  const payload = JSON.stringify({ v: SHARD_VERSION, entries: obj });
  const file = `${key}.json`;
  fs.writeFileSync(path.join(outDir, file), payload);
  const hash = crypto.createHash('sha1').update(payload).digest('hex').slice(0, 12);
  manifest[key] = {
    file,
    size: payload.length,
    hash,
    words: words.length,
    covered: fromDb.size,
    filled,
  };
  console.log(
    `  ${key}: ${fromDb.size}/${words.length} words (+${filled} via edge) → ${file} (${(payload.length / 1024).toFixed(1)} KB)`
  );
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ v: SHARD_VERSION, shards: manifest }, null, 2)
);

console.log(`\nDone. ${Object.keys(manifest).length} shards written to public/dict/`);
