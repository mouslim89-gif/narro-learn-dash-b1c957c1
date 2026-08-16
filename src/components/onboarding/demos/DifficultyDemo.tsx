import { motion, AnimatePresence } from 'framer-motion';

export function DifficultyDemo({ active }: { active: boolean }) {
  const modes = ['Simplified', 'Intermediate', 'Original'];
  const text = {
    Simplified: 'むかしむかし、あるところに、おじいさんとおばあさんがいました。',
    Intermediate: '昔々、ある所に、お爺さんとお婆さんが住んでいました。',
    Original: '今は昔、竹取の翁といふものありけり。'
  };

  const [currentIdx, setCurrentIdx] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % modes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30">
      {/* Segmented Control Mock */}
      <div className="flex gap-1 rounded-full bg-card ring-1 ring-border/40 p-1 mb-10 relative">
        {modes.map((mode, i) => (
          <div
            key={mode}
            className={`relative px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${
              i === currentIdx ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {mode}
          </div>
        ))}
        <motion.div
          animate={{ x: currentIdx * 88 }} // Rough estimation for demo
          className="absolute inset-y-1 left-1 w-[84px] bg-background rounded-full shadow-sm ring-1 ring-border/20"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Text Preview */}
      <div className="bg-card p-8 rounded-3xl border shadow-sm w-full max-w-[300px] min-h-[160px] flex items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-japanese leading-relaxed"
          >
            {text[modes[currentIdx] as keyof typeof text]}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-center font-medium text-muted-foreground"
      >
        Read what you want, at the level you want.
      </motion.p>
    </div>
  );
}
import React from 'react';