/**
 * Bulk-prepopulate `sentence_translations` for every book in the catalog.
 *
 * Splits each book's text (across all difficulties / chapters / parts) into
 * sentences the same way Reader.tsx does, then calls the deployed
 * `translate-sentences-batch` edge function which handles cache lookup,
 * AI translation, and DB upsert.
 *
 * Run: bun run scripts/preload-translations.ts [--dry]
 */
import { books, type Difficulty } from '../src/data/books';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing SUPABASE_URL / ANON KEY env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const DRY = process.argv.includes('--dry');
const DIFFICULTIES: Difficulty[] = ['simplified', 'intermediate', 'original'];

// Optional --book <id> filter: restrict to a single book.
const bookFlagIdx = process.argv.indexOf('--book');
const ONLY_BOOK = bookFlagIdx >= 0 ? process.argv[bookFlagIdx + 1] : null;

// Mirror Reader.tsx stripParens.
function stripParens(text: string): string {
  return text
    .replace(/[（(][^（）()\n\r]*[）)]/g, '')
    .replace(/([\u3040-\u30ff\u3400-\u9fff、。！？「」『』])[ \t　]+([\u3040-\u30ff\u3400-\u9fff、。！？「」『』])/g, '$1$2')
    .replace(/^一$/gm, '\u200b');
}

// Mirror Reader.tsx sentence split: break on 。！？ or newline.
function splitSentences(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n' || ch === '\r') {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
    if (ch === '。' || ch === '！' || ch === '？') {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Collect every distinct text blob from every book.
function collectAllTexts(): string[] {
  const seen = new Set<string>();
  const push = (s: string | undefined) => {
    if (s && !seen.has(s)) seen.add(s);
  };
  const targetBooks = ONLY_BOOK ? books.filter((b) => b.id === ONLY_BOOK) : books;
  if (ONLY_BOOK && targetBooks.length === 0) {
    console.error(`No book with id "${ONLY_BOOK}"`);
    process.exit(1);
  }
  for (const book of targetBooks) {
    for (const d of DIFFICULTIES) {
      push(book.content?.[d]);
      if (book.chapters) for (const ch of book.chapters) push(ch.content?.[d]);
      if (book.parts) for (const p of book.parts[d] ?? []) push(p);
    }
  }
  return Array.from(seen);
}

async function fetchCachedHashes(hashes: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  const CHUNK = 80;
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const part = hashes.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('sentence_translations')
      .select('hash')
      .in('hash', part);
    if (error) {
      console.warn('cache lookup error', error.message);
      continue;
    }
    for (const r of data ?? []) out.add(r.hash);
  }
  return out;
}

async function callBatch(sentences: string[]): Promise<{ count: number; rateLimited: boolean }> {
  const { data, error } = await supabase.functions.invoke('translate-sentences-batch', {
    body: { sentences },
  });
  if (error) {
    console.error('  batch error:', error.message);
    return { count: 0, rateLimited: false };
  }
  const results = (data as any)?.results ?? [];
  if ((data as any)?.creditsExhausted) {
    console.error('  CREDITS EXHAUSTED — stopping');
    process.exit(2);
  }
  return { count: results.length, rateLimited: !!(data as any)?.rateLimited };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  console.log('Collecting texts…' + (ONLY_BOOK ? ` (book=${ONLY_BOOK})` : ''));
  const blobs = collectAllTexts();
  console.log(`  ${blobs.length} distinct text blobs`);

  const allSentences = new Set<string>();
  for (const blob of blobs) {
    for (const s of splitSentences(stripParens(blob))) {
      if (s.length >= 1 && s.length <= 800) allSentences.add(s);
    }
  }
  const sentences = Array.from(allSentences);
  console.log(`  ${sentences.length} distinct sentences`);

  console.log('Hashing + checking cache…');
  const hashes = await Promise.all(sentences.map(sha256Hex));
  const cached = await fetchCachedHashes(hashes);
  const missing = sentences.filter((_, i) => !cached.has(hashes[i]));
  console.log(`  cached: ${cached.size}    missing: ${missing.length}`);

  if (DRY) {
    console.log('Dry run, exiting.');
    return;
  }
  if (missing.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const BATCH = 50;
  const PARALLEL = 1;

  // Drain loop: keep re-checking the cache for missing sentences and retrying
  // any that remain (handles rate-limit pauses). Backoff grows when no progress.
  let pending = missing;
  let totalNew = 0;
  let backoff = 0;
  let pass = 0;
  while (pending.length > 0) {
    pass++;
    if (backoff > 0) {
      console.log(`Sleeping ${backoff}s before next pass…`);
      await sleep(backoff * 1000);
    }
    const batches: string[][] = [];
    for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH));
    console.log(`Pass ${pass}: ${pending.length} sentences, ${batches.length} batches`);

    let cursor = 0;
    let passNew = 0;
    let sawRate = false;
    const worker = async (id: number) => {
      while (cursor < batches.length) {
        const idx = cursor++;
        const batch = batches[idx];
        const { count, rateLimited } = await callBatch(batch);
        passNew += count;
        console.log(`    batch ${idx + 1}/${batches.length}: +${count}/${batch.length}${rateLimited ? ' (rate-limited)' : ''}`);
        if (rateLimited) {
          sawRate = true;
          await sleep(60000);
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, (_, i) => worker(i)));
    totalNew += passNew;
    console.log(`  pass ${pass} translated: ${passNew}`);

    // Recheck cache to know what's still missing.
    const pendingHashes = await Promise.all(pending.map(sha256Hex));
    const nowCached = await fetchCachedHashes(pendingHashes);
    pending = pending.filter((_, i) => !nowCached.has(pendingHashes[i]));
    console.log(`  still missing: ${pending.length}`);

    if (passNew === 0 && pending.length > 0) {
      backoff = Math.min(120, backoff === 0 ? 30 : backoff * 2);
    } else if (sawRate) {
      backoff = 30;
    } else {
      backoff = 0;
    }
  }
  console.log(`Done. Translated ${totalNew} new sentences total.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
