import { useFlashcardStore } from "@/stores/flashcards";
import { useReadingProgressStore } from "@/stores/reading-progress";
import { CheckCircle2, Flame, Target, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function DailyGoalProgress() {
  const { dailyGoal, getReviewedTodayCount } = useFlashcardStore();
  const { readingGoal, getReadTodayCount } = useReadingProgressStore();
  
  const reviewsToday = getReviewedTodayCount();
  const wordsReadToday = getReadTodayCount();
  
  const reviewProgress = Math.min(100, (reviewsToday / dailyGoal) * 100);
  const readProgress = Math.min(100, (wordsReadToday / readingGoal) * 100);
  
  const reviewsComplete = reviewsToday >= dailyGoal;
  const readComplete = wordsReadToday >= readingGoal;

  return (
    <div className="mx-6 mb-6 p-5 rounded-3xl bg-card border ring-1 ring-border/40 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">Daily Goals</h4>
            <p className="text-[11px] text-muted-foreground">Keep your streak alive</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-bold font-serif">Daily Streak</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Flashcards Goal */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-serif tabular-nums">{reviewsToday}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">/ {dailyGoal} cards</span>
            </div>
            {reviewsComplete && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"
              >
                <CheckCircle2 className="w-3 h-3" />
                Done
              </motion.div>
            )}
          </div>
          <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${reviewProgress}%` }}
              className={cn("h-full rounded-full transition-colors", reviewsComplete ? 'bg-green-500' : 'bg-primary')}
            />
          </div>
        </div>

        {/* Reading Goal */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-serif tabular-nums">{wordsReadToday}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">/ {readingGoal} words</span>
            </div>
            {readComplete && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"
              >
                <CheckCircle2 className="w-3 h-3" />
                Done
              </motion.div>
            )}
          </div>
          <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${readProgress}%` }}
              className={cn("h-full rounded-full transition-colors", readComplete ? 'bg-green-500' : 'bg-amber-500')}
            />
          </div>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
    </div>
  );
}
