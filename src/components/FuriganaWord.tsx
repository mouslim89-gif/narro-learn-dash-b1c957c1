import { forwardRef, type MouseEvent } from 'react';
import { getCached, type CacheEntry } from '@/lib/jisho';

interface FuriganaWordProps {
  text: string;
  onClick: (e: MouseEvent<HTMLSpanElement>) => void;
}

export interface FuriganaSegment {
  text: string;
  reading?: string;
}

const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
const KANA_RE = /[\u3040-\u309F\u30A0-\u30FFー]/;

function hasKanji(text: string) {
  return KANJI_RE.test(text);
}

function isKanjiChar(char: string) {
  return KANJI_RE.test(char);
}

function isKanaChar(char: string) {
  return KANA_RE.test(char);
}

function toHiragana(char: string) {
  const code = char.charCodeAt(0);
  return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char;
}

function normalizeKana(text: string) {
  return [...text].map(toHiragana).join('');
}

function commonPrefixLength(a: string, b: string) {
  const aChars = [...a];
  const bChars = [...b];
  let i = 0;
  while (i < aChars.length && i < bChars.length && aChars[i] === bChars[i]) i += 1;
  return i;
}

function mergePlainSegments(segments: FuriganaSegment[]) {
  return segments.reduce<FuriganaSegment[]>((acc, segment) => {
    const last = acc.at(-1);

    if (!segment.reading && last && !last.reading) {
      last.text += segment.text;
      return acc;
    }

    acc.push({ ...segment });
    return acc;
  }, []);
}

function chooseBestEntry(text: string, cache?: CacheEntry) {
  if (!cache?.results?.length) return null;

  const deinflected = cache.deinflected ?? '';
  const surfaceKanji = [...text].filter(isKanjiChar).join('');

  let best:
    | {
        score: number;
        word: string;
        reading: string;
      }
    | null = null;

  for (const result of cache.results) {
    for (const japanese of result.japanese ?? []) {
      const word = japanese.word?.trim();
      const reading = japanese.reading?.trim();
      if (!word || !reading || !hasKanji(word)) continue;

      const wordKanji = [...word].filter(isKanjiChar).join('');
      let score = 0;

      if (word === text) score += 1000;
      if (deinflected && word === deinflected) score += 900;
      if (surfaceKanji && wordKanji === surfaceKanji) score += 700;
      if (surfaceKanji && wordKanji && (surfaceKanji.startsWith(wordKanji) || wordKanji.startsWith(surfaceKanji))) score += 300;
      score += commonPrefixLength(word, text) * 30;
      score += deinflected ? commonPrefixLength(word, deinflected) * 20 : 0;
      score += surfaceKanji ? commonPrefixLength(wordKanji, surfaceKanji) * 60 : 0;

      if (!best || score > best.score) {
        best = { score, word, reading };
      }
    }
  }

  return best;
}

function parseWordToSegments(word: string, reading: string): FuriganaSegment[] | null {
  const wordChars = [...word];
  const readingChars = [...normalizeKana(reading)];
  const memo = new Map<string, FuriganaSegment[] | null>();

  const parse = (wordIndex: number, readingIndex: number): FuriganaSegment[] | null => {
    const key = `${wordIndex}:${readingIndex}`;
    if (memo.has(key)) return memo.get(key)!;

    if (wordIndex === wordChars.length) {
      const value = readingIndex === readingChars.length ? [] : null;
      memo.set(key, value);
      return value;
    }

    const current = wordChars[wordIndex];

    if (!isKanjiChar(current)) {
      if (!isKanaChar(current)) {
        const rest = parse(wordIndex + 1, readingIndex);
        const value = rest ? mergePlainSegments([{ text: current }, ...rest]) : null;
        memo.set(key, value);
        return value;
      }

      if (readingIndex >= readingChars.length || normalizeKana(current) !== readingChars[readingIndex]) {
        memo.set(key, null);
        return null;
      }

      const rest = parse(wordIndex + 1, readingIndex + 1);
      const value = rest ? mergePlainSegments([{ text: current }, ...rest]) : null;
      memo.set(key, value);
      return value;
    }

    let end = wordIndex;
    while (end < wordChars.length && isKanjiChar(wordChars[end])) end += 1;
    const kanjiChunk = wordChars.slice(wordIndex, end).join('');

    for (let split = readingIndex + 1; split <= readingChars.length; split += 1) {
      const rest = parse(end, split);
      if (rest) {
        const value = [{ text: kanjiChunk, reading: readingChars.slice(readingIndex, split).join('') }, ...rest];
        memo.set(key, value);
        return value;
      }
    }

    memo.set(key, null);
    return null;
  };

  const segments = parse(0, 0);
  return segments ? mergePlainSegments(segments) : null;
}

function projectSegmentsToSurface(surface: string, segments: FuriganaSegment[]) {
  const surfaceChars = [...surface];
  let cursor = 0;
  const projected: FuriganaSegment[] = [];

  for (const segment of segments) {
    if (cursor >= surfaceChars.length) break;

    if (segment.reading) {
      const rubyText = surfaceChars.slice(cursor, cursor + [...segment.text].length).join('');
      if (!rubyText || ![...rubyText].every(isKanjiChar)) return null;
      projected.push({ text: rubyText, reading: segment.reading });
      cursor += [...segment.text].length;
      continue;
    }

    const plainChars = [...segment.text];
    let matched = 0;

    while (matched < plainChars.length && cursor + matched < surfaceChars.length) {
      if (normalizeKana(surfaceChars[cursor + matched]) !== normalizeKana(plainChars[matched])) break;
      matched += 1;
    }

    if (matched > 0) {
      projected.push({ text: surfaceChars.slice(cursor, cursor + matched).join('') });
      cursor += matched;
    }
  }

  if (cursor < surfaceChars.length) {
    projected.push({ text: surfaceChars.slice(cursor).join('') });
  }

  const merged = mergePlainSegments(projected);
  return merged.some((segment) => segment.reading) ? merged : null;
}

export function getFuriganaSegments(text: string, cache = getCached(text)) {
  if (!cache || !hasKanji(text)) return null;

  const match = chooseBestEntry(text, cache);
  if (!match) return null;

  const baseSegments = parseWordToSegments(match.word, match.reading);
  if (!baseSegments) return null;

  if (match.word === text) return baseSegments;
  return projectSegmentsToSurface(text, baseSegments);
}

export const FuriganaWord = forwardRef<HTMLSpanElement, FuriganaWordProps>(function FuriganaWord(
  { text, onClick },
  ref
) {
  const segments = getFuriganaSegments(text);

  return (
    <span
      ref={ref}
      onClick={onClick}
      className="cursor-pointer rounded px-px transition-colors hover:bg-accent/15 hover:text-accent underline decoration-accent/30 decoration-1 underline-offset-4"
    >
      {segments
        ? segments.map((segment, index) =>
            segment.reading ? (
              <ruby key={`${segment.text}-${index}`}>
                {segment.text}
                <rp>(</rp>
                <rt className="text-[0.5em] font-normal text-muted-foreground">{segment.reading}</rt>
                <rp>)</rp>
              </ruby>
            ) : (
              <span key={`${segment.text}-${index}`}>{segment.text}</span>
            )
          )
        : text}
    </span>
  );
});

FuriganaWord.displayName = 'FuriganaWord';