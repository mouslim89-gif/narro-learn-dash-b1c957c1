import { Link } from 'react-router-dom';
import { Clock, Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { hasAnyAudio } from '@/data/books';

export function BookCard({ book, progress }: { book: Book; progress?: number }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex w-36 flex-shrink-0 flex-col gap-2 md:w-44 tap-scale"
    >
      <div
        className="book-cover book-paper relative flex h-56 items-end overflow-hidden rounded-lg p-3 shadow-md ring-1 ring-black/5 card-lift group-hover:shadow-lg md:h-64"
        style={{ backgroundColor: book.coverColor }}
      >
        {/* Soft top highlight + bottom shade for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/35" />
        {/* Spine effect */}
        <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
        <div className="absolute inset-y-0 left-2 w-px bg-white/10" />
        {hasAnyAudio(book) && (
          <div className="absolute right-2 top-2 rounded-full bg-black/30 p-1.5 backdrop-blur-md ring-1 ring-white/20">
            <Headphones className="h-3 w-3 text-white" />
          </div>
        )}
        <div className="relative w-full">
          <p className="font-japanese text-lg font-bold leading-tight text-white drop-shadow-md">
            {book.titleJp}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/70">{book.author}</p>
        </div>
        {progress != null && (
          <div className="absolute right-2 bottom-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold tabular-nums text-foreground shadow-sm ring-1 ring-black/5">
            {Math.round(progress)}%
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-[13px] font-semibold text-foreground">{book.titleEn}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {book.readingTimeMin}m
          </span>
        </div>
      </div>
    </Link>
  );
}
