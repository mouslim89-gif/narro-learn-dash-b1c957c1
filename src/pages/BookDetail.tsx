import { useParams, useNavigate, Link } from 'react-router-dom';
import { books, difficultyConfig, genreLabels, hasAnyAudio, hasChapters, DEFAULT_CHAPTER_ID, type Difficulty } from '@/data/books';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Headphones, BookOpen, CheckCircle2, ChevronRight, Clock, Layers, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { cn } from '@/lib/utils';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const { getBookProgress, getChapterProgress } = useReadingProgressStore();
  const bookProgress = id ? getBookProgress(id) : undefined;
  const hasProgress = bookProgress && bookProgress.progressPercent > 0;

  const [difficulty, setDifficulty] = useState<Difficulty>(
    bookProgress?.difficulty || 'simplified'
  );

  if (!book) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-2xl font-semibold">Book not found</p>
        <Link to="/" className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← Back to Library
        </Link>
      </div>
    );
  }

  const isMultiChapter = hasChapters(book);
  const chapterProgressMap = id ? getChapterProgress(id) : {};

  const continueChapterId = bookProgress?.chapterId || DEFAULT_CHAPTER_ID;
  const continueLink = isMultiChapter
    ? `/reader/${book.id}/${difficulty}/${continueChapterId}`
    : `/reader/${book.id}/${difficulty}`;

  return (
    <div className="pb-24">
      {/* Hero with kanji watermark, tinted by cover color */}
      <header
        className="library-header-bg relative overflow-hidden px-6 pt-16 pb-8"
        style={{ backgroundImage: `linear-gradient(160deg, ${book.coverColor}26 0%, hsl(var(--background)) 70%)` }}
      >
        <span className="library-kanji-watermark" aria-hidden="true">本</span>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 hover:bg-background"
          aria-label="Back"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div
            className="book-paper relative flex h-48 w-32 items-end overflow-hidden rounded-md p-3 shadow-2xl ring-1 ring-black/10 rotate-[-2deg]"
            style={{ backgroundColor: book.coverColor }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40" />
            <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
            <p className="font-japanese relative text-base font-bold leading-tight text-white drop-shadow-sm">
              {book.titleJp}
            </p>
          </div>

          <h1 className="mt-6 font-serif text-3xl font-bold leading-tight tracking-tight">{book.titleEn}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>

          {/* Metadata strip — no JLPT */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3 w-3" /> {genreLabels[book.genre]}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {book.readingTimeMin}m
            </span>
            {hasAnyAudio(book) && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Headphones className="h-3 w-3" /> Audio
                </span>
              </>
            )}
            {isMultiChapter && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3 w-3" /> {book.chapters!.length} chapters
                </span>
              </>
            )}
          </div>

          {hasProgress && (
            <div className="mt-4 flex w-full max-w-xs items-center gap-2">
              <Progress value={bookProgress.progressPercent} className="h-1.5 flex-1" />
              <span className="text-[11px] font-semibold tabular-nums text-foreground/70">
                {bookProgress.progressPercent}%
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="bg-gradient-to-b from-transparent to-background h-6 -mt-6 relative z-0" />

      <div className="px-6">
        {/* Synopsis */}
        <p className="mt-2 font-serif text-[15px] leading-relaxed text-foreground/80">{book.synopsis}</p>

        {/* Primary CTA */}
        <Link to={continueLink}>
          <Button className="mt-6 h-12 w-full rounded-full text-sm font-semibold shadow-md shadow-primary/20">
            {hasProgress
              ? isMultiChapter
                ? `Continue Chapter ${(book.chapters!.findIndex(c => c.id === continueChapterId) + 1) || 1}`
                : 'Continue Reading'
              : isMultiChapter
                ? 'Start Chapter 1'
                : 'Start Reading'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>

        {/* Difficulty — segmented tiles */}
        <section className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="section-bullet" />Reading Level
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => {
              const cfg = difficultyConfig[d];
              const selected = d === difficulty;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all tap-scale',
                    selected
                      ? 'ring-2 ring-primary/40 border-transparent shadow-sm'
                      : 'border-border/50 bg-card hover:border-border'
                  )}
                  style={selected ? { backgroundImage: `linear-gradient(140deg, ${book.coverColor}26 0%, hsl(var(--card)) 70%)` } : undefined}
                >
                  <p className="font-serif text-[13px] font-bold leading-tight">{cfg.label}</p>
                  <p className="mt-1 text-[10px] leading-snug text-muted-foreground line-clamp-2">{cfg.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Chapters — shelf rows */}
        {isMultiChapter && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="section-bullet" />Chapters
              </p>
              <span className="text-[11px] tabular-nums text-muted-foreground">{book.chapters!.length} total</span>
            </div>
            <div className="stagger-children mt-3 flex flex-col gap-2">
              {book.chapters!.map((ch, idx) => {
                const cp = chapterProgressMap[ch.id];
                const pct = cp?.progressPercent ?? 0;
                const done = pct >= 100;
                const started = pct > 0 && !done;
                return (
                  <Link key={ch.id} to={`/reader/${book.id}/${difficulty}/${ch.id}`}>
                    <button
                      type="button"
                      className="card-lift tap-scale w-full rounded-xl border bg-card p-4 text-left ring-1 ring-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-[14px] font-semibold leading-tight truncate">{ch.title}</p>
                          {started && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <Progress value={pct} className="h-1 flex-1" />
                              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{pct}%</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
