/**
 * Generate grammar notes for the new book "a-aki" (3 difficulties)
 * by calling the grammar-notes edge function, then merge into book-grammar.ts.
 *
 * Run: npx tsx scripts/generate-grammar-for-aaki.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// ---- Read .env to get Supabase URL + anon key (the edge function is public via apikey header) ----
const envPath = path.resolve(__dirname, '../.env');
const envSrc = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envSrc.split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"\n]+)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars');
const USER_JWT = process.env.SUPABASE_USER_JWT || SUPABASE_KEY;

// ---- Load book content ----
const booksPath = path.resolve(__dirname, '../src/data/books.ts');
const booksSrc = fs.readFileSync(booksPath, 'utf-8');

function extractConst(name: string): string {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\`([\\s\\S]*?)\`;`, 'm');
  const m = booksSrc.match(re);
  if (!m) throw new Error(`Could not extract ${name}`);
  return m[1];
}

const versions = {
  simplified: extractConst('aAkiSimplified'),
  intermediate: extractConst('aAkiIntermediate'),
  original: extractConst('aAkiOriginal'),
};

interface GrammarNote {
  pattern: string;
  meaning: string;
  example: string;
  jlpt: string;
  tip: string;
}

async function fetchGrammar(text: string): Promise<GrammarNote[]> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/grammar-notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${USER_JWT}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Edge function failed: ${resp.status} ${errText}`);
  }
  const data = await resp.json();
  return data.notes || data.grammarNotes || data;
}

async function main() {
  const result: Record<string, GrammarNote[]> = {};
  for (const diff of ['simplified', 'intermediate', 'original'] as const) {
    console.log(`Fetching grammar for a-aki/${diff} (${versions[diff].length} chars)...`);
    const notes = await fetchGrammar(versions[diff]);
    console.log(`  → ${notes.length} notes`);
    result[diff] = notes;
    // small delay between calls
    await new Promise((r) => setTimeout(r, 1500));
  }

  // ---- Merge into book-grammar.ts ----
  const grammarPath = path.resolve(__dirname, '../src/data/book-grammar.ts');
  const grammarSrc = fs.readFileSync(grammarPath, 'utf-8');
  const startIdx = grammarSrc.indexOf('= {') + 2;
  const endIdx = grammarSrc.lastIndexOf('};') + 1;
  const jsonStr = grammarSrc.slice(startIdx, endIdx);
  const allGrammar: Record<string, Record<string, GrammarNote[]>> = JSON.parse(jsonStr);

  allGrammar['a-aki'] = result;

  const output = `// Auto-generated grammar notes for all books
// Do not edit manually - regenerate with scripts/generate-book-data

export interface GrammarNote {
  pattern: string;
  meaning: string;
  example: string;
  jlpt: string;
  tip: string;
}

export const bookGrammar: Record<string, Record<string, GrammarNote[]>> = ${JSON.stringify(allGrammar)};
`;
  fs.writeFileSync(grammarPath, output, 'utf-8');
  console.log(`\nWritten to ${grammarPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
