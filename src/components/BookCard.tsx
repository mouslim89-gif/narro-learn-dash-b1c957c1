import { Link } from 'react-router-dom';
import { Clock, Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { jlptColors, hasAnyAudio } from '@/data/books';

export function BookCard({ book, progress }: { book: Book; progress?: number }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex w-36 flex-shrink-0 flex-col gap-2 md:w-44 tap-scale"
    >
      <div
        className="book-cover book-paper relative flex h-52 items-end overflow-hidden rounded-md p-3 shadow-md card-lift group-hover:shadow-lg md:h-60"
        style={{ backgroundColor: book.coverColor }}
      >
        {/* Soft top highlight + bottom shade for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/35" />
        {/* Spine effect */}
        <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
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
          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/70">{book.author}</p>
        </div>
        {progress != null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
            <div
              className="h-full bg-white/85 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-[12px] font-medium text-foreground">{book.titleEn}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: jlptColors[book.jlptLevel] }}
          >
            {book.jlptLevel}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {book.readingTimeMin}m
          </span>
        </div>
      </div>
    </Link>
  );
}
