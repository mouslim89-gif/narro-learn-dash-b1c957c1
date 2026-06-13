import { useState, useMemo, useRef } from'react';
import { useScrollProgress } from'@/hooks/use-scroll-progress';
import { useFlashcardStore } from'@/stores/flashcards';
import { Trash2, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown, Settings, Sparkles, Flame, GraduationCap, CheckCircle2, ArrowRight, Check } from'lucide-react';
import { Link } from'react-router-dom';
import { PlayWordButton } from'@/components/PlayWordButton';
import { Button } from'@/components/ui/button';
import { Input } from'@/components/ui/input';
import { Progress } from'@/components/ui/progress';
import { FlashcardReview } from'@/components/FlashcardReview';
import { AnimatedTitle } from'@/components/AnimatedTitle';
import { cn } from'@/lib/utils';
import { romajiToKana } from'@/lib/romaji';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from'@/components/ui/dropdown-menu';
import { useDelayed } from'@/hooks/use-delayed';

type StatusFilter ='all'|'due'|'new'|'learning'|'known';
type SortOption ='added'|'mastery';

function masteryLevel(m: number):'new'|'learning'|'known'{
 if (m <= 0) return'new';
 if (m <= 2) return'learning';
 return'known';
}

const LEVEL_BAR: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-[hsl(var(--state-new))]',
  learning: 'bg-[hsl(var(--state-learning))]',
  known: 'bg-[hsl(var(--state-known))]',
};

