import { useState, useMemo } from 'react';
import { books, genreLabels, type Genre } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Moon, Sun, Settings, X } from 'lucide-react';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const genres = Object.keys(genreLabels) as Genre[];

export default function Library() {
  const [search, setSearch] = useState('');
  const { progress, darkMode, setDarkMode } = useReadingProgressStore();

  // Find most recently read book
  const continueBook = useMemo(() => {
    const entries = Object.entries(progress)
      .filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100)
      .sort(([, a], [, b]) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
    if (entries.length === 0) return null;
    const [bookId, prog] = entries[0];
    const book = books.find(b => b.id === bookId);
    return book ? { book, progress: prog } : null;
  }, [progress]);

  // Filter books by search
  const filteredBooks = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return books.filter(
      b => b.titleEn.toLowerCase().includes(q) || b.titleJp.includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="pb-20">
      <header className="library-header-bg relative px-6 pt-12 pb-6 flex items-end justify-between overflow-hidden">
        <span className="library-kanji-watermark" aria-hidden="true">積</span>
        <div className="relative z-10">
          <h1 className="wordmark font-serif font-bold tracking-tight text-[42px] md:text-[48px] leading-none text-foreground">Tsundoku</h1>
          <p className="mt-3 text-[12px] tracking-[0.08em] text-muted-foreground">
            <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
            Learn Japanese through reading
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 hover:bg-background" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 hover:bg-background">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </Link>
        </div>
      </header>
      <div className="bg-gradient-to-b from-transparent to-background h-6 -mt-6 relative z-0" />

      {/* Search */}
      <div className="px-6 pt-1 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {filteredBooks ? (
        <section className="px-6 py-4">
          <p className="mb-3 text-xs text-muted-foreground">{filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-4">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} progress={progress[book.id]?.progressPercent} />
            ))}
          </div>
          {filteredBooks.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No books found.</p>
          )}
        </section>
      ) : (
        <>
          {/* Continue Reading */}
          {continueBook && (
            <section className="px-6 py-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="section-bullet" />Continue Reading
              </p>
              <Link to={`/reader/${continueBook.book.id}/${continueBook.progress.difficulty}`} className="block">
                <div
                  className="relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-border/40 card-lift"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${continueBook.book.coverColor}22 0%, hsl(var(--card)) 60%)`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="book-paper relative flex h-28 w-20 flex-shrink-0 items-end overflow-hidden rounded-md p-2.5 shadow-lg ring-1 ring-black/5 rotate-[-3deg]"
                      style={{ backgroundColor: continueBook.book.coverColor }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40" />
                      <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
                      <p className="font-japanese relative text-[13px] font-bold leading-tight text-white drop-shadow-sm">
                        {continueBook.book.titleJp}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-lg font-bold leading-snug truncate">{continueBook.book.titleEn}</h2>
                      <p className="text-[12px] text-muted-foreground truncate">{continueBook.book.author}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={continueBook.progress.progressPercent} className="h-1.5 flex-1" />
                        <span className="text-[11px] font-semibold tabular-nums text-foreground/70">
                          {Math.round(continueBook.progress.progressPercent)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-4 w-full rounded-full shadow-md">
                    Resume <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Link>
            </section>
          )}

          {/* Genre sections */}
          {genres.map((genre) => {
            const genreBooks = books.filter((b) => b.genre === genre);
            if (genreBooks.length === 0) return null;
            return (
              <section key={genre} className="py-5">
                <div className="px-6 flex items-baseline justify-between">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {genreLabels[genre]}
                  </h3>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{genreBooks.length} books</span>
                </div>
                <div className="stagger-children mt-4 flex gap-5 overflow-x-auto px-6 pb-3 scrollbar-none">
                  {genreBooks.map((book) => (
                    <BookCard key={book.id} book={book} progress={progress[book.id]?.progressPercent} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
