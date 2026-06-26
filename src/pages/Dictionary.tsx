import { useState, useEffect, useRef } from'react';
import { useScrollProgress } from'@/hooks/use-scroll-progress';
import { ConjugationTable } from'@/components/ConjugationTable';
import { useSearchParams } from'react-router-dom';
import { DelayedLink as Link } from'@/components/DelayedLink';
import { useDelayedNav } from'@/hooks/use-delayed-nav';
import { useFlashcardStore, type SavedWord } from'@/stores/flashcards';
import { useDictionaryHistoryStore } from '@/stores/dictionary-history';
import { searchJisho, getDisplayWord, type JishoResult } from'@/lib/jisho';
import { Search, Star, Loader2, X, Settings, ChevronRight, History, Trash2 } from'lucide-react';
import { Button } from'@/components/ui/button';
import { PlayWordButton } from'@/components/PlayWordButton';
import { toRomaji } from'wanakana';
import { ExampleSentence } from'@/components/ExampleSentence';
import { Input } from'@/components/ui/input';
import { AnimatedTitle } from'@/components/AnimatedTitle';
import { romajiToKana } from'@/lib/romaji';

/**
 * Rerank Jisho results so exact English-definition matches come first.
 * Score: 3 = exact word match in a definition, 2 = exact match as one of multiple defs,
 *        1 = whole-word substring, 0 = other. Stable sort preserves Jisho's order within ties.
 */
function rankByRelevance(results: JishoResult[], query: string): JishoResult[] {
  const q = query.trim().toLowerCase();
  if (!q || !/[a-zA-Z]/.test(q)) return results;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const wordRe = new RegExp(`\\b${escaped}\\b`,'i');
  // Matches definitions that START with the query followed by a word boundary
  // (end of string, space, parenthesis, bracket). Catches "cat (esp. ...)" as exact.
  const exactPrefixRe = new RegExp(`^${escaped}(?:[\\s(\\[]|$)`,'i');
  const score = (r: JishoResult): number => {
    let best = 0;
    for (const sense of r.senses) {
      for (const def of sense.english_definitions) {
        const d = def.toLowerCase();
        if (d === q) return 3;
        if (exactPrefixRe.test(d)) { best = Math.max(best, 3); continue; }
        if (d.split(/[;,]\s*/).some((p) => p.trim() === q)) best = Math.max(best, 2);
        else if (wordRe.test(def)) best = Math.max(best, 1);
      }
    }
    // Push Wikipedia-only entries (proper nouns like band/album names) below real words.
    if (best === 0 && r.senses.length > 0 && r.senses.every((s) => s.parts_of_speech.includes('Wikipedia definition'))) {
      return -1;
    }
    return best;
  };
  return [...results]
    .map((r, i) => ({ r, i, s: score(r), c: r.is_common ? 1 : 0 }))
    .sort((a, b) => b.s - a.s || b.c - a.c || a.i - b.i)
    .map((x) => x.r);
}

