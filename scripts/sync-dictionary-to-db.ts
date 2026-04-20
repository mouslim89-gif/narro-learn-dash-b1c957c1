/**
 * Sync the global `dictionary` Supabase table with all words used by every
 * book in `book-tokens.ts`.
 *
 * For each missing (surface | base form), call the `jisho-lookup` edge
 * function and INSERT the result. Idempotent — safe to re-run after adding
 * new books.
 *
 * Run: npx tsx scripts/sync-dictionary-to-db.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const base = '/dev-server';
const SUPABASE_URL = 'https://bjkftxbbfxjyezrjzlmw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2Z0eGJiZnhqeWV6cmp6bG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzExNTUsImV4cCI6MjA5MTI0NzE1NX0.DLGXEWor58Uz3RwWbLKDxNQLMdh2ylqZrP0AjjnQ7LE';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 1. Load tokens
const tokensSource = fs.readFileSync(path.join(base, 'src/data/book-tokens.ts'), 'utf-8');
const tStart = tokensSource.indexOf('= {') + 2;
const tEnd = tokensSource.lastIndexOf('};') + 1;
const allTokens = JSON.parse(tokensSource.slice(tStart, tEnd));

// 2. Collect all unique words
const allWords = new Set<string>();
for (const bookId of Object.keys(allTokens)) {
  for (const diff of Object.keys(allTokens[bookId])) {
    for (const t of allTokens[bookId][diff]) {
      if (!t.j) continue;
      if (t.t) allWords.add(t.t);
      if (t.b) allWords.add(t.b);
    }
  }
}
console.log(`Total unique words across all books: ${allWords.size}`);

// 3. Find what's already in DB (paginated)
const existingWords = new Set<string>();
const PAGE = 1000;
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from('dictionary')
    .select('word')
    .range(from, from + PAGE - 1);
  if (error) { console.error(error); process.exit(1); }
  if (!data || data.length === 0) break;
  for (const r of data) existingWords.add(r.word);
  if (data.length < PAGE) break;
  from += PAGE;
}
console.log(`Already in DB: ${existingWords.size}`);

const missing = [...allWords].filter(w => !existingWords.has(w));
console.log(`To fetch from Jisho: ${missing.length}`);

if (missing.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

// 4. Batch fetch from jisho-lookup edge function and INSERT
const BATCH = 25;
let inserted = 0;
for (let i = 0; i < missing.length; i += BATCH) {
  const batch = missing.slice(i, i + BATCH);
  const url = `${SUPABASE_URL}/functions/v1/jisho-lookup?keywords=${encodeURIComponent(batch.join(','))}`;
  try {
    const response = await fetch(url, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
    });
    if (!response.ok) {
      console.error(`Batch ${i} failed: ${response.status}`);
      continue;
    }
    const data = await response.json();
    const rows = (data.batch || []).map((entry: any) => ({
      word: entry.keyword,
      entry: { results: entry.results || [], deinflected: entry.deinflected || null },
    }));
    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from('dictionary')
        .upsert(rows, { onConflict: 'word' });
      if (insErr) console.error('Insert error:', insErr);
      else inserted += rows.length;
    }
    console.log(`  ${i + batch.length}/${missing.length} (inserted ${inserted})`);
  } catch (err) {
    console.error('Batch error:', err);
  }
  await new Promise(r => setTimeout(r, 400));
}

console.log(`\nDone. Inserted ${inserted} new dictionary entries.`);
