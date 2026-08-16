import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

const words = ['今日', 'は', '天気', 'が', 'いい', 'です', 'ね', '。'];
const bars = [14, 24, 32, 18, 28, 34, 20, 30, 16, 26, 32, 20];

export function AudioDemo({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(-1);

  useEffect(() => {
    if (!active || reduced) {
      setIdx(reduced ? 2 : -1);
      return;
    }
    const interval = setInterval(() => setIdx((p) => (p + 1) % (words.length + 2)), 420);
    return () => clearInterval(interval);
  }, [active, reduced]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 p-6">
      <div className="reader-text text-center font-japanese text-xl leading-[2.3]">
        {words.map((w, i) => (
          <span
            key={i}
            className={cn(
              'rounded px-0.5 transition-colors duration-200',
              i === idx ? 'bg-accent/15 text-accent' : 'text-foreground',
            )}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="flex w-full max-w-[280px] items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground elev-soft">
          <Pause className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex h-9 items-end gap-[3px]">
            {bars.map((h, i) => (
              <motion.span
                key={i}
                className="w-1.5 flex-1 rounded-full bg-accent/40"
                style={{ height: 12 }}
                animate={active && !reduced ? { height: [12, h, 12] } : { height: 18 }}
                transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.06, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
            <span>0:12</span>
            <span>3:04</span>
          </div>
        </div>
      </div>
    </div>
  );
}
