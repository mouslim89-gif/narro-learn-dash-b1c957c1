import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { jlptColors } from '@/data/books';
import type { GrammarNote } from '@/data/book-grammar';
import { FuriganaSentence } from '@/components/FuriganaSentence';
import { useSavedGrammarStore } from '@/stores/saved-grammar';
import { supabase } from '@/integrations/supabase/client';
import { preloadTranslations, type TranslationMap } from '@/lib/sentence-translations';

export default function GrammarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSaved, saveGrammar, removeGrammar } = useSavedGrammarStore();

  const [note, setNote] = useState<GrammarNote | null>(location.state?.note || null);
  const [loading, setLoading] = useState(!note);
  const [examples, setExamples] = useState<{ japanese: string; english: string; tokens?: any[] }[]>([]);
  const [formations, setFormations] = useState<{ parts: string[] }[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [translations, setTranslations] = useState<TranslationMap>(new Map());
  const [exampleTokens, setExampleTokens] = useState<{ t: string; r?: string }[] | null>(null);

  useEffect(() => {
    if (!note && id) {
      const saved = useSavedGrammarStore.getState().savedItems.find(i => i.id === id);
      if (saved) {
        setNote(saved);
        setLoading(false);
      } else {
        // We could search in all book data here if needed
        setLoading(false);
      }
    }
  }, [id, note]);

  useEffect(() => {
    if (!note) return;

    const fetchAiExamples = async () => {
      // Cache-first: a valid local entry means no network call and no AI cost.
      const cacheKey = `grammar_cache_${note.pattern}_${note.jlpt}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.examples) && parsed.examples.length > 0) {
            setExamples(parsed.examples);
            setFormations(parsed.formations || []);
            setLoadingMore(false);
            preloadTranslations(
              parsed.examples.map((ex: any) => ex.japanese),
              { onProgress: (map) => setTranslations((prev) => new Map([...prev, ...map])) },
            );
            return;
          }
        } catch (e) {
          console.error("Failed to parse grammar cache", e);
        }
      }

      setLoadingMore(true);
      try {
        const { data, error } = await supabase.functions.invoke('grammar-examples', {
          body: {
            pattern: note.pattern,
            meaning: note.meaning,
            jlpt: note.jlpt
          }
        });
        
        if (data) {
          if (data.examples) {
            setExamples(data.examples);
            
            // Preload translations
            const texts = data.examples.map((ex: any) => ex.japanese);
            preloadTranslations(texts, {
              onProgress: (map) => setTranslations(prev => new Map([...prev, ...map]))
            });
          }
          if (data.formations) {
            setFormations(data.formations);
          }

          // Save to local cache
          localStorage.setItem(cacheKey, JSON.stringify({
            examples: data.examples,
            formations: data.formations,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        console.error("Failed to fetch grammar examples:", err);
      } finally {
        setLoadingMore(false);
      }
    };

    fetchAiExamples();
  }, [note]);

  // Furigana for the "From your reading" extract — cached locally, one AI call app-wide.
  useEffect(() => {
    if (!note?.example) return;
    setExampleTokens(null);

    const cacheKey = `grammar_cache_${note.pattern}_${note.jlpt}`;
    const readCache = () => {
      try {
        return JSON.parse(localStorage.getItem(cacheKey) || 'null') || {};
      } catch {
        return {};
      }
    };

    const cached = readCache();
    if (Array.isArray(cached.exampleTokens) && cached.exampleTokens.length > 0) {
      setExampleTokens(cached.exampleTokens);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('tatoeba-example', {
          body: { mode: 'tokenize', sentence: note.example },
        });
        const tokens = data?.tokens;
        if (!Array.isArray(tokens) || tokens.length === 0) return;
        if (!cancelled) setExampleTokens(tokens);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ ...readCache(), exampleTokens: tokens }));
        } catch {
          /* quota: ignore */
        }
      } catch (err) {
        console.error('Failed to tokenize grammar example:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [note]);



  const saved = id ? isSaved(id) : false;

  const toggleSave = () => {
    if (!note || !id) return;
    if (saved) {
      removeGrammar(id);
    } else {
      saveGrammar({ ...note, id });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/my-books');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Grammar point not found.</p>
        <Button variant="link" onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const highlightPattern = note.pattern.replace(/^〜|〜$/g, '').trim();

  return (
    <div className="pb-24">
      {/* Top bar - matched with WordDetail.tsx */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-6 pt-3 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 shrink-0 header-chip"
          aria-label="Back"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Grammar</p>
          <p className="font-japanese text-base font-bold truncate mt-0.5">{note.pattern}</p>
        </div>
        <button
          onClick={toggleSave}
          className={cn(
            "h-10 w-10 rounded-full ring-1 ring-border/40 bg-background/80 backdrop-blur-md flex items-center justify-center shrink-0 header-chip transition-colors",
            saved ? "text-accent" : "text-muted-foreground"
          )}
        >
          <Star className="h-[18px] w-[18px]" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </header>

      <div className="stagger-children px-6 mt-4 space-y-5">
        {/* Hero Card - Formation as the star */}
        <section className="rounded-2xl bg-card p-4 ring-1 ring-border/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
              style={{ backgroundColor: jlptColors[note.jlpt] || '#888' }}
            >
              {note.jlpt}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground ml-auto">
              {note.pattern}
            </span>
          </div>

          <div className="space-y-4">
            {loadingMore && formations.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-3/4 rounded-xl bg-accent/5" />
                <Skeleton className="h-5 w-1/2 rounded-lg bg-muted/20" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {formations.length > 0 ? (
                    formations.map((f, i) => (
                      <div key={i} className="relative">
                        {i > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-border/40" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 bg-background px-2">OR</span>
                            <div className="h-px flex-1 bg-border/40" />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-y-2">
                          {f.parts.map((part, pi) => (
                            <div key={pi} className="flex items-center">
                              <span className={cn(
                                "inline-block rounded-lg border px-2 py-0.5 text-xs font-bold transition-colors shadow-sm",
                                /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(part) 
                                  ? "font-japanese bg-accent/15 text-accent border-accent/30" 
                                  : "bg-muted/60 text-foreground border-border/80"
                              )}>
                                {part}
                              </span>
                              {pi < f.parts.length - 1 && (
                                <span className="text-foreground font-black text-sm px-1.5 drop-shadow-sm">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <h1 className="font-japanese text-2xl font-bold leading-tight break-words">{note.pattern}</h1>
                  )}
                </div>
                <p className="font-serif text-base text-muted-foreground leading-snug">{note.meaning}</p>
              </>
            )}
          </div>

          <Button
            onClick={toggleSave}
            className={cn(
              "mt-6 w-full rounded-full h-11 font-semibold transition-all",
              saved ? "bg-accent/15 text-accent relief-inset" : "bg-accent text-accent-foreground relief-raised-accent"
            )}
            variant="ghost"
          >
            {saved ? (
              <><Star className="h-4 w-4 mr-1.5" fill="currentColor" /> Saved to bookmarks</>
            ) : (
              <><Star className="h-4 w-4 mr-1.5" /> Save to bookmarks</>
            )}
          </Button>
        </section>

        {/* Tip - Style matched with WordDetail sections */}
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-accent" />
            <h2 className="font-serif text-lg font-semibold">Usage Notes</h2>
          </div>
          <p className="font-serif text-[15px] text-foreground/90 leading-relaxed italic">
            {note.tip}
          </p>
        </section>

        {/* Primary Example - Matched style */}
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40 shadow-sm">
          <h2 className="font-serif text-lg font-semibold mb-3">From your reading</h2>
          <div className="font-jp-serif text-lg leading-relaxed text-foreground/90 border-l-4 border-primary/20 pl-4 py-1">
            <FuriganaSentence tokens={exampleTokens ?? undefined} fallbackText={note.example} />
          </div>
        </section>

        {/* Additional Examples - Renamed from AI-generated */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold ml-1">Examples</h2>
          
          {loadingMore && examples.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          )}

          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="rounded-2xl bg-card p-4 ring-1 ring-border/30 shadow-sm animate-fade-in-soft">
                <div className="text-base leading-relaxed text-foreground">
                  {ex.tokens ? (
                    <FuriganaSentence tokens={ex.tokens} highlight={highlightPattern} />
                  ) : (
                    ex.japanese
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground italic leading-snug">
                  {ex.english}
                </p>
              </div>
            ))}
          </div>

          {!loadingMore && examples.length === 0 && (
            <div className="py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border/60">
              <p className="text-xs text-muted-foreground">Generating examples...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
