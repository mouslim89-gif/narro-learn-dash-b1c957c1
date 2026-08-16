import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo components
import { BooksFanDemo } from './demos/BooksFanDemo';
import { WordTapDemo } from './demos/WordTapDemo';
import { DifficultyDemo } from './demos/DifficultyDemo';
import { GrammarDemo } from './demos/GrammarDemo';
import { FlashcardDemo } from './demos/FlashcardDemo';
import { AudioDemo } from './demos/AudioDemo';

const slides = [
  {
    title: "Welcome to Tsundoku",
    description: "Your journey into Japanese literature begins here. Read real stories, not textbooks.",
    demo: (active: boolean) => <BooksFanDemo active={active} />,
  },
  {
    title: "Tap to Understand",
    description: "Instant lookups for any word. Definition, grammar, and pitch accent at your fingertips.",
    demo: (active: boolean) => <WordTapDemo active={active} />,
  },
  {
    title: "Levels for Everyone",
    description: "Switch between Simplified, Intermediate, and Original versions of the same story.",
    demo: (active: boolean) => <DifficultyDemo active={active} />,
  },
  {
    title: "Grammar, Simplified",
    description: "Stuck on a sentence? Our AI-powered grammar explanations break it down for you.",
    demo: (active: boolean) => <GrammarDemo active={active} />,
  },
  {
    title: "Synchronized Audio",
    description: "Listen to professional narration while you read. Perfectly synced, line by line.",
    demo: (active: boolean) => <AudioDemo active={active} />,
  },
  {
    title: "Never Forget",
    description: "Save words to your flashcards. Spaced repetition ensures they stay in your memory.",
    demo: (active: boolean) => <FlashcardDemo active={active} />,
  },
];

export function OnboardingCarousel() {
  const { hasCompletedCarousel, completeCarousel, alwaysReplayOnboarding } = useOnboardingStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Auto-advance logic (optional, but nice for "demo" feel)
  // Removed for now to allow users to read at their own pace

  const dismiss = () => {
    completeCarousel();
    setDismissed(true);
  };

  const isReader = location.pathname.startsWith('/reader/');
  const isLegal = ['/terms', '/privacy', '/credits', '/support', '/account-deletion'].includes(location.pathname);

  if (dismissed || isReader || isLegal || (hasCompletedCarousel && !alwaysReplayOnboarding)) return null;

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      dismiss();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -50) nextSlide();
    if (info.offset.x > 50 && currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-background"
      >
        {/* Progress Bars (Story style) */}
        <div className="flex gap-1.5 px-4 pt-4 pb-2 mt-[env(safe-area-inset-top,0px)]">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: i < currentSlide ? "100%" : i === currentSlide ? "100%" : "0%" }}
                transition={{ duration: i === currentSlide ? 0.4 : 0.2 }}
              />
            </div>
          ))}
        </div>

        {/* Header Actions */}
        <div className="flex justify-end px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-muted/50 backdrop-blur-sm"
            onClick={dismiss}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Area (Swipeable) */}
        <div className="flex-1 relative overflow-hidden">
          <motion.div
            key={currentSlide}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Demo Visualization */}
            <div className="flex-1 flex items-center justify-center">
              {slides[currentSlide].demo(true)}
            </div>

            {/* Text & CTA */}
            <div className="px-8 pb-12 pt-6 bg-gradient-to-t from-background via-background to-transparent">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-serif font-bold mb-3"
              >
                {slides[currentSlide].title}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground leading-relaxed mb-10 text-lg"
              >
                {slides[currentSlide].description}
              </motion.p>

              <Button 
                onClick={nextSlide} 
                className="w-full h-14 rounded-full text-lg font-bold shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group"
              >
                {currentSlide === slides.length - 1 ? "Start Reading" : "Continue"}
                {currentSlide < slides.length - 1 && (
                  <ChevronRight className="h-5 w-5 transition-transform group-active:translate-x-1" />
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
