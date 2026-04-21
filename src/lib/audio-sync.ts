// Client-side audio↔text sync loader with IndexedDB cache.
// Hierarchy: in-memory → IndexedDB → Supabase DB → Edge function (transcribe + cache).

import { get as idbGet, set as idbSet } from 'idb-keyval';
import { supabase } from '@/integrations/supabase/client';

export interface SentenceTimestamp {
  idx: number;
  startSec: number;
  endSec: number;
}

export interface AudioSync {
  sentences: SentenceTimestamp[];
  durationSec: number;
}

const memCache = new Map<string, AudioSync>();
const idbKey = (bookId: string, difficulty: string) =>
  `audio-sync:${bookId}:${difficulty}`;

/**
 * Load audio sync data for a book/difficulty.
 * Returns null if no audio is available or generation fails.
 */
export async function loadAudioSync(
  bookId: string,
  difficulty: string,
  sentences: string[]
): Promise<AudioSync | null> {
  const key = idbKey(bookId, difficulty);

  // 1. In-memory
  const mem = memCache.get(key);
  if (mem) return mem;

  // 2. IndexedDB
  try {
    const cached = await idbGet<AudioSync>(key);
    if (cached) {
      memCache.set(key, cached);
      return cached;
    }
  } catch (e) {
    console.warn('[audio-sync] IndexedDB read failed', e);
  }

  // 3. DB direct read (fast path — skips edge function if already generated)
  try {
    const { data, error } = await supabase
      .from('book_audio_sync')
      .select('sentences, duration_sec')
      .eq('book_id', bookId)
      .eq('difficulty', difficulty)
      .maybeSingle();

    if (!error && data) {
      const sync: AudioSync = {
        sentences: data.sentences as unknown as SentenceTimestamp[],
        durationSec: Number(data.duration_sec),
      };
      memCache.set(key, sync);
      idbSet(key, sync).catch(() => {});
      return sync;
    }
  } catch (e) {
    console.warn('[audio-sync] DB read failed', e);
  }

  // 4. Edge function (generates + caches in DB)
  try {
    const { data, error } = await supabase.functions.invoke('generate-audio-sync', {
      body: { bookId, difficulty, sentences },
    });

    if (error) {
      console.error('[audio-sync] generate-audio-sync error', error);
      return null;
    }
    if (!data?.sentences) {
      console.error('[audio-sync] generate-audio-sync returned no sentences', data);
      return null;
    }

    const sync: AudioSync = {
      sentences: data.sentences,
      durationSec: data.durationSec,
    };
    memCache.set(key, sync);
    idbSet(key, sync).catch(() => {});
    return sync;
  } catch (e) {
    console.error('[audio-sync] generate-audio-sync invocation failed', e);
    return null;
  }
}

/**
 * Build the public Storage URL for a book audio file.
 * Returns null if the project URL env var is missing.
 */
export function buildAudioUrl(bookId: string, difficulty: string): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) return null;
  return `${url}/storage/v1/object/public/book-audio/${bookId}/${difficulty}.mp3`;
}

/**
 * Binary search for the sentence index containing a given audio time (seconds).
 */
export function findSentenceAt(
  sync: AudioSync,
  timeSec: number
): number | null {
  const arr = sync.sentences;
  if (arr.length === 0) return null;
  if (timeSec <= arr[0].startSec) return 0;
  if (timeSec >= arr[arr.length - 1].endSec) return arr.length - 1;

  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = arr[mid];
    if (timeSec >= s.startSec && timeSec <= s.endSec) return mid;
    if (timeSec < s.startSec) hi = mid - 1;
    else lo = mid + 1;
  }
  // Between two sentences — return the closest preceding one
  return Math.max(0, hi);
}
