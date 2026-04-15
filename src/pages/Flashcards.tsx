import { useState, useMemo } from 'react';
import { useFlashcardStore } from '@/stores/flashcards';
import { Trash2, RotateCcw, Shuffle, Search, ArrowUpDown } from 'lucide-react';
import { PlayWordButton } from '@/components/PlayWordButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlashcardReview } from '@/components/FlashcardReview';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type StatusFilter = 'all' | 'new' | 'learning' | 'known';
type SortOption = 'added' | 'mastery' | 'jlpt';

export default function Flashcards() {
  const { savedWords, removeWord, getDueWords, setIsReviewing } = useFlashcardStore();
  const [reviewMode, setReviewMode] = useState(false);

  const enterReview = () => { setReviewMode(true); setIsReviewing(true); };
  const exitReview = () => { setReviewMode(false); setIsReviewing(false); };
  const [shuffled, setShuffled] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [search, setSearch] = useState('');

  const reviewDeck = useMemo(() => {
    const due = getDueWords();
    const deck = due.length > 0 ? [...due] : [...savedWords];
    if (shuffled) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedWords, shuffled, reviewMode]);

  const filteredWords = useMemo(() => {
    let words = [...savedWords];

    // Filter
    if (filter === 'new') words = words.filter(w => !(w.mastery || 0));
    else if (filter === 'learning') words = words.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3);
    else if (filter === 'known') words = words.filter(w => (w.mastery || 0) >= 3);

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      words = words.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.reading.toLowerCase().includes(q) ||
        w.meanings.some(m => m.toLowerCase().includes(q))
      );
    }

    // Sort
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
  }, [savedWords, filter, search, sortBy]);

  const knownCount = savedWords.filter(w => (w.mastery || 0) >= 3).length;
  const learningCount = savedWords.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3).length;
  const newCount = savedWords.filter(w => !(w.mastery || 0)).length;
  const dueCount = getDueWords().length;

  if (reviewMode) {
    return (
      <FlashcardReview
        deck={reviewDeck}
        onExit={exitReview}
      />
    );
  }

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Learning', value: 'learning' },
    { label: 'Known', value: 'known' },
  ];

  const sortLabels: Record<SortOption, string> = {
    added: 'Date added',
    mastery: 'Mastery',
    jlpt: 'JLPT',
  };

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        {savedWords.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShuffled(!shuffled)}
              className={shuffled ? 'text-primary' : 'text-muted-foreground'}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button onClick={enterReview} size="sm" className="font-semibold">
              <RotateCcw className="mr-1 h-4 w-4" /> Review
              {dueCount > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {dueCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {savedWords.length > 0 && (
        <>
          {/* Stats */}
          <div className="mt-3 flex gap-3">
            <div className="flex-1 rounded-lg border bg-card p-3 text-center">
              <p className="text-lg font-bold text-green-600">{knownCount}</p>
              <p className="text-[10px] text-muted-foreground">Known</p>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-3 text-center">
              <p className="text-lg font-bold text-amber-500">{learningCount}</p>
              <p className="text-[10px] text-muted-foreground">Learning</p>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-3 text-center">
              <p className="text-lg font-bold text-muted-foreground">{newCount}</p>
              <p className="text-[10px] text-muted-foreground">New</p>
            </div>
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
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1">
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

      <p className="mt-3 text-sm text-muted-foreground">
        {filteredWords.length} words{filter !== 'all' || search ? ` (of ${savedWords.length})` : ' saved'}
        {dueCount > 0 && <span className="text-accent font-semibold"> · {dueCount} due for review</span>}
      </p>

      {savedWords.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-muted-foreground">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-lg font-semibold">No flashcards yet</p>
          <p className="mt-1 text-sm">Tap words while reading to save them.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {filteredWords.map((word) => {
            const mastery = word.mastery || 0;
            const masteryColor = mastery >= 3 ? 'bg-green-500' : mastery > 0 ? 'bg-amber-400' : 'bg-muted';
            return (
              <div key={word.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${masteryColor}`} />
                    <PlayWordButton word={word.word} reading={word.reading} size={16} />
                    <div>
                      <p className="font-japanese text-lg font-bold">{word.word}</p>
                      <p className="text-xs text-muted-foreground">
                        {word.reading} — {word.meanings.join(', ')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeWord(word.id)} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
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
  );
}
