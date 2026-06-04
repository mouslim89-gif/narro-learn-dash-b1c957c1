// DEPRECATED — dictionary entries now live in the`dictionary`Supabase table
// and are hydrated client-side via`src/lib/dictionary-db.ts`(DB → IndexedDB).
//
// This file is kept as an empty stub for backwards compatibility with any
// remaining imports. New books should NOT add entries here — instead, run
//`npx tsx scripts/sync-dictionary-to-db.ts`to upload missing words.

import type { CacheEntry } from'@/lib/jisho';

export const bookDictionary: Record<string, CacheEntry> = {};
