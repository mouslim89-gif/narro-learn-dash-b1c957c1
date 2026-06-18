import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowDown, Check, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideProps {
  kanji: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  isLast?: boolean;
  onNext?: () => void;
}

function OnboardingSlide({ kanji, title, description, children, isLast, onNext }: SlideProps) {
  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center px-8 text-center snap-start overflow-hidden bg-background">
      <span className="library-kanji-watermark select-none pointer-events-none" aria-hidden="true">
        {kanji}
      </span>
      
      <div className="relative z-10 max-w-sm w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-[40px] leading-[1.1] text-foreground font-bold italic mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
            {description}
          </p>
        </motion.div>

        <div className="py-4">
          {children}
        </div>

        {isLast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="pt-4"
          >
            <Button 
              onClick={onNext}
              size="lg" 
              className="w-full rounded-full h-12 text-[15px] font-semibold shadow-md tap-scale-sm"
            >
              Get Started
            </Button>
          </motion.div>
        )}
      </div>

      {!isLast && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ArrowDown className="h-5 w-5" />
        </div>
      )}
    </section>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollTop / window.innerHeight);
      setActiveIndex(index);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFinish = () => {
    localStorage.setItem("tsundoku-welcome-seen", "true");
    navigate("/auth");
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-y-auto snap-y snap-mandatory no-scrollbar bg-background"
    >
      {/* Vertical Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i}
            className={cn(
              "w-0.5 h-4 rounded-full transition-all duration-300",
              activeIndex === i ? "bg-foreground h-8" : "bg-foreground/20"
            )}
          />
        ))}
      </div>

      {/* Skip Button */}
      <button 
        onClick={handleFinish}
        className="fixed top-6 right-6 z-50 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground smooth-colors"
      >
        Skip
      </button>

      <OnboardingSlide
        kanji="積"
        title="Tsundoku"
        description="Read real Japanese literature, one tap at a time. The library is your world."
      >
        <div className="wordmark text-[14px] text-accent tracking-[0.2em] uppercase mt-4">Welcome</div>
      </OnboardingSlide>

      <OnboardingSlide
        kanji="学"
        title="Tap to Learn"
        description="Instant lookups for any word or phrase. Grammar notes explained by AI."
      >
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border ring-1 ring-border/30 text-xs font-jp-sans shadow-sm">
            不思議<span className="text-[10px] text-muted-foreground ml-1">ふしぎ</span>
          </div>
          <div className="h-px w-4 bg-border/60" />
          <div className="text-[11px] text-muted-foreground italic">mysterious; strange</div>
        </div>
      </OnboardingSlide>

      <OnboardingSlide
        kanji="聴"
        title="Listen Along"
        description="Synchronized native audio tracks read with you. Master the natural flow of speech."
      >
        <div className="mt-4 flex items-center justify-center gap-1 h-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{ height: [8, 24, 12, 28, 10][i-1] }}
              transition={{ repeat: Infinity, duration: 1, repeatType: "reverse", delay: i * 0.1 }}
              className="w-1 bg-accent rounded-full"
            />
          ))}
        </div>
      </OnboardingSlide>

      <OnboardingSlide
        kanji="読"
        title="Ready to Start?"
        description="Join thousands of readers mastering Japanese through the beauty of stories."
        isLast
        onNext={handleFinish}
      />
    </div>
  );
}
