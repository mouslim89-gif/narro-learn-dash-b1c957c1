import { useParams, useNavigate, Link } from 'react-router-dom';
import { books, difficultyConfig, jlptColors, genreLabels, hasAnyAudio, hasChapters, DEFAULT_CHAPTER_ID, type Difficulty } from '@/data/books';
import { useState } from 'react';
import { ArrowLeft, Headphones, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const { getProgress, getBookProgress, getChapterProgress } = useReadingProgressStore();
  const bookProgress = id ? getBookProgress(id) : undefined;
  const hasProgress = bookProgress && bookProgress.progressPercent > 0;

  const [difficulty, setDifficulty] = useState<Difficulty>(
    bookProgress?.difficulty || 'simplified'
  );

  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  const isMultiChapter = hasChapters(book);
  const chapterProgressMap = id ? getChapterProgress(id) : {};

  // Single-chapter "Continue Reading" target
  const continueChapterId = bookProgress?.chapterId || DEFAULT_CHAPTER_ID;
  const continueLink = isMultiChapter
    ? `/reader/${book.id}/${difficulty}/${continueChapterId}`
    : `/reader/${book.id}/${difficulty}`;

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
            {hasAnyAudio(book) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Headphones className="h-3 w-3" /> Audio
              </span>
            )}
            {isMultiChapter && (
              <span className="text-xs text-muted-foreground">{book.chapters!.length} chapters</span>
            )}
          </div>
          {hasProgress && (
            <div className="mt-3 flex items-center gap-2">
              <Progress value={bookProgress.progressPercent} className="h-1.5 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{bookProgress.progressPercent}% read</span>
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

        {isMultiChapter && (
          <>
            <h3 className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Chapters</h3>
            <Accordion type="single" collapsible className="mt-2">
              {book.chapters!.map((ch, idx) => {
                const cp = chapterProgressMap[ch.id];
                const pct = cp?.progressPercent ?? 0;
                const done = pct >= 100;
                const started = pct > 0;
                return (
                  <AccordionItem key={ch.id} value={ch.id} className="border-b border-border/60">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex flex-1 items-center gap-3 pr-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : idx + 1}
                        </span>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold leading-tight">{ch.title}</p>
                          {started && !done && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <Progress value={pct} className="h-1 flex-1" />
                              <span className="text-[10px] font-medium text-muted-foreground">{pct}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {ch.content[difficulty].slice(0, 100)}…
                      </p>
                      <Link to={`/reader/${book.id}/${difficulty}/${ch.id}`}>
                        <Button size="sm" variant={started ? 'default' : 'outline'} className="w-full">
                          <BookOpen className="mr-2 h-3.5 w-3.5" />
                          {done ? 'Re-read chapter' : started ? 'Continue chapter' : 'Start chapter'}
                        </Button>
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}

        <Link to={continueLink}>
          <Button className="mt-6 w-full py-6 text-sm font-semibold shadow-sm">
            <BookOpen className="mr-2 h-4 w-4" />
            {hasProgress
              ? isMultiChapter
                ? `Continue Chapter ${(book.chapters!.findIndex(c => c.id === continueChapterId) + 1) || 1}`
                : 'Continue Reading'
              : isMultiChapter
                ? 'Start Chapter 1'
                : 'Start Reading'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
