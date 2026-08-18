import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { ConjugationTable } from '@/components/ConjugationTable';
import { useSearchParams } from 'react-router-dom';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { searchJisho, getDisplayWord, type JishoResult } from '@/lib/jisho';
import { Search, Star, Loader2, X, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayWordButton } from '@/components/PlayWordButton';
import { toRomaji } from 'wanakana';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Input } from '@/components/ui/input';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { romajiToKana } from '@/lib/romaji';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGrammarPoints } from '@/lib/grammar-index';
import { cn } from '@/lib/utils';
import { jlptColors } from '@/data/books';

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
  const [mode, setMode] = useState<'words' | 'grammar'>('words');
  const [jlptFilter, setJlptFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  
  const initial = searchParams.get('q') ?? sessionStorage.getItem('dictionary:query') ?? '';
  const [query, setQuery] = useState(initial);
  const { addWord, removeWord, hasWord } = useFlashcardStore();
  const savedWords = useFlashcardStore((s) => s.savedWords);
  
  const [jishoResults, setJishoResults] = useState<JishoResult[]>(() => {
    try {
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
  const lastFetchedRef = useRef<string>(initial && jishoResults.length > 0 ? initial : '');
  const headerRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useScrollProgress(headerRef, 0, 56);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 10);
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, {
      rootMargin: '200px',
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMore]);

  const grammarPoints = useMemo(() => {
    if (mode !== 'grammar') return [];
    let list = getAllGrammarPoints();
    
    if (jlptFilter) {
      list = list.filter(p => p.jlpt === jlptFilter);
    }
    
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(p => 
        p.pattern.toLowerCase().includes(q) || 
        p.meaning.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [mode, jlptFilter, query]);

  useEffect(() => {
    sessionStorage.setItem('dictionary:query', query);
  }, [query]);

  useEffect(() => {
    if (mode !== 'words') return;
    if (!query.trim()) {
      setJishoResults([]);
      setVisibleCount(10);
      sessionStorage.removeItem('dictionary:results:v2');
      lastFetchedRef.current = '';
      return;
    }

    if (query === lastFetchedRef.current) return;

    const timeout = setTimeout(async () => {
      setSearching(true);
      setVisibleCount(10);
      try {
        const results = await searchJisho(romajiToKana(query) ?? query);
        const ranked = rankByRelevance(results, query);
        setJishoResults(ranked);
        lastFetchedRef.current = query;
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
  }, [query, mode]);

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

  {/* Tab Switcher */}
  <div className="mt-4 px-6">
    <div className="relative flex w-full items-center gap-1 rounded-full bg-muted/60 p-1 ring-1 ring-border/20 shadow-inner-sm">
      <AnimatePresence mode="popLayout" initial={false}>
        {mode === 'words' && (
          <motion.div
            layoutId="tab-pill"
            className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-card shadow-sm ring-1 ring-border/20"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        {mode === 'grammar' && (
          <motion.div
            layoutId="tab-pill"
            className="absolute bottom-1 right-1 top-1 w-[calc(50%-4px)] rounded-full bg-card shadow-sm ring-1 ring-border/20"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <button
        onClick={() => setMode('words')}
        className={cn(
          "relative z-10 flex h-9 flex-1 items-center justify-center text-xs font-bold transition-colors",
          mode === 'words' ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Words
      </button>
      <button
        onClick={() => setMode('grammar')}
        className={cn(
          "relative z-10 flex h-9 flex-1 items-center justify-center text-xs font-bold transition-colors",
          mode === 'grammar' ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Grammar
      </button>
    </div>
  </div>

  {/* Search pill */}
  <div className="mt-4 px-6 relative">
    <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
    <Input
      ref={inputRef}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={mode === 'grammar' ? "Search grammar..." : "Search in Japanese or English..."}
      className="h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-10 text-sm shadow-inner-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
    />
    {query && (
      <button
        type="button"
        onPointerDown={(e) => {
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

  {/* JLPT Filters for Grammar */}
  {mode === 'grammar' && (
    <div className="mt-4 px-6">
      <div className="no-scrollbar -mx-6 flex items-center gap-2 overflow-x-auto px-6 pb-2">
        <button
          onClick={() => setJlptFilter(null)}
          className={cn(
            "h-8 flex-shrink-0 rounded-full px-4 text-xs font-bold ring-1 smooth-colors tap-scale-sm",
            !jlptFilter 
              ? "bg-primary text-primary-foreground ring-primary" 
              : "bg-muted/60 text-muted-foreground ring-border/40"
          )}
        >
          All
        </button>
        {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => {
          const active = jlptFilter === level;
          const color = active ? (jlptColors as any)[level] : null;
          return (
            <button
              key={level}
              onClick={() => setJlptFilter(level)}
              className={cn(
                "h-8 flex-shrink-0 rounded-full px-4 text-xs font-bold ring-1 transition-all tap-scale-sm",
                active 
                  ? "text-white ring-transparent shadow-sm"
                  : "bg-muted/60 text-muted-foreground ring-border/40"
              )}
              style={active ? { backgroundColor: color } : {}}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  )}

  {searching && mode === 'words' && (
    <div className="mt-6 flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3.5 py-1.5 ring-1 ring-border/40 shadow-inner-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground"/>
        <span className="text-xs font-medium text-muted-foreground">Searching…</span>
      </div>
    </div>
  )}

  <div className={cn("stagger-children flex flex-col gap-3 px-6 pb-20", mode === 'grammar' ? "mt-4" : "mt-5")}>
    {mode === 'words' ? (
      <>
        {jishoResults.slice(0, visibleCount).map((result, idx) => {

          const disp = getDisplayWord(result, query);
          const word = disp.word || result.slug;
          const reading = disp.reading;
          
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
  onClick={(e) => goTo(`/dictionary/${encodeURIComponent(word)}`, e)}
  onKeyDown={(e) => {
    if (e.key ==='Enter'|| e.key ==='') {
      goTo(`/dictionary/${encodeURIComponent(word)}`, e);
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
      </>
    ) : (
      <>
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {grammarPoints.length} grammar points
          </p>
        </div>
        
        {grammarPoints.slice(0, visibleCount).map((note) => (
          <button
            key={note.id}
            onClick={(e) => goTo(`/grammar/${note.id}`, e, { state: { note } })}
            className="relative flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border/40 shadow-sm transition-all tap-scale text-left"
          >
            <div className="flex flex-col gap-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-japanese text-base font-bold text-foreground">
                  {note.pattern}
                </span>
                <span 
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: (jlptColors as any)[note.jlpt] }}
                >
                  {note.jlpt}
                </span>
              </div>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {note.meaning}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </button>
        ))}

        {grammarPoints.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Search className="h-9 w-9 text-primary"/>
            </div>
            <p className="mt-5 font-serif text-lg font-semibold">No grammar found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or JLPT filters.
            </p>
          </div>
        )}
      </>
    )}

    {((mode === 'words' && jishoResults.length > visibleCount) || (mode === 'grammar' && grammarPoints.length > visibleCount)) && (
      <div ref={sentinelRef} className="h-20 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
      </div>
    )}

    {mode === 'words' && !searching && query.trim() && jishoResults.length === 0 && (
      <p className="mt-8 text-center text-sm text-muted-foreground">No results found.</p>
    )}
    
    {mode === 'words' && !query.trim() && (
      <div className="mt-16 flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Search className="h-9 w-9 text-primary"/>
        </div>
        <p className="mt-5 font-serif text-lg font-semibold">Search the dictionary</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Type a word in Japanese or English to get started.
        </p>
      </div>
    )}
  </div>
</div>
);
}
