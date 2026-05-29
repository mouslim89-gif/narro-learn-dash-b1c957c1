// Normalizes grammar note pattern/meaning/tip across src/data/book-grammar.ts:
// - Standardizes slot labels (plain form → Dictionary form, te-form → Te-form, etc.)
// - Capitalizes first letter of pattern, meaning, tip
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/data/book-grammar.ts";
const src = readFileSync(PATH, "utf8");

// Parse: extract the JS object literal after `export const bookGrammar: ... = ` up to the final `};`
const marker = "export const bookGrammar: Record<string, Record<string, GrammarNote[][]>> = ";
const idx = src.indexOf(marker);
if (idx < 0) throw new Error("marker not found");
const head = src.slice(0, idx + marker.length);
const tail = src.slice(idx + marker.length);
// tail ends with `};\n` (object literal terminator). Strip trailing `;` to JSON.parse.
const endIdx = tail.lastIndexOf("};");
const objLiteral = tail.slice(0, endIdx + 1); // includes `}`
const data = JSON.parse(objLiteral);

const labelMap: [RegExp, string][] = [
  [/\bplain\s*non[-\s]?past\b/gi, "Dictionary form"],
  [/\bplain\s*form\b/gi, "Dictionary form"],
  [/\bdictionary\s*form\b/gi, "Dictionary form"],
  [/\bjisho[-\s]?(form|kei)\b/gi, "Dictionary form"],
  [/\bplain\s*past\b/gi, "Plain past"],
  [/\bta[-\s]?form\b/gi, "Plain past"],
  [/\bplain\s*negative\b/gi, "Plain negative"],
  [/\bte[-\s]?form\b/gi, "Te-form"],
  [/\bmasu[-\s]?stem\b/gi, "Masu-stem"],
  [/\bverb\s*stem\b/gi, "Stem"],
  [/\bi[-\s]?adjective\b/gi, "I-adjective"],
  [/\bna[-\s]?adjective\b/gi, "Na-adjective"],
  [/\bnoun\b/g, "Noun"],
  [/\bclause\b/gi, "Clause"],
];

function normalize(s: string): string {
  if (!s) return s;
  let out = s;
  for (const [re, rep] of labelMap) out = out.replace(re, rep);
  // capitalize first letter (skip if starts with non-letter like ～ or 〜 or Japanese)
  const first = out.charAt(0);
  if (/[a-z]/.test(first)) out = first.toUpperCase() + out.slice(1);
  return out;
}

let count = 0;
for (const book of Object.keys(data)) {
  for (const diff of Object.keys(data[book])) {
    const parts = data[book][diff];
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (!Array.isArray(part)) continue;
      for (const note of part) {
        for (const k of ["pattern", "meaning", "tip"] as const) {
          if (typeof note[k] === "string") {
            const n = normalize(note[k]);
            if (n !== note[k]) count++;
            note[k] = n;
          }
        }
      }
    }
  }
}

const newObj = JSON.stringify(data);
writeFileSync(PATH, head + newObj + ";\n");
console.log(`Normalized ${count} fields.`);
