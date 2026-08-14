import { loadBookTokens, type BookToken } from '@/data/book-tokens';

export interface FuriToken {
  t: string;
  r?: string;
}

const normalize = (s: string) => s.replace(/\s+/g, '');

/** Find the token range whose concatenated surfaces contain `sentence`. */
function sliceMatch(tokens: BookToken[], target: string): FuriToken[] | null {
  let joined = '';
  const starts: number[] = [];
  for (const tok of tokens) {
    starts.push(joined.length);
    joined += normalize(tok.t);
  }
  const at = joined.indexOf(target);
  if (at < 0) return null;
  const end = at + target.length;

  const out: FuriToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const start = starts[i];
    const stop = start + normalize(tokens[i].t).length;
    if (stop <= at) continue;
    if (start >= end) break;
    out.push({ t: tokens[i].t, r: tokens[i].r });
  }
  return out.length > 0 ? out : null;
}

/**
 * Resolve furigana for a sentence taken from a book, using the pre-tokenized
 * (offline Kuromoji) data shipped with the app. No network call, no AI.
 */
export async function findSentenceTokens(
  bookId: string,
  sentence: string,
  difficulty?: string,
): Promise<FuriToken[] | null> {
  const target = normalize(sentence);
  if (!bookId || !target) return null;

  const rootId = bookId.includes('__') ? bookId.split('__')[0] : bookId;
  let map;
  try {
    map = await loadBookTokens(rootId);
  } catch {
    return null;
  }

  for (const byDifficulty of Object.values(map)) {
    const ordered = difficulty && byDifficulty[difficulty]
      ? [byDifficulty[difficulty], ...Object.entries(byDifficulty).filter(([d]) => d !== difficulty).map(([, v]) => v)]
      : Object.values(byDifficulty);
    for (const tokens of ordered) {
      if (!Array.isArray(tokens)) continue;
      const hit = sliceMatch(tokens, target);
      if (hit) return hit;
    }
  }
  return null;
}
