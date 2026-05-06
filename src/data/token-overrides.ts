import type { BookToken } from '@/data/book-tokens';

/**
 * Per-book token overrides. Lets you manually fix tokenization for tricky
 * spans without touching merge logic or regenerating tokens.
 *
 * Each override matches a CONSECUTIVE sequence of token surface forms
 * (`match`) anywhere in the book and replaces them with `replace`.
 *
 * Matching is on surface form only (`tok.t`). Longer matches win.
 *
 * Example:
 *   '桜の樹' is currently one noun token → split it:
 *     { match: ['桜の樹'], replace: [
 *       { t: '桜', j: true, p: '名詞', r: 'さくら' },
 *       { t: 'の', j: true, p: '助詞', r: 'の' },
 *       { t: '樹', j: true, p: '名詞', r: 'き' },
 *     ]}
 *
 *   Or merge a sequence into a single token:
 *     { match: ['呑め', 'そう', 'な'], replace: [
 *       { t: '呑めそうな', j: true, p: '動詞/自立', b: '呑む', r: 'のめそうな' },
 *     ]}
 *
 * Use `'*'` (book id) to apply an override to ALL books.
 */
export interface TokenOverride {
  match: string[];
  replace: BookToken[];
}

export const tokenOverrides: Record<string, TokenOverride[]> = {
  // Example — uncomment and adapt as needed:
  // 'sakura': [
  //   { match: ['呑め', 'そう', 'な'], replace: [
  //     { t: '呑めそうな', j: true, p: '動詞/自立', b: '呑む', r: 'のめそうな' },
  //   ]},
  // ],
  '*': [
    // Global overrides applied to every book go here.
  ],
};

/**
 * Apply token overrides for a given book. Runs at the very start of the
 * runtime pipeline, before any merge/split logic. Longest matches win.
 */
export function applyTokenOverrides(bookId: string, tokens: BookToken[]): BookToken[] {
  const rules = [
    ...(tokenOverrides[bookId] ?? []),
    ...(tokenOverrides['*'] ?? []),
  ];
  if (rules.length === 0) return tokens;

  // Sort longest match first so overlapping rules resolve deterministically.
  const sorted = [...rules].sort((a, b) => b.match.length - a.match.length);

  const out: BookToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    let matched: TokenOverride | null = null;
    for (const rule of sorted) {
      if (rule.match.length === 0) continue;
      if (i + rule.match.length > tokens.length) continue;
      let ok = true;
      for (let k = 0; k < rule.match.length; k++) {
        if (tokens[i + k].t !== rule.match[k]) { ok = false; break; }
      }
      if (ok) { matched = rule; break; }
    }
    if (matched) {
      out.push(...matched.replace);
      i += matched.match.length;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out;
}