export default function Flashcards() {
 const { savedWords, removeWord, getDueWords, setIsReviewing } = useFlashcardStore();
 const [reviewMode, setReviewMode] = useState(false);
 const showEmpty = useDelayed(300);
 const headerRef = useRef<HTMLElement>(null);
 useScrollProgress(headerRef, 0, 56);

 const enterReview = () => { setReviewMode(true); setIsReviewing(true); };
 const exitReview = () => { setReviewMode(false); setIsReviewing(false); };
 const [filter, setFilter] = useState<StatusFilter>('all');
 const [sortBy, setSortBy] = useState<SortOption>('added');
 const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
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

 if (filter ==='due') words = words.filter(w => dueIds.has(w.id));
 else if (filter ==='new') words = words.filter(w => !(w.mastery || 0));
 else if (filter ==='learning') words = words.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3);
 else if (filter ==='known') words = words.filter(w => (w.mastery || 0) >= 3);

     if (search.trim()) {
            const q = search.trim().toLowerCase();
            const kana = romajiToKana(q);
            words = words.filter(w =>
                w.word.toLowerCase().includes(q) ||
                w.reading.toLowerCase().includes(q) ||
                w.meanings.some(m => m.toLowerCase().includes(q)) ||
                (kana ? (w.word.includes(kana) || w.reading.includes(kana)) : false)
            );
        }

 if (sortBy ==='mastery') {
 words.sort((a, b) => (a.mastery || 0) - (b.mastery || 0));
 }
 //'added'uses insertion order (oldest → newest)
 if (sortDir ==='desc') words.reverse();

 return words;
 }, [savedWords, filter, search, sortBy, sortDir, dueIds]);

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
 added:'Date added',
 mastery:'Mastery',
 };

 type Tile = { key: StatusFilter; label: string; count: number; Icon: typeof Flame; tint: string; iconColor: string };
 const tiles: Tile[] = [
 { key:'new', label:'New', count: newCount, Icon: Sparkles, tint:'200 60% 55%', iconColor:'hsl(200 60% 50%)'},
 { key:'learning', label:'Learning', count: learningCount, Icon: GraduationCap, tint:'36 80% 60%', iconColor:'hsl(36 80% 50%)'},
 { key:'known', label:'Known', count: knownCount, Icon: CheckCircle2, tint:'150 50% 45%', iconColor:'hsl(150 50% 40%)'},
 { key:'due', label:'Due', count: dueCount, Icon: Flame, tint:'36 80% 60%', iconColor:'hsl(36 80% 50%)'},
 ];

 return (
 <div className="pb-24">
 {/* Masthead */}
 <header
 ref={headerRef}
 className="sticky top-0 z-30 px-6 flex items-center justify-between"
 style={{
 paddingTop: 'calc(40px - var(--p, 0) * 28px)',
 paddingBottom: 'calc(8px + var(--p, 0) * 4px)',
 backgroundColor: 'hsl(var(--background) / calc(var(--p, 0) * 0.85))',
 backdropFilter: 'blur(calc(var(--p, 0) * 16px))',
 WebkitBackdropFilter: 'blur(calc(var(--p, 0) * 16px))',
 borderBottom: '1px solid hsl(var(--border) / calc(var(--p, 0) * 0.5))',
 }}
 >
 <div className="min-w-0">
  <AnimatedTitle
 text="Flashcards"
 className="font-serif font-bold leading-none tracking-tight"
 style={{ 
    '--title-scale': 'calc(1 - var(--p, 0) * 0.25)', 
    fontSize: '32px'
 } as any}
 />
 </div>
 <Link to="/settings">
 <Button variant="ghost"size="icon"className="h-10 w-10 rounded-full ring-1 ring-border/40 chip-relief">
 <Settings className="h-[18px] w-[18px]"/>
 </Button>
 </Link>
 </header>

 {savedWords.length > 0 && (
 <>
 {/* Hero review CTA */}
 <section className="px-6 pt-5">
 {dueCount > 0 ? (
 <div
 className="relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-border/40 card-lift"
 style={{ backgroundImage:'linear-gradient(135deg, hsl(36 80% 60% / 0.18) 0%, hsl(var(--card)) 60%)'}}
 >
 <div className="flex items-center gap-4">
 <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-background/80 ring-1 ring-border/40">
 <Flame className="h-6 w-6"style={{ color:'hsl(36 80% 55%)'}} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Due today</p>
 <p className="font-serif text-2xl font-bold leading-none tabular-nums">{dueCount}</p>
 <p className="mt-1 text-[12px] text-muted-foreground">Keep your streak going</p>
 </div>
 <Button size="sm"className="rounded-full px-4 shadow-md"onClick={enterReview}>
 Review <ArrowRight className="ml-1 h-3.5 w-3.5"/>
 </Button>
 </div>
 </div>
 ) : (
 <Button variant="outline"className="w-full h-12 rounded-full"onClick={enterReview}>
 <RotateCcw className="mr-2 h-4 w-4"/>Review all words
 </Button>
 )}
 </section>

 {/* Stat tiles */}
 <div className="stagger-children mt-4 px-6 grid grid-cols-4 gap-2">
 {tiles.map(({ key, label, count, Icon, tint, iconColor }) => {
 const active = filter === key;
 return (
 <button
 key={key}
 onClick={() => setFilter(active ?'all': key)}
 className={cn('rounded-xl border bg-card p-3 text-left card-lift tap-scale smooth-colors',
 active ?'border-primary/40 ring-1 ring-primary/30':'border-border/40')}
 style={{ backgroundImage:`linear-gradient(140deg, hsl(${tint} / 0.14) 0%, hsl(var(--card)) 60%)`}}
 >
 <Icon className="h-4 w-4"style={{ color: iconColor }} />
 <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none">{count}</p>
 <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
 </button>
 );
 })}
 </div>

 {/* Search pill */}
 <div className="mt-4 px-6 relative">
 <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
 <Input
 placeholder="Search words..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
 />
 </div>

 {/* Sort */}
 <div className="mt-3 flex items-center justify-end px-6 gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 aria-label={`Sort by ${sortLabels[sortBy]}`}
 className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted/60 px-3.5 text-[12px] font-medium text-foreground/80 ring-1 ring-border/40 smooth-colors tap-scale-sm"
 >
 <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground"/>
 <span className="text-muted-foreground">Sort by</span>
 <span>{sortLabels[sortBy]}</span>
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end"className="w-44">
 {(Object.keys(sortLabels) as SortOption[]).map(key => {
 const active = sortBy === key;
 return (
 <DropdownMenuItem
 key={key}
 onClick={() => setSortBy(key)}
 className="flex items-center justify-between gap-2"
 >
 <span>{sortLabels[key]}</span>
 {active && <Check className="h-3.5 w-3.5 text-primary"/>}
 </DropdownMenuItem>
 );
 })}
 </DropdownMenuContent>
 </DropdownMenu>
 <button
 onClick={() => setSortDir(d => (d ==='asc'?'desc':'asc'))}
 aria-label={sortDir ==='asc'?'Ascending — tap to reverse':'Descending — tap to reverse'}
 className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-foreground/80 ring-1 ring-border/40 smooth-colors tap-scale-sm"
 >
 {sortDir ==='asc'? <ArrowUp className="h-4 w-4"/>
 : <ArrowDown className="h-4 w-4"/>}
 </button>
 </div>
 </>
 )}

 {savedWords.length === 0 ? (
 <div className={`mt-24 flex flex-col items-center text-center px-6 transition-opacity duration-200 ${showEmpty ?'opacity-100':'opacity-0'}`}>
 <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
 <Sparkles className="h-9 w-9 text-primary"/>
 </div>
 <p className="mt-5 font-serif text-lg font-semibold">No flashcards yet</p>
 <p className="mt-1 text-sm text-muted-foreground">Tap a word while reading to save it here.</p>
 <Link to="/"className="mt-5"><Button size="sm"className="rounded-full px-5">Browse Library</Button></Link>
 </div>
 ) : (
 <ul className="stagger-children mt-2 space-y-2 px-6">
 {filteredWords.map((w) => {
 const mastery = w.mastery || 0;
 const level = masteryLevel(mastery);
 const isDue = dueIds.has(w.id);
 const pct = Math.min(100, (mastery / 5) * 100);
 return (
 <li key={w.id}>
 <div className="relative flex items-center gap-3 rounded-xl border bg-card p-3 ring-1 ring-border/30 card-lift">
 <span className={cn('h-10 w-1.5 flex-shrink-0 rounded-full', LEVEL_BAR[level])} aria-hidden />
 <div className="min-w-0 flex-1">
 <div className="flex items-baseline gap-2">
 <p className="font-japanese text-[18px] font-bold leading-tight truncate">{w.word}</p>
 {w.reading && w.reading !== w.word && (
 <p className="font-japanese text-[12px] text-muted-foreground truncate">{w.reading}</p>
 )}
 {isDue && <span className="ml-auto rounded-full bg-[hsl(var(--state-due)/0.15)] px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--state-due))]">Due</span>}
 </div>
 <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">{w.meanings.join(',')}</p>
 <div className="mt-2 flex items-center gap-2">
 <Progress value={pct} className="h-1 flex-1"/>
 <span className="text-[10px] font-semibold tabular-nums text-foreground/60">{Math.round(pct)}%</span>
 </div>
 </div>
 <PlayWordButton word={w.word} reading={w.reading} className="flex-shrink-0"/>
 <button
 onClick={() => removeWord(w.id)}
 className="flex-shrink-0 rounded-full p-1.5 text-muted-foreground smooth-colors tap-scale-sm"
 aria-label="Delete"
 >
 <Trash2 className="h-3.5 w-3.5"/>
 </button>
 </div>
 </li>
 );
 })}
 {filteredWords.length === 0 && (
 <p className="text-center text-sm text-muted-foreground mt-8">No words match your filters.</p>
 )}
 </ul>
 )}
 </div>
 );
}
