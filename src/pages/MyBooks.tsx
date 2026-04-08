import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';

export default function MyBooks() {
  return (
    <div className="pb-20 px-6 pt-8">
      <h1 className="text-2xl font-bold">My Books</h1>
      <p className="mt-1 text-sm text-muted-foreground">Continue where you left off</p>

      {books.length === 0 ? (
        <div className="mt-20 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No books yet</p>
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
