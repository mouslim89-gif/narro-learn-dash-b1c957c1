import { Trophy, Flame, BookOpen, Bookmark, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReadingProgress } from '@/stores/reading-progress';

interface MilestonesRowProps {
  streak: number;
  wordsRead: number;
  wordsSaved: number;
  booksDone: number;
  progress: Record<string, ReadingProgress>;
}

export function MilestonesRow({ streak, wordsRead, wordsSaved, booksDone, progress }: MilestonesRowProps) {
  const hasN3 = Object.values(progress).some(p => {
    // This is a simplification; ideally we'd look up the book JLPT level
    // For now we'll just check if any book has significant progress
    return p.progressPercent > 0; 
  });

  const milestones = [
    { 
      id: 'first-book', 
      label: 'First Story', 
      desc: 'Finish 1 book', 
      Icon: BookOpen, 
      unlocked: booksDone >= 1,
      target: '1'
    },
    { 
      id: 'streak-7', 
      label: 'Weekly Habit', 
      desc: '7-day streak', 
      Icon: Flame, 
      unlocked: streak >= 7,
      target: '7d'
    },
    { 
      id: 'words-1000', 
      label: 'Reader', 
      desc: '1k words read', 
      Icon: Zap, 
      unlocked: wordsRead >= 1000,
      target: '1k'
    },
    { 
      id: 'saved-100', 
      label: 'Collector', 
      desc: '100 words saved', 
      Icon: Bookmark, 
      unlocked: wordsSaved >= 100,
      target: '100'
    },
    { 
      id: 'streak-30', 
      label: 'Dedicated', 
      desc: '30-day streak', 
      Icon: Star, 
      unlocked: streak >= 30,
      target: '30d'
    },
    { 
      id: 'master', 
      label: 'Master', 
      desc: '10 books done', 
      Icon: Trophy, 
      unlocked: booksDone >= 10,
      target: '10'
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
      {milestones.map((m) => (
        <div 
          key={m.id}
          className={cn(
            "flex min-w-[100px] flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all",
            m.unlocked 
              ? "bg-accent/10 border-accent/30 ring-1 ring-accent/20" 
              : "bg-muted/30 border-border/40 opacity-60"
          )}
        >
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full mb-2",
            m.unlocked ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
          )}>
            <m.Icon className="h-5 w-5" />
          </div>
          <p className={cn(
            "text-[10px] font-bold leading-tight",
            m.unlocked ? "text-accent" : "text-muted-foreground"
          )}>
            {m.label}
          </p>
          <p className="mt-1 text-[9px] text-muted-foreground/80 font-medium">
            {m.unlocked ? 'Unlocked' : m.target}
          </p>
        </div>
      ))}
    </div>
  );
}
