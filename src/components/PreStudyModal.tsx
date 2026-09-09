import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Plus, ArrowRight, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StretchyCards } from '@/components/StretchyCards';
import { loadBookTokens, type BookToken } from '@/data/book-tokens';
import { getCached } from '@/lib/jisho';
import { readWordEntry, hydrateDictionaryForBook } from '@/lib/dictionary-db';
import { useFlashcardStore } from '@/stores/flashcards';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@/data/books';

const KANJI_RE = /[一-鿿]/;
const CONTENT_POS = /^(名詞|動詞|形容詞|副詞)/;
const TARGET_COUNT = 20;

interface PreStudyWord {
  /** dictionary form (also used as flashcard id) */
  base: string;
  reading: string;
  meanings: string[];
  jlpt: string[];
  partsOfSpeech: string[];
  frequency: number;
}

interface PreStudyModalProps {
  open: boolean;
  bookId: string;
  difficulty: Difficulty;
  /** Called on skip or finish — must mark the book+difficulty as seen. */
  onClose: () => void;
}


/** Pick the most useful words to pre-study: frequent, kanji-bearing content words. */
async function pickKeyWords(
  bookId: string,
  difficulty: Difficulty,
  exclude: Set<string>
): Promise<PreStudyWord[]> {
  const map = await loadBookTokens(bookId);
  const freq = new Map<string, { count: number; reading?: string; pos?: string }>();
  for (const chapterDict of Object.values(map)) {
    const list: BookToken[] | undefined = chapterDict[difficulty];
    if (!list) continue;
    for (const t of list) {
      if (!t.j || !t.p || !CONTENT_POS.test(t.p)) continue;
      const base = t.b || t.t;
      if (!KANJI_RE.test(base) || base.length > 6) continue;
      const entry = freq.get(base) ?? { count: 0 };
      entry.count += 1;
      if (!entry.reading && t.r) entry.reading = t.r;
      if (!entry.pos && t.p) entry.pos = t.p;
      freq.set(base, entry);
    }
  }
  // Skip words already saved as flashcards or marked known, then fill up to TARGET_COUNT.
  const ranked = [...freq.entries()]
    .filter(([base]) => !exclude.has(base))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TARGET_COUNT);

  return Promise.all(
    ranked.map(async ([base, info]) => {
      // Cache-only lookups — never trigger a network/AI call here.
      let entry = getCached(base);
      if (!entry) {
        try {
          entry = await readWordEntry(base);
        } catch {
          entry = undefined;
        }
      }
      const result = entry?.results?.[0];
      const jp = result?.japanese?.[0];
      return {
        base,
        reading: jp?.reading ?? info.reading ?? '',
        meanings: result?.senses?.[0]?.english_definitions?.slice(0, 3) ?? [],
        jlpt: result?.jlpt ?? [],
        partsOfSpeech: result?.senses?.[0]?.parts_of_speech ?? (info.pos ? [info.pos] : []),
        frequency: info.count,
      };
    })
  );
}

