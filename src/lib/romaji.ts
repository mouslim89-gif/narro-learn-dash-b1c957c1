import { toHiragana, isRomaji } from 'wanakana';

/** If the query is pure romaji, return its hiragana form; else return null. */
export function romajiToKana(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return null;
  if (!isRomaji(trimmed)) return null;
  const kana = toHiragana(trimmed, { passRomaji: false });
  return kana && kana !== trimmed.toLowerCase() ? kana : null;
}
