import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  selector: string;
  title: string;
  description: string;
  isInteractive?: boolean;
}

const readerSteps: TutorialStep[] = [
  {
    selector: '[data-tutorial="token"]',
    title: 'Tap a word 📖',
    description:
      'The heart of Tsundoku. Tap any word to see its definition, reading (furigana), and grammar function.',
    isInteractive: true,
  },
  {
    selector: '[data-tutorial="furigana"]',
    title: 'Reading Aids 🅰',
    description: 'Toggle furigana (readings above kanji) to help you read or challenge your memory.',
  },
  {
    selector: '[data-tutorial="translation"]',
    title: 'Helpful Translations 🌐',
    description: 'Need a hint? Toggle full sentence translations to better understand the story flow.',
  },
  {
    selector: '[data-tutorial="grammar"]',
    title: 'Grammar Guide 文',
    description: 'Check specific grammar points for this book to help you with complex structures.',
  },
  {
    selector: '[data-tutorial="settings"]',
    title: 'Your Preferences ⚙️',
    description: 'Customize text size, font, or theme for a comfortable reading experience.',
  },
];

const CARD_WIDTH = 320;
const CARD_MAX_HEIGHT = 230;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ReaderTutorial() {
  const { hasSeenReaderTutorial, completeReaderTutorial, alwaysReplayOnboarding } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const currentStep = readerSteps[stepIndex];
  const active = !dismissed && (!hasSeenReaderTutorial || alwaysReplayOnboarding) && isVisible;

  useEffect(() => {
    if (hasSeenReaderTutorial && !alwaysReplayOnboarding) return;
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [hasSeenReaderTutorial, alwaysReplayOnboarding]);

  const close = useCallback(() => {
    completeReaderTutorial();
    setIsVisible(false);
    setDismissed(true);
  }, [completeReaderTutorial]);

  const handleNext = useCallback(() => {
    if (stepIndex === readerSteps.length - 1) {
      close();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  }, [stepIndex, close]);

  const handlePrev = () => setStepIndex((prev) => Math.max(0, prev - 1));

  const handleSkip = () => close();

  // Track the target element position
  useEffect(() => {
    if (!active) return;

    const update = () => {
      const el = document.querySelector(currentStep.selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });

      const inView =
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        r.right <= (window.innerWidth || document.documentElement.clientWidth);
      if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [active, stepIndex, currentStep.selector]);

  // Interactive step: detect the mini popup so we can stop dimming (no auto-advance)
  useEffect(() => {
    if (!active || !currentStep.isInteractive) {
      setPopupOpen(false);
      return;
    }

    const check = () =>
      setPopupOpen(
        !!document.querySelector('.animate-mini-slide-up, .animate-mini-slide-down'),
      );
    check();
    const interval = setInterval(check, 200);
    return () => clearInterval(interval);
  }, [active, stepIndex, currentStep.isInteractive]);

  if (!active) return null;

  const highlight: Box = box
    ? { top: box.top - 4, left: box.left - 4, width: box.width + 8, height: box.height + 8 }
    : { top: 0, left: 0, width: 0, height: 0 };

  const targetCenterX = highlight.left + highlight.width / 2;
  const placeAbove = highlight.top + highlight.height + 16 + CARD_MAX_HEIGHT > window.innerHeight;
  const cardTop = placeAbove
    ? Math.max(16, highlight.top - CARD_MAX_HEIGHT - 16)
    : highlight.top + highlight.height + 16;
  const cardLeft = Math.max(
    12,
    Math.min(window.innerWidth - CARD_WIDTH - 12, targetCenterX - CARD_WIDTH / 2),
  );
  const arrowLeft = Math.max(20, Math.min(CARD_WIDTH - 36, targetCenterX - cardLeft - 8));

  const transitionStyle = { transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)' };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden animate-fade-in-soft pointer-events-none">
      {/* Real spotlight cut-out using box-shadow */}
      {box && !popupOpen && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            ...transitionStyle,
          }}
        />
      )}

      {/* Pulsing ring halo for interactive step */}
      {box && currentStep.isInteractive && !popupOpen && (
        <div
          className="absolute rounded-xl ring-2 ring-accent animate-tutorial-pulse pointer-events-none"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            ...transitionStyle,
          }}
        />
      )}

      {/* Click blocking layers — only blocked outside the cut-out on interactive steps */}
      {currentStep.isInteractive ? (
        popupOpen ? null : (
          <>
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 pointer-events-auto bg-transparent" style={{ height: highlight.top }} />
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-auto bg-transparent" style={{ top: highlight.top + highlight.height }} />
            {/* Left */}
            <div className="absolute left-0 pointer-events-auto bg-transparent" style={{ top: highlight.top, height: highlight.height, width: highlight.left }} />
            {/* Right */}
            <div className="absolute right-0 pointer-events-auto bg-transparent" style={{ top: highlight.top, height: highlight.height, left: highlight.left + highlight.width }} />
          </>
        )
      ) : (
        <div className="absolute inset-0 pointer-events-auto bg-transparent" />
      )}

      {/* Tooltip card */}
      <div
        className="absolute rounded-2xl border bg-card p-5 shadow-2xl ring-1 ring-border/50 pointer-events-auto"
        style={{ top: cardTop, left: cardLeft, width: CARD_WIDTH, ...transitionStyle }}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex gap-1 pt-2">
            {readerSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === stepIndex ? 'w-4 bg-primary' : 'w-1 bg-muted',
                )}
              />
            ))}
          </div>
          <button onClick={handleSkip} aria-label="Skip tutorial" className="text-muted-foreground tap-scale-sm">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mb-2 font-serif text-xl font-bold text-foreground">{currentStep.title}</h3>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{currentStep.description}</p>

        <div className="flex items-center justify-between">
          <div>
            {stepIndex > 0 && (
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-10 w-10 rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNext} className="rounded-full px-6 font-semibold shadow-md btn-tsundoku-premium">
              {stepIndex === readerSteps.length - 1 ? 'Start Reading' : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Arrow */}
        <div
          className={cn(
            'absolute h-4 w-4 rotate-45 bg-card ring-1 ring-border/20',
            placeAbove ? '-bottom-2 border-b border-r' : '-top-2 border-l border-t',
          )}
          style={{ left: arrowLeft, transition: 'left 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>
    </div>
  );
}
