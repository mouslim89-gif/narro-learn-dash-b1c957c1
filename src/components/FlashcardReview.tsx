import { useState, useCallback, useRef } from 'react';
import { SavedWord, useFlashcardStore } from '@/stores/flashcards';
import { PlayWordButton } from '@/components/PlayWordButton';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Button } from '@/components/ui/button';
import { SrsButtons, type SrsQualityLabel } from '@/components/SrsButtons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toRomaji } from 'wanakana';
import { Trash2, X, BookOpen, ChevronDown, Eye, EyeClosed } from 'lucide-react';

interface Props {
  deck: SavedWord[];
  onExit: () => void;
}

const DEFAULT_MEANINGS = 3;

export function FlashcardReview({ deck, onExit }: Props) {
  const { adjustMastery, removeWord } = useFlashcardStore();
  // Snapshot the deck once, then manage review-session deletions locally.
  const [localDeck, setLocalDeck] = useState<SavedWord[]>(() => deck);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllMeanings, setShowAllMeanings] = useState(false);
  const [showFrontReading, setShowFrontReading] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const advance = useCallback((action?: () => void) => {
    action?.();
    setAnimClass('animate-card-out');
    setTimeout(() => {
      setFlipped(false);
      setShowAllMeanings(false);
      setShowFrontReading(false);
      setCurrentIdx(i => i + 1);
      setAnimClass('animate-card-in');
      setTimeout(() => setAnimClass(''), 260);
    }, 200);
  }, []);

  if (currentIdx >= localDeck.length) {
    return (
      <div className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-background px-6">
        <span className="text-6xl">🎉</span>
        <p className="font-serif text-3xl tracking-tight">Session complete</p>
        <p className="text-sm text-muted-foreground">{localDeck.length} cards reviewed</p>
        <Button onClick={onExit} className="mt-2 rounded-full px-8">Done</Button>
      </div>
    );
  }

  const card = localDeck[currentIdx];
  const progressPct = ((currentIdx + 1) / localDeck.length) * 100;
  const visibleMeanings = showAllMeanings ? card.meanings : card.meanings.slice(0, DEFAULT_MEANINGS);
  const hiddenMeaningsCount = Math.max(0, card.meanings.length - DEFAULT_MEANINGS);

  const handleAnswer = (quality: SrsQualityLabel) => {
    advance(() => adjustMastery(card.id, quality));
  };

  const handleDeleteCurrent = () => {
    const deletedId = card.id;
    setShowDeleteDialog(false);
    removeWord(deletedId);
    setAnimClass('animate-card-out');

    window.setTimeout(() => {
      const nextDeck = localDeck.filter((word) => word.id !== deletedId);
      setLocalDeck(nextDeck);
      setCurrentIdx((index) => Math.min(index, nextDeck.length));
      setFlipped(false);
      setShowAllMeanings(false);
      setShowFrontReading(false);
      setAnimClass('animate-card-in');
      window.setTimeout(() => setAnimClass(''), 260);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-muted/40 via-background to-background">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex-none flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button
          onClick={onExit}
          aria-label="Exit review"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/60 text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-95"
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted/70 overflow-hidden ring-1 ring-border/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-[12px] tabular-nums font-semibold text-foreground/80 tracking-tight">
            {currentIdx + 1}<span className="text-muted-foreground/60 font-normal"> / {localDeck.length}</span>
          </span>
        </div>

        <button
          onClick={() => setShowDeleteDialog(true)}
          aria-label="Delete card"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/60 text-muted-foreground/70 shadow-sm transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 active:scale-95"
        >
          <Trash2 className="h-[16px] w-[16px]" />
        </button>
      </div>

      {/* Card area */}
      <div className="relative flex-1 min-h-0 flex items-stretch justify-center px-4 py-3">
        <div
          className={`perspective-800 w-full max-w-md h-full ${animClass}`}
          onPointerDown={(e) => {
            pointerStartRef.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-no-flip]')) return;
            const start = pointerStartRef.current;
            if (start && (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8)) return;
            setFlipped(!flipped);
          }}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front face */}
            <div className="backface-hidden absolute inset-0 flex flex-col rounded-[28px] bg-gradient-to-br from-card via-card to-muted/40 border border-border/60 shadow-[0_12px_36px_-18px_hsl(var(--foreground)/0.12),0_2px_8px_-4px_hsl(var(--foreground)/0.05)] overflow-hidden">
              {/* decorative kanji watermark */}
              <span className="pointer-events-none select-none absolute -top-10 -right-6 font-japanese text-[220px] leading-none font-bold text-foreground/[0.025]">
                {card.word.charAt(0)}
              </span>

              <div className="relative flex-1 flex flex-col items-center justify-center px-6">
                <p className="font-japanese text-[72px] leading-none font-bold tracking-tight text-foreground select-none drop-shadow-sm">
                  {card.word}
                </p>
                <div className="mt-7 h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <p
                  className={`font-japanese text-xl mt-7 font-medium transition-all duration-300 ${
                    showFrontReading ? 'text-muted-foreground opacity-100' : 'text-muted-foreground opacity-0 blur-md select-none'
                  }`}
                  aria-hidden={!showFrontReading}
                >
                  {card.reading || '—'}
                </p>
              </div>

              <div
                className="relative flex-none flex items-center justify-center gap-2 pb-7"
                data-no-flip
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowFrontReading((v) => !v)}
                  aria-label={showFrontReading ? 'Hide reading' : 'Show reading'}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 border border-border/70 text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-95"
                >
                  {showFrontReading ? <Eye className="h-[18px] w-[18px]" /> : <EyeClosed className="h-[18px] w-[18px]" />}
                </button>
                <PlayWordButton word={card.word} reading={card.reading} size={26} />
              </div>

              <p className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] uppercase tracking-[0.25em] font-medium text-muted-foreground/50 pointer-events-none">
                Tap to reveal
              </p>
            </div>

            {/* Back face */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-[28px] bg-gradient-to-br from-card via-card to-muted/30 border border-border/60 shadow-[0_12px_36px_-18px_hsl(var(--foreground)/0.12),0_2px_8px_-4px_hsl(var(--foreground)/0.05)] overflow-hidden">
              {/* Header — word + reading */}
              <div className="flex-none px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-japanese text-[34px] leading-[0.95] font-bold tracking-tight">{card.word}</p>
                    <p className="font-japanese text-[15px] font-medium text-foreground/70 mt-1.5">{card.reading}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">
                      {toRomaji(card.reading || card.word)}
                    </p>
                  </div>
                  <div data-no-flip className="shrink-0 -mr-1" onClick={(e) => e.stopPropagation()}>
                    <PlayWordButton word={card.word} reading={card.reading} size={20} />
                  </div>
                </div>

                {card.partsOfSpeech?.[0] && (
                  <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
                    {card.partsOfSpeech.slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>

              <div className="mx-5 h-px bg-border/60" />

              {/* Body — scrollable */}
              <div className="flex-1 min-h-0 px-5 py-4 overflow-y-auto overscroll-contain">
                {/* Meanings */}
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-2">
                    Meaning
                  </p>
                  <ol className="space-y-1.5">
                    {visibleMeanings.map((m, i) => (
                      <li key={i} className="flex gap-2.5 text-[15px] leading-snug text-foreground">
                        <span className="font-semibold text-[12px] text-foreground/50 pt-0.5 tabular-nums w-3.5 shrink-0">
                          {i + 1}
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                  {hiddenMeaningsCount > 0 && !showAllMeanings && (
                    <button
                      data-no-flip
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAllMeanings(true); }}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                      {hiddenMeaningsCount} more
                    </button>
                  )}
                </section>

                {/* Context sentence */}
                {card.contextSentence && (
                  <section className="mt-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="h-3 w-3 text-foreground/55 shrink-0" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                        From your reading
                      </p>
                    </div>
                    <p className="font-japanese text-[15px] leading-snug text-foreground/90 border-l-[3px] border-primary/40 pl-3">
                      {(() => {
                        const idx = card.contextSentence!.indexOf(card.word);
                        if (idx === -1) return card.contextSentence;
                        return (
                          <>
                            {card.contextSentence!.slice(0, idx)}
                            <span className="text-primary font-semibold underline decoration-dotted underline-offset-4">{card.word}</span>
                            {card.contextSentence!.slice(idx + card.word.length)}
                          </>
                        );
                      })()}
                    </p>
                  </section>
                )}

                {/* Example sentence */}
                <section className="mt-4 pb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-1.5">
                    Example
                  </p>
                  <ExampleSentence word={card.word} />
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action area */}
      <div className="relative flex-none flex justify-center gap-2 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
        {flipped ? (
          <SrsButtons card={card} onAnswer={handleAnswer} />
        ) : (
          <button
            onClick={() => advance()}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors px-5 py-2.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm"
          >
            Skip
          </button>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              This card will be permanently removed from your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCurrent}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
