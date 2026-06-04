import { supabase } from'@/integrations/supabase/client';

/** SHA-256 hex of a string, using Web Crypto. */
export async function hashSentence(s: string): Promise<string> {
 const data = new TextEncoder().encode(s.trim());
 const buf = await crypto.subtle.digest('SHA-256', data);
 return Array.from(new Uint8Array(buf))
 .map((b) => b.toString(16).padStart(2,'0'))
 .join('');
}

const memCache = new Map<string, string>(); // hash -> english

function lsKey(hash: string) {
 return`xlate:${hash}`;
}

function lsGet(hash: string): string | null {
 try {
 return localStorage.getItem(lsKey(hash));
 } catch {
 return null;
 }
}

function lsSet(hash: string, english: string) {
 try {
 localStorage.setItem(lsKey(hash), english);
 } catch {
 /* quota: ignore */
 }
}

export type TranslationMap = Map<string, string>; // hash -> english

export interface PreloadOptions {
 /** Called every time the map grows. */
 onProgress?: (map: TranslationMap) => void;
 /** Abort signal — stop further work, but already-resolved entries remain valid. */
 signal?: AbortSignal;
}

/**
 * Preload English translations for a list of Japanese sentences.
 *
 * Strategy:
 * 1) Hash everything. Resolve trivially from in-memory cache + localStorage.
 * 2) For still-missing hashes, one bulk SELECT against`sentence_translations`.
 * 3) For genuinely-uncached sentences, call`translate-sentences-batch`in
 * chunks of 50, up to 3 in flight, writing each result back to all caches.
 */
export async function preloadTranslations(
 sentences: string[],
 opts: PreloadOptions = {},
): Promise<TranslationMap> {
 const map: TranslationMap = new Map();
 if (sentences.length === 0) return map;

 // Dedupe
 const normalized = sentences.map((s) => s.trim()).filter((s) => s.length > 0);
 const hashes = await Promise.all(normalized.map(hashSentence));
 const byHash = new Map<string, string>(); // hash -> japanese
 normalized.forEach((s, i) => byHash.set(hashes[i], s));

 // 1) Local caches
 const stillMissing: string[] = [];
 for (const h of byHash.keys()) {
 const mem = memCache.get(h);
 if (mem) {
 map.set(h, mem);
 continue;
 }
 const ls = lsGet(h);
 if (ls) {
 memCache.set(h, ls);
 map.set(h, ls);
 continue;
 }
 stillMissing.push(h);
 }
 opts.onProgress?.(new Map(map));
 if (stillMissing.length === 0) return map;
 if (opts.signal?.aborted) return map;

 // 2) Bulk DB lookup
 const dbCached = await fetchCachedFromDb(stillMissing);
 for (const [h, eng] of dbCached) {
 memCache.set(h, eng);
 lsSet(h, eng);
 map.set(h, eng);
 }
 opts.onProgress?.(new Map(map));
 if (opts.signal?.aborted) return map;

 const truly = stillMissing.filter((h) => !map.has(h));
 if (truly.length === 0) return map;

 // 3) Edge function batches
 const CHUNK = 50;
 const PARALLEL = 3;
 const chunks: string[][] = [];
 for (let i = 0; i < truly.length; i += CHUNK) {
 chunks.push(truly.slice(i, i + CHUNK));
 }

 let cursor = 0;
 async function worker() {
 while (cursor < chunks.length && !opts.signal?.aborted) {
 const myIdx = cursor++;
 const chunk = chunks[myIdx];
 try {
 const payload = chunk.map((h) => byHash.get(h)!).filter(Boolean);
 const { data, error } = await supabase.functions.invoke('translate-sentences-batch', {
 body: { sentences: payload },
 });
 if (error) {
 console.warn('translate-sentences-batch chunk failed', error);
 continue;
 }
 const results: { hash: string; english: string }[] = (data as any)?.results ?? [];
 for (const r of results) {
 if (!r.english) continue;
 memCache.set(r.hash, r.english);
 lsSet(r.hash, r.english);
 map.set(r.hash, r.english);
 }
 opts.onProgress?.(new Map(map));
 } catch (e) {
 console.warn('translate-sentences-batch threw', e);
 }
 }
 }

 await Promise.all(Array.from({ length: Math.min(PARALLEL, chunks.length) }, worker));
 return map;
}

async function fetchCachedFromDb(hashes: string[]): Promise<Map<string, string>> {
 const out = new Map<string, string>();
 // Postgres IN list — chunk to avoid huge URLs.
 const CHUNK = 200;
 for (let i = 0; i < hashes.length; i += CHUNK) {
 const part = hashes.slice(i, i + CHUNK);
 const { data, error } = await supabase
 .from('sentence_translations')
 .select('hash, english')
 .in('hash', part);
 if (error) {
 console.warn('sentence_translations bulk lookup failed', error);
 continue;
 }
 for (const row of data ?? []) {
 if (row?.hash && row?.english) out.set(row.hash, row.english);
 }
 }
 return out;
}
