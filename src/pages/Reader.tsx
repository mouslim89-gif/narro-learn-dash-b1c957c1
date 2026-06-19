import { useParams, useNavigate } from 'react-router-dom';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ArrowLeft, ArrowRight, Settings, Sun, Moon, Type, BookType, Eye, EyeClosed, Wrench, Languages, ChevronDown, ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { books, difficultyConfig, type Difficulty, getChapterContent, chapterKey, DEFAULT_CHAPTER_ID, hasParts, parsePartId, partChapterId } from '@/data/books';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

function HeaderChip({ children, onClick, className, 'aria-label': ariaLabel }: { children: React.ReactNode, onClick?: (e: React.MouseEvent) => void, className?: string, 'aria-label'?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex h-10 items-center justify-center rounded-full bg-background/80 px-3 backdrop-blur-md ring-1 ring-border/40 header-chip smooth-colors tap-scale-sm",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function Reader() {
  const { id, difficulty: diffParam, chapterId: chapterParam } = useParams();
  const navigate = useNavigate();
  const goTo = useDelayedNav();
  const { 
    updateProgress, 
    getProgress, 
    fontSize, 
    setFontSize, 
    darkMode,
    setDarkMode,
    showFurigana,
    setShowFurigana
  } = useReadingProgressStore();

  const difficulty = (diffParam as Difficulty) || 'original';
  const chapterId = chapterParam || DEFAULT_CHAPTER_ID;
  const book = useMemo(() => books.find(b => b.id === id), [id]);

  if (!book) return <div>Book not found</div>;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-bottom border-border/40">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <HeaderChip onClick={(e) => goTo(`/book/${id}`, e)} aria-label="Back to book">
            <ArrowLeft className="h-5 w-5"/>
          </HeaderChip>
          
          <div className="flex-1 min-w-0 text-center">
            <h1 className="truncate font-serif text-sm font-bold">{book.titleEn}</h1>
          </div>

          <HeaderChip onClick={() => {}}>
            <Settings className="h-5 w-5"/>
          </HeaderChip>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className={cn("reader-text", fontSize === 'small' ? 'text-lg' : fontSize === 'large' ? 'text-2xl' : 'text-xl')}>
          <p className="font-japanese leading-loose text-foreground/90">
            Reader content placeholder for {book.titleJp} ({difficulty}).
          </p>
        </div>
      </main>
    </div>
  );
}
