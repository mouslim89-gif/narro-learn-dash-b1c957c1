/**
 * Fetch missing dictionary entries from Jisho API and expand book-dictionary.ts
 * Run: npx tsx scripts/fetch-missing-dictionary.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const base = '/dev-server';
const SUPABASE_URL = 'https://bjkftxbbfxjyezrjzlmw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2Z0eGJiZnhqeWV6cmp6bG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzExNTUsImV4cCI6MjA5MTI0NzE1NX0.DLGXEWor58Uz3RwWbLKDxNQLMdh2ylqZrP0AjjnQ7LE';

// Load existing dictionary
const dictPath = path.join(base, 'src/data/book-dictionary.ts');
const dictSource = fs.readFileSync(dictPath, 'utf-8');
const startIdx = dictSource.indexOf('= {') + 2;
const endIdx = dictSource.lastIndexOf('};') + 1;
const dictionary: Record<string, any> = JSON.parse(dictSource.slice(startIdx, endIdx));

// Load tokens
const tokensSource = fs.readFileSync(path.join(base, 'src/data/book-tokens.ts'), 'utf-8');
const tStart = tokensSource.indexOf('= {') + 2;
const tEnd = tokensSource.lastIndexOf('};') + 1;
const allTokens = JSON.parse(tokensSource.slice(tStart, tEnd));

// Collect all unique words that need lookup
interface TokenInfo { surface: string; baseForm?: string }
const needLookup = new Map<string, TokenInfo>(); // key to look up → token info

for (const bookId of Object.keys(allTokens)) {
  for (const diff of Object.keys(allTokens[bookId])) {
    for (const t of allTokens[bookId][diff]) {
      if (!t.j) continue;
      const surface = t.t;
      const baseForm = t.b;
      
      // Skip if already in dictionary
      if (dictionary[surface] || (baseForm && dictionary[baseForm])) continue;
      
      // Prefer looking up base form (more likely to have dict entry)
      const lookupKey = baseForm || surface;
      if (!needLookup.has(lookupKey)) {
        needLookup.set(lookupKey, { surface, baseForm });
      }
    }
  }
}

console.log(`Need to look up ${needLookup.size} unique words`);

// Batch lookup via edge function
const BATCH_SIZE = 25;
const keys = [...needLookup.keys()];
let fetched = 0;
let found = 0;

for (let i = 0; i < keys.length; i += BATCH_SIZE) {
  const batch = keys.slice(i, i + BATCH_SIZE);
  const url = `${SUPABASE_URL}/functions/v1/jisho-lookup?keywords=${encodeURIComponent(batch.join(','))}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });
    
    if (!response.ok) {
      console.error(`Batch failed: ${response.status}`);
      continue;
    }
    
    const data = await response.json();
    for (const entry of data.batch || []) {
      const keyword = entry.keyword;
      const info = needLookup.get(keyword);
      if (!info) continue;
      
      const cacheEntry = {
        results: entry.results || [],
        deinflected: entry.deinflected || undefined,
      };
      
      // Add under lookup key
      dictionary[keyword] = cacheEntry;
      
      // Also add under surface and base form
      if (info.surface && info.surface !== keyword && cacheEntry.results.length > 0) {
        dictionary[info.surface] = cacheEntry;
      }
      if (info.baseForm && info.baseForm !== keyword && cacheEntry.results.length > 0) {
        dictionary[info.baseForm] = cacheEntry;
      }
      
      if (cacheEntry.results.length > 0) found++;
    }
    
    fetched += batch.length;
    console.log(`  Fetched ${fetched}/${keys.length} (${found} found so far)`);
  } catch (err) {
    console.error(`Batch error:`, err);
  }
  
  // Rate limit
  await new Promise(r => setTimeout(r, 500));
}

// Now do a second pass: for ALL tokens, ensure both surface and base form keys exist
for (const bookId of Object.keys(allTokens)) {
  for (const diff of Object.keys(allTokens[bookId])) {
    for (const t of allTokens[bookId][diff]) {
      if (!t.j || !t.b) continue;
      const surface = t.t;
      const baseForm = t.b;
      
      const entry = dictionary[surface] || dictionary[baseForm];
      if (entry && entry.results?.length > 0) {
        if (!dictionary[surface]) dictionary[surface] = entry;
        if (!dictionary[baseForm]) dictionary[baseForm] = entry;
      }
    }
  }
}

console.log(`\nFinal dictionary: ${Object.keys(dictionary).length} keys`);

// Write back
const output = `// Auto-generated dictionary data for all books
// Do not edit manually - regenerate with scripts/generate-book-data

import type { CacheEntry } from '@/lib/jisho';

export const bookDictionary: Record<string, CacheEntry> = ${JSON.stringify(dictionary, null, 2)};
`;

fs.writeFileSync(dictPath, output, 'utf-8');
console.log(`Written to ${dictPath} (${(Buffer.byteLength(output) / 1024).toFixed(0)} KB)`);
