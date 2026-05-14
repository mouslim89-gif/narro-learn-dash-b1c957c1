import { useState, useCallback } from 'react';
import { SavedWord, useFlashcardStore } from '@/stores/flashcards';
import { PlayWordButton } from '@/components/PlayWordButton';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SrsButtons, type SrsQualityLabel } from '@/components/SrsButtons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toRomaji } from 'wanakana';
import { Trash2, ArrowLeft, BookOpen, ChevronDown, Eye, EyeOff } from 'lucide-react';

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
      <div
        className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6"
        style={{ backgroundImage: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 60%)' }}
      >
        <span className="text-5xl">🎉</span>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
            All done
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">Session complete</h2>
          <p className="mt-2 text-sm text-muted-foreground">{deck.length} {deck.length === 1 ? 'card' : 'cards'} reviewed</p>
        </div>
        <Button onClick={onExit} className="rounded-full px-6 shadow-md">Back</Button>
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
    <div
      className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ backgroundImage: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 55%)' }}
    >
      {/* Kanji watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="library-kanji-watermark">読</span>
      </div>

      {/* Header */}
      <div className="relative flex-none flex items-center justify-between px-4 pt-4 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40"
          aria-label="Back"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteDialog(true)}
          className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-destructive/20 text-destructive hover:text-destructive"
          aria-label="Delete card"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </Button>
      </div>

      {/* Progress */}
      <div className="relative flex-none px-6 pb-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Review</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-serif text-[13px] font-bold tabular-nums">{currentIdx + 1} / {deck.length}</span>
        </div>
        <Progress value={progressPct} className="h-1 w-full bg-muted/60" />
      </div>

      {/* Card area */}
      <div className="relative flex-1 min-h-0 flex items-stretch justify-center px-4 py-3">
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
            {/* Front face */}
            <div
              className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl ring-1 ring-border/40 p-6 shadow-xl"
              style={{ backgroundImage: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(36 80% 60% / 0.06) 100%)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
                Word
              </p>
              <p className="font-japanese text-6xl font-bold tracking-[-0.02em] mt-3 text-center">{card.word}</p>
              <p
                className={`font-japanese text-xl mt-3 transition-all ${
                  showFrontReading ? 'text-muted-foreground' : 'text-transparent select-none blur-md'
                }`}
                aria-hidden={!showFrontReading}
              >
                {card.reading || '???'}
              </p>
              <div className="mt-5 flex items-center gap-2" data-no-flip onClick={(e) => e.stopPropagation()}>
                <PlayWordButton word={card.word} reading={card.reading} size={28} />
                <button
                  type="button"
                  onClick={() => setShowFrontReading((v) => !v)}
                  aria-label={showFrontReading ? 'Hide furigana' : 'Show furigana'}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-muted/60 ring-1 ring-border/40 text-foreground/80 hover:bg-muted tap-scale-sm"
                >
                  {showFrontReading ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
                Tap to flip
              </p>
            </div>

            {/* Back face */}
            <div
              className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-3xl ring-1 ring-border/40 shadow-xl overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(36 80% 60% / 0.05) 100%)' }}
            >
              {/* Header */}
              <div className="flex-none px-5 pt-5 pb-3 border-b border-border/50">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="font-japanese text-3xl font-bold tracking-[-0.01em]">{card.word}</p>
                  <span className="font-japanese text-base text-muted-foreground">{card.reading}</span>
                  <div data-no-flip className="ml-auto shrink-0">
                    <PlayWordButton word={card.word} reading={card.reading} size={18} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 italic mt-0.5">{toRomaji(card.reading || card.word)}</p>
                {card.partsOfSpeech && card.partsOfSpeech.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {card.partsOfSpeech.slice(0, 3).map((p, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div
                data-no-flip
                className="flex-1 min-h-0 px-5 py-4 overflow-y-auto overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Meanings */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
                    Meanings
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {visibleMeanings.map((m, i) => (
                      <li key={i} className="text-base font-medium text-foreground leading-snug">{m}</li>
                    ))}
                  </ol>
                  {hiddenMeaningsCount > 0 && !showAllMeanings && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAllMeanings(true); }}
                      className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 h-7 text-[11px] font-semibold text-foreground/80 hover:bg-muted ring-1 ring-border/40"
                    >
                      <ChevronDown className="h-3 w-3" />
                      Show {hiddenMeaningsCount} more
                    </button>
                  )}
                </div>

                {/* Context sentence */}
                {card.contextSentence && (
                  <div
                    className="mt-4 rounded-2xl ring-1 ring-amber-500/15 p-3"
                    style={{ backgroundImage: 'linear-gradient(135deg, hsl(36 80% 60% / 0.14) 0%, hsl(var(--card)) 100%)' }}
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 shrink-0" style={{ color: 'hsl(36 80% 45%)' }} />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'hsl(36 80% 35%)' }}>
                        From your reading
                      </span>
                    </div>
                    <p className="font-japanese text-sm leading-relaxed text-foreground">
                      {(() => {
                        const idx = card.contextSentence!.indexOf(card.word);
                        if (idx === -1) return card.contextSentence;
                        return (
                          <>
                            {card.contextSentence!.slice(0, idx)}
                            <span className="text-accent font-bold">{card.word}</span>
                            {card.contextSentence!.slice(idx + card.word.length)}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                )}

                {/* Example sentence */}
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                    <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
                    Example
                  </p>
                  <ExampleSentence word={card.word} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative flex-none flex justify-center px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="rounded-full bg-card/80 backdrop-blur ring-1 ring-border/40 shadow-sm px-2 py-1.5">
          {flipped ? (
            <SrsButtons card={card} onAnswer={handleAnswer} />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => advance()} className="rounded-full px-4 text-muted-foreground">
              Skip →
            </Button>
          )}
        </div>
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
