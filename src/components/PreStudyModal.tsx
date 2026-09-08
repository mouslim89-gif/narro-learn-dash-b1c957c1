import { useEffect, useMemo, useState } from 'react';
import { X, Check, BookmarkPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadBookTokens, type BookToken } from '@/data/book-tokens';
import { getCached } from '@/lib/jisho';
import { readWordEntry, hydrateDictionaryForBook } from '@/lib/dictionary-db';
import { useFlashcardStore } from '@/stores/flashcards';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Difficulty } from '@/data/books';

const KANJI_RE = /[一-鿿]/;
const CONTENT_POS = /^(名詞|動詞|形容詞|副詞)/;
const TARGET_COUNT = 15;

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
async function pickKeyWords(bookId: string, difficulty: Difficulty): Promise<PreStudyWord[]> {
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
  const ranked = [...freq.entries()]
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
  const [index, setIndex] = useState(0);
  const [learning, setLearning] = useState<PreStudyWord[]>([]);
  const [done, setDone] = useState(false);
  const addWord = useFlashcardStore((s) => s.addWord);
  const hasWord = useFlashcardStore((s) => s.hasWord);

  useEffect(() => {
    if (!open) return;
    setWords(null);
    setIndex(0);
    setLearning([]);
    setDone(false);
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

  const current = words?.[index];
  const total = words?.length ?? 0;

  const advance = (learn: boolean) => {
    if (!current) return;
    if (learn && !hasWord(current.base)) setLearning((l) => [...l, current]);
    if (index + 1 >= total) setDone(true);
    else setIndex(index + 1);
  };

  const finish = (addToFlashcards: boolean) => {
    if (addToFlashcards && learning.length > 0) {
      for (const w of learning) {
        addWord({
          id: w.base,
          word: w.base,
          reading: w.reading,
          meanings: w.meanings,
          jlpt: w.jlpt,
          partsOfSpeech: w.partsOfSpeech,
        });
      }
      toast.success(`${learning.length} word${learning.length === 1 ? '' : 's'} added to your flashcards`);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background p-0 overflow-hidden [&>button]:hidden">
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
        ) : !done && current ? (
          <div className="px-5 pb-6 pt-1">
            <p className="text-center text-[11px] tabular-nums text-muted-foreground">
              {index + 1} / {total}
            </p>
            <div className="mt-3 flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-card p-6 ring-1 ring-border/30 shadow-sm">
              <p className="font-jp-serif text-5xl font-bold leading-tight">{current.base}</p>
              {current.reading && current.reading !== current.base && (
                <p className="mt-2 font-japanese text-lg text-muted-foreground">{current.reading}</p>
              )}
              <p className="mt-4 text-center text-[15px] leading-relaxed text-foreground/80">
                {current.meanings.length > 0 ? current.meanings.join(', ') : '—'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {current.jlpt.slice(0, 1).map((j) => (
                  <span
                    key={j}
                    className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300"
                  >
                    {j.replace('jlpt-', '')}
                  </span>
                ))}
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  ×{current.frequency} in this book
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => advance(true)}
                className="h-12 rounded-full text-[15px] font-semibold tap-scale"
              >
                <BookmarkPlus className="mr-1.5 h-4 w-4" />
                Learn it
              </Button>
              <Button
                size="lg"
                onClick={() => advance(false)}
                className="h-12 rounded-full text-[15px] font-semibold tap-scale"
              >
                <Check className="mr-1.5 h-4 w-4" />
                I know it
              </Button>
            </div>
            <button
              onClick={onClose}
              className="mt-3 w-full text-center text-xs text-muted-foreground tap-scale-sm"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="px-5 pb-6 pt-1 text-center">
            <div className="mt-2 flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-card p-6 ring-1 ring-border/30 shadow-sm">
              <p className="font-serif text-2xl font-bold">You're ready</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {learning.length > 0
                  ? `${learning.length} word${learning.length === 1 ? '' : 's'} marked as still learning.`
                  : 'You know all the key words — nice.'}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {learning.length > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => finish(true)}
                  className="h-12 w-full rounded-full text-[15px] font-semibold tap-scale"
                >
                  <BookmarkPlus className="mr-1.5 h-4 w-4" />
                  Add {learning.length} to flashcards
                </Button>
              )}
              <Button
                size="lg"
                onClick={() => finish(false)}
                className="btn-tsundoku-premium h-12 w-full rounded-full border-none font-serif text-[15px] font-bold tap-scale"
              >
                Start reading
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Re-exported so the modal's internal helpers stay tree-shakeable.
export const __preStudyInternals = { pickKeyWords, KANJI_RE, CONTENT_POS };
void ArrowLeft; void useMemo; void cn;
