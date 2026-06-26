import { useMemo } from'react';
import { useFlashcardStore } from'@/stores/flashcards';
import type { BookToken } from'@/data/book-tokens';

export type KnownLevel ='new'|'learning'|'known';

/** Katakana → Hiragana for stable matching. */
function normalizeKana(text: string): string {
 let out ='';
 for (const ch of text.normalize('NFC')) {
 const code = ch.charCodeAt(0);
 if (code >= 0x30a1 && code <= 0x30f6) {
 out += String.fromCharCode(code - 0x60);
 } else {
 out += ch;
 }
 }
 return out;
}

function masteryToLevel(mastery: number): KnownLevel {
 if (mastery <= 0) return'new';
 if (mastery <= 2) return'learning';
 return'known';
}

/**
 * Returns a Map<normalizedKey, mastery> for fast O(1) token matching.
 * Indexes both`word`and`reading`. If a key collides, keeps the highest mastery.
 */
export function useKnownWordsIndex(): Map<string, number> {
 const savedWords = useFlashcardStore((s) => s.savedWords);
 return useMemo(() => {
 const map = new Map<string, number>();
 for (const w of savedWords) {
 const m = w.mastery ?? 0;
 const keys = [w.word, w.reading].filter(Boolean).map(normalizeKana);
 for (const k of keys) {
 const prev = map.get(k);
 if (prev === undefined || m > prev) map.set(k, m);
 }
 }
 return map;
 }, [savedWords]);
}

/**
 * Match a reader token against the known-words index.
 * Strict matching only on`b`(base form) and`t`(surface) — no kana-only fallback,
 * to avoid highlighting particles like の, は, etc.
 */
export function getKnownLevel(
 token: BookToken,
 index: Map<string, number>
): KnownLevel | null {
  if (!token.j) return null;
  const candidates = [token.b, token.t, token.r].filter(Boolean) as string[];

 for (const c of candidates) {
 const k = normalizeKana(c);
 const m = index.get(k);
 if (m !== undefined) return masteryToLevel(m);
 }
 return null;
}
