import { Link } from'react-router-dom';
import { Headphones } from'lucide-react';
import { formatDistanceToNow } from'date-fns';
import type { Book } from'@/data/books';
import { difficultyConfig, hasAnyAudio } from'@/data/books';
import { Progress } from'@/components/ui/progress';
import type { ReadingProgress } from'@/stores/reading-progress';

export function BookShelfRow({ book, progress }: { book: Book; progress: ReadingProgress }) {
 const done = progress.progressPercent >= 100;
 return (
 <Link
 to={`/book/${book.id}`}
 className="group block rounded-xl border bg-card p-3 ring-1 ring-border/30 card-lift tap-scale"
 style={{ backgroundImage:`linear-gradient(110deg, ${book.coverColor}14 0%, hsl(var(--card)) 50%)`}}
 >
 <div className="flex items-center gap-4">
 <div
 className="book-paper relative flex h-24 w-16 flex-shrink-0 items-end overflow-hidden rounded-md p-2 shadow-md ring-1 ring-black/5"
 style={{ backgroundColor: book.coverColor }}
 >
 <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40"/>
 <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20"/>
 <p className="font-japanese relative text-[11px] font-bold leading-tight text-white drop-shadow-sm">{book.titleJp}</p>
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-2">
 <h3 className="font-serif text-[15px] font-semibold leading-snug truncate">{book.titleEn}</h3>
 {done && (
 <span className="flex-shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
 Done
 </span>
 )}
 </div>
 <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
 <div className="mt-2 flex items-center gap-2">
 <span className="text-[10px] font-semibold text-foreground/70 truncate">{difficultyConfig[progress.difficulty].label}</span>
 {hasAnyAudio(book) && <Headphones className="h-3 w-3 text-muted-foreground"/>}
 </div>
 <div className="mt-2 flex items-center gap-2">
 <Progress value={progress.progressPercent} className="h-1.5 flex-1"/>
 <span className="text-[10px] font-semibold tabular-nums text-foreground/70">{Math.round(progress.progressPercent)}%</span>
 </div>
 <p className="mt-1 text-[10px] text-muted-foreground">
 {formatDistanceToNow(new Date(progress.lastReadAt), { addSuffix: true })}
 </p>
 </div>
 </div>
 </Link>
 );
}
