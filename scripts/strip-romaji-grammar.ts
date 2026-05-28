/**
 * One-off: rewrite romaji out of existing grammar notes in
 * src/data/book-grammar.ts. `pattern` and `example` are left untouched
 * (already kana/kanji / verbatim source). Only `meaning` and `tip` are
 * rewritten via Lovable AI when they contain romaji-looking tokens.
 *
 * Run: npx tsx scripts/strip-romaji-grammar.ts
 */
import * as fs from 'fs';
import * as path from 'path';

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

interface GrammarNote {
  pattern: string;
  meaning: string;
  example: string;
  jlpt: string;
  tip: string;
}

// English allow-list: common words that look like romaji but are English.
const ENGLISH = new Set<string>(
  `a an the and or but if then else of in on at to for from with by as is are was were be been being have has had do does did not no nor so than that this these those it its their there here will would can could should may might must shall about into over under between among through during before after while until against without within across upon onto off out up down across against around behind below beneath beside besides beyond inside outside underneath versus via near
verb verbs noun nouns adjective adjectives adverb adverbs particle particles pronoun pronouns clause clauses sentence sentences phrase phrases word words form forms ending endings root stem base plain polite formal informal casual literary written spoken modern classical archaic colloquial honorific humble respectful negative positive affirmative interrogative imperative declarative conditional volitional passive causative potential transitive intransitive
group one two three four five six seven eight nine ten first second third meaning means uses use used using example examples action actions state states result results subject object topic comment focus emphasis nuance feeling tone reason cause effect purpose method manner time place direction location speaker listener person people speaker speakers writer reader past present future progressive perfect completed ongoing habitual repeated single multiple plural singular conditional inevitable natural law rule rules pattern patterns common rare frequent typical typical typically often sometimes always never usually generally specifically literally figuratively metaphorically
because before after when while since although though even unless until whether weather like unlike similar different same opposite contrary contrast comparison comparison comparable equivalent equivalent equivalents
jlpt level easy hard difficult basic intermediate advanced learner learners beginner beginners teacher teachers student students japanese english french chinese korean
yes very much really quite rather just only also too either neither both all some any none most least few several many much more less greater smaller bigger
ok okay sure indeed certainly probably perhaps maybe possibly likely surely definitely absolutely truly genuinely simply merely actually basically essentially generally specifically particularly especially mainly primarily mostly largely partly partially fully completely entirely totally`
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
);

