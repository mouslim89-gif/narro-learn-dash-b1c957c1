/**
 * Expand book-dictionary.ts with base-form and merged-surface keys.
 * Reads existing dictionary + tokens, adds alias keys so WordPopup cache hits.
 * Run: npx tsx scripts/expand-dictionary.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Parse dictionary TS file to extract the JSON object
const dictPath = path.resolve(__dirname, '../src/data/book-dictionary.ts');
const dictSource = fs.readFileSync(dictPath, 'utf-8');

// Extract the object between `= {` and `};`
const startIdx = dictSource.indexOf('= {') + 2;
const endIdx = dictSource.lastIndexOf('};') + 1;
const jsonStr = dictSource.slice(startIdx, endIdx);
const dictionary: Record<string, any> = JSON.parse(jsonStr);

console.log(`Loaded dictionary with ${Object.keys(dictionary).length} keys`);

// Parse book-tokens to find all (surface, baseForm) pairs
const tokensPath = path.resolve(__dirname, '../src/data/book-tokens.ts');
const tokensSource = fs.readFileSync(tokensPath, 'utf-8');
const tokensStartIdx = tokensSource.indexOf('= {') + 2;
const tokensEndIdx = tokensSource.lastIndexOf('};') + 1;
const tokensJsonStr = tokensSource.slice(tokensStartIdx, tokensEndIdx);
const allTokens: Record<string, Record<string, { t: string; j: boolean; r?: string; b?: string; p?: string }[]>> = JSON.parse(tokensJsonStr);

// Collect all unique surface→baseForm mappings and merged surfaces
let addedBaseForms = 0;
let addedMergedSurfaces = 0;

for (const bookId of Object.keys(allTokens)) {
  for (const diff of Object.keys(allTokens[bookId])) {
    const tokens = allTokens[bookId][diff];
    for (const token of tokens) {
      if (!token.j) continue;

      const surface = token.t;
      const baseForm = token.b;

      // If token has a base form and we have a dictionary entry for any variant
      if (baseForm && baseForm !== surface) {
        // Find an existing entry to alias
        const existingEntry = dictionary[surface] || dictionary[baseForm];
        
        if (existingEntry && existingEntry.results?.length > 0) {
          // Add base form key if missing
          if (!dictionary[baseForm]) {
            dictionary[baseForm] = existingEntry;
            addedBaseForms++;
          }
          // Add merged surface key if missing
          if (!dictionary[surface]) {
            dictionary[surface] = existingEntry;
            addedMergedSurfaces++;
          }
        }
      }
    }
  }
}

console.log(`Added ${addedBaseForms} base-form keys`);
console.log(`Added ${addedMergedSurfaces} merged-surface keys`);
console.log(`Total keys: ${Object.keys(dictionary).length}`);

// Write back
const output = `// Auto-generated dictionary data for all books
// Do not edit manually - regenerate with scripts/generate-book-data

import type { CacheEntry } from '@/lib/jisho';

export const bookDictionary: Record<string, CacheEntry> = ${JSON.stringify(dictionary, null, 2)};
`;

fs.writeFileSync(dictPath, output, 'utf-8');
console.log(`Written to ${dictPath} (${(Buffer.byteLength(output) / 1024).toFixed(0)} KB)`);
