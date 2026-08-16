import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HalfGauge } from '@/components/HalfGauge';

const srsButtons = [
  { label: 'Again', tone: 'text-destructive' },
  { label: 'Hard', tone: 'text-amber-600 dark:text-amber-400' },
  { label: 'Good', tone: 'text-primary' },
  { label: 'Easy', tone: 'text-emerald-600 dark:text-emerald-400' },
];

export function FlashcardDemo({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!active || reduced) return;
    const interval = setInterval(() => setFlipped((p) => !p), 2600);
    return () => clearInterval(interval);
  }, [active, reduced]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6">
      <div className="w-full max-w-[250px]" style={{ perspective: 1000 }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative h-[124px] w-full"
        >
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background ring-1 ring-border/50 elev-soft"
          >
            <span className="font-japanese text-3xl font-bold">天気</span>
            <span className="mt-1.5 text-xs text-muted-foreground">てんき</span>
          </div>
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background px-6 text-center ring-1 ring-border/50 elev-soft"
          >
            <span className="text-sm font-medium">Weather; the elements</span>
          </div>
        </motion.div>
      </div>

      <div className="flex w-full max-w-[250px] gap-1.5">
        {srsButtons.map((b) => (
          <div
            key={b.label}
            className={`flex-1 rounded-full bg-muted py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-border/40 ${b.tone}`}
          >
            {b.label}
          </div>
        ))}
      </div>

      <HalfGauge
        value={active ? 12 : 0}
        max={15}
        label="Reviews"
        centerText="12"
        subText="of 15"
        tone="accent"
      />
    </div>
  );
}
