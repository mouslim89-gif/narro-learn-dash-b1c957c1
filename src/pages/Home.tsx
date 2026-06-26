import { useMemo, useRef } from 'react';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { useFlashcardStore } from '@/stores/flashcards';
import { books } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { ContributionGraph } from '@/components/my-books/ContributionGraph';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Layers, Flame, Trophy, ChevronRight, Settings, Sun, Moon } from 'lucide-react';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function Home() {
  const { progress, darkMode, setDarkMode } = useReadingProgressStore();
  const { savedWords, getDueCount, getReviewedTodayCount, dailyGoal, history } = useFlashcardStore();
  const headerRef = useRef<HTMLElement>(null);
  useScrollProgress(headerRef, 0, 64);

  const readDateStrings = useMemo(() => {
    const dates = new Set<string>();
    Object.values(progress).forEach(p => {
      dates.add(format(new Date(p.lastReadAt), 'yyyy-MM-dd'));
    });
    return dates;
  }, [progress]);


  // Find most recently read book
  const lastReadBook = useMemo(() => {
    const sorted = Object.entries(progress)
      .filter(([, p]) => p.progressPercent > 0 && p.progressPercent < 100)
      .sort(([, a], [, b]) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
    
    if (sorted.length === 0) return null;
    
    const [idWithChapter] = sorted[0];
    const bookId = idWithChapter.split('__')[0];
    const book = books.find(b => b.id === bookId);
    if (!book) return null;
    
    return {
      ...book,
      percent: progress[idWithChapter].progressPercent,
      chapterId: progress[idWithChapter].chapterId,
      difficulty: progress[idWithChapter].difficulty,
    };
  }, [progress]);

  const dueCount = getDueCount();
  const reviewedToday = getReviewedTodayCount();
  
  // Calculate streak from history
  const streak = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if user has reviewed today or yesterday to maintain streak
    const hasActivityToday = sortedHistory[0]?.date === today;
    const hasActivityYesterday = sortedHistory.some(h => h.date === yesterday);
    
    if (!hasActivityToday && !hasActivityYesterday) return 0;
    
    let lastDate = new Date(hasActivityToday ? today : yesterday);
    
    for (const entry of sortedHistory) {
      const entryDate = new Date(entry.date);
      const diffDays = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak++;
        lastDate = entryDate;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [history]);

  return (
    <div className="pb-28">
      <header
        ref={headerRef}
        className="sticky top-0 z-30 px-6 flex items-center justify-between overflow-hidden"
        style={{
          paddingTop: 'calc(48px - var(--p, 0) * 36px)',
          paddingBottom: 'calc(24px - var(--p, 0) * 16px)',
          backgroundColor: 'hsl(var(--background) / calc(var(--p, 0) * 0.85))',
          backdropFilter: 'blur(calc(var(--p, 0) * 16px))',
          WebkitBackdropFilter: 'blur(calc(var(--p, 0) * 16px))',
          borderBottom: '1px solid hsla(var(--border) / calc(var(--p, 0) * 0.5))',
          borderBottomWidth: 'calc(min(var(--p, 0), 1) * 1px)',
        }}
      >
        <div className="relative z-10 min-w-0">
          <AnimatedTitle
            text="Tsundoku"
            className="wordmark font-serif font-bold tracking-tight leading-none text-foreground"
            style={{ 
              '--title-scale': 'calc(1 - var(--p, 0) * 0.429)', 
              fontSize: '42px'
            } as any}
          />
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-[18px] w-[18px]"/> : <Moon className="h-[18px] w-[18px]"/>}
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
              <Settings className="h-[18px] w-[18px]"/>
            </Button>
          </Link>
        </div>
      </header>

      <main className="px-6 pt-4 stagger-children">
        {/* Hero: Continue Reading */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold">Continue Reading</h2>
            <Link to="/my-books" className="text-xs text-primary font-medium flex items-center gap-0.5">
              All books <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          {lastReadBook ? (
            <Link 
              to={`/reader/${lastReadBook.id}/${lastReadBook.difficulty}${lastReadBook.chapterId && lastReadBook.chapterId !== 'main' ? `/${lastReadBook.chapterId}` : ''}`}
              className="group block relative overflow-hidden rounded-3xl border border-border/40 bg-card p-5 transition-all hover:border-primary/20 active:scale-[0.98]"
            >
              <div className="flex gap-5">
                <div 
                  className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5"
                  style={{ backgroundColor: lastReadBook.coverColor }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute inset-x-2 bottom-3">
                    <p className="font-jp-serif text-[10px] leading-tight text-white/90 line-clamp-3">
                      {lastReadBook.titleJp}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h3 className="text-lg font-bold leading-tight truncate">{lastReadBook.titleEn}</h3>
                  <p className="text-sm text-muted-foreground truncate mb-4">{lastReadBook.author}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-primary">{lastReadBook.percent}%</span>
                    </div>
                    <Progress value={lastReadBook.percent} className="h-1.5" />
                  </div>
                </div>
                
                <div className="flex items-center justify-center pl-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 p-8 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-4">You haven't started any books yet.</p>
              <Link to="/">
                <Button variant="outline" size="sm" className="rounded-full px-6">
                  Browse Library
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-serif font-bold mb-4">Today's Focus</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/flashcards"
              className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-card p-5 transition-all hover:border-primary/20 active:scale-[0.98]"
            >
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[22px] font-bold leading-none">{dueCount}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Due Today</p>
              </div>
            </Link>
            
            <Link 
              to="/flashcards"
              className="flex flex-col gap-3 rounded-3xl border border-border/40 bg-card p-5 transition-all hover:border-primary/20 active:scale-[0.98]"
            >
              <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[22px] font-bold leading-none">{streak}d</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Streak</p>
              </div>
            </Link>

            <div className="col-span-2 flex items-center justify-between rounded-3xl border border-border/40 bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Daily Goal</p>
                  <p className="text-xs text-muted-foreground">{reviewedToday} / {dailyGoal} cards</p>
                </div>
              </div>
              <div className="relative h-12 w-12 flex items-center justify-center">
                <svg className="h-12 w-12 -rotate-90 transform">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 * (1 - Math.min(reviewedToday / dailyGoal, 1))}
                    strokeLinecap="round"
                    className="text-amber-500 transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold">{Math.round((reviewedToday / dailyGoal) * 100)}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Activity Graph */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold">Activity</h2>
          </div>
          <div className="rounded-3xl border border-border/40 bg-card p-5">
            <ContributionGraph readDateStrings={readDateStrings} />
          </div>
        </section>
      </main>
    </div>
  );
}
