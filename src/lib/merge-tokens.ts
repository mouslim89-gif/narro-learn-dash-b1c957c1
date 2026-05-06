import type { BookToken } from '@/data/book-tokens';

/**
 * Post-process Kuromoji tokens to merge a verb/i-adjective with all of its
 * trailing auxiliaries, conjugational endings, and the て/で particle when it
 * forms a compound (て+いる, て+くれる, etc).
 *
 * This produces "one clickable unit" for forms like 包まれました,
 * 食べさせられる, 行ってくれました — even when Kuromoji split them.
 *
 * The base form (b) and reading (r) are inherited from the head verb so the
 * dictionary lookup still resolves correctly.
 */

// POS prefixes that can be merged INTO the previous verb chunk
const MERGEABLE_POS_PREFIXES = ['助動詞', '動詞/非自立', '動詞/接尾'];

// Specific auxiliary verb base forms that should always glue to a preceding て-form
const AUX_VERB_BASES = new Set([
  'いる', 'ある', 'おる',
  'くる', 'いく', 'みる',
  'しまう', 'おく',
  'くれる', 'あげる', 'もらう', 'いただく', 'くださる',
  'ほしい',
]);

function isHead(tok: BookToken): boolean {
  if (!tok.p) return false;
  return tok.p.startsWith('動詞/自立') || tok.p.startsWith('形容詞');
}

function isMergeableAux(tok: BookToken): boolean {
  if (!tok.p) return false;
  // Auxiliaries (ます, た, ない, れる, せる, られる, させる, です…)
  if (MERGEABLE_POS_PREFIXES.some(p => tok.p!.startsWith(p))) return true;
  return false;
}

function isTeParticle(tok: BookToken): boolean {
  return tok.p === '助詞' && (tok.t === 'て' || tok.t === 'で');
}

function isAuxVerbAfterTe(tok: BookToken): boolean {
  if (!tok.p?.startsWith('動詞')) return false;
  return tok.b ? AUX_VERB_BASES.has(tok.b) : AUX_VERB_BASES.has(tok.t);
}

