import { useState, useMemo } from'react';
import { books, genreLabels, type Genre } from'@/data/books';
import { BookCard } from'@/components/BookCard';
import { Link } from'react-router-dom';
import { Search, Moon, Sun, Settings, X } from'lucide-react';
import { useReadingProgressStore } from'@/stores/reading-progress';
import { Input } from'@/components/ui/input';
import { Button } from'@/components/ui/button';
import { AnimatedTitle } from'@/components/AnimatedTitle';
import { romajiToKana } from'@/lib/romaji';
import { useScrollProgress } from'@/hooks/use-scroll-progress';

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (a: number, b: number, p: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const genres = Object.keys(genreLabels) as Genre[];

export default function Library() {
 const [search, setSearch] = useState('');
 const { progress, darkMode, setDarkMode } = useReadingProgressStore();
 const p = useScrollProgress(0, 90);
 const largeOpacity = 1 - smooth(0.3, 0.65, p);
 const largeScale = lerp(1, 0.5, p);
 const smallOpacity = smooth(0.45, 0.85, p);
 const headerPt = lerp(48, 10, p);
 const headerPb = lerp(24, 10, p);
 const headerBgAlpha = smooth(0.05, 0.85, p) * 0.92;
 const watermarkOpacity = Math.max(0, 1 - p * 1.6);

 // Find most recently read book
 // Find books in progress, most recently read first
 const continueBooks = useMemo(() => {
 return Object.entries(progress)
 .filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100)
 .sort(([, a], [, b]) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
 .map(([bookId]) => books.find(b => b.id === bookId))
 .filter((b): b is typeof books[number] => Boolean(b));
 }, [progress]);

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
 <header className="library-header-bg relative px-6 pt-12 pb-6 flex items-end justify-between overflow-hidden">
 <span className="library-kanji-watermark"aria-hidden="true">積</span>
 <div className="relative z-10">
         <AnimatedTitle text="Tsundoku"className="wordmark font-serif font-bold tracking-tight text-[42px] md:text-[48px] leading-none text-foreground"/>
 </div>
 <div className="relative z-10 flex items-center gap-2">
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40"onClick={() => setDarkMode(!darkMode)}>
 {darkMode ? <Sun className="h-[18px] w-[18px]"/> : <Moon className="h-[18px] w-[18px]"/>}
 </Button>
 <Link to="/settings">
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40">
 <Settings className="h-[18px] w-[18px]"/>
 </Button>
 </Link>
 </div>
 </header>
 <div className="bg-gradient-to-b from-transparent to-background h-6 -mt-6 relative z-0"/>

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
 {/* Continue Reading */}
 {continueBooks.length > 0 && (
 <section className="py-5">
 <div className="px-6 flex items-baseline justify-between">
 <h3 className="font-serif text-lg font-semibold text-foreground">
 Continue Reading
 </h3>
 <span className="text-[11px] text-muted-foreground tabular-nums">
 {continueBooks.length} book{continueBooks.length !== 1 ?'s':''}
 </span>
 </div>
 <div className="stagger-children mt-4 flex gap-5 overflow-x-auto px-6 pb-3 scrollbar-none">
 {continueBooks.map((book) => (
 <BookCard key={book.id} book={book} progress={progress[book.id]?.progressPercent} />
 ))}
 </div>
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
