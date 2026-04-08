import { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { lookupWord, type JishoResult } from '@/lib/jisho';

interface WordPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function WordPopup({ word, position, onClose }: WordPopupProps) {
  const { addWord, hasWord } = useFlashcardStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<JishoResult | null>(null);
  const [error, setError] = useState(false);

  const wordId = word; // Use the word itself as ID
  const saved = hasWord(wordId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    lookupWord(word)
      .then((results) => {
        if (!cancelled && results.length > 0) {
          setResult(results[0]);
        } else if (!cancelled) {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [word]);

  const handleSave = () => {
    if (!result) return;
    const entry: SavedWord = {
      id: wordId,
      word: result.japanese[0]?.word || word,
      reading: result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
    };
    addWord(entry);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-72 animate-in fade-in zoom-in-95 rounded-lg border bg-card p-4 shadow-lg"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.min(position.y + 10, window.innerHeight - 250),
        }}
      >
        <button onClick={onClose} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {loading && (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Looking up…</span>
          </div>
        )}

        {error && !loading && (
          <div className="py-2">
            <p className="font-japanese text-2xl font-bold">{word}</p>
            <p className="mt-2 text-sm text-muted-foreground">No definition found.</p>
          </div>
        )}

        {result && !loading && (
          <>
            <p className="font-japanese text-2xl font-bold">
              {result.japanese[0]?.word || word}
            </p>
            <p className="font-japanese text-sm text-muted-foreground">
              {result.japanese[0]?.reading}
            </p>
            {result.jlpt.length > 0 && (
              <span className="mt-1 inline-block rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                {result.jlpt[0]?.replace('jlpt-', 'JLPT ')}
              </span>
            )}
            {result.senses[0]?.parts_of_speech && (
              <p className="mt-1 text-[10px] text-muted-foreground italic">
                {result.senses[0].parts_of_speech.join(', ')}
              </p>
            )}
            <div className="mt-2 space-y-1">
              {result.senses.slice(0, 3).map((sense, i) => (
                <p key={i} className="text-sm font-semibold text-accent">
                  {i + 1}. {sense.english_definitions.join('; ')}
                </p>
              ))}
            </div>
            <div className="mt-3">
              <button
                onClick={handleSave}
                disabled={saved}
                className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  saved
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-accent text-accent-foreground hover:bg-accent/80'
                }`}
              >
                <Star className="h-3.5 w-3.5" /> {saved ? 'Saved' : 'Save to Flashcards'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
