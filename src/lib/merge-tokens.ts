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
        // Standalone て-form connecting to a non-aux: stop here, leave て as separate token
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
