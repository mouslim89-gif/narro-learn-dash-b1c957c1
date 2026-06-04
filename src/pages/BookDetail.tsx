import { useParams, useNavigate, Link } from'react-router-dom';
import { books, difficultyConfig, genreLabels, hasAnyAudio, hasChapters, hasParts, partChapterId, DEFAULT_CHAPTER_ID, type Difficulty } from'@/data/books';

import { useState } from'react';
import { ArrowLeft, ArrowRight, Headphones, BookOpen, Clock, CheckCircle2, ChevronRight } from'lucide-react';
import { Button } from'@/components/ui/button';
import { Progress } from'@/components/ui/progress';
import { useReadingProgressStore } from'@/stores/reading-progress';
import { cn } from'@/lib/utils';

export default function BookDetail() {
 const { id } = useParams();
 const navigate = useNavigate();
 const book = books.find((b) => b.id === id);
 const { getBookProgress, getChapterProgress } = useReadingProgressStore();
 const bookProgress = id ? getBookProgress(id) : undefined;
 const hasProgress = !!bookProgress && bookProgress.progressPercent > 0;

 const [difficulty, setDifficulty] = useState<Difficulty>(
 bookProgress?.difficulty ||'simplified');

 if (!book) {
 return (
 <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
 <p className="font-serif text-2xl font-semibold">Book not found</p>
 <Link to="/" className="text-sm text-muted-foreground underline-offset-4 ">
 Back to Library
 </Link>
 </div>
 );
 }

 const isMultiChapter = hasChapters(book);
 const isMultiPart = !isMultiChapter && hasParts(book);
 const chapterProgressMap = id ? getChapterProgress(id) : {};

 // Ordered chapter ids for this book (used to auto-advance Continue).
 const orderedChapterIds: string[] = isMultiChapter
 ? book.chapters!.map((c) => c.id)
 : isMultiPart
 ? book.anchors!.map((_, i) => partChapterId(i))
 : [DEFAULT_CHAPTER_ID];

 // Decide what Continue should open:
 // - last read chapter if it's still in progress
 // - else the next chapter after it
 // - else the first not-completed chapter
 // - else the first chapter (book finished -> restart)
 function pickResumeChapter(): { id: string; label:'continue'|'next'|'start'|'restart'} {
 if (!isMultiChapter && !isMultiPart) {
 const p = chapterProgressMap[DEFAULT_CHAPTER_ID];
 if (!p || p.progressPercent <= 0) return { id: DEFAULT_CHAPTER_ID, label:'start'};
 if (p.progressPercent >= 100) return { id: DEFAULT_CHAPTER_ID, label:'restart'};
 return { id: DEFAULT_CHAPTER_ID, label:'continue'};
 }
 const lastId = bookProgress?.chapterId;
 const lastIdx = lastId ? orderedChapterIds.indexOf(lastId) : -1;
 if (lastIdx >= 0) {
 const lastPct = chapterProgressMap[lastId!]?.progressPercent ?? 0;
 if (lastPct > 0 && lastPct < 100) return { id: lastId!, label:'continue'};
 // Last chapter is done — jump to the next one.
 const nextIdx = lastIdx + 1;
 if (nextIdx < orderedChapterIds.length) {
 return { id: orderedChapterIds[nextIdx], label:'next'};
 }
 }
 // Either nothing read or book finished — find first non-completed.
 const firstUnfinished = orderedChapterIds.find(
 (cid) => (chapterProgressMap[cid]?.progressPercent ?? 0) < 100,
 );
 if (firstUnfinished) {
 const pct = chapterProgressMap[firstUnfinished]?.progressPercent ?? 0;
 return { id: firstUnfinished, label: pct > 0 ?'continue': (lastIdx >= 0 ?'next':'start') };
 }
 return { id: orderedChapterIds[0], label:'restart'};
 }

 const resume = pickResumeChapter();
 const continueChapterId = resume.id;
 const continueLink = (isMultiChapter || isMultiPart)
 ?`/reader/${book.id}/${difficulty}/${continueChapterId}`:`/reader/${book.id}/${difficulty}`;

 function continueLabel(): string {
 if (!isMultiChapter && !isMultiPart) {
 if (resume.label ==='restart') return'Read Again';
 if (resume.label ==='continue') return'Continue Reading';
 return'Start Reading';
 }
 const idx = orderedChapterIds.indexOf(continueChapterId);
 const num = idx >= 0 ? idx + 1 : 1;
 if (resume.label ==='restart') return'Read Again';
 if (resume.label ==='continue') return`Continue Chapter ${num}`;
 if (resume.label ==='next') return`Start Chapter ${num}`;
 return`Start Chapter ${num}`;
 }

 return (
 <div className="pb-24">
 <header
 className="relative overflow-hidden px-6 pt-10 pb-6"
 style={{ backgroundImage:`linear-gradient(160deg, ${book.coverColor}1f 0%, hsl(var(--background)) 65%)`}}
 >
 
 <button
 onClick={() => navigate('/')}
 className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40 "
 aria-label="Back"
 >
 <ArrowLeft className="h-[18px] w-[18px]" />
 </button>

 <div className="relative z-10 mt-8 flex flex-col items-center text-center">
 <div
 className="book-paper relative flex h-64 w-44 items-end overflow-hidden rounded-xl p-4 shadow-xl ring-1 ring-black/5 rotate-[-3deg]"
 style={{ backgroundColor: book.coverColor }}
 >
 <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40" />
 <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
 <p className="font-japanese relative text-lg font-bold leading-tight text-white drop-shadow-sm">
 {book.titleJp}
 </p>
 </div>
 <h1 className="mt-6 font-serif text-3xl font-bold leading-tight">{book.titleEn}</h1>
 <p className="mt-1.5 text-sm text-muted-foreground">{book.author}</p>

 <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
 <span className="inline-flex items-center gap-1.5">
 <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
 {genreLabels[book.genre]}
 </span>
 <span className="text-foreground/20">·</span>
 <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{book.readingTimeMin}m</span>
 {hasAnyAudio(book) && (
 <>
 <span className="text-foreground/20">·</span>
 <span className="inline-flex items-center gap-1.5"><Headphones className="h-3.5 w-3.5" />Audio</span>
 </>
 )}
 {book.chapters && book.chapters.length > 1 && (
 <>
 <span className="text-foreground/20">·</span>
 <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{book.chapters.length} chapters</span>
 </>
 )}
 </div>

 {hasProgress && (
 <div className="mx-auto mt-5 flex w-full max-w-xs items-center gap-3">
 <Progress value={bookProgress!.progressPercent} className="h-1.5 flex-1" />
 <span className="text-[11px] font-semibold tabular-nums text-foreground/70">{bookProgress!.progressPercent}%</span>
 </div>
 )}
 </div>
 </header>

 <div className="h-6 -mt-6 bg-gradient-to-b from-transparent to-background" />

 <div className="stagger-children px-6">
 <p className="text-sm leading-relaxed text-muted-foreground">{book.synopsis}</p>

 <section className="mt-8">
 <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
 <span className="section-bullet" />Reading Level
 </p>
 <div className="rounded-full bg-muted/60 p-1 ring-1 ring-border/40 grid grid-cols-3 gap-1">
 {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => {
 const cfg = difficultyConfig[d];
 const selected = difficulty === d;
 return (
 <button
 key={d}
 onClick={() => setDifficulty(d)}
 className={cn('rounded-full px-3 py-2 text-[12px] font-semibold tracking-wide smooth-colors tap-scale',
 selected
 ?'bg-card text-foreground shadow-sm ring-1 ring-border/50':'text-muted-foreground')}
 >
 {cfg.label}
 </button>
 );
 })}
 </div>
 <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
 {difficultyConfig[difficulty].description}
 </p>
 </section>

 <Link to={continueLink}>
 <Button size="lg" className="mt-6 h-12 w-full rounded-full text-[15px] font-semibold shadow-md">
 {continueLabel()}
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>

 {isMultiChapter && (
 <section className="mt-8">
 <div className="mb-3 flex items-baseline justify-between">
 <h2 className="font-serif text-lg font-semibold">Chapters</h2>
 <span className="text-[11px] tabular-nums text-muted-foreground">{book.chapters!.length} total</span>
 </div>
 <ul className="space-y-2">
 {book.chapters!.map((ch, idx) => {
 const cp = chapterProgressMap[ch.id];
 const pct = cp?.progressPercent ?? 0;
 const done = pct >= 100;
 return (
 <li key={ch.id}>
 <Link to={`/reader/${book.id}/${difficulty}/${ch.id}`} className="block">
 <div className="card-lift tap-scale w-full rounded-xl border bg-card p-4 text-left ring-1 ring-border/30">
 <div className="flex items-center gap-3">
 <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums ring-1',
 done ?'bg-primary/15 text-primary ring-primary/20':'bg-muted text-muted-foreground ring-border/40')}>
 {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
 </span>
 <div className="min-w-0 flex-1">
 <p className="font-serif text-[15px] font-semibold leading-snug truncate">{ch.title}</p>
 {pct > 0 && !done && (
 <div className="mt-1.5 flex items-center gap-2">
 <Progress value={pct} className="h-1 flex-1" />
 <span className="text-[10px] font-semibold tabular-nums text-foreground/70">{pct}%</span>
 </div>
 )}
 </div>
 <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
 </div>
 </div>
 </Link>
 </li>
 );
 })}
 </ul>
 </section>
 )}

 {isMultiPart && (
 <section className="mt-8">
 <div className="mb-3 flex items-baseline justify-between">
 <h2 className="font-serif text-lg font-semibold">Chapters</h2>
 <span className="text-[11px] tabular-nums text-muted-foreground">{book.anchors!.length} total</span>
 </div>
 <ul className="space-y-2">
 {book.anchors!.map((title, idx) => {
 const partId = partChapterId(idx);
 const cp = chapterProgressMap[partId];
 const pct = cp?.progressPercent ?? 0;
 const done = pct >= 100;
 return (
 <li key={partId}>
 <Link to={`/reader/${book.id}/${difficulty}/${partId}`} className="block">
 <div className="card-lift tap-scale w-full rounded-xl border bg-card p-4 text-left ring-1 ring-border/30">
 <div className="flex items-center gap-3">
 <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums ring-1',
 done ?'bg-primary/15 text-primary ring-primary/20':'bg-muted text-muted-foreground ring-border/40')}>
 {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
 </span>
 <div className="min-w-0 flex-1">
 <p className="font-serif text-[15px] font-semibold leading-snug">{title}</p>
 {pct > 0 && !done && (
 <div className="mt-1.5 flex items-center gap-2">
 <Progress value={pct} className="h-1 flex-1" />
 <span className="text-[10px] font-semibold tabular-nums text-foreground/70">{pct}%</span>
 </div>
 )}
 </div>
 <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
 </div>
 </div>
 </Link>
 </li>
 );
 })}
 </ul>
 </section>
 )}

 </div>
 </div>
 );
}
