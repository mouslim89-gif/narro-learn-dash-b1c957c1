import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookType } from 'lucide-react';

export function GrammarDemo({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setOpen(true), reduced ? 0 : 700);
    return () => clearTimeout(t);
  }, [active, reduced]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6">
      <div className="reader-text text-center font-japanese text-lg leading-[2.2] text-foreground">
        今日は<span className="rounded bg-accent/15 px-0.5 text-accent">行くのだ</span>。
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 ring-1 ring-border/40 tap-scale-sm"
      >
        <BookType className="h-4 w-4 text-accent" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Grammar Notes
        </span>
      </button>

      <div className="h-[136px] w-full max-w-[290px]">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="rounded-2xl bg-background p-4 ring-1 ring-border/50 elev-soft"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Structure
              </p>
              <p className="mt-2 font-japanese text-base font-bold text-foreground">
                Dictionary form <span className="text-accent">+</span> のだ
              </p>
              <p className="mt-3 text-sm leading-snug text-muted-foreground">
                Gives an explanation or a reason behind what is being said.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
