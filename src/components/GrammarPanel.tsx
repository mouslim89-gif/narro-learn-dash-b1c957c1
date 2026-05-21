import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { bookGrammar, type GrammarNote } from '@/data/book-grammar';
import { Skeleton } from '@/components/ui/skeleton';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { cn } from '@/lib/utils';

interface GrammarPanelProps {
  text: string;
  bookId: string;
  difficulty: string;
  coverColor: string;
  open: boolean;
  onClose: () => void;
}

export function GrammarPanel({ text, bookId, difficulty, coverColor, open, onClose }: GrammarPanelProps) {
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

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl ring-1 ring-border/40 animate-fade-in">
        {/* Tinted editorial header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 pt-4 pb-3"
          style={{
            backgroundImage: `linear-gradient(180deg, ${coverColor}1f 0%, hsl(var(--card)) 100%)`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 ring-1 ring-border/40">
              <Sparkles className="h-[15px] w-[15px] text-primary" />
            </span>
            <div>
              <p className="font-serif text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reader</p>
              <h2 className="font-serif text-base font-semibold leading-tight">Grammar notes</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 ring-1 ring-border/40 hover:bg-background transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-6 pt-3">
          {loading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <p className="text-center font-serif italic text-[13px] text-muted-foreground mt-1">
                Reading the text…
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl ring-1 ring-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => { setFetched(false); setError(null); }}
                className="mt-2 inline-block rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-[12px] font-semibold text-primary"
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
                    className={cn(
                      'group w-full rounded-2xl bg-card p-4 text-left ring-1 ring-border/40 transition-all hover:ring-border/70',
                      expanded && 'shadow-sm',
                    )}
                    style={expanded ? { backgroundImage: `linear-gradient(160deg, ${coverColor}14 0%, hsl(var(--card)) 70%)` } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-serif italic text-[11px] text-muted-foreground">{note.jlpt?.toUpperCase()}</p>
                        <p className="mt-0.5 font-japanese text-base font-bold leading-snug">{note.pattern}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground leading-snug">{note.meaning}</p>
                      </div>
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border/40 text-muted-foreground">
                        {expanded ? <ChevronUp className="h-[14px] w-[14px]" /> : <ChevronDown className="h-[14px] w-[14px]" />}
                      </span>
                    </div>

                    {expanded && (
                      <div className="mt-4 space-y-4 animate-in fade-in">
                        <div>
                          <p className="font-serif text-[13px] font-semibold text-foreground/80">Example from text</p>
                          <div className="mt-1 mb-2 h-px w-8 bg-border/60" />
                          <blockquote className="rounded-xl bg-muted/40 ring-1 ring-border/40 p-4">
                            <span className="font-serif text-2xl text-foreground/30 leading-none">&ldquo;</span>
                            <p className="font-japanese text-[15px] leading-relaxed">{note.example}</p>
                          </blockquote>
                        </div>
                        <div>
                          <p className="font-serif text-[13px] font-semibold text-foreground/80">Tip</p>
                          <div className="mt-1 mb-2 h-px w-8 bg-border/60" />
                          <p className="text-[13px] leading-relaxed text-foreground/85">{note.tip}</p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && notes.length === 0 && fetched && (
            <p className="text-center font-serif italic text-sm text-muted-foreground py-8">
              No grammar notes found for this text.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
