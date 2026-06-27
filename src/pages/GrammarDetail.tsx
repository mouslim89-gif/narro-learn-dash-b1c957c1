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
  const [structure, setStructure] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [translations, setTranslations] = useState<TranslationMap>(new Map());

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
          if (data.structure) {
            setStructure(data.structure);
          }
        }
      } catch (err) {
        console.error("Failed to fetch grammar examples:", err);
      } finally {
        setLoadingMore(false);
      }
    };

    fetchAiExamples();
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
        {/* Main Header Card - matched style with WordDetail */}
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
                  style={{ backgroundColor: jlptColors[note.jlpt] || '#888' }}
                >
                  {note.jlpt}
                </span>
              </div>
              <h1 className="font-japanese text-3xl font-bold leading-tight break-words">{note.pattern}</h1>
              <p className="font-serif text-lg text-muted-foreground mt-1 leading-snug">{note.meaning}</p>
            </div>
          </div>

          {/* Visual Structure Element */}
          {(structure || (loadingMore && !structure)) && (
            <div className="mt-5 p-4 rounded-xl bg-accent/5 ring-1 ring-accent/20 border-l-4 border-accent">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Structure</p>
              {loadingMore && !structure ? (
                <Skeleton className="h-6 w-3/4 bg-accent/10" />
              ) : (
                <div className="font-japanese text-lg font-medium text-foreground tracking-wide">
                  {structure}
                </div>
              )}
            </div>
          )}
          
          <Button
            onClick={toggleSave}
            className={cn(
              "mt-5 w-full rounded-full h-11 font-semibold transition-all",
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
            {note.example}
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
                <div className="font-jp-serif text-base leading-relaxed text-foreground">
                  {ex.tokens ? (
                    <FuriganaSentence tokens={ex.tokens} highlight={note.pattern} />
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
