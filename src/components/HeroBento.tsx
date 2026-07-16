import { useReadingProgressStore } from "@/stores/reading-progress";
import { books, hasChapters, DEFAULT_CHAPTER_ID } from "@/data/books";
import { BookCard } from "@/components/BookCard";
import { BookOpen, Flame, Target } from "lucide-react";
import { useFlashcardStore } from "@/stores/flashcards";
import { Progress } from "@/components/ui/progress";
import { DelayedLink as Link } from "@/components/DelayedLink";
import { motion } from "framer-motion";

export function HeroBento() {
  const { progress } = useReadingProgressStore();
  const { dailyGoal, getReviewedTodayCount } = useFlashcardStore();
  
  const reviewsToday = getReviewedTodayCount();
  const goalProgress = Math.min(100, (reviewsToday / dailyGoal) * 100);
  
  // Find the most recently read book that is in progress
  const continueBook = Object.entries(progress)
    .filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100)
    .sort(([, a], [, b]) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
    .map(([bookId]) => books.find(b => b.id === bookId))[0];

  // Fallback to a featured book (e.g., Urashima Taro) if nothing in progress
  const featuredBook = continueBook || books.find(b => b.id === 'urashima') || books[0];
  const bookProgress = continueBook ? progress[continueBook.id] : null;

  return (
    <div className="grid grid-cols-5 gap-3 px-6 mt-2 stagger-children">
      {/* Continue Reading / Featured Pick */}
      <Link 
        to={`/book/${featuredBook.id}`}
        className="col-span-3 relative overflow-hidden rounded-2xl border bg-card ring-1 ring-border/30 shadow-sm p-4 flex flex-col justify-between min-h-[180px] card-lift tap-scale group"
      >
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none" 
          style={{ backgroundColor: featuredBook.coverColor }}
        />
        
        <div className="relative z-10 flex gap-4">
          <div 
            className="book-paper h-24 w-16 flex-shrink-0 rounded-md shadow-md ring-1 ring-black/5 flex items-end p-1.5"
            style={{ backgroundColor: featuredBook.coverColor }}
          >
             <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30"/>
             <span className="font-japanese text-[9px] font-bold text-white leading-tight drop-shadow-sm line-clamp-2">
               {featuredBook.titleJp}
             </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-primary" />
              {continueBook ? 'Continue' : 'Featured'}
            </p>
            <h3 className="font-serif text-lg font-bold leading-tight truncate">{featuredBook.titleEn}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{featuredBook.author}</p>
          </div>
        </div>

        <div className="relative z-10 mt-4">
          {continueBook && bookProgress ? (
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Progress
                </span>
                <span className="text-[11px] font-bold tabular-nums">
                  {Math.round(bookProgress.progressPercent)}%
                </span>
              </div>
              <Progress value={bookProgress.progressPercent} className="h-1.5 reader-progress-track" />
            </div>
          ) : (
             <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm btn-primary-glow">
                Start Reading
                <BookOpen className="w-3 h-3" />
             </div>
          )}
        </div>

        {/* Decorative Watermark */}
        <span className="absolute -bottom-4 -right-2 text-7xl font-serif text-foreground/[0.03] select-none pointer-events-none" aria-hidden="true">
          本
        </span>
      </Link>

      {/* Daily Goal & Streak */}
      <div className="col-span-2 flex flex-col gap-3">
        {/* Goal Card */}
        <Link 
          to="/flashcards"
          className="flex-1 rounded-2xl border bg-card ring-1 ring-border/30 shadow-sm p-3 flex flex-col justify-center items-center text-center card-lift tap-scale"
        >
          <div className="relative h-12 w-12 mb-2">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-muted/20" />
              <motion.circle
                cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent"
                strokeDasharray={88}
                initial={{ strokeDashoffset: 88 }}
                animate={{ strokeDashoffset: 88 - (goalProgress / 100) * 88 }}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today</p>
          <p className="font-serif text-lg font-bold leading-none mt-1">
            {reviewsToday}<span className="text-[10px] font-normal text-muted-foreground">/{dailyGoal}</span>
          </p>
        </Link>

        {/* Streak / Stats Card */}
        <div className="flex-1 rounded-2xl border bg-card ring-1 ring-border/30 shadow-sm p-3 flex flex-col justify-center items-center text-center">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 mb-1">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
          <p className="font-serif text-lg font-bold leading-none mt-1">7 Days</p>
        </div>
      </div>
    </div>
  );
}
