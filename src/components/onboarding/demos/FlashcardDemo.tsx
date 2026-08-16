import { motion, AnimatePresence } from 'framer-motion';
import { HalfGauge } from '@/components/HalfGauge';
import { Sparkles } from 'lucide-react';
import React from 'react';

export function FlashcardDemo({ active }: { active: boolean }) {
  const [flipped, setFlipped] = React.useState(false);

  React.useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setFlipped(prev => !prev);
    }, 2500);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-[260px] mb-10">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
          className="relative w-full h-40"
        >
          {/* Recto */}
          <div 
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-card rounded-2xl border shadow-sm flex flex-col items-center justify-center p-6"
          >
            <span className="text-3xl font-japanese font-bold">天気</span>
            <span className="mt-2 text-xs text-muted-foreground">てんき</span>
          </div>

          {/* Verso */}
          <div 
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 bg-card rounded-2xl border shadow-sm flex flex-col items-center justify-center p-6"
          >
            <span className="text-sm font-medium">Weather; the elements</span>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-6 w-8 rounded bg-muted border border-border/40" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-card p-6 pb-2 rounded-2xl border shadow-sm w-full max-w-[240px] flex flex-col items-center">
        <HalfGauge 
          value={active ? 75 : 0} 
          max={100} 
          label="REVIEWS"
          centerText="15"
          subText="Due"
          tone="accent"
        />
        <div className="mt-2 mb-4 flex items-center gap-2 text-accent">
          <Sparkles className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Goal almost reached!</span>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-center font-medium text-muted-foreground"
      >
        Spaced Repetition keeps your vocabulary fresh.
      </motion.p>
    </div>
  );
}
