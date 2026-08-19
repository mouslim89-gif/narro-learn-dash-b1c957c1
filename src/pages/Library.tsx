import { useState, useMemo, useRef } from 'react';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { books, genreLabels, type Genre, type Book } from '@/data/books';
import { collections, type Collection } from '@/data/collections';
import { BookCard } from '@/components/BookCard';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { Search, Moon, Sun, Settings, X, Sparkles } from 'lucide-react';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { romajiToKana } from '@/lib/romaji';
import { ContinueHero } from '@/components/library/ContinueHero';
import { PremiumUpsellCard } from '@/components/library/PremiumUpsellCard';

import { cn } from '@/lib/utils';

interface BookRailProps {
  title: string;
  subtitle?: string;
  books: Book[];
  progress: Record<string, any>;
  className?: string;
}

function BookRail({ title, subtitle, books: railBooks, progress, className }: BookRailProps) {
  if (railBooks.length === 0) return null;

  return (
    <section className={cn("py-5 border-t border-border/40 last:border-0", className)}>
      <div className="px-6 mb-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            {title}
          </h3>
          <span className="text-[11px] text-muted-foreground tabular-nums font-medium uppercase tracking-wider">
            {railBooks.length} books
          </span>
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
            {subtitle}
          </p>
        )}
      </div>
      <div className="stagger-children flex gap-5 overflow-x-auto px-6 pb-3 scrollbar-none">
        {railBooks.map((book) => (
          <BookCard key={book.id} book={book} progress={progress[book.id]?.progressPercent} />
        ))}
      </div>
    </section>
  );
}


export default function Library() {
 const [search, setSearch] = useState('');
 const { progress, darkMode, setDarkMode } = useReadingProgressStore();
 const headerRef = useRef<HTMLElement>(null);
 useScrollProgress(headerRef, 0, 64);

 // Find books in progress, most recently read first
 const continueBooks = useMemo(() => {
   const inProgress = Object.entries(progress)
     .filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100)
     .sort(([, a], [, b]) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
   
   return inProgress.map(([id, p]) => {
     const bookId = id.includes('__') ? id.split('__')[0] : id;
     const book = books.find(b => b.id === bookId);
     return book ? { book, progress: p, id } : null;
   }).filter((item): item is NonNullable<typeof item> => Boolean(item));
 }, [progress]);

 const heroBook = continueBooks[0];
 

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
 paddingTop: 'calc(max(48px, env(safe-area-inset-top)) - var(--p, 0) * 36px)',
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
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip"onClick={() => setDarkMode(!darkMode)}>
 {darkMode ? <Sun className="h-[18px] w-[18px]"/> : <Moon className="h-[18px] w-[18px]"/>}
 </Button>
 <Link to="/settings">
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
 <Settings className="h-[18px] w-[18px]"/>
 </Button>
 </Link>
      </div>
    </header>

 {/* Search */}
 <div className="px-6 pt-1 pb-3">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
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
 <X className="h-3.5 w-3.5"/>
 </button>
 )}
 </div>
 </div>

 {/* Search results */}
 {filteredBooks ? (
 <section className="px-6 py-4">
 <p className="mb-3 text-xs text-muted-foreground">{filteredBooks.length} result{filteredBooks.length !== 1 ?'s':''}</p>
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
  {/* Hero Section */}
  {heroBook ? (
    <ContinueHero 
      book={heroBook.book} 
      progressPercent={heroBook.progress.progressPercent}
      difficulty={heroBook.progress.difficulty}
      chapterId={heroBook.id.includes('__') ? heroBook.id.split('__')[1] : undefined}
    />
  ) : (
    <section className="px-6 mb-8">
      <Link
        to={`/book/${books[0].id}`}
        className="block group relative overflow-hidden rounded-3xl border border-border/30 bg-card p-5 shadow-sm card-lift"
        style={{ 
          backgroundImage: `linear-gradient(135deg, ${books[0].coverColor}18 0%, hsl(var(--card)) 60%)` 
        }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold">Start your first story</h3>
            <p className="text-sm text-muted-foreground">Pick a book from the collection below</p>
          </div>
        </div>
      </Link>
    </section>
  )}


  {/* Layout structure: Mixed Genre and Collections */}
  <BookRail 
    title={collections[0].title} 
    subtitle={collections[0].subtitle} 
    books={books.filter(collections[0].match)} 
    progress={progress} 
  />
  
  <PremiumUpsellCard />

  <BookRail 

    title={genreLabels['folk-tales']} 
    books={books.filter(b => b.genre === 'folk-tales')} 
    progress={progress} 
  />

  <BookRail 
    title={genreLabels['historical']} 
    books={books.filter(b => b.genre === 'historical')} 
    progress={progress} 
  />

  <BookRail 
    title={collections[1].title} 
    subtitle={collections[1].subtitle} 
    books={books.filter(collections[1].match)} 
    progress={progress} 
  />

  <BookRail 
    title={genreLabels['psychological']} 
    books={books.filter(b => b.genre === 'psychological')} 
    progress={progress} 
  />

  <BookRail 
    title={genreLabels['surreal']} 
    books={books.filter(b => b.genre === 'surreal')} 
    progress={progress} 
  />

  <BookRail 
    title={genreLabels['gothic']} 
    books={books.filter(b => b.genre === 'gothic')} 
    progress={progress} 
  />

  <BookRail 
    title={genreLabels['slice-of-life']} 
    books={books.filter(b => b.genre === 'slice-of-life')} 
    progress={progress} 
  />

  <BookRail 
    title={collections[2].title} 
    subtitle={collections[2].subtitle} 
    books={books.filter(collections[2].match)} 
    progress={progress} 
  />

  </>
 )}
 </div>
 );
}
