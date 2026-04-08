// Common particles and suffixes that should be separate tokens
const PARTICLES = new Set([
  'は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の', 'か', 'よ', 'ね',
  'な', 'だ', 'から', 'まで', 'より', 'など', 'って', 'けど', 'けれど',
  'ので', 'のに', 'ても', 'でも', 'しか', 'だけ', 'ばかり', 'こそ',
]);

// Common verb/adjective endings (okurigana patterns)
const OKURIGANA_MAX = 4;

function isKanji(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF);
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
  return '。、！？「」『』（）・…ー〜～\n\r\t '.includes(ch);
}

export interface TextToken {
  text: string;
  isJapanese: boolean;
}

/**
 * Tokenize Japanese text into clickable word-like chunks.
 * Strategy:
 * - Kanji blocks get up to OKURIGANA_MAX trailing hiragana (okurigana)
 * - Pure hiragana is split by checking for particle prefixes
 * - Katakana runs stay together
 * - Punctuation is individual
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

    // Kanji block + limited okurigana
    if (isKanji(ch)) {
      let end = i + 1;
      while (end < text.length && isKanji(text[end])) end++;
      
      // Add trailing hiragana as okurigana, but limit length and stop at particles
      const kanjiEnd = end;
      let hiraCount = 0;
      while (end < text.length && isHiragana(text[end]) && hiraCount < OKURIGANA_MAX) {
        // Check if remaining hiragana starts with a particle — if so, stop
        const remaining = text.slice(end);
        let isParticle = false;
        for (const p of PARTICLES) {
          if (remaining.startsWith(p)) {
            isParticle = true;
            break;
          }
        }
        if (isParticle) break;
        end++;
        hiraCount++;
      }
      
      tokens.push({ text: text.slice(i, end), isJapanese: true });
      i = end;
      continue;
    }

    // Pure hiragana — try to split into particles and word chunks
    if (isHiragana(ch)) {
      // First check for multi-char particles
      let matched = false;
      // Sort particles by length desc for greedy match
      const sortedParticles = Array.from(PARTICLES).sort((a, b) => b.length - a.length);
      for (const p of sortedParticles) {
        if (text.startsWith(p, i)) {
          tokens.push({ text: p, isJapanese: true });
          i += p.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Otherwise group hiragana until we hit a particle, kanji, katakana, or punctuation
      let end = i + 1;
      while (end < text.length && isHiragana(text[end])) {
        // Check if current position starts a particle
        let isParticle = false;
        for (const p of sortedParticles) {
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
      while (end < text.length && isKatakana(text[end])) end++;
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
