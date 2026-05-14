import { useMemo } from 'react';
import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useFlashcardStore } from '@/stores/flashcards';
import { difficultyConfig } from '@/data/books';
import { formatDistanceToNow, startOfDay, format } from 'date-fns';
import { tokenWordCounts } from '@/data/book-tokens';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyBooks() {
  const { progress, getBookProgress } = useReadingProgressStore();
  const savedWords = useFlashcardStore(s => s.savedWords);

  // Build per-book aggregated progress (most-recently-read across chapters).
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
    const booksInProgress = entries.filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100).length;
    const booksCompleted = entries.filter(([, p]) => p.progressPercent >= 100).length;

    // Estimate words read from tokens (per-chapter aware)
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
      {bookProgressList.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'hsl(12 78% 58% / 0.14)' }}>
            <p className="text-lg font-bold" style={{ color: 'hsl(12 78% 48%)' }}>{stats.streak}</p>
            <p className="text-[9px] text-muted-foreground">Day streak</p>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'hsl(168 60% 42% / 0.14)' }}>
            <p className="text-lg font-bold" style={{ color: 'hsl(168 60% 34%)' }}>{stats.wordsRead}</p>
            <p className="text-[9px] text-muted-foreground">Words read</p>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'hsl(258 70% 62% / 0.14)' }}>
            <p className="text-lg font-bold" style={{ color: 'hsl(258 70% 55%)' }}>{stats.wordsSaved}</p>
            <p className="text-[9px] text-muted-foreground">Saved</p>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'hsl(36 85% 55% / 0.16)' }}>
            <p className="text-lg font-bold" style={{ color: 'hsl(36 85% 42%)' }}>{stats.booksCompleted}</p>
            <p className="text-[9px] text-muted-foreground">Done</p>
          </div>
        </div>
      )}

      {bookProgressList.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-muted-foreground">
          <span className="text-5xl mb-4">📖</span>
          <p className="text-lg font-semibold">No books yet</p>
          <p className="text-sm">Start reading from the Library!</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {bookProgressList.map(({ book, progress: p }) => (
            <div key={book.id} className="flex flex-col gap-1">
              <BookCard book={book} progress={p.progressPercent} variant="grid" />
              <div className="px-0.5">
                <p className="text-[10px] text-muted-foreground">
                  {difficultyConfig[p.difficulty].label} · {formatDistanceToNow(new Date(p.lastReadAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
