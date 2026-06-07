/**
 * Generate grammar notes for "gyofukuki" — one call per (difficulty, part).
 * Writes back into book-grammar.ts under the GrammarNote[][] shape.
 *
 * Run: npx tsx scripts/generate-grammar-for-gyofukuki.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  gyofukukiSimplifiedParts,
  gyofukukiIntermediateParts,
  gyofukukiOriginalParts,
} from '../src/data/books/gyofukuki';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

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

const partsByDiff = {
  simplified: gyofukukiSimplifiedParts,
  intermediate: gyofukukiIntermediateParts,
  original: gyofukukiOriginalParts,
} as const;

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
      Authorization: `Bearer ${SUPABASE_KEY}`,
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
  const result: Record<string, GrammarNote[][]> = {};
  for (const diff of ['simplified', 'intermediate', 'original'] as const) {
    const parts = partsByDiff[diff];
    const perPart: GrammarNote[][] = [];
    for (let i = 0; i < parts.length; i++) {
      console.log(`Fetching grammar for gyofukuki/${diff} part ${i + 1}/${parts.length} (${parts[i].length} chars)...`);
      const notes = await fetchGrammar(parts[i]);
      console.log(`  → ${notes.length} notes`);
      perPart.push(notes);
      await new Promise((r) => setTimeout(r, 1200));
    }
    result[diff] = perPart;
  }

  const grammarPath = path.resolve(__dirname, '../src/data/book-grammar.ts');
  const grammarSrc = fs.readFileSync(grammarPath, 'utf-8');
  const startIdx = grammarSrc.indexOf('= {') + 2;
  const endIdx = grammarSrc.lastIndexOf('};') + 1;
  const jsonStr = grammarSrc.slice(startIdx, endIdx);
  const allGrammar: Record<string, Record<string, GrammarNote[][]>> = JSON.parse(jsonStr);

  allGrammar['gyofukuki'] = result;

  const before = grammarSrc.slice(0, startIdx);
  const after = grammarSrc.slice(endIdx);
  const output = `${before}${JSON.stringify(allGrammar)}${after}`;
  fs.writeFileSync(grammarPath, output, 'utf-8');
  console.log(`\nWritten to ${grammarPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
