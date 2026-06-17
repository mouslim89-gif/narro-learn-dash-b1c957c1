import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Layers, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    title: "Welcome to Tsundoku",
    description: "Your personalized Japanese reading companion. Master kanji and vocabulary through immersive reading.",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    title: "Smart Flashcards",
    description: "We automatically track the words you're learning and schedule reviews using spaced repetition (SRS).",
    icon: Layers,
    color: "text-orange-500",
  },
  {
    title: "Adaptive Furigana",
    description: "As you learn, furigana will automatically hide for words you've mastered, encouraging real reading.",
    icon: Settings2,
    color: "text-purple-500",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setOpen(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  const CurrentIcon = STEPS[step].icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full bg-muted ${STEPS[step].color}`}>
              <CurrentIcon size={48} />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{STEPS[step].title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {STEPS[step].description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleNext} className="w-full">
            {step === STEPS.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
