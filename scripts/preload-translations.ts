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
  for (const book of books) {
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
  const CHUNK = 500;
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const part = hashes.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('sentence_translations')
      .select('hash')
  const CHUNK = 80;
    if (error) {
      console.warn('cache lookup error', error.message);
      continue;
    }
    for (const r of data ?? []) out.add(r.hash);
  }
  return out;
}

async function callBatch(sentences: string[]): Promise<number> {
  const { data, error } = await supabase.functions.invoke('translate-sentences-batch', {
    body: { sentences },
  });
  if (error) {
    console.error('  batch error:', error.message);
    return 0;
  }
  const results = (data as any)?.results ?? [];
  if ((data as any)?.rateLimited) console.warn('  rate-limited');
  if ((data as any)?.creditsExhausted) console.error('  CREDITS EXHAUSTED');
  return results.length;
}

async function main() {
  console.log('Collecting texts…');
  const blobs = collectAllTexts();
  console.log(`  ${blobs.length} distinct text blobs across ${books.length} books`);

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
  const PARALLEL = 3;
  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += BATCH) batches.push(missing.slice(i, i + BATCH));

  console.log(`Translating ${missing.length} sentences in ${batches.length} batches (parallel=${PARALLEL})…`);
  let done = 0;
  let translated = 0;
  let cursor = 0;
  const worker = async (id: number) => {
    while (cursor < batches.length) {
      const idx = cursor++;
      const batch = batches[idx];
      const got = await callBatch(batch);
      translated += got;
      done++;
      console.log(`  [${done}/${batches.length}] worker ${id} batch ${idx + 1}: +${got}/${batch.length}`);
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, (_, i) => worker(i)));
  console.log(`Done. Translated ${translated} new sentences.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