const ROMAJI_VOWEL_RE = /^[a-zāīūēōâîûêôēōáíúéó']+$/i;

function looksLikeRomaji(s: string): boolean {
  // Tokenize on non-letter boundaries; ignore tokens inside ()/[] glosses too — still scan them.
  const tokens = s.split(/[^A-Za-zāīūēōâîûêôēōáíúéó']+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok.length < 2) continue;
    if (!ROMAJI_VOWEL_RE.test(tok)) continue;
    const lower = tok.toLowerCase();
    if (ENGLISH.has(lower)) continue;
    // Roman numerals / acronyms are uppercase
    if (tok === tok.toUpperCase() && tok.length <= 5) continue;
    // Heuristic: contains a vowel
    if (!/[aeiouāīūēōáíúéó]/i.test(tok)) continue;
    return true;
  }
  return false;
}

async function rewriteBatch(items: { idx: number; meaning: string; tip: string; pattern: string; example: string }[]): Promise<{ idx: number; meaning: string; tip: string }[]> {
  const system = `You rewrite Japanese-grammar study notes to remove ALL romaji (Latin-letter transliterations of Japanese).
Rules:
- Keep the same meaning. Do not change difficulty or scope.
- Replace any romaji word (e.g. "tabeta", "te-iru", "kuru", "na-adjective", "wa", "ga") with the kana/kanji equivalent. An English gloss in parentheses is fine (e.g. 食べる (to eat)).
- English explanation words (verb, particle, conditional, etc.) stay in English.
- Keep punctuation and length similar.
- Only rewrite the "meaning" and "tip" fields. Return them as-is for each item.`;

  const user = `Rewrite the following notes. Return JSON: {"items":[{"idx":N,"meaning":"...","tip":"..."}]}.

${JSON.stringify(items, null, 2)}`;

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY || env.LOVABLE_API_KEY || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'return_rewritten',
            parameters: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      idx: { type: 'number' },
                      meaning: { type: 'string' },
                      tip: { type: 'string' },
                    },
                    required: ['idx', 'meaning', 'tip'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['items'],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'return_rewritten' } },
    }),
  });

  if (!resp.ok) {
    throw new Error(`AI gateway error: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error('No tool call in response');
  return JSON.parse(args).items;
}

async function main() {
  const grammarPath = path.resolve(__dirname, '../src/data/book-grammar.ts');
  const grammarSrc = fs.readFileSync(grammarPath, 'utf-8');
  const startIdx = grammarSrc.indexOf('= {') + 2;
  const endIdx = grammarSrc.lastIndexOf('};') + 1;
  const jsonStr = grammarSrc.slice(startIdx, endIdx);
  const allGrammar: Record<string, Record<string, GrammarNote[][] | GrammarNote[]>> = JSON.parse(jsonStr);

  // Flatten with refs back to original objects so we can mutate in place.
  type Flat = { book: string; diff: string; partIdx: number; noteIdx: number; note: GrammarNote };
  const flat: Flat[] = [];
  for (const [book, diffs] of Object.entries(allGrammar)) {
    for (const [diff, val] of Object.entries(diffs)) {
      // Support both shapes: GrammarNote[] (legacy) and GrammarNote[][] (parts).
      const parts: GrammarNote[][] = Array.isArray(val) && val.length && Array.isArray((val as any)[0])
        ? (val as GrammarNote[][])
        : [val as GrammarNote[]];
      parts.forEach((notes, pi) => {
        notes.forEach((note, ni) => {
          flat.push({ book, diff, partIdx: pi, noteIdx: ni, note });
        });
      });
    }
  }

  const flagged = flat.filter(({ note }) => looksLikeRomaji(note.meaning) || looksLikeRomaji(note.tip));
  console.log(`Total notes: ${flat.length}. Flagged for rewrite: ${flagged.length}.`);

  if (flagged.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const BATCH = 15;
  for (let i = 0; i < flagged.length; i += BATCH) {
    const slice = flagged.slice(i, i + BATCH);
    const payload = slice.map((f, j) => ({
      idx: j,
      pattern: f.note.pattern,
      example: f.note.example,
      meaning: f.note.meaning,
      tip: f.note.tip,
    }));
    console.log(`Batch ${i / BATCH + 1}/${Math.ceil(flagged.length / BATCH)} (${slice.length} items)...`);
    try {
      const out = await rewriteBatch(payload);
      for (const item of out) {
        const target = slice[item.idx];
        if (!target) continue;
        target.note.meaning = item.meaning;
        target.note.tip = item.tip;
      }
    } catch (e) {
      console.error(`  Batch failed: ${(e as Error).message}. Continuing.`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  const output = `// Auto-generated grammar notes for all books
// Do not edit manually - regenerate with scripts/generate-book-data
//
// Shape: bookGrammar[bookId][difficulty] = GrammarNote[][]
//   - Outer array: one entry per book "part" (chapter-like split).
//   - Single-part books are still wrapped as [notes] for uniformity.

export interface GrammarNote {
  pattern: string;
  meaning: string;
  example: string;
  jlpt: string;
  tip: string;
}

export const bookGrammar: Record<string, Record<string, GrammarNote[][]>> = ${JSON.stringify(allGrammar)};
`;
  fs.writeFileSync(grammarPath, output, 'utf-8');
  console.log(`\nWritten to ${grammarPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
