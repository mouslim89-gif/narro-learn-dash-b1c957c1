import { Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { hasAnyAudio } from '@/data/books';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  progress?: number;
  variant?: 'carousel' | 'grid';
}

export function BookCard({ book, progress, variant = 'carousel' }: BookCardProps) {
  const isCarousel = variant === 'carousel';
  return (
    <Link
      to={`/book/${book.id}`}
      className={cn(
        'group flex flex-col gap-2 tap-scale',
        isCarousel ? 'w-36 flex-shrink-0 md:w-44' : 'w-full',
      )}
    >
      <div
        className={cn(
          'book-cover book-paper relative flex items-end overflow-hidden rounded-md p-3 shadow-md card-lift group-hover:shadow-lg',
          isCarousel ? 'h-52 md:h-60' : 'aspect-[3/4]',
        )}
        style={{ backgroundColor: book.coverColor }}
      >
        {/* Soft top highlight + bottom shade for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40" />
        {/* Diagonal color pop for vibrance */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 mix-blend-overlay" />
        {/* Spine effect */}
        <div className="absolute inset-y-0 left-0 w-2 bg-black/25" />
        <div className="absolute inset-y-0 left-2 w-px bg-white/10" />
        {hasAnyAudio(book) && (
          <div className="absolute right-2 top-2 rounded-full bg-white/25 p-1 backdrop-blur-sm">
            <Headphones className="h-3 w-3 text-white" />
          </div>
        )}
        <div className="relative w-full">
          <p className="font-japanese text-lg font-bold leading-tight text-white drop-shadow-md">
            {book.titleJp}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/75">{book.author}</p>
        </div>
        {progress != null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
            <div
              className="h-full bg-white/90 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-[12px] font-medium text-foreground">{book.titleEn}</p>
        <p className="truncate text-[10px] text-muted-foreground">{book.author}</p>
      </div>
    </Link>
  );
}
