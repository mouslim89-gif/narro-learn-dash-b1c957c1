import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { jlptColors } from '@/data/books';
import { bookGrammar, type GrammarNote } from '@/data/book-grammar';
import { Skeleton } from '@/components/ui/skeleton';

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

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-t-xl sm:rounded-xl border bg-card shadow-xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Grammar Notes</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <p className="text-center text-xs text-muted-foreground mt-2">
                Analyzing grammar patterns…
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => { setFetched(false); setError(null); }}
                className="mt-2 text-xs text-primary underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="flex flex-col gap-2">
              {notes.map((note, i) => {
                const expanded = expandedIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => setExpandedIdx(expanded ? null : i)}
                    className="w-full rounded-lg border bg-background p-4 text-left transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: jlptColors[note.jlpt] || '#888' }}
                        >
                          {note.jlpt}
                        </span>
                        <span className="font-japanese text-base font-bold">{note.pattern}</span>
                      </div>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{note.meaning}</p>

                    {expanded && (
                      <div className="mt-3 space-y-2 animate-in fade-in">
                        <div className="rounded bg-muted/50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                            Example from text
                          </p>
                          <p className="font-japanese text-sm">{note.example}</p>
                        </div>
                        <div className="rounded bg-primary/5 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">
                            💡 Tip
                          </p>
                          <p className="text-sm text-foreground">{note.tip}</p>
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
