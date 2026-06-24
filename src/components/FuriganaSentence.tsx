import { Fragment, type ReactNode } from'react';
import { segmentsFromReading, type FuriganaSegment } from'@/components/FuriganaWord';

interface FuriganaSentenceProps {
 /** Pre-tokenized sentence with readings (preferred for furigana). */
 tokens?: { t: string; r?: string }[];
 /** Raw sentence text — used when tokens are absent. */
 fallbackText?: string;
 /** Token surface (or substring) to highlight as the studied word. */
 highlight?: string;
 className?: string;
}

const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;

function renderSegments(segments: FuriganaSegment[], key: number): ReactNode {
 return (
 <Fragment key={key}>
 {segments.map((seg, i) =>
 seg.reading ? (
 <ruby key={i}>
 {seg.text}
 <rt className="font-japanese text-[0.55em] font-normal text-foreground/60 leading-none">
 {seg.reading}
 </rt>
 </ruby>
 ) : (
 <Fragment key={i}>{seg.text}</Fragment>
 )
 )}
 </Fragment>
 );
}

export function FuriganaSentence({
 tokens,
 fallbackText,
 highlight,
 className,
}: FuriganaSentenceProps) {
 // No tokens → plain text with simple highlight (legacy flashcards).
 if (!tokens || tokens.length === 0) {
 const text = fallbackText ??'';
 if (!highlight) {
 return <p className={className}>{text}</p>;
 }
 const idx = text.indexOf(highlight);
 if (idx === -1) return <p className={className}>{text}</p>;
 return (
 <p className={className}>
 {text.slice(0, idx)}
 <span className="text-primary font-semibold underline decoration-dotted underline-offset-4">
 {highlight}
 </span>
 {text.slice(idx + highlight.length)}
 </p>
 );
 }

  // Highlight logic: check if token matches the highlight word or its dictionary form.
  let highlightedOnce = false;

  return (
    <p className={className}>
      {tokens.map((tok, i) => {
        const isHighlight =
          !highlightedOnce && !!highlight && (tok.t === highlight || tok.t.includes(highlight));
        if (isHighlight) highlightedOnce = true;

        const hasKanji = KANJI_RE.test(tok.t);
        const segs = hasKanji && tok.r ? segmentsFromReading(tok.t, tok.r) : null;

        let content: ReactNode;
        if (segs) {
          content = renderSegments(segs, i);
        } else if (hasKanji && tok.r) {
          // Fallback: Show ruby for the whole token if splitting failed
          content = (
            <ruby key={i}>
              {tok.t}
              <rt className="font-japanese text-[0.55em] font-normal text-foreground/60 leading-none">
                {tok.r}
              </rt>
            </ruby>
          );
        } else {
          content = tok.t;
        }

        if (isHighlight) {
          return (
            <span
              key={i}
              className="text-primary font-semibold underline decoration-dotted underline-offset-4"
            >
              {content}
            </span>
          );
        }
        return <Fragment key={i}>{content}</Fragment>;
      })}
    </p>
  );
}
