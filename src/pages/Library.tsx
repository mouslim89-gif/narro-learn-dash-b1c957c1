import { useState, useMemo } from 'react';
import { books, genreLabels, genreAccents, type Genre } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Moon, Sun, Settings } from 'lucide-react';
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
      <header className="library-header-bg relative px-6 pt-10 pb-4 flex items-end justify-between overflow-hidden">
        <span className="library-kanji-watermark" aria-hidden="true">積</span>
        <div className="relative z-10">
          <h1 className="wordmark text-[30px] leading-none text-foreground">Tsundoku</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">Learn Japanese through reading</p>
        </div>
        <div className="relative z-10 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full transition-transform active:scale-90" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full transition-transform active:scale-90">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </Link>
        </div>
      </header>
      <div className="hairline-fade mx-6" />

      {/* Search */}
      <div className="px-6 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
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
            <section className="px-6 py-4">
              <Link to={`/reader/${continueBook.book.id}/${continueBook.progress.difficulty}`}>
                <div
                  className="card-lift relative overflow-hidden rounded-xl ring-1 ring-border/40 p-5 shadow-md"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(168 60% 42% / 0.18), hsl(12 78% 58% / 0.18) 60%, hsl(258 70% 62% / 0.15))',
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/70 mb-3">Continue Reading</p>
                  <div className="flex items-center gap-4">
                    <div
                      className="book-paper relative flex h-20 w-14 flex-shrink-0 items-end overflow-hidden rounded p-2 shadow-md"
                      style={{ backgroundColor: continueBook.book.coverColor }}
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-black/15" />
                      <p className="font-japanese relative text-[9px] font-bold leading-tight text-white drop-shadow-sm">{continueBook.book.titleJp}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-base font-bold truncate">{continueBook.book.titleEn}</h2>
                      <p className="text-[11px] text-muted-foreground truncate">{continueBook.book.author}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={continueBook.progress.progressPercent} className="h-1 flex-1" />
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{continueBook.progress.progressPercent}%</span>
                      </div>
                    </div>
                    <Button size="sm" className="flex-shrink-0 rounded-full">
                      <BookOpen className="mr-1 h-3.5 w-3.5" /> Resume
                    </Button>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Genre sections */}
          {genres.map((genre) => {
            const genreBooks = books.filter((b) => b.genre === genre);
            if (genreBooks.length === 0) return null;
            const accent = genreAccents[genre];
            return (
              <section key={genre} className="py-3">
                <h3
                  className="px-6 text-[13px] font-bold tracking-tight flex items-center"
                  style={{ color: `hsl(${accent})` }}
                >
                  <span
                    className="mr-2 inline-block h-3 w-[3px] rounded-full"
                    style={{ background: `hsl(${accent})` }}
                  />
                  {genreLabels[genre]}
                </h3>
                <div className="stagger-children mt-3 flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-none">
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

