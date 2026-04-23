import { useState, useMemo } from 'react';
import { useFlashcardStore } from '@/stores/flashcards';
import { Trash2, RotateCcw, Search, ArrowUpDown, Settings, Sparkles, Flame, GraduationCap, CheckCircle2 } from 'lucide-react';
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

type StatusFilter = 'all' | 'due' | 'new' | 'learning' | 'known';
type SortOption = 'added' | 'mastery' | 'jlpt';

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
    const deck = due.length > 0 ? [...due] : [...savedWords];
    return deck;
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
    else if (sortBy === 'jlpt') {
      const jlptOrder = (w: typeof words[0]) => {
        const j = w.jlpt?.[0];
        if (!j) return 99;
        return parseInt(j.replace('jlpt-n', ''));
      };
      words.sort((a, b) => jlptOrder(a) - jlptOrder(b));
    }

    return words;
  }, [savedWords, filter, search, sortBy, dueIds]);

  const knownCount = savedWords.filter(w => (w.mastery || 0) >= 3).length;
  const learningCount = savedWords.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3).length;
  const newCount = savedWords.filter(w => !(w.mastery || 0)).length;
  const dueCount = dueWords.length;

  if (reviewMode) {
    return (
      <FlashcardReview
        deck={reviewDeck}
        onExit={exitReview}
      />
    );
  }

  const sortLabels: Record<SortOption, string> = {
    added: 'Date added',
    mastery: 'Mastery',
    jlpt: 'JLPT',
  };

  const tiles: { key: StatusFilter; label: string; count: number; Icon: typeof Flame; gradient: string; text: string }[] = [
    { key: 'due', label: 'Due', count: dueCount, Icon: Flame, gradient: 'from-accent/15 to-accent/5', text: 'text-accent' },
    { key: 'new', label: 'New', count: newCount, Icon: Sparkles, gradient: 'from-amber-500/15 to-amber-500/5', text: 'text-amber-600 dark:text-amber-400' },
    { key: 'learning', label: 'Learning', count: learningCount, Icon: GraduationCap, gradient: 'from-sky-500/15 to-sky-500/5', text: 'text-sky-600 dark:text-sky-400' },
    { key: 'known', label: 'Known', count: knownCount, Icon: CheckCircle2, gradient: 'from-emerald-500/15 to-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Due', value: 'due' },
    { label: 'New', value: 'new' },
    { label: 'Learning', value: 'learning' },
    { label: 'Known', value: 'known' },
  ];

  return (
    <div className="pb-20 px-6 pt-8">
      {/* Hero header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {savedWords.length} card{savedWords.length === 1 ? '' : 's'}
            {dueCount > 0 && (
              <> · <span className="font-semibold text-accent">{dueCount} due today</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {savedWords.length > 0 && (
        <>
          {/* Hero review CTA */}
          {dueCount > 0 ? (
            <button
              onClick={enterReview}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-primary/85 px-5 py-3.5 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.99] transition-transform flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-white/15 p-1.5">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold leading-tight">Start review</p>
                  <p className="text-[11px] opacity-85 leading-tight">{dueCount} card{dueCount > 1 ? 's' : ''} due</p>
                </div>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
                {dueCount}
              </span>
            </button>
          ) : (
            <Button variant="outline" size="sm" onClick={enterReview} className="mt-4 w-full font-semibold">
              <RotateCcw className="mr-1.5 h-4 w-4" /> Review all
            </Button>
          )}

          {/* 4-tile stats */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {tiles.map(({ key, label, count, Icon, gradient, text }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(active ? 'all' : key)}
                  className={`rounded-xl border bg-gradient-to-br ${gradient} p-2.5 text-center transition-all active:scale-[0.97] ${
                    active ? 'border-primary/50 ring-1 ring-primary/30' : 'border-border/60'
                  }`}
                >
                  <Icon className={`mx-auto h-3.5 w-3.5 ${text}`} />
                  <p className={`mt-1 text-lg font-bold leading-none ${text}`}>{count}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search words..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filters + Sort */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1 shrink-0">
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
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {filteredWords.length} word{filteredWords.length === 1 ? '' : 's'}
        {(filter !== 'all' || search) && ` (of ${savedWords.length})`}
      </p>

      {savedWords.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-muted-foreground">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-lg font-semibold">No flashcards yet</p>
          <p className="mt-1 text-sm">Tap words while reading to save them.</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {filteredWords.map((word) => {
            const mastery = word.mastery || 0;
            const level = masteryLevel(mastery);
            const isDue = dueIds.has(word.id);
            const masteryPct = Math.min(100, (mastery / 5) * 100);
            const nextLabel = nextReviewLabel(word.nextReviewAt);
            return (
              <div
                key={word.id}
                className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 pl-5 ring-1 ring-transparent transition-all hover:border-primary/30 hover:bg-muted/30 active:scale-[0.99]"
              >
                {/* Vertical color indicator */}
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${LEVEL_BAR[level]}`} />

                {/* Due badge */}
                {isDue && (
                  <span className="absolute right-3 top-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Due
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <PlayWordButton word={word.word} reading={word.reading} size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="font-japanese text-lg font-bold truncate">{word.word}</p>
                        <span className="font-japanese text-xs text-muted-foreground truncate">{word.reading}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {word.meanings.join(', ')}
                      </p>
                      {nextLabel && (
                        <p className="mt-1 text-[10px] font-medium text-muted-foreground/80">
                          Next: {nextLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeWord(word.id)}
                    className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Mastery progress bar */}
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${LEVEL_BAR[level]}`}
                    style={{ width: `${masteryPct}%` }}
                  />
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
  );
}
