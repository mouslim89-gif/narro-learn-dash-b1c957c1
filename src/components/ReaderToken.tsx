import { FuriganaWord } from '@/components/FuriganaWord';
import { useLongPress } from '@/hooks/use-long-press';
import type { BookToken } from '@/data/book-tokens';
import type { KnownLevel } from '@/lib/known-words';

interface Props {
  token: BookToken;
  showFurigana: boolean;
  colorClass: string;
  isHighlighted: boolean;
  knownLevel?: KnownLevel | null;
  onTap: () => void;
  onLongPress: () => void;
}

const KNOWN_CLASS: Record<KnownLevel, string> = {
  new: 'known-new',
  learning: 'known-learning',
  known: 'known-known',
};

/**
 * One clickable Japanese token. Encapsulates the long-press hook
 * so it can be used inside .map() (hooks can't run inside loops at the parent).
 */
export function ReaderToken({
  token,
  showFurigana,
  colorClass,
  isHighlighted,
  knownLevel,
  onTap,
  onLongPress,
}: Props) {
  const { handlers, didTrigger, reset } = useLongPress(onLongPress, {
    delay: 400,
    moveThreshold: 8,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didTrigger()) {
      reset();
      return;
    }
    onTap();
  };

  const stopDown = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();

  const knownClass = knownLevel ? KNOWN_CLASS[knownLevel] : '';
  const cls = `${colorClass} ${knownClass} ${isHighlighted ? 'bg-accent/25 rounded-sm' : ''}`;

  const hasReading = !!token.r;

  if (hasReading) {
    return (
      <FuriganaWord
        text={token.t}
        reading={token.r}
        furiganaVisible={showFurigana}
        colorClass={cls}
        onClick={handleClick}
        onMouseDown={(e) => { stopDown(e); handlers.onMouseDown(e); }}
        onTouchStart={(e) => { stopDown(e); handlers.onTouchStart(e); }}
        onMouseMove={handlers.onMouseMove}
        onMouseUp={handlers.onMouseUp}
        onMouseLeave={handlers.onMouseLeave}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
        onTouchCancel={handlers.onTouchCancel}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      onMouseDown={(e) => { stopDown(e); handlers.onMouseDown(e); }}
      onTouchStart={(e) => { stopDown(e); handlers.onTouchStart(e); }}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
      onMouseLeave={handlers.onMouseLeave}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
      onTouchCancel={handlers.onTouchCancel}
      className={`cursor-pointer transition-colors active:bg-accent/15 ${cls}`}
    >
      {token.t}
    </span>
  );
}
