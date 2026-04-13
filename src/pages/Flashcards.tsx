import { useState, useMemo } from 'react';
import { useFlashcardStore } from '@/stores/flashcards';
import { Trash2, RotateCcw, Shuffle, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayWordButton } from '@/components/PlayWordButton';
import { Progress } from '@/components/ui/progress';

export default function Flashcards() {
  const { savedWords, removeWord, incrementMastery, resetMastery, getDueWords } = useFlashcardStore();
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  const reviewDeck = useMemo(() => {
    const due = getDueWords();
    const deck = due.length > 0 ? [...due] : [...savedWords];
    if (shuffled) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedWords, shuffled, reviewMode]);

  const knownCount = savedWords.filter(w => (w.mastery || 0) >= 3).length;
  const learningCount = savedWords.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3).length;
  const newCount = savedWords.filter(w => !(w.mastery || 0)).length;
  const dueCount = getDueWords().length;

  if (reviewMode && reviewDeck.length > 0) {
    const idx = currentIdx % reviewDeck.length;
    const card = reviewDeck[idx];
    const progressPct = ((idx + 1) / reviewDeck.length) * 100;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pb-20">
        <Progress value={progressPct} className="h-1 w-full max-w-sm" />
        <p className="text-xs font-medium text-muted-foreground">
          {idx + 1} / {reviewDeck.length}
        </p>

        {/* 3D Flip Card */}
        <div
          className="perspective-800 w-full max-w-sm"
          onClick={() => setFlipped(!flipped)}
        >
          <div
            className={`relative h-64 w-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front */}
            <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card shadow-lg">
              <p className="font-japanese text-5xl font-bold">{card.word}</p>
              <p className="font-japanese mt-2 text-lg text-muted-foreground">{card.reading}</p>
              <PlayWordButton text={card.reading || card.word} size="md" className="mt-2" />
              <p className="mt-6 text-xs text-muted-foreground">Tap to flip</p>
            </div>
            {/* Back */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card shadow-lg p-4">
              <p className="font-japanese text-2xl font-bold mb-2">{card.word}</p>
              {card.meanings.map((m, i) => (
                <p key={i} className="text-lg font-semibold text-accent text-center">{m}</p>
              ))}
              {card.jlpt && card.jlpt.length > 0 && (
                <span className="mt-3 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold uppercase text-accent">
                  {card.jlpt[0]?.replace('jlpt-', 'JLPT ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {flipped ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => { resetMastery(card.id); setFlipped(false); setCurrentIdx(currentIdx + 1); }}
            >
              <X className="mr-1 h-4 w-4" /> Again
            </Button>
            <Button
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
              onClick={() => { incrementMastery(card.id); setFlipped(false); setCurrentIdx(currentIdx + 1); }}
            >
              <Check className="mr-1 h-4 w-4" /> Got it
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setFlipped(false); setCurrentIdx(currentIdx + 1); }}>
              Skip →
            </Button>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={() => { setReviewMode(false); setCurrentIdx(0); setFlipped(false); }}>
          Exit Review
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        {savedWords.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShuffled(!shuffled)}
              className={shuffled ? 'text-primary' : 'text-muted-foreground'}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button onClick={() => setReviewMode(true)} size="sm" className="font-semibold">
              <RotateCcw className="mr-1 h-4 w-4" /> Review
              {dueCount > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {dueCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {savedWords.length > 0 && (
        <div className="mt-3 flex gap-3">
          <div className="flex-1 rounded-lg border bg-card p-3 text-center">
            <p className="text-lg font-bold text-green-600">{knownCount}</p>
            <p className="text-[10px] text-muted-foreground">Known</p>
          </div>
          <div className="flex-1 rounded-lg border bg-card p-3 text-center">
            <p className="text-lg font-bold text-amber-500">{learningCount}</p>
            <p className="text-[10px] text-muted-foreground">Learning</p>
          </div>
          <div className="flex-1 rounded-lg border bg-card p-3 text-center">
            <p className="text-lg font-bold text-muted-foreground">{newCount}</p>
            <p className="text-[10px] text-muted-foreground">New</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        {savedWords.length} words saved
        {dueCount > 0 && <span className="text-accent font-semibold"> · {dueCount} due for review</span>}
      </p>

      {savedWords.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-muted-foreground">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-lg font-semibold">No flashcards yet</p>
          <p className="mt-1 text-sm">Tap words while reading to save them.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {savedWords.map((word) => {
            const mastery = word.mastery || 0;
            const masteryColor = mastery >= 3 ? 'bg-green-500' : mastery > 0 ? 'bg-amber-400' : 'bg-muted';
            return (
              <div key={word.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${masteryColor}`} />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-japanese text-lg font-bold">{word.word}</p>
                      <PlayWordButton text={word.reading || word.word} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {word.reading} — {word.meanings.join(', ')}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeWord(word.id)} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
