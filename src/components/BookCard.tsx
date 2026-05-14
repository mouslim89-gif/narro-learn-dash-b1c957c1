import { Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import type { Book } from '@/data/books';
import { hasAnyAudio } from '@/data/books';

export function BookCard({ book, progress }: { book: Book; progress?: number }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col gap-2.5 tap-scale"
    >
      <div
        className="book-cover book-paper relative flex aspect-[2/3] items-end overflow-hidden rounded-sm p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.18)] card-lift group-hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.22)]"
        style={{ backgroundColor: book.coverColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/40" />
        <div className="absolute inset-y-0 left-0 w-2 bg-black/25" />
        <div className="absolute inset-y-0 left-2 w-px bg-white/10" />
        {hasAnyAudio(book) && (
          <div className="absolute right-2 top-2 rounded-full bg-white/25 p-1 backdrop-blur-sm">
            <Headphones className="h-3 w-3 text-white" />
          </div>
        )}
        <div className="relative w-full">
          <p className="font-japanese text-base font-bold leading-tight text-white drop-shadow-md">
            {book.titleJp}
          </p>
        </div>
        {progress != null && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/30">
            <div
              className="h-full bg-white/90 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="font-serif text-[13px] font-semibold leading-tight text-foreground line-clamp-2">
          {book.titleEn}
        </p>
        <p className="mt-1 text-[11px] tracking-wide text-muted-foreground truncate">
          {book.author}
        </p>
      </div>
    </Link>
  );
}
