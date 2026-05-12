import { useState, useCallback, useEffect } from 'react';
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
  const [showReading, setShowReading] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('yomimasu-review-show-reading') === 'true';
  });
  useEffect(() => {
    window.localStorage.setItem('yomimasu-review-show-reading', String(showReading));
  }, [showReading]);

  const advance = useCallback((action?: () => void) => {
    action?.();
    setAnimClass('animate-card-out');
    setTimeout(() => {
      setFlipped(false);
      setShowAllMeanings(false);
      setCurrentIdx(i => i + 1);
      setAnimClass('animate-card-in');
      setTimeout(() => setAnimClass(''), 260);
    }, 200);
  }, []);

  if (deck.length === 0) return null;

  if (currentIdx >= deck.length) {
    return (
      <div className="fixed inset-0 z-[60] flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6">
        <span className="text-5xl">🎉</span>
        <p className="text-xl font-bold">Session terminée !</p>
        <p className="text-sm text-muted-foreground">{deck.length} cartes révisées</p>
        <Button onClick={onExit}>Retour</Button>
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
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowReading(v => !v)}
          aria-label={showReading ? 'Hide reading on front' : 'Show reading on front'}
          title={showReading ? 'Hide reading on front' : 'Show reading on front'}
        >
          {showReading ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="flex-none px-6 pb-2">
        <Progress value={progressPct} className="h-1 w-full" />
        <p className="text-xs font-medium text-muted-foreground text-center mt-[5px]">
          {currentIdx + 1} / {deck.length}
        </p>
      </div>

      {/* Card area — fills available space */}
      <div className="flex-1 min-h-0 flex items-stretch justify-center px-4 py-3">
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
            <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card shadow-lg p-6">
              <p className="font-japanese text-6xl font-bold tracking-tight">{card.word}</p>
              {showReading && (
                <p className="font-japanese text-xl text-muted-foreground mt-3">{card.reading}</p>
              )}
              <PlayWordButton word={card.word} reading={card.reading} size={28} className="mt-4" />
              <p className="mt-8 text-xs text-muted-foreground/70 uppercase tracking-wider">Tap to flip</p>
            </div>

            {/* Back face — Anki-style: clean header + body */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-2xl border bg-card shadow-lg overflow-hidden">
              {/* Header — word + reading + tags */}
              <div className="flex-none px-5 pt-5 pb-3 border-b border-border/50">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="font-japanese text-3xl font-bold">{card.word}</p>
                  <span className="font-japanese text-base text-muted-foreground">{card.reading}</span>
                  <div data-no-flip className="ml-auto shrink-0">
                    <PlayWordButton word={card.word} reading={card.reading} size={18} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 italic mt-0.5">{toRomaji(card.reading || card.word)}</p>
                {((card.jlpt && card.jlpt.length > 0) || (card.partsOfSpeech && card.partsOfSpeech.length > 0)) && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {card.jlpt?.[0] && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                        {card.jlpt[0].replace('jlpt-', 'JLPT ')}
                      </span>
                    )}
                    {card.partsOfSpeech?.slice(0, 3).map((p, i) => (
                      <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Body — scrollable only when expanded */}
              <div
                data-no-flip
                className={`flex-1 min-h-0 px-5 py-4 ${showAllMeanings ? 'overflow-y-auto' : 'overflow-hidden'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Meanings */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Meanings</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {visibleMeanings.map((m, i) => (
                      <li key={i} className="text-base font-medium text-foreground leading-snug">{m}</li>
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

                {/* Context sentence */}
                {card.contextSentence && (
                  <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">From your reading</span>
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Example</p>
                  <ExampleSentence word={card.word} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-none flex justify-center gap-2 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {flipped ? (
          <SrsButtons card={card} onAnswer={handleAnswer} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => advance()}>
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
