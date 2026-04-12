import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Settings, Sun, Moon, Type, Sparkles, Languages } from 'lucide-react';
import { books, difficultyConfig, type Difficulty } from '@/data/books';
import { bookTokens, type BookToken } from '@/data/book-tokens';
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
  const [popupWord, setPopupWord] = useState<{ text: string; baseForm?: string; pos?: string } | null>(null);
  
  const [scrollPercent, setScrollPercent] = useState(saved?.progressPercent || 0);
  const [showGrammar, setShowGrammar] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);
  const restoredScroll = useRef(false);

  const book = books.find((b) => b.id === id);

  // Use pre-baked Kuromoji tokens
  const tokens = useMemo(() => {
    if (!id) return [];
    return bookTokens[id]?.[difficulty] || [];
  }, [id, difficulty]);

  const bookText = useMemo(() => {
    if (!book) return '';
    return book.content[difficulty];
  }, [book, difficulty]);

  // Split tokens into sentences for highlighting
  const sentences = useMemo(() => {
    const result: { tokens: BookToken[] }[] = [];
    let current: BookToken[] = [];
    tokens.forEach((token) => {
      current.push(token);
      if (token.t.includes('。') || token.t.includes('！') || token.t.includes('？')) {
        result.push({ tokens: [...current] });
        current = [];
      }
    });
    if (current.length > 0) result.push({ tokens: current });
    return result;
  }, [tokens]);

  useEffect(() => {
    restoredScroll.current = false;
    seedCache(bookDictionary);
  }, [id, difficulty]);

  useEffect(() => {
    if (restoredScroll.current || !saved?.progressPercent) return;
    restoredScroll.current = true;
    requestAnimationFrame(() => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH > 0) {
        window.scrollTo(0, (saved.progressPercent / 100) * scrollH);
      }
    });
  }, [saved?.progressPercent]);

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
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
        <button onClick={() => navigate(-1)} className="rounded p-2 -ml-1 active:bg-muted">
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
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className={`rounded p-2 transition-colors active:scale-95 ${showFurigana ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            title={showFurigana ? 'Hide Furigana' : 'Show Furigana'}
          >
            <Languages className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowGrammar(true)}
            className="rounded p-2 text-muted-foreground active:scale-95"
            title="Grammar Notes"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="rounded p-2 active:scale-95">
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

      <Progress value={scrollPercent} className="h-0.5 rounded-none" />
      <article ref={articleRef} className="mx-auto max-w-2xl px-6 py-10">
        <div className={`font-japanese tracking-wide ${fontSizeMap[fontSize]} ${showFurigana ? 'leading-[3.2]' : ''}`}>
          {sentences.map((sentence, sIdx) => (
            <span
              key={sIdx}
              onClick={() => setActiveSentence(activeSentence === sIdx ? null : sIdx)}
              className={`transition-colors duration-200 ${
                activeSentence === sIdx ? 'bg-accent/10 rounded' : ''
              }`}
            >
              {sentence.tokens.map((token, i) => {
                if (!token.j) {
                  return <span key={i}>{token.t}</span>;
                }

                const handleClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setPopupWord({ text: token.t, baseForm: token.b, pos: token.p });
                };

                if (showFurigana) {
                  return <FuriganaWord key={i} text={token.t} reading={token.r} onClick={handleClick} />;
                }

                return (
                  <span
                    key={i}
                    onClick={handleClick}
                    className="cursor-pointer rounded px-0.5 py-1 transition-all active:scale-95 active:bg-accent/20 hover:bg-accent/15 hover:text-accent underline decoration-accent/30 decoration-1 underline-offset-4"
                  >
                    {token.t}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
      </article>

      {popupWord && (
        <WordPopup
          word={popupWord.text}
          baseForm={popupWord.baseForm}
          pos={popupWord.pos}
          onClose={() => setPopupWord(null)}
        />
      )}

      <GrammarPanel
        text={bookText}
        bookId={id || ''}
        difficulty={difficulty}
        open={showGrammar}
        onClose={() => setShowGrammar(false)}
      />

      {book.hasAudio && <AudioPlayer />}
    </div>
  );
}
