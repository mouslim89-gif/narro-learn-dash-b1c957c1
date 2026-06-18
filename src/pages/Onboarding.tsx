import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { books } from "@/data/books";
import { BookCard } from "@/components/BookCard";
import { cn } from "@/lib/utils";
import { ArrowDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // Setup state
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

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

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({
          has_completed_onboarding: true,
          daily_goal_minutes: dailyGoal,
          // first_book_id doesn't exist in preferences, but we handle navigation
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Welcome aboard!");
      navigate(selectedBookId ? `/book/${selectedBookId}` : "/");
    } catch (err: any) {
      toast.error(err.message || "Failed to save onboarding");
      setSubmitting(false);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;
    try {
      await supabase
        .from("user_preferences")
        .update({ has_completed_onboarding: true })
        .eq("user_id", user.id);
      navigate("/");
    } catch (e) {
      navigate("/");
    }
  };


  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-y-auto snap-y snap-mandatory no-scrollbar bg-background"
    >
      {/* Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className={cn(
              "w-0.5 h-4 rounded-full transition-all duration-300",
              activeIndex === i ? "bg-foreground h-8" : "bg-foreground/20"
            )}
          />
        ))}
      </div>

      {/* Skip */}
      <button 
        onClick={skipOnboarding}
        className="fixed top-6 right-6 z-50 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        Skip
      </button>

      {/* Slide 1: Daily Goal */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center px-8 text-center snap-start overflow-hidden bg-background">
        <span className="library-kanji-watermark select-none pointer-events-none" aria-hidden="true">目</span>
        <div className="relative z-10 max-w-sm w-full space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="font-serif text-[36px] leading-tight font-bold italic mb-3">Set your goal</h2>
            <p className="text-muted-foreground text-sm">How many minutes do you want to read each day?</p>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-3">
            {[5, 10, 20, 30].map((min) => (
              <button
                key={min}
                onClick={() => setDailyGoal(min)}
                className={cn(
                  "h-16 rounded-2xl flex flex-col items-center justify-center ring-1 smooth-colors tap-scale-sm",
                  dailyGoal === min 
                    ? "bg-accent text-white ring-accent" 
                    : "bg-card text-foreground ring-border/40"
                )}
              >
                <span className="text-lg font-bold">{min}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80">minutes</span>
              </button>
            ))}
          </div>
          <div className="pt-4 animate-bounce opacity-40">
            <ArrowDown className="h-5 w-5 mx-auto" />
          </div>
        </div>
      </section>

      {/* Slide 2: Choose First Book */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center px-6 text-center snap-start overflow-hidden bg-background">
        <span className="library-kanji-watermark select-none pointer-events-none" aria-hidden="true">本</span>
        <div className="relative z-10 w-full max-w-sm flex flex-col h-[80vh]">
          <motion.div className="mb-6">
            <h2 className="font-serif text-[32px] leading-tight font-bold italic mb-2">Pick your first book</h2>
            <p className="text-muted-foreground text-sm">Select a story to start your journey.</p>
          </motion.div>
          
          <div className="flex-1 overflow-y-auto px-1 py-2 no-scrollbar">
            <div className="grid grid-cols-2 gap-3 pb-8">
              {books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={cn(
                    "relative rounded-xl overflow-hidden transition-all duration-300",
                    selectedBookId === book.id ? "ring-4 ring-accent scale-95" : "ring-1 ring-border/20 opacity-80"
                  )}
                >
                  <BookCard book={book} />
                  {selectedBookId === book.id && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center pointer-events-none">
                      <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg">
                        <Check className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 pb-6 animate-bounce opacity-40">
            <ArrowDown className="h-5 w-5 mx-auto" />
          </div>
        </div>
      </section>

      {/* Slide 3: Finish */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center px-8 text-center snap-start overflow-hidden bg-background">
        <span className="library-kanji-watermark select-none pointer-events-none" aria-hidden="true">✓</span>
        <div className="relative z-10 max-w-sm w-full space-y-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}>
            <h2 className="font-serif text-[44px] leading-tight font-bold italic mb-4">You're ready.</h2>
            <div className="space-y-4 inline-block text-left">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Check className="h-4 w-4" />
                </div>
                <div className="text-sm">Daily Goal: <span className="font-bold">{dailyGoal} min</span></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Check className="h-4 w-4" />
                </div>
                <div className="text-sm">First Book: <span className="font-bold">{selectedBookId ? books.find(b => b.id === selectedBookId)?.titleEn : 'Selected for you'}</span></div>

              </div>
            </div>
          </motion.div>

          <Button 
            onClick={handleFinish}
            disabled={submitting}
            size="lg" 
            className="w-full rounded-full h-14 text-[16px] font-bold shadow-xl tap-scale-sm"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Reading"}
          </Button>
        </div>
      </section>
    </div>
  );
}
