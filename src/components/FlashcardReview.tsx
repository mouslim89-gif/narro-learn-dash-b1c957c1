import { useState, useCallback } from 'react';
import { SavedWord, useFlashcardStore } from '@/stores/flashcards';
import { PlayWordButton } from '@/components/PlayWordButton';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Button } from '@/components/ui/button';
import { SrsButtons, type SrsQualityLabel } from '@/components/SrsButtons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toRomaji } from 'wanakana';
import { Trash2, X, BookOpen, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface Props {
  deck: SavedWord[];
  onExit: () => void;
}

const DEFAULT_MEANINGS = 3;

export function FlashcardReview({ deck, onExit }: Props) {
  const { adjustMastery, removeWord } = useFlashcardStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllMeanings, setShowAllMeanings] = useState(false);
  const [showFrontReading, setShowFrontReading] = useState(false);

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

  if (deck.length === 0) return null;

  if (currentIdx >= deck.length) {
    return (
      <div className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-background px-6">
        <span className="text-6xl">🎉</span>
        <p className="font-serif text-3xl tracking-tight">Session complete</p>
        <p className="text-sm text-muted-foreground">{deck.length} cards reviewed</p>
        <Button onClick={onExit} className="mt-2 rounded-full px-8">Done</Button>
      </div>
    );
  }

  const card = deck[currentIdx];
  const progressPct = ((currentIdx + 1) / deck.length) * 100;
  const visibleMeanings = showAllMeanings ? card.meanings : card.meanings.slice(0, DEFAULT_MEANINGS);
  const hiddenMeaningsCount = Math.max(0, card.meanings.length - DEFAULT_MEANINGS);

  const handleAnswer = (quality: SrsQualityLabel) => {
    advance(() => adjustMastery(card.id, quality));
  };

  return (
    <div className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Header — minimal: close, counter, delete */}
      <div className="flex-none flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <button
          onClick={onExit}
          aria-label="Exit review"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:scale-95"
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 h-[3px] rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground/80 transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground tracking-tight">
            {currentIdx + 1}<span className="opacity-40"> / {deck.length}</span>
          </span>
        </div>

        <button
          onClick={() => setShowDeleteDialog(true)}
          aria-label="Delete card"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
        >
          <Trash2 className="h-[16px] w-[16px]" />
        </button>
      </div>

      {/* Card area */}
      <div className="flex-1 min-h-0 flex items-stretch justify-center px-4 py-4">
        <div
          className={`perspective-800 w-full max-w-md h-full ${animClass}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-no-flip]')) return;
            setFlipped(!flipped);
          }}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front face — ultra clean, focus on the word */}
            <div className="backface-hidden absolute inset-0 flex flex-col rounded-3xl bg-card">
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <p className="font-japanese text-[64px] leading-none font-semibold tracking-tight text-foreground select-none">
                  {card.word}
                </p>
                <div className="mt-6 h-px w-10 bg-border" />
                <p
                  className={`font-japanese text-lg mt-6 transition-all duration-300 ${
                    showFrontReading ? 'text-muted-foreground opacity-100' : 'text-muted-foreground opacity-0 blur-md select-none'
                  }`}
                  aria-hidden={!showFrontReading}
                >
                  {card.reading || '—'}
                </p>
              </div>

              <div
                className="flex-none flex items-center justify-center gap-1 pb-6"
                data-no-flip
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowFrontReading((v) => !v)}
                  aria-label={showFrontReading ? 'Hide reading' : 'Show reading'}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                >
                  {showFrontReading ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
                <PlayWordButton word={card.word} reading={card.reading} size={26} />
              </div>

              <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 pointer-events-none">
                Tap to reveal
              </p>
            </div>

            {/* Back face — refined typographic answer */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-3xl bg-card overflow-hidden">
              {/* Header — word + reading */}
              <div className="flex-none px-6 pt-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-japanese text-[34px] leading-none font-semibold tracking-tight">{card.word}</p>
                    <p className="font-japanese text-[15px] text-muted-foreground mt-2">{card.reading}</p>
                    <p className="text-[11px] text-muted-foreground/60 italic mt-1 tracking-wide">
                      {toRomaji(card.reading || card.word)}
                    </p>
                  </div>
                  <div data-no-flip className="shrink-0 -mr-1" onClick={(e) => e.stopPropagation()}>
                    <PlayWordButton word={card.word} reading={card.reading} size={22} />
                  </div>
                </div>

                {card.partsOfSpeech?.[0] && (
                  <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {card.partsOfSpeech.slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>

              <div className="mx-6 h-px bg-border/60" />

              {/* Body — scrollable */}
              <div
                data-no-flip
                className="flex-1 min-h-0 px-6 py-5 overflow-y-auto overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Meanings */}
                <section>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">
                    Meaning
                  </p>
                  <ol className="space-y-2">
                    {visibleMeanings.map((m, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-snug text-foreground">
                        <span className="font-mono text-xs text-muted-foreground/50 pt-1 tabular-nums w-3 shrink-0">
                          {i + 1}
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                  {hiddenMeaningsCount > 0 && !showAllMeanings && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAllMeanings(true); }}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                      {hiddenMeaningsCount} more
                    </button>
                  )}
                </section>

                {/* Context sentence */}
                {card.contextSentence && (
                  <section className="mt-7">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <BookOpen className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                        From your reading
                      </p>
                    </div>
                    <p className="font-japanese text-[15px] leading-relaxed text-foreground/90 border-l-2 border-border pl-3">
                      {(() => {
                        const idx = card.contextSentence!.indexOf(card.word);
                        if (idx === -1) return card.contextSentence;
                        return (
                          <>
                            {card.contextSentence!.slice(0, idx)}
                            <span className="text-foreground font-semibold underline decoration-dotted underline-offset-4">{card.word}</span>
                            {card.contextSentence!.slice(idx + card.word.length)}
                          </>
                        );
                      })()}
                    </p>
                  </section>
                )}

                {/* Example sentence */}
                <section className="mt-7 pb-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 mb-2.5">
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
      <div className="flex-none flex justify-center gap-2 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]">
        {flipped ? (
          <SrsButtons card={card} onAnswer={handleAnswer} />
        ) : (
          <button
            onClick={() => advance()}
            className="text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors px-4 py-2"
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
              onClick={() => {
                removeWord(card.id);
                setShowDeleteDialog(false);
                advance();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
