import { useMemo, useRef } from 'react';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { books } from '@/data/books';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useFlashcardStore } from '@/stores/flashcards';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { Settings, Flame, BookOpen, Bookmark, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { ContributionGraph } from '@/components/my-books/ContributionGraph';
import { useDelayed } from '@/hooks/use-delayed';
import { StatsStrip } from '@/components/my-books/StatsStrip';
import { ShelfSection } from '@/components/my-books/ShelfSection';
import { MilestonesRow } from '@/components/my-books/MilestonesRow';
import { BookShelfRow } from '@/components/my-books/BookShelfRow';
import { startOfDay, format } from 'date-fns';
import { tokenWordCounts } from '@/data/book-tokens';

export default function MyBooks() {
  const { progress, getBookProgress } = useReadingProgressStore();
  const savedWords = useFlashcardStore(s => s.savedWords);
  const showEmpty = useDelayed(300);
  const headerRef = useRef<HTMLElement>(null);
  useScrollProgress(headerRef, 0, 56);

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
      readDateStrings.add(format(new Date(p.lastReadAt), 'yyyy-MM-dd'));
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

  const bookGroups = useMemo(() => {
    const reading: any[] = [];
    const finished: any[] = [];
    const notStarted: any[] = [];

    const openedIds = new Set(Object.keys(progress).map(k => k.includes('__') ? k.split('__')[0] : k));

    for (const book of books) {
      const p = getBookProgress(book.id);
      if (!p || p.progressPercent === 0) {
        notStarted.push({ book, progress: p });
      } else if (p.progressPercent >= 100) {
        finished.push({ book, progress: p });
      } else {
        reading.push({ book, progress: p });
      }
    }

    // Sort reading/finished by last read date
    const sortByDate = (a: any, b: any) => {
      const dateA = a.progress ? new Date(a.progress.lastReadAt).getTime() : 0;
      const dateB = b.progress ? new Date(b.progress.lastReadAt).getTime() : 0;
      return dateB - dateA;
    };

    reading.sort(sortByDate);
    finished.sort(sortByDate);
    
    return { reading, finished, notStarted };
  }, [progress, getBookProgress]);

  const hasAnyProgress = bookGroups.reading.length > 0 || bookGroups.finished.length > 0;

  return (
    <div className="pb-24">
      <header
        ref={headerRef}
        className="sticky top-0 z-30 px-6 flex items-center justify-between"
        style={{
          paddingTop: 'calc(40px - var(--p, 0) * 28px)',
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
            className="font-serif font-bold leading-none tracking-tight"
            style={{ 
              '--title-scale': 'calc(1 - var(--p, 0) * 0.25)', 
              fontSize: '32px'
            } as any}
          />
        </div>
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
            <Settings className="h-[18px] w-[18px]"/>
          </Button>
        </Link>
      </header>

      <div className="px-6 space-y-8 mt-4">
        {/* Stats Strip */}
        <StatsStrip 
          streak={stats.streak} 
          wordsRead={stats.wordsRead} 
          wordsSaved={stats.wordsSaved} 
          booksDone={stats.booksCompleted} 
        />

        {/* Empty state (only if nothing started) */}
        {!hasAnyProgress && (
          <div className={`py-8 flex flex-col items-center text-center transition-opacity duration-200 ${showEmpty ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <BookOpen className="h-9 w-9 text-primary"/>
            </div>
            <p className="mt-5 font-serif text-lg font-semibold">Your bookshelf is empty</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-[240px]">Pick up a story from the Library to get started.</p>
            <Link to="/" className="mt-5">
              <Button size="sm" className="rounded-full px-5">Browse Library</Button>
            </Link>
          </div>
        )}

        {/* Shelf Sections */}
        <div className="space-y-10">
          <ShelfSection 
            title="Currently Reading" 
            count={bookGroups.reading.length} 
            items={bookGroups.reading} 
            variant="reading"
          />
          
          <ShelfSection 
            title="Finished" 
            count={bookGroups.finished.length} 
            items={bookGroups.finished} 
            variant="finished"
          />

          <ShelfSection 
            title="Not Started" 
            count={bookGroups.notStarted.length} 
            items={bookGroups.notStarted} 
            variant="unread"
          />
        </div>

        {/* Reading activity */}
        {hasAnyProgress && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Reading Activity</h3>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
              <ContributionGraph readDateStrings={stats.readDateStrings} />
            </div>
          </section>
        )}

        {/* Milestones */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Milestones</h3>
          </div>
          <MilestonesRow 
            streak={stats.streak}
            wordsRead={stats.wordsRead}
            wordsSaved={stats.wordsSaved}
            booksDone={stats.booksCompleted}
            progress={progress}
          />
        </section>
      </div>
    </div>
  );
}
