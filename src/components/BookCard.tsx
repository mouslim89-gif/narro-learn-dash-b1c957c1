import { Link } from 'react-router-dom';
import { Clock, Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { jlptColors, hasAnyAudio } from '@/data/books';

export function BookCard({ book, progress }: { book: Book; progress?: number }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex w-36 flex-shrink-0 flex-col gap-2 md:w-44"
    >
      <div
        className="book-cover relative flex h-52 items-end overflow-hidden rounded p-3 shadow-md transition-transform duration-200 group-active:scale-[0.97] group-hover:scale-[1.02] md:h-60"
        style={{ backgroundColor: book.coverColor }}
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
        {/* Spine effect */}
        <div className="absolute inset-y-0 left-0 w-2 bg-black/15" />
        {hasAnyAudio(book) && (
          <div className="absolute right-2 top-2 rounded bg-white/20 p-1 backdrop-blur-sm">
            <Headphones className="h-3 w-3 text-white" />
          </div>
        )}
        <div className="relative w-full">
          <p className="font-japanese text-lg font-bold leading-tight text-white drop-shadow-md">
            {book.titleJp}
          </p>
          <p className="text-[11px] text-white/75">{book.titleEn}</p>
        </div>
        {progress != null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
            <div
              className="h-full bg-white/80 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-0.5">
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
    </Link>
  );
}
