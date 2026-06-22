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
    title: "Le cœur de Kotoba 📖",
    description: "Appuyez sur n'importe quel mot pour voir sa définition, sa lecture (furigana) et sa fonction grammaticale.",
    position: 'bottom',
  },
  {
    selector: '[data-tutorial="settings"]',
    title: "À votre goût ⚙️",
    description: "Changez la taille du texte, la police ou le mode sombre pour une lecture confortable.",
    position: 'bottom',
  },
  {
    selector: '[data-tutorial="grammar"]',
    title: "Guide de grammaire 📚",
    description: "Consultez les points de grammaire spécifiques à ce livre pour mieux comprendre les structures complexes.",
    position: 'bottom',
  },
];

export function ReaderTutorial() {
  const { hasSeenReaderTutorial, completeReaderTutorial } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasSeenReaderTutorial) return;

    // Small delay to ensure the reader content is rendered
    const timer = setTimeout(() => {
      updateTargetRect();
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasSeenReaderTutorial, stepIndex]);

  const updateTargetRect = () => {
    const selector = readerSteps[stepIndex].selector;
    const element = document.querySelector(selector);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // If element not found, move to next step or finish
      if (stepIndex < readerSteps.length - 1) {
        setStepIndex(prev => prev + 1);
      } else {
        setIsVisible(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [stepIndex]);

  if (hasSeenReaderTutorial || !isVisible || !targetRect) return null;

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
          left: Math.max(16, Math.min(window.innerWidth - 336, targetRect.left + targetRect.width / 2 - 160)),
        };
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + gap,
          left: Math.max(16, Math.min(window.innerWidth - 336, targetRect.left + targetRect.width / 2 - 160)),
        };
      default:
        return {
          top: targetRect.bottom + gap,
          left: targetRect.left,
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
            Étape {stepIndex + 1}/{readerSteps.length}
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
            Passer
          </Button>
          <Button size="sm" onClick={handleNext} className="rounded-full px-4">
            {stepIndex === readerSteps.length - 1 ? "Compris !" : "Continuer"}
          </Button>
        </div>

        {/* Arrow */}
        <div 
          className={cn(
            "absolute w-3 h-3 bg-card border-l border-t rotate-45",
            currentStep.position === 'bottom' ? "-top-1.5 left-1/2 -translate-x-1/2" : "-bottom-1.5 left-1/2 -translate-x-1/2"
          )}
        />
      </motion.div>
    </div>
  );
}
