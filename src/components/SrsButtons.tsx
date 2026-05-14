import { X, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { previewIntervalDays, formatInterval, type SrsCard, type Quality } from '@/lib/srs';

export type SrsQualityLabel = 'again' | 'hard' | 'good' | 'easy';

interface Props {
  card: SrsCard;
  onAnswer: (quality: SrsQualityLabel) => void;
}

const ORDER: { key: SrsQualityLabel; quality: Quality; label: string; Icon: typeof Check; tint: string; fg: string }[] = [
  { key: 'again', quality: 0, label: 'Again', Icon: X,             tint: '0 70% 55%',   fg: 'text-rose-600 dark:text-rose-300' },
  { key: 'hard',  quality: 3, label: 'Hard',  Icon: AlertTriangle, tint: '36 85% 55%',  fg: 'text-amber-600 dark:text-amber-300' },
  { key: 'good',  quality: 4, label: 'Good',  Icon: Check,         tint: '150 55% 42%', fg: 'text-emerald-600 dark:text-emerald-300' },
  { key: 'easy',  quality: 5, label: 'Easy',  Icon: Sparkles,      tint: '210 80% 55%', fg: 'text-primary' },
];

export function SrsButtons({ card, onAnswer }: Props) {
  return (
    <div className="grid w-full max-w-md grid-cols-4 gap-2">
      {ORDER.map(({ key, quality, label, Icon, tint, fg }) => {
        const days = previewIntervalDays(card, quality);
        return (
          <button
            key={key}
            onClick={() => onAnswer(key)}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-full border ring-1 ring-border/40 transition-all tap-scale ${fg}`}
            style={{ backgroundImage: `linear-gradient(140deg, hsl(${tint} / 0.18) 0%, hsl(var(--card)) 70%)` }}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="font-serif text-[13px] font-semibold leading-none">{label}</span>
            </div>
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground leading-none">
              {formatInterval(days)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
