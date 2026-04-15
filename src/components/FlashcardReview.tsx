import { useState, useCallback } from 'react';
import { SavedWord, useFlashcardStore } from '@/stores/flashcards';
import { PlayWordButton } from '@/components/PlayWordButton';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toRomaji } from 'wanakana';
import { X, AlertTriangle, Check, BookOpen, Trash2, ArrowLeft } from 'lucide-react';

interface Props {
  deck: SavedWord[];
  onExit: () => void;
}

export function FlashcardReview({ deck, onExit }: Props) {
  const { adjustMastery, removeWord } = useFlashcardStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const advance = useCallback((action?: () => void) => {
    action?.();
    setAnimClass('animate-card-out');
    setTimeout(() => {
      setFlipped(false);
      setCurrentIdx(i => i + 1);
      setAnimClass('animate-card-in');
      setTimeout(() => setAnimClass(''), 260);
    }, 200);
  }, []);

  if (deck.length === 0) return null;

  if (currentIdx >= deck.length) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 px-6">
        <span className="text-5xl">🎉</span>
        <p className="text-xl font-bold">Session terminée !</p>
        <p className="text-sm text-muted-foreground">{deck.length} cartes révisées</p>
        <Button onClick={onExit}>Retour</Button>
      </div>
    );
  }

  const card = deck[currentIdx];
  const progressPct = ((currentIdx + 1) / deck.length) * 100;

  const backContent = (
    <>
      <div className="flex items-center gap-2 w-full">
        <p className="font-japanese text-2xl font-bold">{card.word}</p>
        <span className="font-japanese text-sm text-muted-foreground">{card.reading}</span>
        <span className="text-xs text-muted-foreground/70 italic">{toRomaji(card.reading || card.word)}</span>
        <PlayWordButton word={card.word} reading={card.reading} size={16} className="ml-auto" />
      </div>

      <ol className="mt-3 list-decimal list-inside space-y-0.5 w-full">
        {card.meanings.map((m, i) => (
          <li key={i} className="text-sm font-medium text-foreground">{m}</li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.jlpt && card.jlpt.length > 0 && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
            {card.jlpt[0]?.replace('jlpt-', 'JLPT ')}
          </span>
        )}
        {card.partsOfSpeech?.map((p, i) => (
          <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {p}
          </span>
        ))}
      </div>

      {card.contextSentence && (
        <>
          <Separator className="mt-3" />
          <div className="mt-3 w-full rounded-lg bg-primary/5 border border-primary/10 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">From your reading</span>
            </div>
            <p className="font-japanese text-sm leading-relaxed text-foreground">
              {(() => {
                const idx = card.contextSentence!.indexOf(card.word);
                if (idx === -1) return card.contextSentence;
                return (
                  <>
                    {card.contextSentence!.slice(0, idx)}
                    <span className="text-amber-500 dark:text-amber-400 font-bold">{card.word}</span>
                    {card.contextSentence!.slice(idx + card.word.length)}
                  </>
                );
              })()}
            </p>
          </div>
        </>
      )}

      <Separator className="mt-3" />
      <ExampleSentence word={card.word} className="w-full mt-3" />
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
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
        <p className="text-xs font-medium text-muted-foreground text-center mt-1">
          {currentIdx + 1} / {deck.length}
        </p>
      </div>

      {/* Card area */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-6 overflow-hidden">
        <div
          className={`perspective-800 w-full max-w-sm ${animClass}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div
            className={`relative w-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Invisible back copy to drive container height */}
            <div className="invisible flex flex-col items-start rounded-xl border p-5" aria-hidden="true">
              {backContent}
            </div>

            {/* Front face */}
            <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card shadow-lg p-5">
              <p className="font-japanese text-5xl font-bold">{card.word}</p>
              <PlayWordButton word={card.word} reading={card.reading} size={24} className="mt-1" />
              <p className="font-japanese mt-1 text-lg text-muted-foreground">{card.reading}</p>
              <p className="mt-6 text-xs text-muted-foreground">Tap to flip</p>
            </div>

            {/* Back face */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-start rounded-xl border bg-card shadow-lg p-5 overflow-y-auto">
              {backContent}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-none flex justify-center gap-2 px-6 py-4">
        {flipped ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => advance(() => adjustMastery(card.id, 'again'))}
            >
              <X className="mr-1 h-4 w-4" /> Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950"
              onClick={() => advance(() => adjustMastery(card.id, 'hard'))}
            >
              <AlertTriangle className="mr-1 h-4 w-4" /> Hard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
              onClick={() => advance(() => adjustMastery(card.id, 'good'))}
            >
              <Check className="mr-1 h-4 w-4" /> Good
            </Button>
          </>
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
