import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { jlptColors } from '@/data/books';
import { bookGrammar, type GrammarNote } from '@/data/book-grammar';
import { Skeleton } from '@/components/ui/skeleton';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

interface GrammarPanelProps {
  text: string;
  bookId: string;
  difficulty: string;
  open: boolean;
  onClose: () => void;
}

export function GrammarPanel({ text, bookId, difficulty, open, onClose }: GrammarPanelProps) {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || fetched || !text) return;

    // Check pre-baked data first
    const prebaked = bookGrammar[bookId]?.[difficulty];
    if (prebaked && prebaked.length > 0) {
      setNotes(prebaked);
      setFetched(true);
      return;
    }

    // Fallback to edge function
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
  }, [open, fetched, text, bookId, difficulty]);

  if (!open) return null;

  const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card ring-1 ring-border/40 shadow-lg animate-fade-in">
        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-2">
          <div className="h-1.5 w-10 rounded-full bg-border/60" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card/95 backdrop-blur-md px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base text-accent/80">文</span>
            <h2 className="wordmark font-serif text-base">Grammar Notes</h2>
          </div>
          <button
            onClick={onClose}
            className="tap-scale-sm rounded-full bg-muted/50 p-1.5 ring-1 ring-border/30 smooth-colors hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5 pt-3">
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
              {notes.map((note, i) => {
                const expanded = expandedIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => setExpandedIdx(expanded ? null : i)}
                    className="w-full rounded-2xl bg-card ring-1 ring-border/30 shadow-sm p-4 text-left smooth-colors hover:ring-border/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shrink-0"
                          style={{ backgroundColor: jlptColors[note.jlpt] || '#888' }}
                        >
                          {note.jlpt}
                        </span>
                        <span className="font-japanese text-base font-bold truncate">{note.pattern}</span>
                      </div>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 font-serif text-sm text-muted-foreground">{note.meaning}</p>

                    {expanded && (
                      <div className="mt-3 space-y-2.5 animate-in fade-in">
                        <div className="rounded-xl bg-muted/40 ring-1 ring-border/30 p-3">
                          <p className={sectionLabel}>Example from text</p>
                          <div className="mt-1 h-px w-8 bg-accent/60" />
                          <p className="mt-2 font-japanese text-sm">{note.example}</p>
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
      </div>
    </div>
  );
}
