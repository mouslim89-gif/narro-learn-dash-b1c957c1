import { useFlashcardStore } from '@/stores/flashcards';
import { cn } from '@/lib/utils';
import { Target, CheckCircle2 } from 'lucide-react';
import { HalfGauge } from '../HalfGauge';

export function DailyGoalCard() {
  const { 
    dailyGoal, 
    dailyNewGoal,
    getReviewedTodayCount, 
    getNewTodayCount,
    getDueCount
  } = useFlashcardStore();
  
  const reviewedCount = getReviewedTodayCount();
  const newCount = getNewTodayCount();
  const dueCount = getDueCount();
  
  // Reviews gauge: charge du jour. On montre combien on a fait / (fait + restant)
  const totalDueToday = reviewedCount + dueCount;
  const isReviewsComplete = dueCount === 0;
  
  // New cards gauge: progression vers l'objectif
  const isNewComplete = newCount >= dailyNewGoal;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 p-5 bg-card shadow-sm transition-all duration-500",
        (isReviewsComplete && isNewComplete) && "ring-1 ring-primary/20 bg-primary/[0.02]"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Daily Progress</p>
          <h3 className="font-serif text-lg font-bold">Keep the momentum</h3>
        </div>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          (isReviewsComplete && isNewComplete) ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        )}>
          {(isReviewsComplete && isNewComplete) ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 items-end">
        <HalfGauge 
          value={reviewedCount}
          max={totalDueToday}
          label="Reviews Left"
          centerText={dueCount.toString()}
          subText={isReviewsComplete ? "Done" : undefined}
          tone="primary"
          complete={isReviewsComplete}
        />
        <HalfGauge 
          value={newCount}
          max={dailyNewGoal}
          label="New Today"
          centerText={`${newCount}/${dailyNewGoal}`}
          tone="accent"
          complete={isNewComplete}
        />
      </div>
      
      {(isReviewsComplete && isNewComplete) && (
        <p className="mt-4 text-center text-[11px] text-primary font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
          Daily goals achieved! ✨
        </p>
      )}
    </div>
  );
}
