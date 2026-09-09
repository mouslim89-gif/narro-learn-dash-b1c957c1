import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, Plus, ArrowRight, CircleCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

function frequencyLabel(count: number) {
  if (count >= 50) return 'everywhere';
  if (count >= 30) return 'very common';
  if (count >= 15) return 'common';
  if (count >= 7) return 'frequent';
  if (count >= 4) return 'uncommon';
  return 'rare';
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
  const addWord = useFlashcardStore((s) => s.addWord);
  const removeWord = useFlashcardStore((s) => s.removeWord);
  const savedWords = useFlashcardStore((s) => s.savedWords);

  const savedIds = useMemo(() => new Set(savedWords.map((w) => w.id)), [savedWords]);

  useEffect(() => {
    if (!open) return;
    setWords(null);
    let cancelled = false;
    // Make sure the dictionary shards for this book are warm before we read them.
    hydrateDictionaryForBook(bookId)
      .catch(() => {})
      .then(() => pickKeyWords(bookId, difficulty))
      .then((picked) => {
        if (cancelled) return;
        setWords(picked);
        if (picked.length === 0) onClose();
      })
      .catch(() => {
        if (!cancelled) onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [open, bookId, difficulty]);

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
    if (savedIds.has(w.base)) removeWord(w.base);
    else save(w);
  };

  const toggleAll = () => {
    if (!words) return;
    if (allSelected) words.forEach((w) => removeWord(w.base));
    else words.filter((w) => !savedIds.has(w.base)).forEach(save);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[360px] sm:max-w-md rounded-3xl border-border/40 bg-background p-0 overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Pre-study key words</DialogTitle>

        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Before you read
          </p>
          <button
            onClick={onClose}
            aria-label="Skip pre-study"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground tap-scale-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!words ? (
          <div className="flex h-72 items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">Preparing key words…</p>
          </div>
        ) : (
          <div className="px-5 pb-6 pt-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {selectedCount} of {total} selected
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  Tap a card to add it to your flashcards
                </p>
              </div>
              <button
                onClick={toggleAll}
                className="rounded-full px-2 py-1 text-[11px] font-semibold text-accent tap-scale-sm"
              >
                {allSelected ? 'Clear' : 'Select all'}
              </button>
            </div>

            <div className="no-scrollbar mt-3 grid max-h-[48vh] grid-cols-2 gap-2 overflow-y-auto">
              {words.map((w) => {
                const selected = savedIds.has(w.base);
                return (
                  <button
                    key={w.base}
                    onClick={() => toggle(w)}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Remove' : 'Add'} ${w.base}`}
                    className={cn(
                      'relative flex flex-col items-start rounded-2xl bg-card p-2.5 text-left ring-1 ring-border/30 shadow-sm tap-scale smooth-colors',
                      selected && 'bg-accent/5 ring-2 ring-accent/60'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full',
                        selected
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground ring-1 ring-border/50'
                      )}
                    >
                      {selected ? (
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
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {w.jlpt.slice(0, 1).map((j) => (
                        <span
                          key={j}
                          className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent"
                        >
                          {j.replace('jlpt-', '')}
                        </span>
                      ))}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {frequencyLabel(w.frequency)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              size="lg"
              onClick={onClose}
              className="btn-tsundoku-premium mt-4 h-12 w-full rounded-full border-none font-serif text-[15px] font-bold tap-scale"
            >
              Start reading
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
