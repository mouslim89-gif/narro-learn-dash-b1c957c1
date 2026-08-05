import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding';
import { ChevronRight, ChevronLeft, BookOpen, MousePointer2, BrainCircuit, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    title: "Welcome to Tsundoku! 👋",
    description: "Your new companion for learning Japanese through reading. Dive into your favorite stories.",
    icon: <BookOpen className="w-12 h-12 text-primary" />,
    color: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    title: "Read, tap, learn",
    description: "Unsure about a word? Tap it to instantly see its definition, grammar, and pronunciation.",
    icon: <MousePointer2 className="w-12 h-12 text-primary" />,
    color: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    title: "Memorize for good",
    description: "Add words to your flashcards. Our spaced repetition system (SRS) takes care of anchoring them in your memory.",
    icon: <BrainCircuit className="w-12 h-12 text-primary" />,
    color: "bg-green-50 dark:bg-green-900/20",
  },
  {
    title: "Ready for the adventure?",
    description: "Pick a book from the library and start your linguistic journey right now.",
    icon: <Star className="w-12 h-12 text-primary" />,
    color: "bg-purple-50 dark:bg-purple-900/20",
  },
];

export function OnboardingCarousel() {
  const { hasCompletedCarousel, completeCarousel, alwaysReplayOnboarding } = useOnboardingStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const location = useLocation();
  // Local dismissal: with "always replay" on, the store flag stays false,
  // so we need a session-level close.
  const [dismissed, setDismissed] = useState(false);

  const dismiss = () => {
    completeCarousel();
    setDismissed(true);
  };

  const isReader = location.pathname.startsWith('/reader/');

  if (dismissed || isReader || (hasCompletedCarousel && !alwaysReplayOnboarding)) return null;

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      dismiss();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-card rounded-3xl shadow-2xl border overflow-hidden relative"
        >
          <div className={cn("h-48 flex items-center justify-center transition-colors duration-500", slides[currentSlide].color)}>
            <motion.div
              key={currentSlide}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {slides[currentSlide].icon}
            </motion.div>
          </div>

          <div className="p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-4 font-serif">{slides[currentSlide].title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between items-center">
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-border"
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {currentSlide > 0 && (
                  <Button variant="ghost" size="icon" onClick={prevSlide}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <Button onClick={nextSlide} className="rounded-full px-6">
                  {currentSlide === slides.length - 1 ? "Let's go!" : "Next"}
                  {currentSlide < slides.length - 1 && <ChevronRight className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={dismiss}
          >
            Skip
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
