import { toHiragana, isRomaji } from 'wanakana';

/**
 * If the query looks like Japanese romaji (short and cleanly convertible), return its hiragana form.
 * Otherwise return null so Jisho can search the original English word.
 *
 * Heuristic: only convert when (a) ≤6 letters AND (b) toHiragana leaves no Latin letters behind.
 * "neko", "sushi", "arigatou" → kana. "superhero", "hero", "cat" → null (kept English).
 */
export function romajiToKana(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z]+$/.test(trimmed)) return null;
  if (trimmed.length > 6) return null;
  if (!isRomaji(trimmed)) return null;
  const kana = toHiragana(trimmed, { passRomaji: false });
  if (!kana || kana === trimmed.toLowerCase()) return null;
  // Reject if any Latin letter remains (means it didn't cleanly convert).
  if (/[a-zA-Z]/.test(kana)) return null;
  return kana;
}
