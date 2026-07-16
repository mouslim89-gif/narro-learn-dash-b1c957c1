import { useState, useMemo, useRef } from 'react';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { genreLabels, type Genre } from '@/data/books';
import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { Search, Moon, Sun, Settings, X } from 'lucide-react';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { romajiToKana } from '@/lib/romaji';
import { HeroBento } from '@/components/HeroBento';
import { UpNextRow } from '@/components/UpNextRow';
import { GenreRail } from '@/components/GenreRail';

const genres = Object.keys(genreLabels) as Genre[];

export default function Library() {
  const [search, setSearch] = useState('');
  const { progress, darkMode, setDarkMode } = useReadingProgressStore();
  const headerRef = useRef<HTMLElement>(null);
  useScrollProgress(headerRef, 0, 64);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const kana = romajiToKana(q);
    return books.filter(
      b => b.titleEn.toLowerCase().includes(q) || b.titleJp.includes(q) || b.author.toLowerCase().includes(q) || (kana ? b.titleJp.includes(kana) : false)
    );
  }, [search]);

  return (
    <div className="pb-20">
      <header
        ref={headerRef}
        className="library-header-bg sticky top-0 z-30 px-6 flex items-center justify-between overflow-hidden"
        style={{
          paddingTop: 'calc(48px - var(--p, 0) * 36px)',
          paddingBottom: 'calc(24px - var(--p, 0) * 16px)',
          backgroundColor: 'hsl(var(--background) / calc(var(--p, 0) * 0.85))',
          backdropFilter: 'blur(calc(var(--p, 0) * 16px))',
          WebkitBackdropFilter: 'blur(calc(var(--p, 0) * 16px))',
          borderBottom: '1px solid hsla(var(--border) / calc(var(--p, 0) * 0.5))',
          borderBottomColor: 'hsla(var(--border) / calc(var(--p, 0) * 0.5))',
          borderBottomWidth: 'calc(min(var(--p, 0), 1) * 1px)',
        }}
      >
        <div className="relative z-10 min-w-0">
          <AnimatedTitle
            text="Tsundoku"
            className="wordmark font-serif font-bold tracking-tight leading-none text-foreground"
            style={{ 
              '--title-scale': 'calc(1 - var(--p, 0) * 0.429)', 
              fontSize: '42px'
            } as any}
          />
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </Link>
        </div>
      </header>

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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground smooth-colors tap-scale-sm"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredBooks ? (
        <section className="px-6 py-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}
          </p>
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
        <div className="stagger-children">
          <HeroBento />
          <UpNextRow />
          
          <div className="mt-4">
            {genres.map((genre) => (
              <GenreRail key={genre} genre={genre} />
            ))}
          </div>
          
          <footer className="py-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
              Tsundoku v1.2 • {books.length} Books
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}
