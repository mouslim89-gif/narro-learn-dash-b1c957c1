import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const books = [
  { title: '桜の森', tone: 'bg-[hsl(210_29%_24%)]' },
  { title: '走れメロス', tone: 'bg-[hsl(20_45%_28%)]' },
  { title: '蜘蛛の糸', tone: 'bg-[hsl(168_35%_24%)]' },
];

export function BooksFanDemo({ active }: { active: boolean }) {
  const reduced = useReducedMotion();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      <div className="relative h-[150px] w-[104px]">
        {books.map((book, i) => {
          const offset = i - 1;
          return (
            <motion.div
              key={book.title}
              initial={{ rotate: 0, x: 0, y: 0, opacity: 0 }}
              animate={
                active
                  ? reduced
                    ? { opacity: 1, rotate: offset * 9, x: offset * 30 }
                    : { opacity: 1, rotate: offset * 9, x: offset * 30, y: Math.abs(offset) * 8 }
                  : { opacity: 0 }
              }
              transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.08 * i }}
              className={cn(
                'book-paper absolute inset-0 flex items-end rounded-2xl p-3 elev-soft ring-1 ring-border/20',
                book.tone,
              )}
            >
              <span className="font-jp-serif text-[11px] font-bold leading-snug text-primary-foreground/85">
                {book.title}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {['N5', 'N4', 'N3'].map((lvl, i) => (
          <motion.span
            key={lvl}
            initial={{ opacity: 0, y: 6 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {lvl}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
