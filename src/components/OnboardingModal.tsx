import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { cn } from '@/lib/utils';
import { Trophy, BookOpen, Target, Sparkles, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JLPT_LEVELS = [
  { id: 'N5', label: 'N5', desc: 'Beginner' },
  { id: 'N4', label: 'N4', desc: 'Basic' },
  { id: 'N3', label: 'N3', desc: 'Intermediate' },
  { id: 'N2', label: 'N2', desc: 'Advanced' },
  { id: 'N1', label: 'N1', desc: 'Fluent' },
];

const DAILY_GOALS = [
  { id: 10, label: '10 min', desc: 'Casual' },
  { id: 20, label: '20 min', desc: 'Steady' },
  { id: 30, label: '30 min', desc: 'Serious' },
  { id: 60, label: '60 min', desc: 'Intense' },
];

export function OnboardingModal() {
  const { 
    hasCompletedOnboarding, 
    setHasCompletedOnboarding,
    targetJlpt,
    setTargetJlpt,
    dailyGoalMinutes,
    setDailyGoalMinutes 
  } = useReadingProgressStore();

  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(!hasCompletedOnboarding);

  const nextStep = () => setStep(s => s + 1);
  
  const finish = () => {
    setHasCompletedOnboarding(true);
    setIsOpen(false);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && finish()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none bg-background rounded-3xl">
        <div className="relative pt-12 pb-8 px-6">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 px-1 pt-1">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 h-full rounded-full transition-colors duration-300",
                  step >= i ? "bg-accent" : "bg-muted/40"
                )} 
              />
            ))}
          </div>

          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-accent" />
                  </div>
                  <DialogTitle className="text-2xl font-serif font-bold">Welcome to Tsundoku</DialogTitle>
                  <p className="text-muted-foreground text-sm">Let's set your learning baseline.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">What is your target level?</p>
                  <div className="grid grid-cols-1 gap-2">
                    {JLPT_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setTargetJlpt(level.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all tap-scale",
                          targetJlpt === level.id 
                            ? "bg-accent/5 border-accent ring-1 ring-accent/20" 
                            : "bg-card border-border/40 hover:border-border"
                        )}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm">{level.label}</span>
                          <span className="text-xs text-muted-foreground">{level.desc}</span>
                        </div>
                        {targetJlpt === level.id && <Check className="w-4 h-4 text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={nextStep} className="w-full h-12 rounded-full font-semibold shadow-md">
                  Continue <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl font-serif font-bold">Daily Reading Goal</DialogTitle>
                  <p className="text-muted-foreground text-sm">Consistent reading is the key to fluency.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Minutes per day</p>
                  <div className="grid grid-cols-2 gap-3">
                    {DAILY_GOALS.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => setDailyGoalMinutes(goal.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-5 rounded-2xl border transition-all tap-scale",
                          dailyGoalMinutes === goal.id 
                            ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                            : "bg-card border-border/40 hover:border-border"
                        )}
                      >
                        <span className="font-bold text-lg">{goal.label}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{goal.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-12 rounded-full font-semibold">
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex-[2] h-12 rounded-full font-semibold shadow-md">
                    Almost there <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </div>
                  <DialogTitle className="text-2xl font-serif font-bold">You're all set!</DialogTitle>
                  <p className="text-muted-foreground text-sm">We've tailored your experience for {targetJlpt}.</p>
                </div>

                <div className="rounded-2xl bg-muted/30 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">Difficulty adapted to {targetJlpt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">{dailyGoalMinutes}m daily target set</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">Flashcards ready for {targetJlpt} vocabulary</p>
                  </div>
                </div>

                <Button onClick={finish} className="w-full h-12 rounded-full font-semibold shadow-md bg-accent hover:bg-accent/90 text-white">
                  Start Reading <BookOpen className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
