import { X, AlertTriangle, Check, Sparkles } from'lucide-react';
import { previewIntervalDays, formatInterval, type SrsCard, type Quality } from'@/lib/srs';

export type SrsQualityLabel ='again'|'hard'|'good'|'easy';

interface Props {
 card: SrsCard;
 onAnswer: (quality: SrsQualityLabel) => void;
}

const ORDER: { key: SrsQualityLabel; quality: Quality; label: string; Icon: typeof Check; cls: string }[] = [
  {
    key: 'again',
    quality: 0,
    label: 'Again',
    Icon: X,
    cls: 'border-destructive/40 text-destructive bg-destructive/5',
  },
  {
    key: 'hard',
    quality: 3,
    label: 'Hard',
    Icon: AlertTriangle,
    cls: 'border-[hsl(var(--state-new)/0.5)] text-[hsl(var(--state-new))] bg-[hsl(var(--state-new)/0.08)]',
  },
  {
    key: 'good',
    quality: 4,
    label: 'Good',
    Icon: Check,
    cls: 'border-[hsl(var(--state-known)/0.5)] text-[hsl(var(--state-known))] bg-[hsl(var(--state-known)/0.08)]',
  },
  {
    key: 'easy',
    quality: 5,
    label: 'Easy',
    Icon: Sparkles,
    cls: 'border-primary/40 text-primary bg-primary/5',
  },
];

export function SrsButtons({ card, onAnswer }: Props) {
 return (
 <div className="grid w-full max-w-sm grid-cols-4 gap-1.5">
 {ORDER.map(({ key, quality, label, Icon, cls }) => {
 const days = previewIntervalDays(card, quality);
 return (
 <button
 key={key}
 onClick={() => onAnswer(key)}
 className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-3 text-[11px] font-bold smooth-colors tap-scale relief-raised active:relief-active transition-all ${cls}`}
 >
 <Icon className="h-3.5 w-3.5"/>
 <span className="leading-none">{label}</span>
 <span className="text-[9px] font-medium opacity-70 leading-none">
 {formatInterval(days)}
 </span>
 </button>
 );
 })}
 </div>
 );
}
