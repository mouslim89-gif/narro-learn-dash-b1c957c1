import { FuriganaWord } from'@/components/FuriganaWord';
import type { BookToken } from'@/data/book-tokens';
import type { KnownLevel } from'@/lib/known-words';

interface Props {
  token: BookToken;
  showFurigana: boolean;
  colorClass: string;
  isHighlighted: boolean;
  knownLevel?: KnownLevel | null;
  onTap: () => void;
}

const KNOWN_CLASS: Record<KnownLevel, string> = {
  new:'known-new',
  learning:'known-learning',
  known:'known-known',
};

/**
 * One clickable Japanese token.
 */
export function ReaderToken({
  token,
  showFurigana,
  colorClass,
  isHighlighted,
  knownLevel,
  onTap,
}: Props) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onTap();
  };

  const stopDown = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();

  const knownClass = knownLevel ? KNOWN_CLASS[knownLevel] :'';
  const cls =`${colorClass} ${knownClass} ${isHighlighted ?'bg-accent/25 rounded-sm':''}`;

  const hasReading = !!token.r;

  if (hasReading) {
    return (
      <FuriganaWord
        text={token.t}
        reading={token.r}
        furiganaVisible={showFurigana}
        colorClass={cls}
        onClick={handleClick}
        onMouseDown={stopDown}
        onTouchStart={stopDown}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      onMouseDown={stopDown}
      onTouchStart={stopDown}
      className={`cursor-pointer transition-colors ${cls}`}
    >
      {token.t}
    </span>
  );
}