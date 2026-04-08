import { books, genreLabels, type Genre } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jlptColors } from '@/data/books';

const genres = Object.keys(genreLabels) as Genre[];

export default function Library() {
  const featured = books[0];

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-black tracking-tight">
          読みます <span className="text-base font-bold text-muted-foreground">Yomimasu</span>
        </h1>
        <p className="text-sm text-muted-foreground">Learn Japanese through reading</p>
      </header>

      {/* Featured */}
      <section className="px-5 py-3">
        <Link to={`/book/${featured.id}`}>
          <div
            className="relative overflow-hidden rounded-3xl p-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${featured.coverColor}, ${featured.coverColor}dd)` }}
          >
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Featured</span>
            </div>
            <h2 className="font-japanese mt-2 text-3xl font-black text-white">{featured.titleJp}</h2>
            <p className="text-sm font-semibold text-white/90">{featured.titleEn}</p>
            <p className="mt-2 text-xs text-white/70 line-clamp-2">{featured.synopsis}</p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: jlptColors[featured.jlptLevel] }}
              >
                {featured.jlptLevel}
              </span>
              <span className="text-xs text-white/70">{featured.readingTimeMin} min read</span>
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
            <h3 className="px-5 text-lg font-extrabold">{genreLabels[genre]}</h3>
            <div className="mt-2 flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-none">
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
