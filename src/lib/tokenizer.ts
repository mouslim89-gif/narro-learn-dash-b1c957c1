import { dictionary, type DictionaryEntry } from '@/data/dictionary';

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

function isPunctuation(ch: string): boolean {
  return '。、！？「」『』（）・…ー〜～\n '.includes(ch);
}

export interface TextToken {
  text: string;
  entry: DictionaryEntry | null;
}

// Build a set of all dictionary surface forms and readings for quick lookup
const dictWords: { text: string; entry: DictionaryEntry }[] = [];
dictionary.forEach((entry) => {
  dictWords.push({ text: entry.word, entry });
  if (entry.reading !== entry.word) {
    dictWords.push({ text: entry.reading, entry });
  }
});
// Sort by length descending for greedy matching
dictWords.sort((a, b) => b.text.length - a.text.length);

/**
 * Tokenize Japanese text using greedy longest-match against dictionary,
 * with fallback character-type grouping.
 */
export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let i = 0;

  while (i < text.length) {
    // Try greedy longest dictionary match
    let matched = false;
    for (const dw of dictWords) {
      if (text.startsWith(dw.text, i)) {
        tokens.push({ text: dw.text, entry: dw.entry });
        i += dw.text.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = text[i];

    // Group punctuation/whitespace individually
    if (isPunctuation(ch)) {
      tokens.push({ text: ch, entry: null });
      i++;
      continue;
    }

    // Group consecutive characters of the same type
    if (isKanji(ch)) {
      let end = i + 1;
      while (end < text.length && isKanji(text[end])) end++;
      tokens.push({ text: text.slice(i, end), entry: null });
      i = end;
    } else if (isHiragana(ch)) {
      let end = i + 1;
      while (end < text.length && isHiragana(text[end])) end++;
      tokens.push({ text: text.slice(i, end), entry: null });
      i = end;
    } else if (isKatakana(ch)) {
      let end = i + 1;
      while (end < text.length && isKatakana(text[end])) end++;
      tokens.push({ text: text.slice(i, end), entry: null });
      i = end;
    } else {
      tokens.push({ text: ch, entry: null });
      i++;
    }
  }

  return tokens;
}
