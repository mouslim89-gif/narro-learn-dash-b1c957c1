import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const readerSteps: TutorialStep[] = [
  {
    selector: '[data-tutorial="token"]',
    title: "The heart of Tsundoku 📖",
    description: "Tap any word to see its definition, reading (furigana), and grammar function.",
    position: 'bottom',
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
  const [tooltipLeft, setTooltipLeft] = useState(16);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasSeenReaderTutorial && !alwaysReplayOnboarding) return;

    // Small delay to ensure the reader content is rendered
    const timer = setTimeout(() => {
      focusStep();
      setIsVisible(true);
    }, 1200);

    // Re-check position frequently while visible to ensure arrow points correctly
    const interval = setInterval(updateTargetRect, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [hasSeenReaderTutorial, stepIndex]);

  const updateTargetRect = () => {
    const selector = readerSteps[stepIndex].selector;
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Only update if it actually changed to avoid unnecessary renders
      setTargetRect(prev => {
        if (!prev || prev.top !== rect.top || prev.left !== rect.left || prev.width !== rect.width) {
          return rect;
        }
        return prev;
      });
      
      const tooltipWidth = 320;
      const windowWidth = window.innerWidth;
      const desiredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      const clampedLeft = Math.max(16, Math.min(windowWidth - tooltipWidth - 16, desiredLeft));
      setTooltipLeft(clampedLeft);
    }
  };

  const focusStep = () => {
    const selector = readerSteps[stepIndex].selector;
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Re-read rect after scroll starts and ends
      setTimeout(updateTargetRect, 100);
      setTimeout(updateTargetRect, 500);
      updateTargetRect();
    } else {
      if (stepIndex < readerSteps.length - 1) {
        setStepIndex(prev => prev + 1);
      } else {
        setIsVisible(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateTargetRect);
    // window.addEventListener('scroll', updateTargetRect);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      // window.removeEventListener('scroll', updateTargetRect);
    };
  }, [stepIndex]);

  if ((hasSeenReaderTutorial && !alwaysReplayOnboarding) || !isVisible || !targetRect) return null;

  const currentStep = readerSteps[stepIndex];

  const handleNext = () => {
    if (stepIndex === readerSteps.length - 1) {
      completeReaderTutorial();
      setIsVisible(false);
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    completeReaderTutorial();
    setIsVisible(false);
  };

  const getTooltipStyle = () => {
    const gap = 12;
    switch (currentStep.position) {
      case 'bottom':
        return {
          top: targetRect.bottom + gap,
          left: tooltipLeft,
        };
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + gap,
          left: tooltipLeft,
        };
      default:
        return {
          top: targetRect.bottom + gap,
          left: tooltipLeft,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none">
      {/* Spotlight Effect */}
      <div 
        className="absolute inset-0 bg-black/40 transition-opacity duration-300 pointer-events-auto" 
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${targetRect.left}px 100%, 
            ${targetRect.left}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.top}px, 
            ${targetRect.right}px ${targetRect.bottom}px, 
            ${targetRect.left}px ${targetRect.bottom}px, 
            ${targetRect.left}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute w-80 bg-card p-5 rounded-2xl shadow-xl border pointer-events-auto"
        style={getTooltipStyle()}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Step {stepIndex + 1}/{readerSteps.length}
          </div>
          <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="text-lg font-bold mb-1">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {currentStep.description}
        </p>

        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
            Skip
          </Button>
          <Button size="sm" onClick={handleNext} className="rounded-full px-4">
            {stepIndex === readerSteps.length - 1 ? "Got it!" : "Continue"}
          </Button>
        </div>

        {/* Arrow */}
        <div 
          className={cn(
            "absolute w-3 h-3 bg-card border-l border-t rotate-45",
            currentStep.position === 'bottom' ? "-top-1.5" : "-bottom-1.5"
          )}
          style={{
            left: Math.max(12, Math.min(320 - 24, targetRect.left + targetRect.width / 2 - tooltipLeft - 6))
          }}
        />
      </motion.div>
    </div>
  );
}
