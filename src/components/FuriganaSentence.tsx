import { Fragment } from 'react';
import { FuriganaWord } from '@/components/FuriganaWord';

interface FuriganaSentenceProps {
  /** Pre-tokenized sentence with readings (preferred for furigana). */
  tokens?: { t: string; r?: string }[];
  /** Raw sentence text — used when tokens are absent. */
  fallbackText?: string;
  /** Token surface (or substring) to highlight as the studied word. */
  highlight?: string;
  className?: string;
}

export function FuriganaSentence({
  tokens,
  fallbackText,
  highlight,
  className,
}: FuriganaSentenceProps) {
  // No tokens → plain text with simple highlight (legacy flashcards).
  if (!tokens || tokens.length === 0) {
    const text = fallbackText ?? '';
    if (!highlight) {
      return <p className={className}>{text}</p>;
    }
    const idx = text.indexOf(highlight);
    if (idx === -1) return <p className={className}>{text}</p>;
    return (
      <p className={className}>
        {text.slice(0, idx)}
        <span className="text-accent font-semibold">
          {highlight}
        </span>
        {text.slice(idx + highlight.length)}
      </p>
    );
  }

  // Highlight logic: check if token surface or dictionary form contains the highlight substring.
  // Using .includes() because grammar patterns like "〜のだ" might be part of a longer token.
  return (
    <p className={className}>
      {tokens.map((tok, i) => {
        const isHighlight =
          !!highlight && (tok.t.includes(highlight) || (tok.r && tok.r.includes(highlight)));

        const content = (
          <FuriganaWord
            key={i}
            text={tok.t}
            reading={tok.r}
            furiganaVisible={true}
            onClick={() => {}}
          />
        );

        if (isHighlight) {
          return (
            <span
              key={i}
              className="text-accent font-bold"
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
