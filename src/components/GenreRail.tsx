import { books, genreLabels, genreKanjis, type Genre } from "@/data/books";
import { BookCard } from "@/components/BookCard";
import { useReadingProgressStore } from "@/stores/reading-progress";

interface GenreRailProps {
  genre: Genre;
}

export function GenreRail({ genre }: GenreRailProps) {
  const { progress } = useReadingProgressStore();
  const genreBooks = books.filter((b) => b.genre === genre);
  
  if (genreBooks.length === 0) return null;

  return (
    <section className="py-6 overflow-hidden">
      <div className="px-6 flex items-end justify-between mb-4 relative">
        <div className="relative">
          <span className="absolute -left-2 -top-4 font-serif text-[44px] text-foreground/[0.07] pointer-events-none select-none" aria-hidden="true">
            {genreKanjis[genre]}
          </span>
          <h3 className="font-serif text-xl font-bold text-foreground relative z-10">
            {genreLabels[genre]}
          </h3>
        </div>
        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border/20">
          {genreBooks.length} books
        </span>
      </div>
      
      <div className="stagger-children flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-none">
        {genreBooks.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            progress={progress[book.id]?.progressPercent} 
          />
        ))}
      </div>
    </section>
  );
}
