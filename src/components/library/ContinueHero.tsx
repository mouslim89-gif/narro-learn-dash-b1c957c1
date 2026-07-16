import { motion } from 'framer-motion';
import { Play, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DelayedLink as Link } from '@/components/DelayedLink';
import type { Book } from '@/data/books';
import { genreLabels } from '@/data/books';
import { cn } from '@/lib/utils';

interface ContinueHeroProps {
  book: Book;
  progressPercent: number;
  difficulty: string;
  chapterId?: string;
}

export function ContinueHero({ book, progressPercent, difficulty, chapterId }: ContinueHeroProps) {
  const continueLink = chapterId 
    ? `/reader/${book.id}/${difficulty}/${chapterId}`
    : `/reader/${book.id}/${difficulty}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-6 mb-8"
    >
      <Link
        to={`/book/${book.id}`}
        className="block group relative overflow-hidden rounded-3xl border border-border/30 bg-card p-5 shadow-sm card-lift transition-all duration-300"
        style={{ 
          backgroundImage: `linear-gradient(135deg, ${book.coverColor}18 0%, hsl(var(--card)) 60%)` 
        }}
      >
        <div className="flex gap-5">
          {/* Large Cover */}
          <div
            className="book-paper relative flex h-[132px] w-[96px] flex-shrink-0 items-end overflow-hidden rounded-xl p-3 shadow-lg ring-1 ring-black/5"
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
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Continue Reading
            </p>
            
            <h3 className="font-japanese text-lg font-bold leading-tight text-foreground truncate">
              {book.titleJp}
            </h3>
            <h4 className="font-serif text-[15px] font-semibold text-foreground/90 truncate">
              {book.titleEn}
            </h4>
            <p className="mt-0.5 text-[12px] text-muted-foreground truncate">{book.author}</p>

            <div className="mt-4 flex items-center gap-3">
              <Progress value={progressPercent} className="h-1.5 flex-1" />
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

        <Link to={continueLink} className="mt-6 block">
          <Button className="btn-primary-glow w-full h-11 rounded-full font-serif font-bold text-[15px] shadow-md transition-all active:scale-[0.98]">
            <Play className="mr-2 h-4 w-4 fill-current" />
            Resume Reading
          </Button>
        </Link>
      </Link>
    </motion.div>
  );
}
