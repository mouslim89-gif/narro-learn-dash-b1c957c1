import { forwardRef, type MouseEvent, type TouchEvent } from 'react';
import { getCached, type CacheEntry } from '@/lib/jisho';

interface FuriganaWordProps {
  text: string;
  /** Pre-computed reading from Kuromoji (hiragana) */
  reading?: string;
  /** Optional color class for grammar color mode */
  colorClass?: string;
  onClick: (e: MouseEvent<HTMLSpanElement>) => void;
  onMouseDown?: (e: MouseEvent<HTMLSpanElement>) => void;
  onMouseMove?: (e: MouseEvent<HTMLSpanElement>) => void;
  onMouseUp?: (e: MouseEvent<HTMLSpanElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLSpanElement>) => void;
  onTouchStart?: (e: TouchEvent<HTMLSpanElement>) => void;
  onTouchMove?: (e: TouchEvent<HTMLSpanElement>) => void;
  onTouchEnd?: (e: TouchEvent<HTMLSpanElement>) => void;
  onTouchCancel?: (e: TouchEvent<HTMLSpanElement>) => void;
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

/**
 * Build furigana segments from a pre-computed Kuromoji reading.
 * Pairs each kanji run in `text` with the corresponding slice of `reading`.
 */
function segmentsFromReading(text: string, reading: string): FuriganaSegment[] | null {
  if (!hasKanji(text)) return null;

  const chars = [...text];
  const readChars = [...normalizeKana(reading)];
  const segments: FuriganaSegment[] = [];
  let ri = 0;

  let i = 0;
  while (i < chars.length) {
    if (isKanjiChar(chars[i])) {
      // Find kanji run
      let kEnd = i;
      while (kEnd < chars.length && isKanjiChar(chars[kEnd])) kEnd++;
      const kanjiText = chars.slice(i, kEnd).join('');

      // Find where the kana after this kanji run starts in the reading
      let kanaAfter = '';
      let kanaEnd = kEnd;
      while (kanaEnd < chars.length && !isKanjiChar(chars[kanaEnd])) {
        kanaAfter += normalizeKana(chars[kanaEnd]);
        kanaEnd++;
      }

      if (kanaAfter && ri < readChars.length) {
        // Find the kana suffix in the reading to determine where kanji reading ends.
        // Use indexOf (first match) — the kana following the kanji should be the
        // earliest occurrence after the kanji's reading.
        const readRemaining = readChars.slice(ri).join('');
        const kanaPos = readRemaining.indexOf(kanaAfter);
        if (kanaPos > 0) {
          segments.push({ text: kanjiText, reading: readChars.slice(ri, ri + kanaPos).join('') });
          ri += kanaPos;
          i = kEnd;
          continue;
        }
      }

      // No kana after, or at end: consume remaining reading up to next kana match
      if (kEnd >= chars.length) {
        // Last segment - take all remaining reading
        segments.push({ text: kanjiText, reading: readChars.slice(ri).join('') });
        ri = readChars.length;
        i = kEnd;
      } else {
        // Fallback: try dictionary cache
        return null;
      }
    } else {
      // Kana character - add as plain text
      segments.push({ text: chars[i] });
      ri++;
      i++;
    }
  }

  return mergePlainSegments(segments);
}

export const FuriganaWord = forwardRef<HTMLSpanElement, FuriganaWordProps>(function FuriganaWord(
  { text, reading, colorClass, onClick, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
  ref
) {
  // Try pre-computed reading first, then fall back to Jisho cache
  let segments: FuriganaSegment[] | null = null;
  if (reading && hasKanji(text)) {
    segments = segmentsFromReading(text, reading);
  }
  if (!segments) {
    segments = getFuriganaSegments(text);
  }

  return (
    <span
      ref={ref}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      className={`cursor-pointer rounded px-px transition-colors active:bg-accent/10 ${colorClass || ''}`}
    >
      {segments
        ? segments.map((segment, index) =>
            segment.reading ? (
              <ruby key={`${segment.text}-${index}`}>
                {segment.text}
                <rp>(</rp>
                <rt className="text-[0.45em] font-normal text-muted-foreground leading-none">{segment.reading}</rt>
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
