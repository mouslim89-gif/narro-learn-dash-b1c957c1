// Common particles
const PARTICLES = new Set([
  'は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の', 'か', 'よ', 'ね',
  'な', 'だ', 'から', 'まで', 'より', 'など', 'って', 'けど', 'けれど',
  'ので', 'のに', 'ても', 'でも', 'しか', 'だけ', 'ばかり', 'こそ',
]);

// Common verb/adj endings to include with kanji
const VERB_ENDINGS = [
  'しました', 'ました', 'ません', 'ている', 'ていた', 'ていました',
  'ておる', 'ており', 'ておりました', 'てきました', 'てきた',
  'ている', 'ていた', 'てくる', 'てきた', 'てある', 'てあった',
  'られる', 'られた', 'させる', 'させた',
  'れました', 'りました', 'きました', 'しまう', 'しまった',
  'なければ', 'なかった', 'ないで', 'なくて',
  'そうです', 'ようです', 'みたいです', 'らしい',
  'った', 'った', 'んだ', 'んで',
  'ます', 'ない', 'たい', 'よう',
  'える', 'める', 'れる', 'せる', 'てる', 'ける', 'ねる', 'べる', 'える',
  'いた', 'した', 'った', 'んだ',
  'える', 'おる', 'ある',
  'って', 'して', 'いて', 'んで', 'ちて',
  'った', 'いた', 'った',
  'まる', 'める', 'みる', 'もる',
  'がる', 'さる', 'ざる',
  'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る', 'う',
  'き', 'ぎ', 'し', 'ち', 'に', 'び', 'み', 'り', 'い',
  'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ', 'え',
];

// Sort by length descending for greedy match
const SORTED_VERB_ENDINGS = VERB_ENDINGS.sort((a, b) => b.length - a.length);
const SORTED_PARTICLES = Array.from(PARTICLES).sort((a, b) => b.length - a.length);

const OKURIGANA_MAX = 8; // increased to handle longer conjugations

function isKanji(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) || code === 0x3005;
}

function isHiragana(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309F;
}

function isKatakana(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x30A0 && code <= 0x30FF;
}

function isPunctuation(ch: string): boolean {
  return '。、！？「」『』（）・…ー〜～\n\r\t 　'.includes(ch);
}

export interface TextToken {
  text: string;
  isJapanese: boolean;
}

/**
 * Tokenize Japanese text into clickable word-like chunks.
 * Improved: better handling of verb conjugation endings attached to kanji.
 */
export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (isPunctuation(ch)) {
      tokens.push({ text: ch, isJapanese: false });
      i++;
      continue;
    }

    // Kanji block + okurigana (verb/adj endings)
    if (isKanji(ch)) {
      let end = i + 1;
      while (end < text.length && isKanji(text[end])) end++;

      const kanjiEnd = end;

      // Try matching known verb endings first (greedy, longest match)
      const remaining = text.slice(end);
      let bestEnding = '';
      for (const ending of SORTED_VERB_ENDINGS) {
        if (remaining.startsWith(ending)) {
          // Make sure the ending isn't followed by more of the same type
          // and check it's not actually a particle at the start
          bestEnding = ending;
          break;
        }
      }

      if (bestEnding) {
        end += bestEnding.length;
      } else {
        // Fallback: add trailing hiragana up to a particle or limit
        let hiraCount = 0;
        while (end < text.length && isHiragana(text[end]) && hiraCount < OKURIGANA_MAX) {
          const rem = text.slice(end);
          let isParticle = false;
          for (const p of SORTED_PARTICLES) {
            if (rem.startsWith(p) && (end + p.length >= text.length || !isHiragana(text[end + p.length]) || PARTICLES.has(text[end + p.length]))) {
              isParticle = true;
              break;
            }
          }
          if (isParticle) break;
          end++;
          hiraCount++;
        }
      }

      tokens.push({ text: text.slice(i, end), isJapanese: true });
      i = end;
      continue;
    }

    // Pure hiragana
    if (isHiragana(ch)) {
      let matched = false;
      for (const p of SORTED_PARTICLES) {
        if (text.startsWith(p, i)) {
          tokens.push({ text: p, isJapanese: true });
          i += p.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      let end = i + 1;
      while (end < text.length && isHiragana(text[end])) {
        let isParticle = false;
        for (const p of SORTED_PARTICLES) {
          if (text.startsWith(p, end)) {
            isParticle = true;
            break;
          }
        }
        if (isParticle) break;
        end++;
      }
      tokens.push({ text: text.slice(i, end), isJapanese: true });
      i = end;
      continue;
    }

    // Katakana run
    if (isKatakana(ch)) {
      let end = i + 1;
      while (end < text.length && (isKatakana(text[end]) || text[end] === 'ー')) end++;
      tokens.push({ text: text.slice(i, end), isJapanese: true });
      i = end;
      continue;
    }

    // Non-Japanese
    tokens.push({ text: ch, isJapanese: false });
    i++;
  }

  return tokens;
}
