import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { jlptColors } from '@/data/books';
import { cn } from '@/lib/utils';
import { getGrammarFlat, getGrammarForPart, type GrammarNote } from '@/data/book-grammar';
import { Skeleton } from '@/components/ui/skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { preloadTranslations, hashSentence, type TranslationMap } from '@/lib/sentence-translations';

interface GrammarPanelProps {
  text: string;
  bookId: string;
  difficulty: string;
  /** When set, only show grammar for this 0-indexed narrative part. */
  partIdx?: number | null;
  open: boolean;
  onClose: () => void;
  onJumpToExample?: (example: string) => void;
}

export function GrammarPanel({ text, bookId, difficulty, partIdx, open, onClose, onJumpToExample }: GrammarPanelProps) {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);
  const [translations, setTranslations] = useState<TranslationMap>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset when the part changes so the panel re-pulls the matching subset.
  useEffect(() => {
    setFetched(false);
    setNotes([]);
    setExpandedIdx(null);
    setTranslations(new Map());
  }, [bookId, difficulty, partIdx]);

  useEffect(() => {
    if (!open) {
      abortControllerRef.current?.abort();
      return;
    }

    if (fetched || !text) return;

    const prebaked = (partIdx !== null && partIdx !== undefined)
      ? getGrammarForPart(bookId, difficulty, partIdx)
      : getGrammarFlat(bookId, difficulty);
    
    if (prebaked.length > 0) {
      setNotes(prebaked);
      setFetched(true);
      return;
    }

    setLoading(true);
    setError(null);

    supabase.functions
      .invoke('grammar-notes', { body: { text } })
      .then(({ data, error: fnError }) => {
        if (fnError) {
          setError('Failed to load grammar notes.');
          console.error(fnError);
        } else if (data?.notes) {
          setNotes(data.notes);
          setFetched(true);
        } else if (data?.error) {
          setError(data.error);
        }
      })
      .finally(() => setLoading(false));
  }, [open, fetched, text, bookId, difficulty, partIdx]);

  // Batch preload translations for examples once notes are loaded
  useEffect(() => {
    if (notes.length === 0 || !open) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const examples = notes.map(n => n.example).filter(Boolean);
    if (examples.length === 0) return;

    preloadTranslations(examples, {
      onProgress: (map) => {
        setTranslations(map);
      },
      signal: abortControllerRef.current.signal
    });

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [notes, open]);

  const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

  // Cache of hashes to avoid repeated async calls in render
  const [hashes, setHashes] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (notes.length === 0) return;
    Promise.all(notes.map(n => hashSentence(n.example))).then(hList => {
      const newHashes = new Map();
      notes.forEach((n, i) => newHashes.set(n.example, hList[i]));
      setHashes(newHashes);
    });
  }, [notes]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent
        className="max-h-[85vh] bg-background p-0 ring-1 ring-border/40 shadow-lg border-0"
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>Grammar Notes</DrawerTitle>
        </DrawerHeader>
        
        <div className="flex flex-col h-full overflow-hidden pt-4">
          <div className="bg-background px-5 pb-3 border-b border-border/40">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="wordmark font-serif text-[20px] leading-none">Grammar Notes</h2>
              {notes.length > 0 && (
                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
          {loading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <p className="text-center text-xs text-muted-foreground mt-2">
                Analyzing grammar patterns…
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-card ring-1 ring-border/30 p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20 mb-4">
                <p className="text-xl">⚠️</p>
              </div>
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => { setFetched(false); setError(null); }}
                className="mt-4 text-xs font-semibold text-accent uppercase tracking-wider tap-scale-sm"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="flex flex-col gap-3">
              {[...notes]
                .sort((a, b) => {
                  const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 } as const;
                  return (order[a.jlpt] ?? 99) - (order[b.jlpt] ?? 99);
                })
                .map((note, i) => {
                  const expanded = expandedIdx === i;
                  const hash = hashes.get(note.example);
                  const translation = hash ? translations.get(hash) : null;

                  return (
                    <div
                      key={i}
                      className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm overflow-hidden smooth-colors"
                    >
                      <button
                        onClick={() => setExpandedIdx(expanded ? null : i)}
                        className="w-full p-4 text-left tap-scale flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white shrink-0 mt-0.5"
                              style={{ backgroundColor: jlptColors[note.jlpt] || '#888' }}
                            >
                              {note.jlpt}
                            </span>
                            <span className="font-japanese text-base font-bold break-words leading-snug min-w-0 flex-1">
                              {note.pattern}
                            </span>
                          </div>
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform duration-200",
                              expanded && "rotate-180"
                            )} 
                          />
                        </div>
                        <p className="font-serif text-sm text-muted-foreground">{note.meaning}</p>
                      </button>

                      {expanded && (
                        <div className="px-4 pb-4 pt-0 space-y-3 animate-fade-in-soft">
                          <button 
                            className="w-full text-left rounded-xl bg-muted/50 ring-1 ring-border/30 p-3 relative tap-scale-sm transition-colors active:bg-muted/70 smooth-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToExample?.(note.example);
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Example from text</p>
                              </div>
                              <span className="text-[10px] font-medium text-accent">
                                Jump to text →
                              </span>
                            </div>
                            <p className="mt-2 font-japanese text-sm">{note.example}</p>
                            {translation && (
                              <p className="mt-1.5 text-[12px] text-muted-foreground leading-snug italic animate-in fade-in duration-300">
                                {translation}
                              </p>
                            )}
                          </button>

                          <div className="rounded-xl bg-accent/5 ring-1 ring-accent/20 p-3">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">Tip</p>
                            </div>
                            <p className="mt-2 font-serif text-sm text-foreground">{note.tip}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {!loading && !error && notes.length === 0 && fetched && (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 mb-4 opacity-40">
                <p className="text-xl">📭</p>
              </div>
              <p className="text-sm text-muted-foreground">
                No grammar notes found for this text.
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
