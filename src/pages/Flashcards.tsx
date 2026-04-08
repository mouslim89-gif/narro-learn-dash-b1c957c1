import { useState, useMemo } from 'react';
import { useFlashcardStore } from '@/stores/flashcards';
import { Trash2, RotateCcw, Shuffle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Flashcards() {
  const { savedWords, removeWord, incrementMastery, resetMastery } = useFlashcardStore();
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  const reviewDeck = useMemo(() => {
    const deck = [...savedWords];
    if (shuffled) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck;
  }, [savedWords, shuffled, reviewMode]);

  const knownCount = savedWords.filter(w => (w.mastery || 0) >= 3).length;
  const learningCount = savedWords.filter(w => (w.mastery || 0) > 0 && (w.mastery || 0) < 3).length;
  const newCount = savedWords.filter(w => !(w.mastery || 0)).length;

  if (reviewMode && reviewDeck.length > 0) {
    const card = reviewDeck[currentIdx % reviewDeck.length];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pb-20">
        <p className="text-xs font-medium text-muted-foreground">
          {(currentIdx % reviewDeck.length) + 1} / {reviewDeck.length}
        </p>
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex h-64 w-full max-w-sm flex-col items-center justify-center rounded-lg border bg-card shadow-sm transition-all active:scale-[0.98]"
        >
          <p className="font-japanese text-5xl font-bold">{card.word}</p>
          <p className="font-japanese mt-2 text-lg text-muted-foreground">{card.reading}</p>
          {revealed && (
            <div className="mt-4 animate-in fade-in text-center">
              {card.meanings.map((m, i) => (
                <p key={i} className="text-lg font-semibold text-accent">{m}</p>
              ))}
            </div>
          )}
          {!revealed && <p className="mt-6 text-xs text-muted-foreground">Tap to reveal</p>}
        </button>

        {revealed ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => { resetMastery(card.id); setRevealed(false); setCurrentIdx(currentIdx + 1); }}
            >
              <X className="mr-1 h-4 w-4" /> Still learning
            </Button>
            <Button
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
              onClick={() => { incrementMastery(card.id); setRevealed(false); setCurrentIdx(currentIdx + 1); }}
            >
              <Check className="mr-1 h-4 w-4" /> Know it
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setRevealed(false); setCurrentIdx(currentIdx + 1); }}>
              Skip →
            </Button>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={() => { setReviewMode(false); setCurrentIdx(0); setRevealed(false); }}>
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
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
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

      <p className="mt-3 text-sm text-muted-foreground">{savedWords.length} words saved</p>

      {savedWords.length === 0 ? (
        <div className="mt-20 text-center text-muted-foreground">
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
                    <p className="font-japanese text-lg font-bold">{word.word}</p>
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
