import { useState } from 'react';
import { useFlashcardStore } from '@/stores/flashcards';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Flashcards() {
  const { savedWords, removeWord } = useFlashcardStore();
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (reviewMode && savedWords.length > 0) {
    const card = savedWords[currentIdx % savedWords.length];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pb-20">
        <p className="text-xs font-medium text-muted-foreground">
          {(currentIdx % savedWords.length) + 1} / {savedWords.length}
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
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setRevealed(false); setCurrentIdx(currentIdx + 1); }}>
            Next →
          </Button>
          <Button variant="ghost" onClick={() => { setReviewMode(false); setCurrentIdx(0); setRevealed(false); }}>
            Exit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        {savedWords.length > 0 && (
          <Button onClick={() => setReviewMode(true)} size="sm" className="font-semibold">
            <RotateCcw className="mr-1 h-4 w-4" /> Review
          </Button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{savedWords.length} words saved</p>

      {savedWords.length === 0 ? (
        <div className="mt-20 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No flashcards yet</p>
          <p className="mt-1 text-sm">Tap words while reading to save them.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {savedWords.map((word) => (
            <div key={word.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div>
                <p className="font-japanese text-lg font-bold">{word.word}</p>
                <p className="text-xs text-muted-foreground">
                  {word.reading} — {word.meanings.join(', ')}
                </p>
              </div>
              <button onClick={() => removeWord(word.id)} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
