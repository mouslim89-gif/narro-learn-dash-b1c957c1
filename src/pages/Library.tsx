import { useState, useMemo } from 'react';
import { books, genreLabels, type Genre, jlptColors, difficultyConfig, hasAnyAudio } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Link } from 'react-router-dom';
import { Clock, Headphones, Search, BookOpen, Moon, Sun, Settings, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="pb-24 bg-gradient-warm min-h-screen">
      {/* Header — branded */}
      <header className="px-6 pt-10 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero shadow-hero">
            <span className="font-japanese text-xl font-black text-white drop-shadow">積</span>
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
          </div>
          <div>
            <h1 className="font-display text-[26px] font-black leading-none tracking-tight">Tsundoku</h1>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              積ん読 · stack of unread books
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
          <Link to="/settings" aria-label="Settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Search */}
      <div className="px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or JLPT level…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-sm rounded-full bg-card border-border/60 shadow-soft focus-visible:ring-primary/30"
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
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-3 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Continue reading
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-20 w-14 flex-shrink-0 items-end overflow-hidden rounded p-2 shadow-book"
                      style={{ backgroundColor: continueBook.book.coverColor }}
                    >
                      <p className="font-japanese text-[9px] font-bold leading-tight text-white drop-shadow">{continueBook.book.titleJp}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-base font-bold truncate">{continueBook.book.titleEn}</h2>
                      <p className="text-xs text-muted-foreground">{difficultyConfig[continueBook.progress.difficulty].label}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={continueBook.progress.progressPercent} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{continueBook.progress.progressPercent}%</span>
                      </div>
                    </div>
                    <Button size="sm" className="flex-shrink-0 rounded-full shadow-soft group-hover:gap-2 transition-all">
                      <BookOpen className="h-3.5 w-3.5" /> Resume
                    </Button>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Featured — hero */}
          <section className="px-6 py-4">
            <Link to={`/book/${featured.id}`}>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-hero p-7 shadow-hero">
                {/* shine */}
                <div className="absolute inset-0 hero-shine pointer-events-none" />
                {/* decorative kanji */}
                <span
                  aria-hidden
                  className="font-japanese pointer-events-none absolute -right-6 -top-10 text-[180px] font-black leading-none text-white/[0.06] select-none"
                >
                  本
                </span>

                <div className="relative flex items-start gap-5">
                  <div
                    className="flex h-36 w-[6.5rem] flex-shrink-0 items-end overflow-hidden rounded-md p-3 shadow-book transition-transform group-hover:-translate-y-1 group-hover:rotate-[-2deg]"
                    style={{ backgroundColor: featured.coverColor }}
                  >
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-black/30" />
                    <p className="relative font-japanese text-sm font-bold leading-tight text-white drop-shadow-md">{featured.titleJp}</p>
                  </div>
                  <div className="flex-1 min-w-0 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Featured today
                    </p>
                    <h2 className="mt-1.5 font-display text-2xl font-black tracking-tight text-balance">{featured.titleEn}</h2>
                    <p className="text-xs text-white/70">{featured.author}</p>
                    <p className="mt-2.5 text-sm leading-relaxed text-white/85 line-clamp-2">{featured.synopsis}</p>
                    <div className="mt-3.5 flex items-center gap-2 flex-wrap">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: jlptColors[featured.jlptLevel] }}
                      >
                        {featured.jlptLevel}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-white/70">
                        <Clock className="h-3 w-3" /> {featured.readingTimeMin} min
                      </span>
                      {hasAnyAudio(featured) && (
                        <span className="flex items-center gap-1 text-[11px] text-white/70">
                          <Headphones className="h-3 w-3" /> Audio
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-white/95 transition-transform group-hover:translate-x-0.5">
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </span>
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
              <section key={genre} className="py-4">
                <div className="px-6 mb-1 flex items-baseline justify-between">
                  <h3 className="font-display text-base font-bold tracking-tight">
                    {genreLabels[genre]}
                  </h3>
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {genreBooks.length} {genreBooks.length === 1 ? 'book' : 'books'}
                  </span>
                </div>
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
