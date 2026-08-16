import { motion, AnimatePresence } from 'framer-motion';
import { HalfGauge } from '@/components/HalfGauge';
import { Sparkles } from 'lucide-react';

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
          className="relative w-full h-40 preserve-3d"
        >
          {/* Recto */}
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border shadow-sm flex flex-col items-center justify-center p-6">
            <span className="text-3xl font-japanese font-bold">天気</span>
            <span className="mt-2 text-xs text-muted-foreground">てんき</span>
          </div>

          {/* Verso */}
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border shadow-sm flex flex-col items-center justify-center p-6 rotate-y-180">
            <span className="text-sm font-medium">Weather; the elements</span>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-6 w-8 rounded bg-muted border border-border/40" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-card p-6 rounded-2xl border shadow-sm w-full max-w-[240px] flex flex-col items-center">
        <div className="w-32 h-20 relative">
          <HalfGauge 
            value={active ? 75 : 0} 
            max={100} 
            size={128} 
            strokeWidth={10}
            className="text-accent"
          />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span className="text-lg font-serif font-bold">15</span>
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground -mt-1">Due today</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-accent">
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
import React from 'react';