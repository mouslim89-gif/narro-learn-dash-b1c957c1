import { useState, useMemo } from 'react';
import { books, genreLabels, type Genre, jlptColors, difficultyConfig, hasAnyAudio } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Link } from 'react-router-dom';
import { Clock, Headphones, Search, BookOpen, Moon, Sun, Settings } from 'lucide-react';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const genres = Object.keys(genreLabels) as Genre[];

export default function Library() {
  const [search, setSearch] = useState('');
  const { progress, darkMode, setDarkMode } = useReadingProgressStore();
  const featured = books[0];

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
      b => b.titleEn.toLowerCase().includes(q) || b.titleJp.includes(q) || b.author.toLowerCase().includes(q) || b.jlptLevel.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="pb-20">
      <header className="px-6 pt-10 pb-3 flex items-end justify-between">
        <div>
          <h1 className="wordmark text-[28px] leading-none text-foreground">Tsundoku</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">Learn Japanese through reading</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Search */}
      <div className="px-6 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or JLPT level…"
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
                <div className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Continue Reading</p>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-20 w-14 flex-shrink-0 items-end rounded p-2 shadow-md"
                      style={{ backgroundColor: continueBook.book.coverColor }}
                    >
                      <p className="font-japanese text-[9px] font-bold leading-tight text-white">{continueBook.book.titleJp}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-base font-bold truncate">{continueBook.book.titleEn}</h2>
                      <p className="text-xs text-muted-foreground">{difficultyConfig[continueBook.progress.difficulty].label}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={continueBook.progress.progressPercent} className="h-1 flex-1" />
                        <span className="text-[10px] font-medium text-muted-foreground">{continueBook.progress.progressPercent}%</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      <BookOpen className="mr-1 h-3.5 w-3.5" /> Resume
                    </Button>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Featured */}
          <section className="px-6 py-4">
            <Link to={`/book/${featured.id}`}>
              <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start gap-5">
                  <div
                    className="flex h-32 w-24 flex-shrink-0 items-end rounded p-3 shadow-md"
                    style={{ backgroundColor: featured.coverColor }}
                  >
                    <p className="font-japanese text-sm font-bold leading-tight text-white">{featured.titleJp}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Featured</p>
                    <h2 className="mt-1 font-serif text-xl font-bold">{featured.titleEn}</h2>
                    <p className="text-xs text-muted-foreground">{featured.author}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{featured.synopsis}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: jlptColors[featured.jlptLevel] }}>
                        {featured.jlptLevel}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {featured.readingTimeMin} min
                      </span>
                      {hasAnyAudio(featured) && (
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
