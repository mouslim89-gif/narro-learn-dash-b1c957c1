import { Link } from 'react-router-dom';
import { Clock, Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { jlptColors, hasAnyAudio } from '@/data/books';

export function BookCard({ book, progress }: { book: Book; progress?: number }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex w-36 flex-shrink-0 flex-col gap-2.5 md:w-44"
    >
      <div
        className="book-cover relative flex h-52 items-end overflow-hidden rounded-md p-3 shadow-book transition-all duration-300 group-active:scale-[0.97] group-hover:-translate-y-1 group-hover:shadow-card md:h-60"
        style={{ backgroundColor: book.coverColor }}
      >
        {/* Gradient overlay for depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-white/15" />
        {/* Spine effect (left edge) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/35 to-transparent" />
        {/* Subtle paper texture highlight (right edge) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-white/20 to-transparent" />

        {hasAnyAudio(book) && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/25 backdrop-blur-md ring-1 ring-white/30">
            <Headphones className="h-3 w-3 text-white" />
          </div>
        )}
        <div className="relative w-full">
          <p className="font-japanese text-lg font-bold leading-tight text-white drop-shadow-md">
            {book.titleJp}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-white/80 line-clamp-1">{book.titleEn}</p>
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
      <div className="flex items-center gap-2 px-0.5">
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm"
          style={{ backgroundColor: jlptColors[book.jlptLevel] }}
        >
          {book.jlptLevel}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" /> {book.readingTimeMin}m
        </span>
      </div>
    </Link>
  );
}
