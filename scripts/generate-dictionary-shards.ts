/**
 * Build-time generator: produces per-(book|chapter) dictionary shards as
 * static JSON files under `public/dict/`. The reader fetches these once on
 * chapter open and seeds the in-memory + IndexedDB caches, so every tap
 * resolves a definition synchronously.
 *
 * Run: bun run scripts/generate-dictionary-shards.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const base = process.cwd();
const SUPABASE_URL = 'https://bjkftxbbfxjyezrjzlmw.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2Z0eGJiZnhqeWV6cmp6bG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzExNTUsImV4cCI6MjA5MTI0NzE1NX0.DLGXEWor58Uz3RwWbLKDxNQLMdh2ylqZrP0AjjnQ7LE';

// Must match DICT_CACHE_VERSION in src/lib/dictionary-db.ts
const SHARD_VERSION = 2;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// 1. Load all tokens
const tokensSource = fs.readFileSync(
  path.join(base, 'src/data/book-tokens.ts'),
  'utf-8'
);
const tStart = tokensSource.indexOf('= {') + 2;
const tEnd = tokensSource.lastIndexOf('};') + 1;
const allTokens: Record<string, Record<string, Array<{ t?: string; b?: string; j?: boolean }>>> =
  JSON.parse(tokensSource.slice(tStart, tEnd));

// 2. For each top-level key, collect unique words (j === true only)
function collectWords(byDiff: Record<string, Array<{ t?: string; b?: string; j?: boolean }>>): string[] {
  const set = new Set<string>();
  for (const diff of Object.keys(byDiff)) {
    for (const tok of byDiff[diff]) {
      if (!tok.j) continue;
      if (tok.t) set.add(tok.t);
      if (tok.b) set.add(tok.b);
    }
  }
  return [...set];
}

const outDir = path.join(base, 'public/dict');
fs.mkdirSync(outDir, { recursive: true });

type Entry = { results: unknown[]; deinflected: unknown };

async function fetchEntries(words: string[]): Promise<Map<string, Entry>> {
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

const manifest: Record<string, { file: string; size: number; hash: string; words: number; covered: number }> = {};

const keys = Object.keys(allTokens);
console.log(`Generating shards for ${keys.length} book/chapter keys...`);

for (const key of keys) {
  const words = collectWords(allTokens[key]);
  if (words.length === 0) continue;
  const entries = await fetchEntries(words);
  const obj: Record<string, Entry> = {};
  for (const [w, e] of entries) obj[w] = e;
  const payload = JSON.stringify({ v: SHARD_VERSION, entries: obj });
  const file = `${key}.json`;
  const filePath = path.join(outDir, file);
  fs.writeFileSync(filePath, payload);
  const hash = crypto.createHash('sha1').update(payload).digest('hex').slice(0, 12);
  manifest[key] = {
    file,
    size: payload.length,
    hash,
    words: words.length,
    covered: entries.size,
  };
  console.log(`  ${key}: ${entries.size}/${words.length} words → ${file} (${(payload.length / 1024).toFixed(1)} KB)`);
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ v: SHARD_VERSION, shards: manifest }, null, 2)
);

console.log(`\nDone. ${Object.keys(manifest).length} shards written to public/dict/`);
