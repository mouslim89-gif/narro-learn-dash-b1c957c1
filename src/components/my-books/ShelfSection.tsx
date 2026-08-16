import { BookShelfRow } from './BookShelfRow';
import { motion, AnimatePresence } from 'framer-motion';

interface ShelfSectionProps {
  title: string;
  count: number;
  items: any[];
  variant: 'reading' | 'finished' | 'unread';
}

export function ShelfSection({ title, count, items, variant }: ShelfSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold flex items-center gap-2">
          {title}
          <span className="text-[11px] font-sans font-semibold tabular-nums text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full ring-1 ring-border/30">
            {count}
          </span>
        </h3>
      </div>
      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <BookShelfRow 
              key={item.book.id} 
              book={item.book} 
              progress={item.progress} 
              variant={variant}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
