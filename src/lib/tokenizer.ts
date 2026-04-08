// Character type helpers
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

function isJapanese(ch: string): boolean {
  return isKanji(ch) || isHiragana(ch) || isKatakana(ch);
}

function isPunctuation(ch: string): boolean {
  return '。、！？「」『』（）・…ー〜～\n '.includes(ch);
}

export interface TextToken {
  text: string;
  isJapanese: boolean;
}

/**
 * Tokenize Japanese text by grouping characters into meaningful chunks.
 * Groups kanji+hiragana together (e.g. 食べました), keeps katakana runs together,
 * and separates punctuation.
 */
export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Punctuation / whitespace / newlines
    if (isPunctuation(ch)) {
      tokens.push({ text: ch, isJapanese: false });
      i++;
      continue;
    }

    // Kanji possibly followed by hiragana (okurigana) — forms a single word
    if (isKanji(ch)) {
      let end = i + 1;
      // Consume consecutive kanji
      while (end < text.length && isKanji(text[end])) end++;
      // Consume trailing hiragana (okurigana like 食べる, 大きい)
      while (end < text.length && isHiragana(text[end])) end++;
      tokens.push({ text: text.slice(i, end), isJapanese: true });
      i = end;
      continue;
    }

    // Pure hiragana run (particles, conjugations)
    if (isHiragana(ch)) {
      let end = i + 1;
      while (end < text.length && isHiragana(text[end])) end++;
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

    // Non-Japanese character
    tokens.push({ text: ch, isJapanese: false });
    i++;
  }

  return tokens;
}
