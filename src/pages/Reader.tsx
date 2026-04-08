import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { books, difficultyConfig, type Difficulty } from '@/data/books';
import { dictionary } from '@/data/dictionary';
import { AudioPlayer } from '@/components/AudioPlayer';
import { WordPopup } from '@/components/WordPopup';
import { Progress } from '@/components/ui/progress';
import type { DictionaryEntry } from '@/data/dictionary';

export default function Reader() {
  const { id, difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const [difficulty, setDifficulty] = useState<Difficulty>((diffParam as Difficulty) || 'simplified');
  const [showSettings, setShowSettings] = useState(false);
  const [popup, setPopup] = useState<{ entry: DictionaryEntry; pos: { x: number; y: number } } | null>(null);

  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  const text = book.content[difficulty];

  const handleWordClick = useCallback(
    (word: string, e: React.MouseEvent) => {
      // Try to find the word in dictionary
      const entry = dictionary.find(
        (d) => word.includes(d.word) || word.includes(d.reading)
      );
      if (entry) {
        setPopup({ entry, pos: { x: e.clientX, y: e.clientY } });
      }
    },
    []
  );

  // Split text into clickable segments (characters for Japanese)
  const chars = text.split('');

  return (
    <div className="min-h-screen pb-36">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="rounded-full p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-japanese text-sm font-bold">{book.titleJp}</p>
          <p className="text-[10px] text-muted-foreground">
            {difficultyConfig[difficulty].emoji} {difficultyConfig[difficulty].label}
          </p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="rounded-full p-1">
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="sticky top-14 z-20 border-b bg-card p-4 shadow-md">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Reading Level</p>
          <div className="flex gap-2">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); setShowSettings(false); }}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  d === difficulty ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-foreground'
                }`}
              >
                {difficultyConfig[d].emoji} {difficultyConfig[d].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <Progress value={35} className="h-1 rounded-none" />

      {/* Text */}
      <article className="px-6 py-8">
        <p className="font-japanese text-xl leading-[2.2] tracking-wide">
          {chars.map((char, i) => (
            <span
              key={i}
              onClick={(e) => handleWordClick(char, e)}
              className="cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary rounded"
            >
              {char}
            </span>
          ))}
        </p>
      </article>

      {/* Word popup */}
      {popup && (
        <WordPopup entry={popup.entry} position={popup.pos} onClose={() => setPopup(null)} />
      )}

      {/* Audio player */}
      {book.hasAudio && <AudioPlayer />}
    </div>
  );
}
