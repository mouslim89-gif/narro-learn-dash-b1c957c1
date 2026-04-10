import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Settings, Sun, Moon, Type, Sparkles, Languages } from 'lucide-react';
import { books, difficultyConfig, type Difficulty } from '@/data/books';
import { tokenize } from '@/lib/tokenizer';
import { seedCache } from '@/lib/jisho';
import { bookDictionary } from '@/data/book-dictionary';
import { bookGrammar } from '@/data/book-grammar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { FuriganaWord } from '@/components/FuriganaWord';
import { WordPopup } from '@/components/WordPopup';
import { GrammarPanel } from '@/components/GrammarPanel';
import { Progress } from '@/components/ui/progress';
import { useReadingProgressStore, fontSizeMap, type FontSize } from '@/stores/reading-progress';

const fontSizes: FontSize[] = ['small', 'medium', 'large'];
const fontSizeLabels: Record<FontSize, string> = { small: 'S', medium: 'M', large: 'L' };

export default function Reader() {
  const { id, difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const { updateProgress, getProgress, fontSize, setFontSize, readerDarkMode, setReaderDarkMode, showFurigana, setShowFurigana } = useReadingProgressStore();
  const saved = id ? getProgress(id) : undefined;

  const [difficulty, setDifficulty] = useState<Difficulty>(
    (diffParam as Difficulty) || saved?.difficulty || 'simplified'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [popup, setPopup] = useState<{ word: string; pos: { x: number; y: number } } | null>(null);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloaded, setPreloaded] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(saved?.progressPercent || 0);
  const [showGrammar, setShowGrammar] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const restoredScroll = useRef(false);

  const book = books.find((b) => b.id === id);

  const tokens = useMemo(() => {
    if (!book) return [];
    return tokenize(book.content[difficulty]);
  }, [book, difficulty]);

  const bookText = useMemo(() => {
    if (!book) return '';
    return book.content[difficulty];
  }, [book, difficulty]);

  useEffect(() => {
    restoredScroll.current = false;
    // Seed cache from pre-baked data
    const dictData = id ? bookDictionary[id]?.[difficulty] : undefined;
    if (dictData) {
      seedCache(dictData);
    }
    setPreloaded(true);
  }, [id, difficulty]);

  useEffect(() => {
    if (!preloaded || restoredScroll.current || !saved?.progressPercent) return;
    restoredScroll.current = true;
    requestAnimationFrame(() => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH > 0) {
        window.scrollTo(0, (saved.progressPercent / 100) * scrollH);
      }
    });
  }, [preloaded, saved?.progressPercent]);

  const rafRef = useRef<number>(0);
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH <= 0) return;
      const pct = Math.min(100, (window.scrollY / scrollH) * 100);
      setScrollPercent(Math.round(pct));
      if (id) updateProgress(id, difficulty, pct);
    });
  }, [id, difficulty, updateProgress]);

  useEffect(() => {
    if (!preloaded) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [preloaded, handleScroll]);

  useEffect(() => {
    if (readerDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => document.documentElement.classList.remove('dark');
  }, [readerDarkMode]);

  const timeRemaining = useMemo(() => {
    if (!book || scrollPercent >= 100) return null;
    const remaining = book.readingTimeMin * ((100 - scrollPercent) / 100);
    return Math.max(1, Math.round(remaining));
  }, [book, scrollPercent]);

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
            {timeRemaining && ` · ~${timeRemaining} min left`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Furigana toggle - always visible */}
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className={`rounded p-1 transition-colors ${showFurigana ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            title={showFurigana ? 'Hide Furigana' : 'Show Furigana'}
          >
            <Languages className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowGrammar(true)}
            className="rounded p-1 text-muted-foreground hover:text-primary"
            title="Grammar Notes"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="rounded p-1">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="sticky top-14 z-20 border-b bg-card p-4 shadow-sm animate-fade-in">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reading Level</p>
          <div className="flex gap-2">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  d === difficulty ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground'
                }`}
              >
                {difficultyConfig[d].label}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Font Size</p>
          <div className="flex gap-2">
            {fontSizes.map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  s === fontSize ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground'
                }`}
              >
                <Type className="h-3 w-3" /> {fontSizeLabels[s]}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Theme</p>
          <button
            onClick={() => setReaderDarkMode(!readerDarkMode)}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-semibold transition-all"
          >
            {readerDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {readerDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      )}

      {!preloaded ? (
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="mb-3 text-sm text-muted-foreground">Loading dictionary…</p>
          <Progress value={preloadProgress} className="h-1.5 rounded-full" />
          <p className="mt-2 text-xs text-muted-foreground">{preloadProgress}%</p>
        </div>
      ) : (
        <>
          <Progress value={scrollPercent} className="h-0.5 rounded-none" />
          <article ref={articleRef} className="mx-auto max-w-2xl px-6 py-10">
            <p className={`font-japanese tracking-wide ${fontSizeMap[fontSize]} ${showFurigana ? 'leading-[3.2]' : ''}`}>
              {tokens.map((token, i) => {
                if (!token.isJapanese) {
                  return <span key={i}>{token.text}</span>;
                }

                const handleClick = (e: React.MouseEvent) => {
                  setPopup({ word: token.text, pos: { x: e.clientX, y: e.clientY } });
                };

                if (showFurigana) {
                  return <FuriganaWord key={i} text={token.text} onClick={handleClick} />;
                }

                return (
                  <span
                    key={i}
                    onClick={handleClick}
                    className="cursor-pointer rounded px-px transition-colors hover:bg-accent/15 hover:text-accent underline decoration-accent/30 decoration-1 underline-offset-4"
                  >
                    {token.text}
                  </span>
                );
              })}
            </p>
          </article>
        </>
      )}

      {popup && (
        <WordPopup word={popup.word} position={popup.pos} onClose={() => setPopup(null)} />
      )}

      <GrammarPanel
        text={bookText}
        open={showGrammar}
        onClose={() => setShowGrammar(false)}
      />

      {book.hasAudio && <AudioPlayer />}
    </div>
  );
}
