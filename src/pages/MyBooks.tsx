import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { BookOpen } from 'lucide-react';

export default function MyBooks() {
  // For now, show all books as "my books" — will be connected to reading progress later
  return (
    <div className="pb-20 px-5 pt-6">
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <BookOpen className="h-6 w-6 text-primary" /> My Books
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Continue where you left off</p>

      {books.length === 0 ? (
        <div className="mt-20 text-center text-muted-foreground">
          <p className="text-lg font-bold">No books yet</p>
          <p className="text-sm">Start reading from the Library!</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
