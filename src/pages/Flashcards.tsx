import { useState, useMemo } from 'react';
import { useFlashcardStore } from '@/stores/flashcards';
import { Trash2, Search, ArrowUpDown, Settings, Sparkles, Flame, GraduationCap, CheckCircle2, X, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlayWordButton } from '@/components/PlayWordButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlashcardReview } from '@/components/FlashcardReview';
import { formatInterval } from '@/lib/srs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'due' | 'new' | 'learning' | 'known';
type SortOption = 'added' | 'mastery';

function masteryLevel(m: number): 'new' | 'learning' | 'known' {
  if (m <= 0) return 'new';
  if (m <= 2) return 'learning';
  return 'known';
}

const LEVEL_BAR: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-amber-500',
  learning: 'bg-sky-500',
  known: 'bg-emerald-500',
};

function nextReviewLabel(nextReviewAt?: string): string | null {
  if (!nextReviewAt) return null;
  const ms = new Date(nextReviewAt).getTime() - Date.now();
  if (ms <= 0) return 'Due now';
  const days = Math.round(ms / 86400000);
  if (days < 1) {
    const hours = Math.round(ms / 3600000);
    return `in ${Math.max(1, hours)}h`;
  }
  return `in ${formatInterval(days)}`;
}

export default function Flashcards() {
  const { savedWords, removeWord, getDueWords, setIsReviewing } = useFlashcardStore();
  const [reviewMode, setReviewMode] = useState(false);

  const enterReview = () => { setReviewMode(true); setIsReviewing(true); };
  const exitReview = () => { setReviewMode(false); setIsReviewing(false); };
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [search, setSearch] = useState('');

  const reviewDeck = useMemo(() => {
    const due = getDueWords();
    return due.length > 0 ? [...due] : [...savedWords];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedWords, reviewMode]);

  const dueWords = useMemo(() => getDueWords(), [savedWords]); // eslint-disable-line react-hooks/exhaustive-deps
  const dueIds = useMemo(() => new Set(dueWords.map(w => w.id)), [dueWords]);

  const filteredWords = useMemo(() => {
    let words = [...savedWords];
    if (filter === 'due') words = words.filter(w => dueIds.has(w.id));
    else if (filter === 'new') words = words.filter(w => !(w.mastery || 0));
    else if (filter === 'learning') words = words.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3);
    else if (filter === 'known') words = words.filter(w => (w.mastery || 0) >= 3);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      words = words.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.reading.toLowerCase().includes(q) ||
        w.meanings.some(m => m.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'mastery') words.sort((a, b) => (b.mastery || 0) - (a.mastery || 0));

    return words;
  }, [savedWords, filter, search, sortBy, dueIds]);

  const knownCount = savedWords.filter(w => (w.mastery || 0) >= 3).length;
  const learningCount = savedWords.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3).length;
  const newCount = savedWords.filter(w => !(w.mastery || 0)).length;
  const dueCount = dueWords.length;

  if (reviewMode) {
    return <FlashcardReview deck={reviewDeck} onExit={exitReview} />;
  }

  const sortLabels: Record<SortOption, string> = {
    added: 'Date added',
    mastery: 'Mastery',
  };

  const STAT_TILES: { key: StatusFilter; label: string; count: number; Icon: typeof Flame; tint: string }[] = [
    { key: 'due',      label: 'Due',      count: dueCount,      Icon: Flame,          tint: '36 80% 60%' },
    { key: 'new',      label: 'New',      count: newCount,      Icon: Sparkles,       tint: '200 60% 55%' },
    { key: 'learning', label: 'Learning', count: learningCount, Icon: GraduationCap,  tint: '270 45% 60%' },
    { key: 'known',    label: 'Known',    count: knownCount,    Icon: CheckCircle2,   tint: '150 50% 45%' },
  ];

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Due', value: 'due' },
    { label: 'New', value: 'new' },
    { label: 'Learning', value: 'learning' },
    { label: 'Known', value: 'known' },
  ];

  return (
    <div className="pb-24">
      {/* Editorial masthead */}
      <header className="library-header-bg relative overflow-hidden px-6 pt-12 pb-6 flex items-end justify-between">
        <span className="library-kanji-watermark" aria-hidden="true">語</span>
        <div className="relative z-10">
          <h1 className="font-serif text-[34px] font-bold leading-none tracking-tight">Flashcards</h1>
          <p className="mt-2 text-[12px] tracking-[0.08em] text-muted-foreground">
            <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
            {savedWords.length} saved {savedWords.length === 1 ? 'word' : 'words'}
          </p>
        </div>
        <Link to="/settings" className="relative z-10">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 hover:bg-background">
            <Settings className="h-[18px] w-[18px]" />
          </Button>
        </Link>
      </header>
      <div className="bg-gradient-to-b from-transparent to-background h-6 -mt-6 relative z-0" />

      <div className="px-6">
        {savedWords.length > 0 && (
          <>
            {/* Review hero */}
            {dueCount > 0 ? (
              <button
                onClick={enterReview}
                className="card-lift mt-2 block w-full overflow-hidden rounded-2xl p-5 text-left shadow-sm ring-1 ring-border/40"
                style={{ backgroundImage: `linear-gradient(135deg, hsl(36 80% 60% / 0.18) 0%, hsl(var(--card)) 60%)` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
                    <Flame className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="section-bullet" />Due today
                    </p>
                    <p className="font-serif text-2xl font-bold tabular-nums leading-tight">{dueCount}</p>
                    <p className="text-[12px] text-muted-foreground">Keep your streak going</p>
                  </div>
                  <Button size="sm" className="rounded-full px-4 shadow-md">
                    Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </button>
            ) : (
              <Button variant="outline" size="lg" onClick={enterReview} className="mt-2 w-full rounded-full font-semibold">
                Review all words
              </Button>
            )}

            {/* Stat tiles */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {STAT_TILES.map(({ key, label, count, Icon, tint }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(active ? 'all' : key)}
                    className={cn(
                      'card-lift relative overflow-hidden rounded-xl border bg-card p-3 text-left',
                      active ? 'ring-2 ring-primary/40 border-transparent' : ''
                    )}
                    style={{ backgroundImage: `linear-gradient(140deg, hsl(${tint} / 0.14) 0%, hsl(var(--card)) 60%)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: `hsl(${tint})` }} />
                    <p className="mt-2 text-2xl font-bold tabular-nums text-foreground leading-none">{count}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
                  </button>
                );
              })}
            </div>

            {/* Search pill */}
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search words…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills + sort */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-none py-1">
                {filters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors tap-scale',
                      filter === f.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-foreground/80 hover:bg-muted'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1 shrink-0 rounded-full">
                    <ArrowUpDown className="h-3 w-3" /> {sortLabels[sortBy]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(sortLabels) as SortOption[]).map(key => (
                    <DropdownMenuItem key={key} onClick={() => setSortBy(key)}>
                      {sortLabels[key]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              {filteredWords.length} word{filteredWords.length === 1 ? '' : 's'}
              {(filter !== 'all' || search) && ` (of ${savedWords.length})`}
            </p>
          </>
        )}

        {savedWords.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <BookOpen className="h-9 w-9 text-primary" />
            </div>
            <p className="mt-5 font-serif text-lg font-semibold">No flashcards yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap a word while reading to save it here.</p>
            <Link to="/" className="mt-5">
              <Button size="sm" className="rounded-full px-5">Browse Library</Button>
            </Link>
          </div>
        ) : (
          <div className="stagger-children mt-3 flex flex-col gap-2">
            {filteredWords.map((word) => {
              const mastery = word.mastery || 0;
              const level = masteryLevel(mastery);
              const isDue = dueIds.has(word.id);
              const masteryPct = Math.min(100, (mastery / 5) * 100);
              const nextLabel = nextReviewLabel(word.nextReviewAt);
              return (
                <div
                  key={word.id}
                  className="card-lift tap-scale group relative overflow-hidden rounded-xl border bg-card p-4 ring-1 ring-border/30"
                >
                  <div className="flex items-start gap-3">
                    <span className={cn('mt-1 h-12 w-1 flex-shrink-0 rounded-full', LEVEL_BAR[level])} />
                    <PlayWordButton word={word.word} reading={word.reading} size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="font-japanese text-lg font-bold truncate">{word.word}</p>
                        {word.reading && word.reading !== word.word && (
                          <span className="font-japanese text-xs text-muted-foreground truncate">{word.reading}</span>
                        )}
                        {isDue && (
                          <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Due
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">
                        {word.meanings.join(', ')}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={cn('h-full rounded-full transition-all', LEVEL_BAR[level])} style={{ width: `${masteryPct}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums text-foreground/70">{Math.round(masteryPct)}%</span>
                      </div>
                      {nextLabel && (
                        <p className="mt-1 text-[10px] font-medium text-muted-foreground/80">Next: {nextLabel}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeWord(word.id)}
                      className="flex-shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredWords.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-8">No words match your filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
