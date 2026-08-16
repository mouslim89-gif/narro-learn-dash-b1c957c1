import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const modes = ['Simplified', 'Intermediate', 'Original'] as const;
const texts: Record<(typeof modes)[number], string> = {
  Simplified: 'むかしむかし、あるところに おじいさんと おばあさんが いました。',
  Intermediate: '昔々、ある所に、お爺さんとお婆さんが住んでいました。',
  Original: '今は昔、竹取の翁といふもの有りけり。',
};

export function DifficultyDemo({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active || reduced) return;
    const interval = setInterval(() => setIdx((p) => (p + 1) % modes.length), 2600);
    return () => clearInterval(interval);
  }, [active, reduced]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex rounded-full bg-muted p-1 ring-1 ring-border/40">
        {modes.map((mode, i) => (
          <button
            key={mode}
            type="button"
            onClick={() => setIdx(i)}
            className="relative rounded-full px-3 py-1.5"
          >
            {i === idx && (
              <motion.span
                layoutId="onb-difficulty-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-background ring-1 ring-border/40 elev-soft"
              />
            )}
            <span
              className={cn(
                'relative text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
                i === idx ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {mode}
            </span>
          </button>
        ))}
      </div>

      <div className="flex min-h-[120px] w-full max-w-[300px] items-center justify-center px-2 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="reader-text font-japanese text-[17px] leading-[2.1] text-foreground"
          >
            {texts[modes[idx]]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
