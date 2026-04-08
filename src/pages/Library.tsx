import { books, genreLabels, type Genre } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Link } from 'react-router-dom';
import { jlptColors } from '@/data/books';
import { Clock, Headphones } from 'lucide-react';

const genres = Object.keys(genreLabels) as Genre[];

export default function Library() {
  const featured = books[0];

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          読みます
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Learn Japanese through reading</p>
      </header>

      {/* Featured */}
      <section className="px-6 py-4">
        <Link to={`/book/${featured.id}`}>
          <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start gap-5">
              <div
                className="flex h-32 w-24 flex-shrink-0 items-end rounded p-3 shadow-md"
                style={{ backgroundColor: featured.coverColor }}
              >
                <p className="font-japanese text-sm font-bold leading-tight text-white">
                  {featured.titleJp}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Featured</p>
                <h2 className="mt-1 font-serif text-xl font-bold">{featured.titleEn}</h2>
                <p className="text-xs text-muted-foreground">{featured.author}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{featured.synopsis}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: jlptColors[featured.jlptLevel] }}
                  >
                    {featured.jlptLevel}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {featured.readingTimeMin} min
                  </span>
                  {featured.hasAudio && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Headphones className="h-3 w-3" /> Audio
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Genre sections */}
      {genres.map((genre) => {
        const genreBooks = books.filter((b) => b.genre === genre);
        if (genreBooks.length === 0) return null;
        return (
          <section key={genre} className="py-3">
            <h3 className="px-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {genreLabels[genre]}
            </h3>
            <div className="mt-3 flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-none">
              {genreBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
