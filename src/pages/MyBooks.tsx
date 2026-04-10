import { useMemo } from 'react';
import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useFlashcardStore } from '@/stores/flashcards';
import { difficultyConfig } from '@/data/books';
import { formatDistanceToNow, differenceInCalendarDays, startOfDay } from 'date-fns';

export default function MyBooks() {
  const { progress } = useReadingProgressStore();
  const savedWords = useFlashcardStore(s => s.savedWords);

  const startedBooks = books
    .filter((b) => progress[b.id])
    .sort((a, b) => new Date(progress[b.id].lastReadAt).getTime() - new Date(progress[a.id].lastReadAt).getTime());

  const stats = useMemo(() => {
    const entries = Object.values(progress);
    const booksInProgress = entries.filter(p => p.progressPercent > 0 && p.progressPercent < 100).length;
    const booksCompleted = entries.filter(p => p.progressPercent >= 100).length;
    const totalMinutes = entries.reduce((sum, p) => {
      const book = books.find(b => b.id === Object.keys(progress).find(k => progress[k] === p));
      return sum + (book ? Math.round(book.readingTimeMin * (p.progressPercent / 100)) : 0);
    }, 0);

    // Calculate streak
    const readDates = entries
      .map(p => startOfDay(new Date(p.lastReadAt)).getTime())
      .sort((a, b) => b - a);
    const uniqueDates = [...new Set(readDates)];
    let streak = 0;
    const today = startOfDay(new Date()).getTime();
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = today - i * 86400000;
      if (uniqueDates[i] === expected) streak++;
      else break;
    }

    return { booksInProgress, booksCompleted, totalMinutes, streak, wordsSaved: savedWords.length };
  }, [progress, savedWords.length]);

  return (
    <div className="pb-20 px-6 pt-8">
      <h1 className="text-2xl font-bold">My Books</h1>
      <p className="mt-1 text-sm text-muted-foreground">Continue where you left off</p>

      {/* Stats */}
      {startedBooks.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-primary">{stats.streak}</p>
            <p className="text-[9px] text-muted-foreground">Day streak</p>
          </div>
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-accent">{stats.totalMinutes}</p>
            <p className="text-[9px] text-muted-foreground">Min read</p>
          </div>
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-green-600">{stats.wordsSaved}</p>
            <p className="text-[9px] text-muted-foreground">Words</p>
          </div>
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{stats.booksCompleted}</p>
            <p className="text-[9px] text-muted-foreground">Done</p>
          </div>
        </div>
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
