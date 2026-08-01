import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { DelayedLink as Link } from '@/components/DelayedLink';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import type { Book } from '@/data/books';

interface ContinueHeroProps {
  book: Book;
  progressPercent: number;
  difficulty: string;
  chapterId?: string;
}

export function ContinueHero({ book, progressPercent, difficulty, chapterId }: ContinueHeroProps) {
  const goTo = useDelayedNav();
  const continueLink = chapterId 
    ? `/reader/${book.id}/${difficulty}/${chapterId}`
    : `/reader/${book.id}/${difficulty}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // If we clicked the button or a link inside, don't trigger the card nav
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    goTo(`/book/${book.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-6 mb-8"
    >
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && goTo(`/book/${book.id}`)}
        className="block group relative overflow-hidden rounded-3xl bg-card p-5 shadow-sm card-lift transition-all duration-300 cursor-pointer"
        style={{
          backgroundImage: `linear-gradient(135deg, ${book.coverColor}3D 0%, ${book.coverColor}14 45%, hsl(var(--card)) 100%)`,
          boxShadow: `0 0 0 1px ${book.coverColor}33, 0 8px 24px -14px ${book.coverColor}80`,
        }}
      >
        {/* Soft colored halo behind the cover */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: book.coverColor }}
        />

        <div className="relative flex gap-5">
          {/* Large Cover */}
          <div
            className="book-paper relative flex h-[132px] w-[96px] flex-shrink-0 items-end overflow-hidden rounded-2xl p-3 shadow-lg ring-1 ring-black/5"
            style={{ backgroundColor: book.coverColor }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/35" />
            <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
            <p className="font-japanese relative text-[10px] font-bold leading-tight text-white drop-shadow-sm">
              {book.titleJp}
            </p>
          </div>

          {/* Book Info */}
          <div className="flex flex-1 flex-col justify-center min-w-0">
            <h3 className="font-japanese text-lg font-bold leading-tight text-foreground truncate">
              {book.titleJp}
            </h3>
            <h4 className="font-serif text-[15px] font-semibold text-foreground/90 truncate">
              {book.titleEn}
            </h4>
            <p className="mt-0.5 text-[12px] text-muted-foreground truncate">{book.author}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%`, backgroundColor: book.coverColor }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-foreground/70">
                {Math.round(progressPercent)}%
              </span>
            </div>

            
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
               <span className="flex items-center gap-1">
                 <Clock className="h-3 w-3" />
                 ~{Math.round(book.readingTimeMin * (1 - progressPercent / 100))} min left
               </span>
            </div>
          </div>
        </div>

        <Link to={continueLink} className="mt-6 block" onClick={(e) => e.stopPropagation()}>
          <Button className="btn-tsundoku-premium tap-scale group h-14 w-full rounded-full border-none font-serif text-[16px] font-bold tracking-wide">
            <Play className="mr-2 h-4 w-4 fill-current" />
            Resume Reading
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
