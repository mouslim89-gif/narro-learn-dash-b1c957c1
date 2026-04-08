import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { difficultyConfig } from '@/data/books';
import { formatDistanceToNow } from 'date-fns';

export default function MyBooks() {
  const { progress } = useReadingProgressStore();

  const startedBooks = books
    .filter((b) => progress[b.id])
    .sort((a, b) => new Date(progress[b.id].lastReadAt).getTime() - new Date(progress[a.id].lastReadAt).getTime());

  return (
    <div className="pb-20 px-6 pt-8">
      <h1 className="text-2xl font-bold">My Books</h1>
      <p className="mt-1 text-sm text-muted-foreground">Continue where you left off</p>

      {startedBooks.length === 0 ? (
        <div className="mt-20 text-center text-muted-foreground">
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
