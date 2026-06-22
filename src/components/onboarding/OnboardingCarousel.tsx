import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding';
import { ChevronRight, ChevronLeft, BookOpen, MousePointer2, BrainCircuit, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    title: "Bienvenue sur Kotoba ! 👋",
    description: "Votre nouveau compagnon pour apprendre le japonais par la lecture. Plongez dans vos histoires préférées.",
    icon: <BookOpen className="w-12 h-12 text-primary" />,
    color: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    title: "Lisez, cliquez, apprenez",
    description: "Un mot vous échappe ? Cliquez dessus pour voir sa définition, sa grammaire et sa prononciation instantanément.",
    icon: <MousePointer2 className="w-12 h-12 text-primary" />,
    color: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    title: "Mémorisez pour de bon",
    description: "Ajoutez des mots à vos flashcards. Notre système de répétition espacée (SRS) s'occupe de les ancrer dans votre mémoire.",
    icon: <BrainCircuit className="w-12 h-12 text-primary" />,
    color: "bg-green-50 dark:bg-green-900/20",
  },
  {
    title: "Prêt pour l'aventure ?",
    description: "Choisissez un livre dans la bibliothèque et commencez votre voyage linguistique dès maintenant.",
    icon: <Star className="w-12 h-12 text-primary" />,
    color: "bg-purple-50 dark:bg-purple-900/20",
  },
];

export function OnboardingCarousel() {
  const { hasCompletedCarousel, completeCarousel } = useOnboardingStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (hasCompletedCarousel) return null;

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      completeCarousel();
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
                  {currentSlide === slides.length - 1 ? "C'est parti !" : "Suivant"}
                  {currentSlide < slides.length - 1 && <ChevronRight className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={completeCarousel}
          >
            Passer
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
