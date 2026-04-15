import { useMemo } from 'react';
import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useFlashcardStore } from '@/stores/flashcards';
import { difficultyConfig } from '@/data/books';
import { formatDistanceToNow, differenceInCalendarDays, startOfDay, subDays, format } from 'date-fns';
import { bookTokens } from '@/data/book-tokens';

function StreakCalendar({ readDatesSet }: { readDatesSet: Set<string> }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const key = format(date, 'yyyy-MM-dd');
    const isActive = readDatesSet.has(key);
    const dayLabel = format(date, 'EEE');
    const isToday = i === 29;
    return { key, isActive, dayLabel, date, isToday };
  });

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Last 30 days</p>
      <div className="flex gap-[3px] flex-wrap">
        {days.map((d) => (
          <div
            key={d.key}
            title={format(d.date, 'MMM d')}
            className={`h-3.5 w-3.5 rounded-sm transition-colors ${
              d.isActive
                ? 'bg-primary'
                : 'bg-muted'
            } ${d.isToday ? 'ring-1 ring-primary/50' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function MyBooks() {
  const { progress } = useReadingProgressStore();
  const savedWords = useFlashcardStore(s => s.savedWords);

  const startedBooks = books
    .filter((b) => progress[b.id])
    .sort((a, b) => new Date(progress[b.id].lastReadAt).getTime() - new Date(progress[a.id].lastReadAt).getTime());

  const stats = useMemo(() => {
    const entries = Object.entries(progress);
    const booksInProgress = entries.filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100).length;
    const booksCompleted = entries.filter(([, p]) => p.progressPercent >= 100).length;
    
    // Estimate words read from tokens
    let wordsRead = 0;
    let totalMinutes = 0;
    for (const [bookId, p] of entries) {
      const book = books.find(b => b.id === bookId);
      if (!book) continue;
      totalMinutes += Math.round(book.readingTimeMin * (p.progressPercent / 100));
      const tokens = bookTokens[bookId as keyof typeof bookTokens]?.[p.difficulty as keyof (typeof bookTokens)[keyof typeof bookTokens]];
      if (tokens) {
        const japaneseTokens = (tokens as any[]).filter((t: any) => t.j).length;
        wordsRead += Math.round(japaneseTokens * (p.progressPercent / 100));
      }
    }

    // Calculate streak & read dates
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

    return { booksInProgress, booksCompleted, totalMinutes, streak, wordsSaved: savedWords.length, wordsRead, readDateStrings };
  }, [progress, savedWords.length]);

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Books</h1>
          <p className="mt-1 text-sm text-muted-foreground">Continue where you left off</p>
        </div>
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {startedBooks.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-lg border bg-card p-2.5 text-center">
              <p className="text-lg font-bold text-primary">{stats.streak}</p>
              <p className="text-[9px] text-muted-foreground">Day streak</p>
            </div>
            <div className="rounded-lg border bg-card p-2.5 text-center">
              <p className="text-lg font-bold text-accent">{stats.wordsRead}</p>
              <p className="text-[9px] text-muted-foreground">Words read</p>
            </div>
            <div className="rounded-lg border bg-card p-2.5 text-center">
              <p className="text-lg font-bold text-green-600">{stats.wordsSaved}</p>
              <p className="text-[9px] text-muted-foreground">Saved</p>
            </div>
            <div className="rounded-lg border bg-card p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{stats.booksCompleted}</p>
              <p className="text-[9px] text-muted-foreground">Done</p>
            </div>
          </div>

          <StreakCalendar readDatesSet={stats.readDateStrings} />
        </>
      )}

      {startedBooks.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-muted-foreground">
          <span className="text-5xl mb-4">📖</span>
          <p className="text-lg font-semibold">No books yet</p>
          <p className="text-sm">Start reading from the Library!</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {startedBooks.map((book) => {
            const p = progress[book.id];
            return (
              <div key={book.id} className="flex flex-col gap-1">
                <BookCard book={book} progress={p.progressPercent} />
                <div className="px-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {difficultyConfig[p.difficulty].label} · {formatDistanceToNow(new Date(p.lastReadAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
