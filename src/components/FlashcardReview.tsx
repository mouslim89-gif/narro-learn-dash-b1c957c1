import { useState, useCallback } from 'react';
import { SavedWord, useFlashcardStore } from '@/stores/flashcards';
import { PlayWordButton } from '@/components/PlayWordButton';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SrsButtons, type SrsQualityLabel } from '@/components/SrsButtons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toRomaji } from 'wanakana';
import { Trash2, ArrowLeft, BookOpen, ChevronDown } from 'lucide-react';

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
  const visibleMeanings = card.meanings.slice(0, MAX_MEANINGS_BACK);
  const hiddenMeaningsCount = Math.max(0, card.meanings.length - MAX_MEANINGS_BACK);

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

      {/* Card area — fixed height, no internal scroll */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-3 overflow-hidden">
        <div
          className={`perspective-800 w-full max-w-sm h-full ${animClass}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front face */}
            <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card shadow-lg p-5">
              <p className="font-japanese text-5xl font-bold">{card.word}</p>
              <p className="font-japanese text-lg text-muted-foreground mt-[10px] my-px mb-0">{card.reading}</p>
              <PlayWordButton word={card.word} reading={card.reading} size={24} className="mt-2" />
              <p className="mt-6 text-xs text-muted-foreground">Tap to flip</p>
            </div>

            {/* Back face — fully constrained, no scroll */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-start rounded-xl border bg-card shadow-lg p-4 overflow-hidden">
              <div className="flex items-center gap-2 w-full">
                <p className="font-japanese text-xl font-bold truncate">{card.word}</p>
                <span className="font-japanese text-xs text-muted-foreground truncate">{card.reading}</span>
                <span className="text-[10px] text-muted-foreground/70 italic truncate">{toRomaji(card.reading || card.word)}</span>
                <PlayWordButton word={card.word} reading={card.reading} size={14} className="ml-auto shrink-0" />
              </div>

              <ol className="mt-2 list-decimal list-inside space-y-0.5 w-full">
                {visibleMeanings.map((m, i) => (
                  <li key={i} className="text-sm font-medium text-foreground line-clamp-1">{m}</li>
                ))}
                {hiddenMeaningsCount > 0 && (
                  <li className="text-[11px] text-muted-foreground list-none italic">
                    +{hiddenMeaningsCount} more meaning{hiddenMeaningsCount > 1 ? 's' : ''}
                  </li>
                )}
              </ol>

              <div className="mt-2 flex flex-wrap gap-1">
                {card.jlpt && card.jlpt.length > 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                    {card.jlpt[0]?.replace('jlpt-', 'JLPT ')}
                  </span>
                )}
                {card.partsOfSpeech?.slice(0, 2).map((p, i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground truncate max-w-[90px]">
                    {p}
                  </span>
                ))}
              </div>

              {card.contextSentence && (
                <>
                  <Separator className="mt-2.5" />
                  <div className="mt-2 w-full rounded-lg border border-primary/10 bg-primary/5 p-2.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">From your reading</span>
                    </div>
                    <p className="font-japanese text-xs leading-relaxed text-foreground line-clamp-2">
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
                </>
              )}

              <div className="mt-2 w-full overflow-hidden">
                <ExampleSentence word={card.word} className="w-full text-xs [&_*]:line-clamp-2" />
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
