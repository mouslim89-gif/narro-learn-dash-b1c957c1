import { Flame, BookOpen, Bookmark, Trophy } from 'lucide-react';

interface StatsStripProps {
  streak: number;
  wordsRead: number;
  wordsSaved: number;
  booksDone: number;
}

export function StatsStrip({ streak, wordsRead, wordsSaved, booksDone }: StatsStripProps) {
  const stats = [
    { label: 'Streak', value: streak, Icon: Flame, tint: '36 80% 60%' },
    { label: 'Words', value: wordsRead, Icon: BookOpen, tint: '180 50% 45%' },
    { label: 'Saved', value: wordsSaved, Icon: Bookmark, tint: '270 45% 60%' },
    { label: 'Done', value: booksDone, Icon: Trophy, tint: '40 90% 55%' },
  ];

  return (
    <div className="flex w-full items-stretch divide-x divide-border/40 rounded-2xl border border-border/40 bg-card py-3.5 shadow-sm ring-1 ring-border/5">
      {stats.map(({ label, value, Icon, tint }) => (
        <div key={label} className="flex flex-1 flex-col items-center justify-center px-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="h-3 w-3" style={{ color: `hsl(${tint})` }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]">{label}</span>
          </div>
          <span className="mt-0.5 text-lg font-bold tabular-nums tracking-tight">
            {value > 9999 ? `${(value / 1000).toFixed(1)}k` : value}
          </span>
        </div>
      ))}
    </div>
  );
}
