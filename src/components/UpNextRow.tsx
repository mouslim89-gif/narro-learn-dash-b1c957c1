import { useReadingProgressStore } from "@/stores/reading-progress";
import { books, hasChapters, DEFAULT_CHAPTER_ID } from "@/data/books";
import { BookCard } from "@/components/BookCard";
import { ChevronRight } from "lucide-react";
import { DelayedLink as Link } from "@/components/DelayedLink";

export function UpNextRow() {
  const { progress } = useReadingProgressStore();
  
  // Find books in progress, excluding the very most recent one (which is in the Hero)
  const continueBooks = Object.entries(progress)
    .filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100)
    .sort(([, a], [, b]) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
    .map(([bookId]) => books.find(b => b.id === bookId))
    .filter((b): b is typeof books[number] => Boolean(b))
    .slice(1, 3); // Take the next 2 books

  if (continueBooks.length === 0) return null;

  return (
    <section className="mt-8 px-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="section-bullet" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Up Next</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {continueBooks.map((book) => {
          const bookProgress = progress[book.id];
          return (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              className="flex-shrink-0 flex items-center gap-3 p-2.5 rounded-xl border bg-card ring-1 ring-border/30 shadow-sm w-[200px] card-lift tap-scale"
            >
              <div 
                className="book-paper h-14 w-10 flex-shrink-0 rounded shadow-sm ring-1 ring-black/5"
                style={{ backgroundColor: book.coverColor }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-[13px] font-bold truncate leading-tight">{book.titleEn}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {Math.round(bookProgress.progressPercent)}%
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
