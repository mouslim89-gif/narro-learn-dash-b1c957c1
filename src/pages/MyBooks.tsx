import { useMemo } from'react';
import { books } from'@/data/books';
import { useReadingProgressStore } from'@/stores/reading-progress';
import { useFlashcardStore } from'@/stores/flashcards';
import { startOfDay, format } from'date-fns';
import { tokenWordCounts } from'@/data/book-tokens';
import { Link } from'react-router-dom';
import { Settings, Flame, BookOpen, Bookmark, Trophy } from'lucide-react';
import { Button } from'@/components/ui/button';
import { AnimatedTitle } from'@/components/AnimatedTitle';
import { BookShelfRow } from'@/components/my-books/BookShelfRow';
import { useDelayed } from'@/hooks/use-delayed';

export default function MyBooks() {
 const { progress, getBookProgress } = useReadingProgressStore();
 const savedWords = useFlashcardStore(s => s.savedWords);
 const showEmpty = useDelayed(300);

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
 <header className="relative px-6 pt-10 pb-2 flex items-end justify-between">
 <div>
 <AnimatedTitle text="My Books"className="font-serif text-[34px] font-bold leading-none tracking-tight"/>
 <p className="mt-2 text-[12px] tracking-[0.08em] text-muted-foreground">
 <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2"/>
 Continue where you left off
 </p>
 </div>
 <Link to="/settings">
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40">
 <Settings className="h-[18px] w-[18px]"/>
 </Button>
 </Link>
 </header>

 <div className="px-6">
 {bookProgressList.length > 0 && (
 <div className="stagger-children mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
 {STAT_TILES.map(({ key, value, label, Icon, tint }) => (
 <div
 key={key}
 className="relative overflow-hidden rounded-xl border bg-card p-4 card-lift"
 style={{ backgroundImage:`linear-gradient(140deg, hsl(${tint} / 0.14) 0%, hsl(var(--card)) 60%)`}}
 >
 <Icon className="h-4 w-4"style={{ color:`hsl(${tint})`}} />
 <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
 <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
 </div>
 ))}
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
