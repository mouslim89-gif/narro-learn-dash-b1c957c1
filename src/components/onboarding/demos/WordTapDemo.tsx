import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Volume2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const before = ['今日', 'は'];
const after = ['が', 'いい', 'です', 'ね', '。'];

export function WordTapDemo({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    if (!active) {
      setTapped(false);
      return;
    }
    const t = setTimeout(() => setTapped(true), reduced ? 0 : 900);
    return () => clearTimeout(t);
  }, [active, reduced]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6">
      <div className="reader-text font-japanese text-xl leading-[2.4] text-foreground">
        {before.map((w) => (
          <span key={w}>{w}</span>
        ))}
        <button
          type="button"
          onClick={() => setTapped(true)}
          className={cn(
            'relative rounded px-0.5 transition-colors duration-300',
            tapped ? 'bg-accent/15 text-accent' : 'bg-transparent',
          )}
        >
          <ruby>
            天気
            <rt className="text-[0.5em] text-muted-foreground">てんき</rt>
          </ruby>
          {active && !reduced && !tapped && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent/50"
              animate={{ opacity: [0.15, 0.7, 0.15], scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            />
          )}
        </button>
        {after.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="h-[132px] w-full max-w-[290px]">
        <AnimatePresence>
          {tapped && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="rounded-2xl bg-background p-4 ring-1 ring-border/50 elev-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-japanese text-xl font-bold leading-none">天気</p>
                  <p className="mt-1 text-xs text-muted-foreground">てんき</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Volume2 className="h-4 w-4" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Bookmark className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Noun
                </span>
                <span className="rounded-full bg-[hsl(var(--n4)/0.15)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--n4))]">
                  N4
                </span>
              </div>
              <p className="mt-2 text-sm leading-snug text-foreground">Weather; the elements</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