export default function DictionaryPage() {
 const goTo = useDelayedNav();
 const [searchParams] = useSearchParams();
 const initial = searchParams.get('q') ?? sessionStorage.getItem('dictionary:query') ??'';
 const [query, setQuery] = useState(initial);
 const { recent, push: pushHistory, remove: removeHistory, clear: clearHistory } = useDictionaryHistoryStore();
 const { addWord, removeWord, hasWord } = useFlashcardStore();
 const [jishoResults, setJishoResults] = useState<JishoResult[]>(() => {
 try {
 // v2: invalidates results cached before the English-search fix.
 sessionStorage.removeItem('dictionary:results');
 const cachedQuery = sessionStorage.getItem('dictionary:query');
 const cachedResults = sessionStorage.getItem('dictionary:results:v2');
 if (cachedQuery && cachedQuery === initial && cachedResults) {
 return JSON.parse(cachedResults) as JishoResult[];
 }
 } catch {/* ignore */}
 return [];
 });
 const [searching, setSearching] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);
 const lastFetchedRef = useRef<string>(initial && jishoResults.length > 0 ? initial :'');
 const headerRef = useRef<HTMLElement>(null);
 useScrollProgress(headerRef, 0, 56);

 useEffect(() => {
 sessionStorage.setItem('dictionary:query', query);
 }, [query]);

 useEffect(() => {
 if (!query.trim()) {
 setJishoResults([]);
 sessionStorage.removeItem('dictionary:results:v2');
 lastFetchedRef.current ='';
 return;
 }

 if (query === lastFetchedRef.current) return;

  const timeout = setTimeout(async () => {
  setSearching(true);
  try {
  const q = romajiToKana(query) ?? query;
  const results = await searchJisho(q);
  const ranked = rankByRelevance(results, query);
  setJishoResults(ranked);
  lastFetchedRef.current = query;
  
  if (ranked.length > 0) {
    pushHistory(q);
  }

  try {
  sessionStorage.setItem('dictionary:results:v2', JSON.stringify(ranked));
  } catch {/* quota — ignore */}
  } catch {
  setJishoResults([]);
  } finally {
  setSearching(false);
  }
  }, 400);

  return () => clearTimeout(timeout);
 }, [query]);

  const handleToggleSave = (result: JishoResult) => {
    const disp = getDisplayWord(result);
    const id = disp.word || result.slug;
    const { savedWords } = useFlashcardStore.getState();
    const savedCard = savedWords.find(s => 
      s.id === id || 
      s.word === id || 
      (result.japanese.some(j => j.word === s.word || j.reading === s.word))
    );

    if (savedCard) {
      removeWord(savedCard.id);
      return;
    }
    const entry: Omit<SavedWord, 'mastery'> = {
      id,
      word: id,
      reading: disp.reading || result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
    };
    addWord(entry);
  };

 const clearQuery = () => {
 setQuery('');
 inputRef.current?.focus();
 };

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
    borderBottom: '1px solid hsla(var(--border) / calc(var(--p, 0) * 0.5))',
    borderBottomColor: 'hsla(var(--border) / calc(var(--p, 0) * 0.5))',
    borderBottomWidth: 'calc(min(var(--p, 0), 1) * 1px)',
 }}
 >
 <AnimatedTitle
 text="Dictionary"
 className="font-serif font-bold leading-none tracking-tight"
 style={{ 
    '--title-scale': 'calc(1 - var(--p, 0) * 0.25)', 
    fontSize: '32px'
 } as any}
 />
 <Link to="/settings">
 <Button
 variant="ghost"
 size="icon"
 className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip"
 >
 <Settings className="h-[18px] w-[18px]"/>
 </Button>
 </Link>
 </header>

 {/* Search pill */}
 <div className="mt-5 px-6 relative">
 <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
 <Input
 ref={inputRef}
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search in Japanese or English..."
 className="h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
 />
 {query && (
 <button
 type="button"
 onPointerDown={(e) => {
 // Fire on press and prevent the input below from stealing focus,
 // which used to require a second tap and visually shifted the icon.
 e.preventDefault();
 e.stopPropagation();
 clearQuery();
 }}
 aria-label="Clear search"
 className="absolute right-8 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:bg-muted/80 smooth-colors"
 >
 <X className="h-4 w-4"/>
 </button>
 )}
 </div>

 {searching && (
 <div className="mt-6 flex justify-center">
 <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3.5 py-1.5 ring-1 ring-border/40 shadow-inner-sm">
 <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground"/>
 <span className="text-xs font-medium text-muted-foreground">Searching…</span>
 </div>
 </div>
 )}

 <div className="stagger-children mt-5 flex flex-col gap-3 px-6">
        {jishoResults.map((result, idx) => {
          const disp = getDisplayWord(result, query);
          const word = disp.word || result.slug;
          const reading = disp.reading;
          const savedWords = useFlashcardStore.getState().savedWords;
          const savedCard = savedWords.find(s => 
            s.id === word || 
            s.word === word || 
            (result.japanese.some(j => j.word === s.word || j.reading === s.word))
          );
          const saved = !!savedCard;
          const isCommon = (result as any).is_common;

 return (
          <div
            key={idx}
            className="relative rounded-2xl bg-card p-5 ring-1 ring-border/40 shadow-sm card-lift overflow-hidden"
          >
 {/* Save / unsave button */}
 <button
 onClick={() => handleToggleSave(result)}
 aria-label={saved ?'Remove from flashcards':'Save word'}
 className={`absolute top-4 right-4 z-10 h-9 w-9 rounded-full ring-1 ring-border/40 bg-background/70 backdrop-blur-md flex items-center justify-center smooth-colors tap-scale-sm ${
 saved ?'text-accent':'text-muted-foreground'}`}
 >
 <Star className="h-4 w-4"fill={saved ?'currentColor':'none'} />
 </button>

 {/* Clickable summary → word detail */}
 <div
 role="link"
 tabIndex={0}
 onClick={() => goTo(`/dictionary/${encodeURIComponent(word)}`)}
 onKeyDown={(e) => {
 if (e.key ==='Enter'|| e.key ==='') {
 e.preventDefault();
 goTo(`/dictionary/${encodeURIComponent(word)}`);
 }
 }}
 className="group cursor-pointer -m-1 p-1 pr-6 rounded-lg relative"
 >
 {/* Word + reading inline */}
				<div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pr-12">
					<p className="font-japanese text-xl font-bold whitespace-nowrap shrink-0">{word}</p>
					<div className="flex items-center gap-1.5 flex-wrap">
						{reading && reading !== word && (
							<span className="font-japanese text-sm text-muted-foreground whitespace-nowrap">{reading}</span>
						)}
 						{disp.pronunciation && (
 							<span className="text-xs text-muted-foreground/70 italic whitespace-nowrap">{toRomaji(disp.pronunciation)}</span>
 						)}
						<span onClick={(e) => e.stopPropagation()}>
							<PlayWordButton word={word} reading={reading} size={16} />
						</span>
					</div>
				</div>

 {/* Tags row */}
 <div className="mt-2 flex flex-wrap items-center gap-1.5">
 {isCommon && (
 <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
 ✦ Common
 </span>
 )}
 {result.jlpt.length > 0 && (
 <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-accent ring-1 ring-accent/20">
 {result.jlpt[0]?.replace('jlpt-','').toUpperCase()}
 </span>
 )}
 {result.senses[0]?.parts_of_speech?.map((pos, i) => (
 <span
 key={i}
 className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/40"
 >
 {pos}
 </span>
 ))}
 </div>

 {/* Meanings */}
 <div className="mt-3 space-y-1">
 {result.senses.slice(0, 3).map((sense, i) => (
 <p key={i} className="text-sm leading-relaxed">
 <span className="text-muted-foreground mr-1">{i + 1}.</span>
 <span className="font-medium text-foreground">{sense.english_definitions.join('; ')}</span>
 </p>
 ))}
 </div>

 <ChevronRight
 aria-hidden
 className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 transition-transform"
 />
 </div>

 <ExampleSentence word={word} />
 <ConjugationTable
 dictForm={word}
 partsOfSpeech={result.senses.flatMap(s => s.parts_of_speech)}
 />
 </div>
 );
 })}
 {!searching && query.trim() && jishoResults.length === 0 && (
 <p className="mt-8 text-center text-sm text-muted-foreground">No results found.</p>
 )}
  {!query.trim() && (
    <div className="mt-12 flex flex-col items-center">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Search className="h-9 w-9 text-primary"/>
        </div>
        <p className="mt-5 font-serif text-lg font-semibold">Search the dictionary</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Type a word in Japanese or English to get started.
        </p>
      </div>

      {recent.length > 0 && (
        <div className="mt-12 w-full max-w-sm px-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="section-bullet" />Recent searches
            </p>
            <button 
              onClick={clearHistory}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-2.5 w-2.5" />
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <div
                key={item.query}
                className="group relative flex items-center gap-1 rounded-full bg-muted/60 pl-3 pr-1.5 py-1.5 ring-1 ring-border/40 tap-scale-sm transition-all active:bg-muted/80"
              >
                <button
                  onClick={() => setQuery(item.query)}
                  className={`text-sm font-medium ${/[　-ヿ]/.test(item.query) ? 'font-japanese' : ''}`}
                >
                  {item.query}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistory(item.query);
                  }}
                  className="h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-background/50 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}
 </div>
 </div>
 );
}
