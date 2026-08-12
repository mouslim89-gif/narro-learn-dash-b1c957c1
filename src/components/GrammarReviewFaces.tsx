import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { jlptColors } from '@/data/books';
import { FuriganaSentence } from '@/components/FuriganaSentence';
import { supabase } from '@/integrations/supabase/client';
import { grammarSlug } from '@/lib/grammar-preload';
import type { SavedGrammar } from '@/stores/saved-grammar';
import { Info } from 'lucide-react';

interface GrammarExample {
  japanese: string;
  english?: string;
  tokens?: { t: string; r?: string }[];
}

interface Formation {
  parts: string[];
}

/**
 * Reads the grammar cache for a saved point.
 * localStorage first, then a single cheap select on `grammar_examples`.
 * Never triggers an AI generation.
 */
function useGrammarCache(item: SavedGrammar) {
  const [examples, setExamples] = useState<GrammarExample[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);

  useEffect(() => {
    let cancelled = false;
    setExamples([]);
    setFormations([]);

    const key = `grammar_cache_${item.pattern}_${item.jlpt}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const ex = Array.isArray(parsed.examples) ? parsed.examples : [];
        if (ex.length > 0) {
          setExamples(ex);
          setFormations(parsed.formations || []);
          return;
        }
      } catch {
        /* fall through to the DB read */
      }
    }

    supabase
      .from('grammar_examples')
      .select('examples')
      .eq('pattern_slug', grammarSlug(item.pattern))
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const raw: any = data.examples;
        const ex: GrammarExample[] = Array.isArray(raw) ? raw : raw?.items ?? [];
        const forms: Formation[] = Array.isArray(raw) ? [] : raw?.formations ?? [];
        setExamples(ex);
        setFormations(forms);
        try {
          localStorage.setItem(
            key,
            JSON.stringify({ examples: ex, formations: forms, timestamp: Date.now() }),
          );
        } catch {
          /* quota: ignore */
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.pattern, item.jlpt]);

  return { examples, formations };
}

export function GrammarCardFront({ item }: { item: SavedGrammar }) {
  return (
    <>
      <span className="pointer-events-none select-none absolute -top-10 -right-6 font-japanese text-[220px] leading-none font-bold text-foreground/[0.025]">
        文
      </span>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
          style={{ backgroundColor: jlptColors[item.jlpt] || '#888' }}
        >
          {item.jlpt}
        </span>
        <p className="mt-5 font-japanese text-[40px] leading-tight font-bold tracking-tight text-foreground select-none break-words">
          {item.pattern}
        </p>
        <div className="mt-7 h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          Grammar
        </p>
      </div>

      <p className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] uppercase tracking-[0.25em] font-medium text-muted-foreground/50 pointer-events-none">
        Tap to reveal
      </p>
    </>
  );
}

export function GrammarCardBack({ item }: { item: SavedGrammar }) {
  const { examples, formations } = useGrammarCache(item);
  const example = examples[0];

  return (
    <>
      {/* Header — pattern */}
      <div className="flex-none px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: jlptColors[item.jlpt] || '#888' }}
          >
            {item.jlpt}
          </span>
          <p className="font-japanese text-[26px] leading-tight font-bold tracking-tight truncate">
            {item.pattern}
          </p>
        </div>
      </div>

      <div className="mx-5 h-px bg-border/60" />

      {/* Body — scrollable */}
      <div className="flex-1 min-h-0 px-5 py-4 overflow-y-auto overscroll-contain">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-2">
            Meaning
          </p>
          <p className="text-[15px] leading-snug text-foreground">{item.meaning}</p>
        </section>

        {formations.length > 0 && (
          <section className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-2">
              Formation
            </p>
            <div className="flex flex-col gap-3">
              {formations.map((f, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
                        OR
                      </span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-y-2">
                    {f.parts.map((part, pi) => (
                      <div key={pi} className="flex items-center">
                        <span
                          className={cn(
                            'inline-block rounded-lg border px-2 py-0.5 text-xs font-bold shadow-sm',
                            /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(part)
                              ? 'font-japanese bg-accent/15 text-accent border-accent/30'
                              : 'bg-muted/60 text-foreground border-border/80',
                          )}
                        >
                          {part}
                        </span>
                        {pi < f.parts.length - 1 && (
                          <span className="text-foreground font-black text-sm px-1.5">+</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-1.5">
            Example
          </p>
          {example ? (
            <>
              <FuriganaSentence
                tokens={example.tokens}
                fallbackText={example.japanese}
                highlight={item.pattern.replace(/[～〜\s]/g, '').split('/')[0]}
                className="font-japanese text-[15px] leading-relaxed text-foreground/90"
              />
              {example.english && (
                <p className="mt-1 text-[12px] text-muted-foreground">{example.english}</p>
              )}
            </>
          ) : (
            <p className="font-japanese text-[15px] leading-relaxed text-foreground/90">
              {item.example}
            </p>
          )}
        </section>

        {item.tip && (
          <section className="mt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="h-3 w-3 text-foreground/55 shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                Usage notes
              </p>
            </div>
            <p className="font-serif text-[14px] italic leading-relaxed text-foreground/85">
              {item.tip}
            </p>
          </section>
        )}
      </div>
    </>
  );
}
