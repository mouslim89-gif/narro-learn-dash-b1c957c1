import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { books, difficultyConfig, type Difficulty } from '@/data/books';
import { tokenize } from '@/lib/tokenizer';
import { AudioPlayer } from '@/components/AudioPlayer';
import { WordPopup } from '@/components/WordPopup';
import { Progress } from '@/components/ui/progress';

export default function Reader() {
  const { id, difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>((diffParam as Difficulty) || 'simplified');
  const [showSettings, setShowSettings] = useState(false);
  const [popup, setPopup] = useState<{ word: string; pos: { x: number; y: number } } | null>(null);

  const book = books.find((b) => b.id === id);

  const tokens = useMemo(() => {
    if (!book) return [];
    return tokenize(book.content[difficulty]);
  }, [book, difficulty]);

  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  return (
    <div className="min-h-screen bg-[hsl(36,33%,96%)] pb-36 dark:bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="rounded p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-japanese text-sm font-bold">{book.titleJp}</p>
          <p className="text-[10px] text-muted-foreground">
            {difficultyConfig[difficulty].label}
          </p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="rounded p-1">
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {showSettings && (
        <div className="sticky top-14 z-20 border-b bg-card p-4 shadow-sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reading Level</p>
          <div className="flex gap-2">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); setShowSettings(false); }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  d === difficulty ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground'
                }`}
              >
                {difficultyConfig[d].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Progress value={35} className="h-0.5 rounded-none" />

      <article className="mx-auto max-w-2xl px-6 py-10">
        <p className="font-japanese text-xl leading-[2.4] tracking-wide">
          {tokens.map((token, i) => {
            if (!token.isJapanese) {
              return <span key={i}>{token.text}</span>;
            }
            return (
              <span
                key={i}
                onClick={(e) => setPopup({ word: token.text, pos: { x: e.clientX, y: e.clientY } })}
                className="cursor-pointer rounded px-px transition-colors hover:bg-accent/15 hover:text-accent underline decoration-accent/30 decoration-1 underline-offset-4"
              >
                {token.text}
              </span>
            );
          })}
        </p>
      </article>

      {popup && (
        <WordPopup word={popup.word} position={popup.pos} onClose={() => setPopup(null)} />
      )}

      {book.hasAudio && <AudioPlayer />}
    </div>
  );
}
