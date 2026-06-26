
import { useFlashcardStore } from "@/stores/flashcards";
import { CheckCircle2, Flame, Target } from "lucide-react";
import { motion } from "framer-motion";

export function DailyGoalProgress() {
  const { reviewsThisSession, dailyGoal } = useFlashcardStore();
  const progress = Math.min(100, (reviewsThisSession / dailyGoal) * 100);
  const isComplete = reviewsThisSession >= dailyGoal;

  return (
    <div className="mx-6 mb-6 p-4 rounded-3xl bg-card border ring-1 ring-border/40 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">Daily Goal</h4>
            <p className="text-[11px] text-muted-foreground">Keep your streak alive</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-bold font-serif">7 Day Streak</span>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-end">
          <span className="text-2xl font-bold font-serif tabular-nums">
            {reviewsThisSession}
            <span className="text-sm text-muted-foreground font-sans font-medium"> / {dailyGoal} cards</span>
          </span>
          {isComplete && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"
            >
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </motion.div>
          )}
        </div>
        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
          />
        </div>
      </div>

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
    </div>
  );
}
