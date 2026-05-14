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
        className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6"
        style={{ backgroundImage: `linear-gradient(160deg, hsl(150 55% 42% / 0.18) 0%, hsl(var(--background)) 70%)` }}
      >
        <span className="text-5xl">🎉</span>
        <p className="font-serif text-2xl font-bold">Session complete</p>
        <p className="text-sm text-muted-foreground">{deck.length} cards reviewed</p>
        <Button onClick={onExit} className="rounded-full px-6">Done</Button>
      </div>
    );
  }

  const card = deck[currentIdx];
  const total = deck.length;
  const index = currentIdx;
  const progressPct = ((currentIdx + 1) / deck.length) * 100;
  const visibleMeanings = showAllMeanings ? card.meanings : card.meanings.slice(0, DEFAULT_MEANINGS);
  const hiddenMeaningsCount = Math.max(0, card.meanings.length - DEFAULT_MEANINGS);

  const handleAnswer = (quality: SrsQualityLabel) => {
    advance(() => adjustMastery(card.id, quality));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ backgroundImage: `linear-gradient(160deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 60%)` }}
    >
      {/* Header — floating chips */}
      <div className="flex-none flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={onExit}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 hover:bg-background"
          aria-label="Back"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 text-destructive hover:bg-background"
          aria-label="Delete card"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Progress strip */}
      <div className="flex-none px-6 pb-2">
        <Progress value={progressPct} className="h-1 w-full" />
        <p className="mt-1.5 text-center text-[11px] font-semibold tabular-nums tracking-[0.18em] text-muted-foreground">
          {index + 1} / {total}
        </p>
      </div>

      {/* Card area */}
      <div className="flex-1 min-h-0 flex items-stretch justify-center px-4 py-3">
        <div
          className={`perspective-800 w-full max-w-md h-full ${animClass}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-no-flip]')) return;
            setFlipped(!flipped);
          }}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
            {/* Front face */}
            <div
              className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card shadow-xl ring-1 ring-border/40 p-6"
              style={{ backgroundImage: `linear-gradient(140deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 70%)` }}
            >
              <p className="font-japanese text-6xl font-bold tracking-tight">{card.word}</p>
              <p
                className={`font-japanese text-lg mt-3 transition-all ${
                  showFrontReading ? 'text-muted-foreground' : 'text-transparent select-none blur-md'
                }`}
                aria-hidden={!showFrontReading}
              >
                {card.reading || '???'}
              </p>
              <div className="mt-5 flex items-center gap-2" data-no-flip onClick={(e) => e.stopPropagation()}>
                <PlayWordButton word={card.word} reading={card.reading} size={28} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setShowFrontReading((v) => !v)}
                  aria-label={showFrontReading ? 'Hide furigana' : 'Show furigana'}
                >
                  {showFrontReading ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              <p className="absolute bottom-5 left-0 right-0 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                Tap to flip
              </p>
            </div>

            {/* Back face */}
            <div
              className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-2xl border bg-card shadow-xl ring-1 ring-border/40 overflow-hidden"
              style={{ backgroundImage: `linear-gradient(140deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 70%)` }}
            >
              {/* Header */}
              <div className="flex-none px-5 pt-5 pb-3 border-b border-border/50">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="font-japanese text-3xl font-bold">{card.word}</p>
                  <span className="font-japanese text-base text-muted-foreground">{card.reading}</span>
                  <div data-no-flip className="ml-auto shrink-0">
                    <PlayWordButton word={card.word} reading={card.reading} size={18} />
                  </div>
                </div>
                <p className="text-xs italic text-muted-foreground/70 mt-0.5">{toRomaji(card.reading || card.word)}</p>
                {card.partsOfSpeech && card.partsOfSpeech.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {card.partsOfSpeech.slice(0, 3).map((p, i) => (
                      <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div
                data-no-flip
                className={`flex-1 min-h-0 px-5 py-4 ${showAllMeanings ? 'overflow-y-auto' : 'overflow-hidden'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="section-bullet" />Meanings
                  </p>
                  <ol className="mt-2 space-y-1.5">
                    {visibleMeanings.map((m, i) => (
                      <li key={i} className="flex gap-2 font-serif text-[15px] leading-snug text-foreground">
                        <span className="font-serif text-muted-foreground/70 tabular-nums">{i + 1}.</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                  {hiddenMeaningsCount > 0 && !showAllMeanings && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAllMeanings(true); }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <ChevronDown className="h-3 w-3" />
                      Show {hiddenMeaningsCount} more
                    </button>
                  )}
                </div>

                {/* Context sentence — tinted quote card */}
                {card.contextSentence && (
                  <div
                    className="mt-4 relative rounded-xl border border-primary/10 p-4"
                    style={{ backgroundImage: `linear-gradient(140deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--card)) 70%)` }}
                  >
                    <span className="absolute -top-2 left-3 font-serif text-3xl leading-none text-primary/60">"</span>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">From your reading</span>
                    </div>
                    <p className="font-japanese text-sm leading-relaxed text-foreground">
                      {(() => {
                        const idx = card.contextSentence!.indexOf(card.word);
                        if (idx === -1) return card.contextSentence;
                        return (
                          <>
                            {card.contextSentence!.slice(0, idx)}
                            <span className="font-bold text-accent">{card.word}</span>
                            {card.contextSentence!.slice(idx + card.word.length)}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="section-bullet" />Example
                  </p>
                  <div className="mt-2">
                    <ExampleSentence word={card.word} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-none flex justify-center gap-2 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {flipped ? (
          <SrsButtons card={card} onAnswer={handleAnswer} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => advance()} className="rounded-full px-5">
            Skip →
          </Button>
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
