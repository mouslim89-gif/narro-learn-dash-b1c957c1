import { useFlashcardStore } from '@/stores/flashcards';
import { cn } from '@/lib/utils';
import { Target, CheckCircle2 } from 'lucide-react';

export function DailyGoalCard() {
  const { dailyGoal, getReviewedTodayCount } = useFlashcardStore();
  const reviewedCount = getReviewedTodayCount();
  const progress = Math.min(100, (reviewedCount / dailyGoal) * 100);
  const isCompleted = reviewedCount >= dailyGoal;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 p-5 card-lift transition-all duration-500",
        isCompleted ? "bg-primary/5 ring-1 ring-primary/20" : "bg-card"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isCompleted ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          )}>
            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Daily Goal</p>
            <p className="font-serif text-xl font-bold">
              {reviewedCount} <span className="text-sm font-normal text-muted-foreground">/ {dailyGoal} cards</span>
            </p>
          </div>
        </div>

        <div className="relative h-14 w-14">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-muted/20"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={88}
              strokeDashoffset={88 - (progress / 100) * 88}
              strokeLinecap="round"
              className={cn(
                "text-primary transition-all duration-1000 ease-out",
                isCompleted && "text-primary animate-pulse-subtle"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
      
      {isCompleted && (
        <p className="mt-3 text-[12px] text-primary font-medium animate-in fade-in slide-in-from-top-1">
          Goal reached! Keep going for extra credit.
        </p>
      )}
    </div>
  );
}
