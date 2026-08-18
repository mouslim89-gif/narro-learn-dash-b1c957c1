import { useMemo, useRef } from'react';
import { useScrollProgress } from'@/hooks/use-scroll-progress';

import { books } from'@/data/books';
import { useReadingProgressStore } from'@/stores/reading-progress';

import { useFlashcardStore } from'@/stores/flashcards';
import { startOfDay, format } from'date-fns';
import { tokenWordCounts } from'@/data/book-tokens';
import { DelayedLink as Link } from'@/components/DelayedLink';
import { Settings, Flame, BookOpen, Bookmark, Trophy } from'lucide-react';
import { Button } from'@/components/ui/button';

import { AnimatedTitle } from'@/components/AnimatedTitle';
import { BookShelfRow } from'@/components/my-books/BookShelfRow';
import { ContributionGraph } from '@/components/my-books/ContributionGraph';
import { useDelayed } from'@/hooks/use-delayed';


export default function MyBooks() {


 const { progress, getBookProgress } = useReadingProgressStore();
  const savedWords = useFlashcardStore(s => s.savedWords);

 const showEmpty = useDelayed(300);
 const headerRef = useRef<HTMLElement>(null);
 useScrollProgress(headerRef, 0, 56);

 const bookProgressList = useMemo(() => {
 const list: { book: typeof books[number]; progress: NonNullable<ReturnType<typeof getBookProgress>> }[] = [];
 for (const b of books) {
 const p = getBookProgress(b.id);
 if (p) list.push({ book: b, progress: p });
 }
 list.sort((a, b) => new Date(b.progress.lastReadAt).getTime() - new Date(a.progress.lastReadAt).getTime());
 return list;
 }, [progress]);

 const stats = useMemo(() => {
 const entries = Object.entries(progress);
 const booksCompleted = entries.filter(([, p]) => p.progressPercent >= 100).length;

 let wordsRead = 0;
 let totalMinutes = 0;
 for (const [key, p] of entries) {
 const bookId = key.includes('__') ? key.split('__')[0] : key;
 const book = books.find(b => b.id === bookId);
 if (!book) continue;
 totalMinutes += Math.round(book.readingTimeMin * (p.progressPercent / 100));
 const tokenCount = tokenWordCounts[key]?.[p.difficulty] ?? tokenWordCounts[bookId]?.[p.difficulty] ?? 0;
 wordsRead += Math.round(tokenCount * (p.progressPercent / 100));
 }

 const readDateStrings = new Set<string>();
 for (const [, p] of entries) {
 readDateStrings.add(format(new Date(p.lastReadAt),'yyyy-MM-dd'));
 }

 const readDates = entries
 .map(([, p]) => startOfDay(new Date(p.lastReadAt)).getTime())
 .sort((a, b) => b - a);
 const uniqueDates = [...new Set(readDates)];
 let streak = 0;
 const today = startOfDay(new Date()).getTime();
 for (let i = 0; i < uniqueDates.length; i++) {
 const expected = today - i * 86400000;
 if (uniqueDates[i] === expected) streak++;
 else break;
 }

 return { booksCompleted, totalMinutes, streak, wordsSaved: savedWords.length, wordsRead, readDateStrings };
 }, [progress, savedWords.length]);

 const STAT_TILES = [
 { key:'streak', value: stats.streak, label:'Day streak', Icon: Flame, tint:'36 80% 60%'},
 { key:'words', value: stats.wordsRead, label:'Words read', Icon: BookOpen, tint:'180 50% 45%'},
 { key:'saved', value: stats.wordsSaved, label:'Words saved', Icon: Bookmark, tint:'270 45% 60%'},
 { key:'completed', value: stats.booksCompleted, label:'Books done', Icon: Trophy, tint:'40 90% 55%'},
 ];

 return (
 <div className="pb-20">
 <header
 ref={headerRef}
 className="sticky top-0 z-30 px-6 flex items-center justify-between"
  style={{
    paddingTop: 'calc(var(--header-top) + 20px - var(--p, 0) * 16px)',
    paddingBottom: 'calc(8px + var(--p, 0) * 4px)',
 backgroundColor: 'hsl(var(--background) / calc(var(--p, 0) * 0.85))',
 backdropFilter: 'blur(calc(var(--p, 0) * 16px))',
 WebkitBackdropFilter: 'blur(calc(var(--p, 0) * 16px))',
 borderBottom: '1px solid hsl(var(--border) / calc(var(--p, 0) * 0.5))',
 }}
 >
 <div className="min-w-0">
         <AnimatedTitle
 text="My Books"
 className="font-serif font-bold leading-[1.05] tracking-tight"
 style={{ 
    '--title-scale': 'calc(1 - var(--p, 0) * 0.25)', 
    fontSize: '32px'
 } as any}
 />
 </div>
 <Link to="/settings">
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
 <Settings className="h-[18px] w-[18px]"/>
 </Button>
 </Link>
 </header>

  <div className="px-6 pb-6">
  {bookProgressList.length > 0 && (
  <div className="stagger-children mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
  {STAT_TILES.map(({ key, value, label, Icon, tint }) => (
  <div
  key={key}
  className="relative overflow-hidden rounded-2xl border border-border/40 bg-card bg-clip-padding p-5 shadow-sm card-lift ring-1 ring-border/5"
  style={{ backgroundImage:`linear-gradient(140deg, hsl(${tint} / 0.14) 0%, hsl(var(--card)) 60%)`}}
  >
  <div className="flex items-center justify-between">
    <Icon className="h-4 w-4"style={{ color:`hsl(${tint})`}} />
  </div>
  <p className="mt-4 text-3xl font-bold tabular-nums text-foreground tracking-tight">{value}</p>
  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">{label}</p>
  </div>
  ))}
  </div>
  )}

  {bookProgressList.length > 0 && (
    <div className="mt-6">
      <ContributionGraph readDateStrings={stats.readDateStrings} />
    </div>
  )}

  {bookProgressList.length === 0 ? (
 <div className={`mt-24 flex flex-col items-center text-center transition-opacity duration-200 ${showEmpty ?'opacity-100':'opacity-0'}`}>
 <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
 <BookOpen className="h-9 w-9 text-primary"/>
 </div>
 <p className="mt-5 font-serif text-lg font-semibold">Your bookshelf is empty</p>
 <p className="mt-1 text-sm text-muted-foreground">Pick up a story from the Library to get started.</p>
 <Link to="/"className="mt-5">
 <Button size="sm"className="rounded-full px-5">Browse Library</Button>
 </Link>
 </div>
 ) : (
 <div className="stagger-children mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
 {bookProgressList.map(({ book, progress: p }) => (
 <BookShelfRow key={book.id} book={book} progress={p} />
 ))}
  </div>
  )}




 </div>
 </div>
 );
}