export function mergeConjugatedTokens(tokens: BookToken[]): BookToken[] {
  const out: BookToken[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];

    if (!isHead(tok)) {
      out.push(tok);
      i++;
      continue;
    }

    // Start a merge run from the head verb/adj
    let surface = tok.t;
    let reading = tok.r ?? '';
    const base = tok.b ?? tok.t;
    const headPos = tok.p;
    let j = i + 1;
    let lastWasTe = false;

    while (j < tokens.length) {
      const next = tokens[j];

      // Stop on punctuation or particles (except て/で which we may consume)
      if (!next.j) break;

      if (isMergeableAux(next)) {
        surface += next.t;
        reading += next.r ?? '';
        lastWasTe = false;
        j++;
        continue;
      }

      if (isTeParticle(next)) {
        // Consume て/で and try to chain an auxiliary verb after it
        const after = tokens[j + 1];
        if (after && isAuxVerbAfterTe(after)) {
          surface += next.t + after.t;
          reading += (next.r ?? '') + (after.r ?? '');
          j += 2;
          lastWasTe = true;
          continue;
        }
        // Standalone て-form (e.g. 信じて + いい): absorb て into the verb chunk
        // so it becomes a single clickable unit, then stop.
        surface += next.t;
        reading += next.r ?? '';
        j++;
        break;
      }

      // After consuming an aux verb that came after て, keep chaining its own auxiliaries
      if (lastWasTe && isMergeableAux(next)) {
        surface += next.t;
        reading += next.r ?? '';
        j++;
        continue;
      }

      break;
    }

    out.push({ t: surface, j: true, p: headPos, r: reading || undefined, b: base });
    i = j;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Phrasal-compound gluing
// ---------------------------------------------------------------------------
// After verb-aux merging, fuse fixed multi-token expressions (じゃない,
// ではない, ように, ような, かもしれない, について, …) into a single
// clickable token whose base form points to the canonical compound.

type PhrasalPattern = {
  /** Sequence of surface forms to match consecutively (token.t === surface). */
  surfaces: string[];
  /** Canonical base form used for dictionary lookup. */
  base: string;
  /** POS tag for the merged token. */
  pos: string;
};

// Order matters only when patterns share a prefix — we sort by length desc.
const PHRASAL_PATTERNS: PhrasalPattern[] = [
  // negative copulas
  { surfaces: ['じゃ', 'ありませんでした'], base: 'じゃない', pos: '助動詞' },
  { surfaces: ['じゃ', 'ありません'], base: 'じゃない', pos: '助動詞' },
  { surfaces: ['じゃ', 'なかった'], base: 'じゃない', pos: '助動詞' },
  { surfaces: ['じゃ', 'ない'], base: 'じゃない', pos: '助動詞' },
  { surfaces: ['で', 'は', 'ありませんでした'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['で', 'は', 'ありません'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['で', 'は', 'なかった'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['で', 'は', 'ない'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['では', 'ありませんでした'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['では', 'ありません'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['では', 'なかった'], base: 'ではない', pos: '助動詞' },
  { surfaces: ['では', 'ない'], base: 'ではない', pos: '助動詞' },

  // よう / そう / みたい + に/な/だ/です
  { surfaces: ['よう', 'に'], base: 'ように', pos: '副詞' },
  { surfaces: ['よう', 'な'], base: 'ような', pos: '連体詞' },
  { surfaces: ['そう', 'に'], base: 'そうに', pos: '副詞' },
  { surfaces: ['そう', 'な'], base: 'そうな', pos: '連体詞' },
  { surfaces: ['みたい', 'に'], base: 'みたいに', pos: '副詞' },
  { surfaces: ['みたい', 'な'], base: 'みたいな', pos: '連体詞' },
  { surfaces: ['みたい', 'です'], base: 'みたいだ', pos: '助動詞' },
  { surfaces: ['みたい', 'だ'], base: 'みたいだ', pos: '助動詞' },

  // なければ / なくては
  { surfaces: ['なければ', 'ならない'], base: 'なければならない', pos: '表現' },
  { surfaces: ['なければ', 'なりません'], base: 'なければならない', pos: '表現' },
  { surfaces: ['なければ', 'いけない'], base: 'なければいけない', pos: '表現' },
  { surfaces: ['なければ', 'いけません'], base: 'なければいけない', pos: '表現' },
  { surfaces: ['なくて', 'は', 'ならない'], base: 'なくてはならない', pos: '表現' },
  { surfaces: ['なくて', 'は', 'いけない'], base: 'なくてはいけない', pos: '表現' },

  // ことがある / ことがない
  { surfaces: ['こと', 'が', 'ある'], base: 'ことがある', pos: '表現' },
  { surfaces: ['こと', 'が', 'ない'], base: 'ことがない', pos: '表現' },

  // わけではない
  { surfaces: ['わけ', 'で', 'は', 'ない'], base: 'わけではない', pos: '表現' },
  { surfaces: ['わけ', 'では', 'ない'], base: 'わけではない', pos: '表現' },

  // かもしれない
  { surfaces: ['かも', 'しれません'], base: 'かもしれない', pos: '助動詞' },
  { surfaces: ['かも', 'しれない'], base: 'かもしれない', pos: '助動詞' },

  // について / に対して / として / による / によって
  { surfaces: ['に', 'ついて'], base: 'について', pos: '表現' },
  { surfaces: ['に', '対して'], base: 'に対して', pos: '表現' },
  { surfaces: ['と', 'して'], base: 'として', pos: '表現' },
  { surfaces: ['に', 'よる'], base: 'による', pos: '表現' },
  { surfaces: ['に', 'よって'], base: 'によって', pos: '表現' },
];

// Sort patterns by surface count descending so longer matches win.
const SORTED_PHRASAL = [...PHRASAL_PATTERNS].sort(
  (a, b) => b.surfaces.length - a.surfaces.length
);

export function gluePhrasalCompounds(tokens: BookToken[]): BookToken[] {
  const out: BookToken[] = [];
  let i = 0;

  while (i < tokens.length) {
    let matched: PhrasalPattern | null = null;

    for (const pat of SORTED_PHRASAL) {
      if (i + pat.surfaces.length > tokens.length) continue;
      let ok = true;
      for (let k = 0; k < pat.surfaces.length; k++) {
        const t = tokens[i + k];
        if (!t.j || t.t !== pat.surfaces[k]) { ok = false; break; }
      }
      if (ok) { matched = pat; break; }
    }

    if (matched) {
      let surface = '';
      let reading = '';
      for (let k = 0; k < matched.surfaces.length; k++) {
        const t = tokens[i + k];
        surface += t.t;
        reading += t.r ?? '';
      }
      out.push({
        t: surface,
        j: true,
        p: matched.pos,
        r: reading || undefined,
        b: matched.base,
      });
      i += matched.surfaces.length;
      continue;
    }

    out.push(tokens[i]);
    i++;
  }

  return out;
}

