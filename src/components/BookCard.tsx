import { Link } from 'react-router-dom';
import { Clock, Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { jlptColors } from '@/data/books';

export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex w-36 flex-shrink-0 flex-col gap-2 md:w-44"
    >
      <div
        className="relative flex h-48 items-end overflow-hidden rounded-2xl p-3 shadow-lg transition-transform group-hover:scale-[1.03] md:h-56"
        style={{ backgroundColor: book.coverColor }}
      >
        {book.hasAudio && (
          <div className="absolute right-2 top-2 rounded-full bg-white/25 p-1.5 backdrop-blur-sm">
            <Headphones className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        <div className="w-full">
          <p className="font-japanese text-lg font-bold leading-tight text-white drop-shadow-md">
            {book.titleJp}
          </p>
          <p className="text-xs font-semibold text-white/80">{book.titleEn}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-1">
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
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
