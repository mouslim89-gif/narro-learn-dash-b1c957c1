import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding';
import { X, Sparkles, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom';
  isInteractive?: boolean;
}

const readerSteps: TutorialStep[] = [
  {
    selector: '[data-tutorial="token"]',
    title: "Tap a word 📖",
    description: "The heart of Tsundoku. Tap any word to see its definition, reading (furigana), and grammar function.",
    position: 'bottom',
    isInteractive: true,
  },
  {
    selector: '[data-tutorial="furigana"]',
    title: "Reading Aids 🅰",
    description: "Toggle furigana (readings above kanji) to help you read or challenge your memory.",
    position: 'bottom',
  },
  {
    selector: '[data-tutorial="translation"]',
    title: "Helpful Translations 🌐",
    description: "Need a hint? Toggle full sentence translations to better understand the story flow.",
    position: 'bottom',
  },
  {
    selector: '[data-tutorial="grammar"]',
    title: "Grammar Guide 文",
    description: "Check specific grammar points for this book to help you with complex structures.",
    position: 'bottom',
  },
  {
    selector: '[data-tutorial="settings"]',
    title: "Your Preferences ⚙️",
    description: "Customize text size, font, or theme for a comfortable reading experience.",
    position: 'bottom',
  },
];

export function ReaderTutorial() {
  const { hasSeenReaderTutorial, completeReaderTutorial, alwaysReplayOnboarding } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showSkipInteraction, setShowSkipInteraction] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = readerSteps[stepIndex];

  useEffect(() => {
    if (hasSeenReaderTutorial && !alwaysReplayOnboarding) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasSeenReaderTutorial, alwaysReplayOnboarding]);

  useEffect(() => {
    if (!isVisible) return;

    const updateRect = () => {
      const element = document.querySelector(currentStep.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll into view only if not visible
        const isVisibleInViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isVisibleInViewport) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });
    
    // Reposition loop during transitions for maximum smoothness
    const interval = setInterval(updateRect, 100);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      clearInterval(interval);
    };
  }, [isVisible, stepIndex, currentStep.selector]);

  // Handle interaction for Step 1
  useEffect(() => {
    if (!isVisible || !currentStep.isInteractive) return;

    setShowSkipInteraction(false);
    interactionTimerRef.current = setTimeout(() => {
      setShowSkipInteraction(true);
    }, 6000);

    const checkPopup = () => {
      const popup = document.querySelector('.animate-mini-slide-up, .animate-mini-slide-down');
      if (popup) {
        handleNext();
      }
    };

    const interval = setInterval(checkPopup, 200);
    return () => {
      clearInterval(interval);
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, [isVisible, stepIndex]);

  if ((hasSeenReaderTutorial && !alwaysReplayOnboarding) || !isVisible) return null;

  const handleNext = () => {
    if (stepIndex === readerSteps.length - 1) {
      completeReaderTutorial();
      setIsVisible(false);
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    completeReaderTutorial();
    setIsVisible(false);
  };

  // Safe area for spotlight (hole)
  const hole = targetRect ? {
    x: targetRect.left - 4,
    y: targetRect.top - 4,
    width: targetRect.width + 8,
    height: targetRect.height + 8,
    borderRadius: 12
  } : { x: 0, y: 0, width: 0, height: 0, borderRadius: 0 };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Dark Overlay with SVG Mask for Rounded Spotlight */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto"
              onClick={handleNext}
            >
              <svg className="w-full h-full">
                <defs>
                  <mask id="spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <motion.rect
                      animate={{
                        x: hole.x,
                        y: hole.y,
                        width: hole.width,
                        height: hole.height,
                        rx: hole.borderRadius
                      }}
                      transition={{ type: "spring", stiffness: 250, damping: 30 }}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="currentColor" mask="url(#spotlight-mask)" />
              </svg>

              {/* Tap to continue indicator */}
              <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] animate-pulse">
                  Tap anywhere to continue
                </p>
              </div>
            </motion.div>

            {/* Pulse Ring around target */}
            <motion.div
              className="absolute border-2 border-accent rounded-xl pointer-events-none"
              animate={{
                x: hole.x,
                y: hole.y,
                width: hole.width,
                height: hole.height,
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                type: "spring",
                stiffness: 250,
                damping: 30
              }}
            />

            {/* Tooltip Card */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                top: hole.y + hole.height + 16 > window.innerHeight - 250 
                  ? hole.y - 210 // Position above if no room below
                  : hole.y + hole.height + 16,
                left: Math.max(16, Math.min(window.innerWidth - 336, hole.x + hole.width / 2 - 160))
              }}
              transition={{ type: "spring", stiffness: 250, damping: 30 }}
              className="absolute w-[320px] bg-card p-6 rounded-2xl shadow-2xl border ring-1 ring-border/50 pointer-events-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {readerSteps.map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-1 rounded-full transition-all duration-300",
                          i === stepIndex ? "w-4 bg-primary" : "w-1 bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-xl font-serif font-bold mb-2 text-foreground">{currentStep.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {stepIndex > 0 && (
                    <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full h-10 w-10">
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {currentStep.isInteractive && showSkipInteraction && (
                    <Button variant="ghost" size="sm" onClick={handleNext} className="text-xs text-muted-foreground">
                      Skip interaction
                    </Button>
                  )}
                  <Button 
                    onClick={handleNext} 
                    className="rounded-full px-6 font-semibold shadow-md btn-tsundoku-premium"
                  >
                    {stepIndex === readerSteps.length - 1 ? "Start Reading" : "Continue"}
                  </Button>
                </div>
              </div>

              {/* Arrow */}
              <motion.div 
                animate={{
                  left: Math.max(20, Math.min(280, hole.x + hole.width / 2 - (Math.max(16, Math.min(window.innerWidth - 336, hole.x + hole.width / 2 - 160))) - 8))
                }}
                className={cn(
                  "absolute w-4 h-4 bg-card border-l border-t rotate-45 -top-2 ring-1 ring-border/20",
                  hole.y + hole.height + 16 > window.innerHeight - 250 && "-bottom-2 top-auto border-l-0 border-t-0 border-r border-b"
                )}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}