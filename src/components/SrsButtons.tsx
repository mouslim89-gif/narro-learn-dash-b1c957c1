import { previewIntervalDays, formatInterval, type SrsCard, type Quality } from '@/lib/srs';

export type SrsQualityLabel = 'again' | 'hard' | 'good' | 'easy';

interface Props {
  card: SrsCard;
  onAnswer: (quality: SrsQualityLabel) => void;
}

const ORDER: { key: SrsQualityLabel; quality: Quality; label: string; cls: string }[] = [
  { key: 'again', quality: 0, label: 'Again', cls: 'bg-rose-500 hover:bg-rose-600 text-white' },
  { key: 'hard',  quality: 3, label: 'Hard',  cls: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { key: 'good',  quality: 4, label: 'Good',  cls: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  { key: 'easy',  quality: 5, label: 'Easy',  cls: 'bg-sky-500 hover:bg-sky-600 text-white' },
];

export function SrsButtons({ card, onAnswer }: Props) {
  return (
    <div className="grid w-full max-w-md grid-cols-4 gap-2">
      {ORDER.map(({ key, quality, label, cls }) => {
        const days = previewIntervalDays(card, quality);
        return (
          <button
            key={key}
            onClick={() => onAnswer(key)}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-md transition-colors active:scale-[0.98] ${cls}`}
          >
            <span className="text-[10px] font-medium tabular-nums opacity-90 leading-none">
              {formatInterval(days)}
            </span>
            <span className="text-sm font-bold leading-none">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
