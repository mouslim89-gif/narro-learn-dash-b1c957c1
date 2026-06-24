import { clsx, type ClassValue } from"clsx";
import { twMerge } from"tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isKanji(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  // Basic Kanji + Extension A + Iteration mark (々)
  return (code >= 0x4E00 && code <= 0x9FFF) || 
         (code >= 0x3400 && code <= 0x4DBF) || 
         code === 0x3005;
}

export function highlightJapaneseWord(text: string, word: string) {
  const isAllKanji = /^[\u4e00-\u9fff々]+$/.test(word);
  
  let foundIdx = -1;
  if (isAllKanji) {
    let idx = -1;
    while ((idx = text.indexOf(word, idx + 1)) !== -1) {
      const charBefore = text[idx - 1];
      const charAfter = text[idx + word.length];
      if (!isKanji(charBefore) && !isKanji(charAfter)) {
        foundIdx = idx;
        break;
      }
    }
  } else {
    foundIdx = text.indexOf(word);
  }

  // Fallback to simple index if boundary check fails but word exists
  if (foundIdx === -1) {
    foundIdx = text.indexOf(word);
  }

  return foundIdx;
}

