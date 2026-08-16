import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboarding';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { BooksFanDemo } from './demos/BooksFanDemo';
import { WordTapDemo } from './demos/WordTapDemo';
import { DifficultyDemo } from './demos/DifficultyDemo';
import { GrammarDemo } from './demos/GrammarDemo';
import { AudioDemo } from './demos/AudioDemo';
import { FlashcardDemo } from './demos/FlashcardDemo';

const slides = [
  {
    label: 'Welcome',
    title: 'Read real Japanese',
    description: 'Classic Japanese literature, graded by level, one story at a time.',
    Demo: BooksFanDemo,
  },
  {
    label: 'Lookups',
    title: 'Tap any word',
    description: 'Reading, meaning and level appear instantly, without leaving the page.',
    Demo: WordTapDemo,
  },
  {
    label: 'Levels',
    title: 'Same story, three levels',
    description: 'Switch between simplified, intermediate and original text whenever you want.',
    Demo: DifficultyDemo,
  },
  {
    label: 'Grammar',
    title: 'See how sentences work',
    description: 'Each pattern comes with its structure and a short, clear explanation.',
    Demo: GrammarDemo,
  },
  {
    label: 'Audio',
    title: 'Listen while you read',
    description: 'Narration follows the text word by word, so rhythm and pitch stick.',
    Demo: AudioDemo,
  },
  {
    label: 'Review',
    title: 'Remember what you read',
    description: 'Saved words come back as flashcards, exactly when you are about to forget them.',
    Demo: FlashcardDemo,
  },
];

export function OnboardingCarousel() {
  const { hasCompletedCarousel, completeCarousel, alwaysReplayOnboarding } = useOnboardingStore();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();
  const reduced = useReducedMotion();

  const isReader = location.pathname.startsWith('/reader/');
  const isLegal = ['/terms', '/privacy', '/credits', '/support', '/account-deletion'].includes(
    location.pathname,
  );

  if (dismissed || isReader || isLegal || (hasCompletedCarousel && !alwaysReplayOnboarding)) {
    return null;
  }

  const dismiss = () => {
    completeCarousel();
    setDismissed(true);
  };

  const goTo = (next: number) => {
    if (next < 0) return;
    if (next >= slides.length) {
      dismiss();
      return;
    }
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const slide = slides[index];
  const Demo = slide.Demo;
  const isLast = index === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Soft ambient wash, same language as the library header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 60% at 50% 0%, hsl(var(--accent) / 0.07), transparent 60%)',
        }}
      />

      <div className="relative flex min-h-0 flex-1 flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Progress */}
        <div className="flex items-center gap-3 px-5">
          <div className="flex flex-1 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                aria-label={s.label}
                onClick={() => goTo(i)}
                className="h-1 flex-1 overflow-hidden rounded-full bg-border/50"
              >
                <motion.span
                  className="block h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: i <= index ? '100%' : '0%' }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Skip"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground tap-scale-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stage */}
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-card ring-1 ring-border/30 elev-soft">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={index}
                custom={direction}
                drag={reduced ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) goTo(index + 1);
                  else if (info.offset.x > 60) goTo(index - 1);
                }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Demo active />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Copy */}
          <div className="pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {slide.label}
                </p>
                <h2 className="mt-2 font-serif text-[26px] font-bold leading-tight text-foreground">
                  {slide.title}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className={cn(
                'btn-tsundoku-premium mt-6 flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold tap-scale',
              )}
            >
              {isLast ? 'Start reading' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
