/**
 * One-off backfill of the `grammar_examples` cache.
 *
 * Calls the `grammar-examples` edge function once per unique grammar pattern.
 * The edge function returns its DB cache when the pattern already exists, so
 * re-running this script is safe and costs no AI credits for done patterns.
 *
 * Usage: npx tsx scripts/preload-grammar-examples.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envSrc = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envSrc.split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"\n]+)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase env vars in .env');
}

const AUTH_HEADER = `Bearer ${SUPABASE_KEY}`;

interface GrammarNote {
  pattern: string;
  meaning: string;
  jlpt: string;
}

function slugify(pattern: string): string {
  return pattern
    .toLowerCase()
    .trim()
    .replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf0-9a-z]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One request with exponential backoff on 429 / 5xx. */
async function requestWithRetry(note: GrammarNote, maxAttempts = 5): Promise<'ok' | 'failed'> {
  let delay = 2000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/grammar-examples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_HEADER,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ pattern: note.pattern, meaning: note.meaning, jlpt: note.jlpt }),
      });

      if (resp.ok) {
        await resp.json().catch(() => null);
        return 'ok';
      }

      const body = await resp.text();
      const retryable = resp.status === 429 || resp.status >= 500;
      console.error(`  ! [${note.pattern}] ${resp.status} ${body.slice(0, 140)}`);
      if (!retryable || attempt === maxAttempts) return 'failed';
    } catch (e) {
      console.error(`  ! [${note.pattern}] ${(e as Error).message}`);
      if (attempt === maxAttempts) return 'failed';
    }
    await sleep(delay);
    delay = Math.min(delay * 2, 30000);
  }
  return 'failed';
}

async function main() {
  const grammarPath = path.resolve(__dirname, '../src/data/book-grammar.ts');
  const grammarSrc = fs.readFileSync(grammarPath, 'utf-8');

  const startIdx = grammarSrc.indexOf('= {') + 2;
  const endIdx = grammarSrc.lastIndexOf('};') + 1;
  const bookGrammar = JSON.parse(grammarSrc.slice(startIdx, endIdx));

  const notesMap = new Map<string, GrammarNote>();
  for (const bookId in bookGrammar) {
    for (const diff in bookGrammar[bookId]) {
      const parts = bookGrammar[bookId][diff];
      const flatNotes: GrammarNote[] = Array.isArray(parts[0]) ? parts.flat() : parts;
      for (const note of flatNotes) {
        const slug = slugify(note.pattern);
        if (!notesMap.has(slug)) notesMap.set(slug, note);
      }
    }
  }

  const allNotes = [...notesMap.values()];
  console.log(`Found ${allNotes.length} unique grammar patterns.\n`);

  let ok = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < allNotes.length; i++) {
    const note = allNotes[i];
    process.stdout.write(`[${i + 1}/${allNotes.length}] ${note.pattern} … `);
    const res = await requestWithRetry(note);
    if (res === 'ok') {
      ok++;
      console.log('ok');
    } else {
      failed++;
      failures.push(note.pattern);
      console.log('FAILED');
    }
    // Stay comfortably below the AI gateway rate limit.
    await sleep(1000);
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`);
  if (failures.length) {
    console.log('Failed patterns (re-run the script to retry, cached ones are free):');
    for (const p of failures) console.log(`  - ${p}`);
  }
}

main().catch(console.error);