export function PreStudyModal({ open, bookId, difficulty, onClose }: PreStudyModalProps) {
  const [words, setWords] = useState<PreStudyWord[] | null>(null);
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const addWord = useFlashcardStore((s) => s.addWord);
  const removeWord = useFlashcardStore((s) => s.removeWord);
  const savedWords = useFlashcardStore((s) => s.savedWords);

  const knownWords = useReadingProgressStore((s) => s.knownWords);
  const markWordKnown = useReadingProgressStore((s) => s.markWordKnown);
  const unmarkWordKnown = useReadingProgressStore((s) => s.unmarkWordKnown);

  const savedIds = useMemo(() => new Set(savedWords.map((w) => w.id)), [savedWords]);
  const knownIds = useMemo(() => new Set(knownWords), [knownWords]);

  // Frozen at open time so tiles don't vanish the moment they're tapped.
  const excludeRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setVisible(true);
    setClosing(false);
    setWords(null);
    excludeRef.current = new Set([
      ...useFlashcardStore.getState().savedWords.map((w) => w.id),
      ...useReadingProgressStore.getState().knownWords,
    ]);
    let cancelled = false;
    // Make sure the dictionary shards for this book are warm before we read them.
    hydrateDictionaryForBook(bookId)
      .catch(() => {})
      .then(() => pickKeyWords(bookId, difficulty, excludeRef.current))
      .then((picked) => {
        if (cancelled) return;
        setWords(picked);
        if (picked.length === 0) {
          setClosing(true);
          setVisible(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClosing(true);
          setVisible(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, bookId, difficulty]);

  if (!open) return null;

  const total = words?.length ?? 0;
  const selectedCount = words ? words.filter((w) => savedIds.has(w.base)).length : 0;
  const allSelected = total > 0 && selectedCount === total;

  const save = (w: PreStudyWord) =>
    addWord({
      id: w.base,
      word: w.base,
      reading: w.reading,
      meanings: w.meanings,
      jlpt: w.jlpt,
      partsOfSpeech: w.partsOfSpeech,
    });

  const toggle = (w: PreStudyWord) => {
    if (savedIds.has(w.base)) removeWord(w.base, { silent: true });
    else save(w);
  };

  const toggleAll = () => {
    if (!words) return;
    if (allSelected) words.forEach((w) => removeWord(w.base, { silent: true }));
    else words.filter((w) => !savedIds.has(w.base)).forEach(save);
  };

  /** Toggle "already known": no flashcard, never proposed again. The tile stays, just marked. */
  const toggleKnown = (w: PreStudyWord) => {
    if (knownIds.has(w.base)) {
      unmarkWordKnown(w.base);
    } else {
      if (savedIds.has(w.base)) removeWord(w.base, { silent: true });
      markWordKnown(w.base);
    }
  };

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
    <AnimatePresence onExitComplete={onClose}>
    {visible && (
    <motion.div
      initial={{ x: '100%', opacity: 0.98 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0.98 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col overflow-hidden bg-background"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-5 pb-3"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Before you read</h2>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            The {TARGET_COUNT} most frequent words in this book. Tap one to add it to your
            flashcards, or mark it as already known.
          </p>
        </div>
        <button
          onClick={requestClose}
          disabled={closing}
          aria-label="Skip pre-study"
          className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border/40 relief-raised tap-scale-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!words ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">Preparing key words…</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-5">
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {selectedCount} of {total} selected
            </p>
            <button
              onClick={toggleAll}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-accent tap-scale-sm"
            >
              {allSelected ? 'Clear' : 'Select all'}
            </button>
          </div>

          {/* p-1 so the selected ring isn't clipped by the scroll container */}
          <div className="no-scrollbar mt-2 flex-1 overflow-y-auto px-5 py-1 pb-24">
            <div className="grid grid-cols-2 gap-2.5">
              {words.map((w) => {
                const selected = savedIds.has(w.base);
                const known = knownIds.has(w.base);
                return (
                  <div
                    key={w.base}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(w)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(w);
                      }
                    }}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Remove' : 'Add'} ${w.base}`}
                    className={cn(
                      'relative flex flex-col items-start rounded-2xl bg-card p-2.5 text-left ring-1 ring-border/30 relief-raised tap-scale smooth-colors',
                      selected && 'bg-accent/5 ring-2 ring-accent/60',
                      known && 'bg-primary/10 ring-2 ring-primary/50'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full',
                        known
                          ? 'bg-primary text-primary-foreground'
                          : selected
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground ring-1 ring-border/50'
                      )}
                    >
                      {selected || known ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        <Plus className="h-3 w-3" strokeWidth={3} />
                      )}
                    </span>
                    <p className="font-jp-serif text-lg font-semibold leading-tight pr-6">{w.base}</p>
                    {w.reading && w.reading !== w.base && (
                      <p className="mt-0.5 font-japanese text-[10px] text-muted-foreground">{w.reading}</p>
                    )}
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-foreground/75">
                      {w.meanings.length > 0 ? w.meanings.join(', ') : '—'}
                    </p>
                    <p className="mt-2 text-[9px] tabular-nums text-muted-foreground/80">
                      appears {w.frequency} {w.frequency === 1 ? 'time' : 'times'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKnown(w);
                      }}
                      aria-pressed={known}
                      aria-label={`Mark ${w.base} as already known`}
                      className={cn(
                        'mt-2 flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-wide tap-scale-sm smooth-colors',
                        known
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                          : 'bg-muted/70 text-muted-foreground'
                      )}
                    >
                      <CircleCheck className="h-3 w-3" strokeWidth={2.5} />
                      {known ? 'Known ✓' : 'Known'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-transparent px-5"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <Button
              size="lg"
              onClick={requestClose}
              disabled={closing}
              className="btn-tsundoku-premium pointer-events-auto h-12 w-full rounded-full border-none font-serif text-[15px] font-bold tap-scale"
            >
              Start reading
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
    )}
    </AnimatePresence>
    </div>
  );
}
