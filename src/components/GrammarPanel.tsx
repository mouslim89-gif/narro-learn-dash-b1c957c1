import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, Sparkles, X, Lightbulb, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { bookGrammar, type GrammarNote } from '@/data/book-grammar';

interface GrammarPanelProps {
  text: string;
  bookId: string;
  difficulty: string;
  open: boolean;
  onClose: () => void;
}

const jlptVar: Record<string, string> = {
  N5: '--n5',
  N4: '--n4',
  N3: '--n3',
  N2: '--n2',
  N1: '--n1',
};

function jlptColor(level: string, alpha = 1) {
  const v = jlptVar[level] || '--primary';
  return alpha === 1 ? `hsl(var(${v}))` : `hsl(var(${v}) / ${alpha})`;
}

export function GrammarPanel({ text, bookId, difficulty, open, onClose }: GrammarPanelProps) {
  const [notes, setNotes] = useState<GrammarNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched || !text) return;

    const prebaked = bookGrammar[bookId]?.[difficulty];
    if (prebaked && prebaked.length > 0) {
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
  }, [open, fetched, text, bookId, difficulty]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative z-50 w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border bg-card shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-300"
      >
        {/* Drag handle (visual) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-3.5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold leading-tight">Grammar Notes</h2>
              {notes.length > 0 && (
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {notes.length} pattern{notes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Subtle bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-3 h-3 bg-gradient-to-b from-card to-transparent" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border bg-card"
                  style={{ borderLeft: `4px solid hsl(var(--primary) / 0.25)` }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
                    </div>
                  </div>
                </div>
              ))}
              <p className="mt-2 text-center text-xs italic text-muted-foreground">
                Analyzing grammar patterns…
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => {
                  setFetched(false);
                  setError(null);
                }}
                className="rounded-full border border-destructive/40 px-4 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {notes.map((note, i) => {
                const expanded = expandedIdx === i;
                const color = jlptColor(note.jlpt);
                const tipBg = jlptColor(note.jlpt, 0.08);
                const tipBorder = jlptColor(note.jlpt, 0.5);
                return (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <button
                      onClick={() => setExpandedIdx(expanded ? null : i)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                    >
                      {/* JLPT pill */}
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {note.jlpt}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-japanese text-base font-bold leading-tight text-foreground">
                          {note.pattern}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {note.meaning}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expanded && (
                      <div className="space-y-2.5 px-4 pb-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Full meaning when truncated above */}
                        <p className="text-sm text-foreground/80">{note.meaning}</p>

                        {/* Example */}
                        <div className="rounded-xl bg-muted/50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Example from text
                          </p>
                          <p className="font-japanese text-base leading-relaxed text-foreground">
                            {note.example}
                          </p>
                        </div>

                        {/* Tip */}
                        <div
                          className="flex gap-2.5 rounded-xl p-3"
                          style={{
                            backgroundColor: tipBg,
                            borderLeft: `2px solid ${tipBorder}`,
                          }}
                        >
                          <Lightbulb
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color }}
                          />
                          <div className="min-w-0">
                            <p
                              className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest"
                              style={{ color }}
                            >
                              Tip
                            </p>
                            <p className="text-sm leading-relaxed text-foreground">{note.tip}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && notes.length === 0 && fetched && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No grammar notes for this passage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
