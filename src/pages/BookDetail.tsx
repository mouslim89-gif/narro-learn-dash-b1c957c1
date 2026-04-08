import { useParams, useNavigate, Link } from 'react-router-dom';
import { books, difficultyConfig, jlptColors, genreLabels, type Difficulty } from '@/data/books';
import { useState } from 'react';
import { ArrowLeft, Headphones, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReadingProgressStore } from '@/stores/reading-progress';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const { getProgress } = useReadingProgressStore();
  const saved = id ? getProgress(id) : undefined;
  const hasProgress = saved && saved.progressPercent > 0;

  const [difficulty, setDifficulty] = useState<Difficulty>(
    saved?.difficulty || 'simplified'
  );

  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  return (
    <div className="pb-24">
      <button onClick={() => navigate(-1)} className="fixed left-4 top-4 z-30 rounded bg-card/80 p-2 shadow backdrop-blur-sm">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex items-end gap-5 border-b bg-card px-6 pb-6 pt-16">
        <div
          className="relative flex h-40 w-28 flex-shrink-0 items-end rounded p-3 shadow-lg"
          style={{ backgroundColor: book.coverColor }}
        >
          <div className="absolute inset-y-0 left-0 w-2 bg-black/15" />
          <p className="font-japanese text-base font-bold leading-tight text-white">{book.titleJp}</p>
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold">{book.titleEn}</h1>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: jlptColors[book.jlptLevel] }}>
              {book.jlptLevel}
            </span>
            <span className="text-xs text-muted-foreground">{genreLabels[book.genre]}</span>
            <span className="text-xs text-muted-foreground">{book.readingTimeMin} min</span>
            {book.hasAudio && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Headphones className="h-3 w-3" /> Audio
              </span>
            )}
          </div>
          {hasProgress && (
            <div className="mt-3 flex items-center gap-2">
              <Progress value={saved.progressPercent} className="h-1.5 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{saved.progressPercent}% read</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{book.synopsis}</p>

        <h3 className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reading Level</h3>
        <div className="mt-3 flex flex-col gap-2">
          {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => {
            const cfg = difficultyConfig[d];
            const selected = d === difficulty;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <div>
                  <p className="text-sm font-semibold">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Link to={`/reader/${book.id}/${difficulty}`}>
          <Button className="mt-6 w-full py-6 text-sm font-semibold shadow-sm">
            <BookOpen className="mr-2 h-4 w-4" />
            {hasProgress ? 'Continue Reading' : 'Start Reading'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
