import { X, Star, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFlashcardStore } from '@/stores/flashcards';
import type { DictionaryEntry } from '@/data/dictionary';

interface WordPopupProps {
  entry: DictionaryEntry;
  position: { x: number; y: number };
  onClose: () => void;
}

export function WordPopup({ entry, position, onClose }: WordPopupProps) {
  const navigate = useNavigate();
  const { addWord, hasWord } = useFlashcardStore();
  const saved = hasWord(entry.id);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-64 animate-in fade-in zoom-in-95 rounded-2xl border bg-card p-4 shadow-xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 270),
          top: Math.min(position.y + 10, window.innerHeight - 200),
        }}
      >
        <button onClick={onClose} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <p className="font-japanese text-2xl font-bold">{entry.word}</p>
        <p className="font-japanese text-sm text-muted-foreground">{entry.reading}</p>
        <p className="mt-1 text-sm font-semibold text-primary">{entry.translation}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => addWord(entry)}
            disabled={saved}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              saved
                ? 'bg-muted text-muted-foreground'
                : 'bg-accent text-accent-foreground hover:bg-accent/80'
            }`}
          >
            <Star className="h-3.5 w-3.5" /> {saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => { onClose(); navigate(`/dictionary?q=${entry.word}`); }}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80"
          >
            <BookOpen className="h-3.5 w-3.5" /> Dictionary
          </button>
        </div>
      </div>
    </>
  );
}
