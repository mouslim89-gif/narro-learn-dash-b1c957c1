import { useParams, useNavigate, Link } from 'react-router-dom';
import { books, difficultyConfig, jlptColors, genreLabels, type Difficulty } from '@/data/books';
import { useState } from 'react';
import { ArrowLeft, Headphones, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const [difficulty, setDifficulty] = useState<Difficulty>('simplified');

  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  return (
    <div className="pb-24">
      <button onClick={() => navigate(-1)} className="fixed left-4 top-4 z-30 rounded-full bg-card/80 p-2 shadow backdrop-blur-sm">
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Cover hero */}
      <div
        className="flex h-56 items-end p-6"
        style={{ background: `linear-gradient(180deg, ${book.coverColor}cc, ${book.coverColor})` }}
      >
        <div>
          <p className="font-japanese text-4xl font-black text-white drop-shadow-lg">{book.titleJp}</p>
          <p className="text-lg font-bold text-white/90">{book.titleEn}</p>
          <p className="text-sm text-white/70">{book.author}</p>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: jlptColors[book.jlptLevel] }}>
            {book.jlptLevel}
          </span>
          <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold">{genreLabels[book.genre]}</span>
          <span className="text-xs text-muted-foreground">{book.readingTimeMin} min</span>
          {book.hasAudio && (
            <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <Headphones className="h-3 w-3" /> Audio
            </span>
          )}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{book.synopsis}</p>

        {/* Difficulty selection */}
        <h3 className="mt-6 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Choose Reading Level</h3>
        <div className="mt-3 flex flex-col gap-2">
          {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => {
            const cfg = difficultyConfig[d];
            const selected = d === difficulty;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                  selected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-2xl">{cfg.emoji}</span>
                <div>
                  <p className="text-sm font-bold">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {d === 'simplified' && 'Simple vocabulary, short sentences'}
                    {d === 'intermediate' && 'Some kanji, moderate complexity'}
                    {d === 'original' && 'Full original Japanese text'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <Link to={`/reader/${book.id}/${difficulty}`}>
          <Button className="mt-6 w-full rounded-2xl py-6 text-base font-extrabold shadow-lg">
            <BookOpen className="mr-2 h-5 w-5" /> Start Reading
          </Button>
        </Link>
      </div>
    </div>
  );
}
