import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { jlptColors } from '@/data/books';
import { getGrammarFlat, getGrammarForPart, type GrammarNote } from '@/data/book-grammar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { translateSentence } from '@/lib/translate';

interface GrammarPanelProps {
  text: string;
  bookId: string;
  difficulty: string;
  /** When set, only show grammar for this 0-indexed narrative part. */
  partIdx?: number | null;
  open: boolean;
  onClose: () => void;
}

export function GrammarPanel({ text, bookId, difficulty, partIdx, open, onClose }: GrammarPanelProps) {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);
  const [translations, setTranslations] = useState<Record<number, { text?: string; loading: boolean; error?: boolean }>>({});

  // Reset when the part changes so the panel re-pulls the matching subset.
  useEffect(() => {
    setFetched(false);
    setNotes([]);
    setExpandedIdx(null);
    setTranslations({});
  }, [bookId, difficulty, partIdx]);

  useEffect(() => {
    if (!open || fetched || !text) return;

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

  const fetchTranslation = async (idx: number, sentence: string) => {
    if (translations[idx]?.text || translations[idx]?.loading) return;

    setTranslations(prev => ({ ...prev, [idx]: { loading: true } }));
    try {
      const result = await translateSentence(sentence);
      setTranslations(prev => ({ ...prev, [idx]: { text: result, loading: false } }));
    } catch (err) {
      console.error('Failed to translate grammar example:', err);
      setTranslations(prev => ({ ...prev, [idx]: { loading: false, error: true } }));
    }
  };

  const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[80vh] overflow-y-auto bg-background p-0"
      >
        <div className="sticky top-0 z-10 bg-background px-5 pt-6 pb-3 border-b border-border/40">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="wordmark font-serif text-[22px] leading-none">Grammar Notes</h2>
            {notes.length > 0 && (
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
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
            <div className="rounded-2xl bg-card ring-1 ring-destructive/30 p-4 text-center shadow-sm">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => { setFetched(false); setError(null); }}
                className="mt-2 text-xs text-accent underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {[...notes]
                .sort((a, b) => {
                  const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 } as const;
                  return (order[a.jlpt] ?? 99) - (order[b.jlpt] ?? 99);
                })
                .map((note, i) => {
                  const expanded = expandedIdx === i;
                  const translation = translations[i];
                  
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const newExpanded = expanded ? null : i;
                        setExpandedIdx(newExpanded);
                        if (newExpanded !== null) {
                          fetchTranslation(i, note.example);
                        }
                      }}
                      className="card-lift tap-scale w-full rounded-xl border border-border/40 bg-card p-4 text-left ring-1 ring-border/30 smooth-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: jlptColors[note.jlpt] || '#888' }}
                          >
                            {note.jlpt}
                          </span>
                          <span className="font-japanese text-base font-bold break-words leading-snug min-w-0 flex-1">{note.pattern}</span>
                        </div>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="mt-1 font-serif text-sm text-muted-foreground">{note.meaning}</p>

                      {expanded && (
                        <div className="mt-3 space-y-2.5 animate-in fade-in">
                          <div className="rounded-xl bg-muted/40 ring-1 ring-border/30 p-3">
                            <p className={sectionLabel}>Example from text</p>
                            <div className="mt-1 h-px w-8 bg-accent/60" />
                            <p className="mt-2 font-japanese text-sm">{note.example}</p>
                            {translation?.loading && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground/60">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-[10px] italic">Translating…</span>
                              </div>
                            )}
                            {translation?.text && (
                              <p className="mt-1.5 text-xs text-muted-foreground italic leading-snug">
                                {translation.text}
                              </p>
                            )}
                          </div>
                          <div className="rounded-xl bg-accent/5 ring-1 ring-accent/20 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Tip</p>
                            <div className="mt-1 h-px w-8 bg-accent/60" />
                            <p className="mt-2 font-serif text-sm text-foreground">{note.tip}</p>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {!loading && !error && notes.length === 0 && fetched && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No grammar notes found for this text.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}