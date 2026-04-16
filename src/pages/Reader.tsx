import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Settings, Sun, Moon, Type, BookType, Languages, AlignVerticalSpaceAround, Palette, Eye, EyeClosed } from 'lucide-react';
import { books, difficultyConfig, type Difficulty } from '@/data/books';
import { bookTokens, type BookToken } from '@/data/book-tokens';
import { mergeConjugatedTokens } from '@/lib/merge-tokens';
import { seedCache } from '@/lib/jisho';
import { bookDictionary } from '@/data/book-dictionary';
import { bookGrammar } from '@/data/book-grammar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { FuriganaWord } from '@/components/FuriganaWord';
import { WordPopup } from '@/components/WordPopup';
import { WordMiniPopup } from '@/components/WordMiniPopup';
import { GrammarPanel } from '@/components/GrammarPanel';
import { Progress } from '@/components/ui/progress';
import { useReadingProgressStore, fontSizeMap, type FontSize, type WritingMode, type DisplayMode } from '@/stores/reading-progress';
import { getPosColorClass, LEGEND } from '@/lib/pos-colors';

const fontSizes: FontSize[] = ['small', 'medium', 'large'];
const fontSizeLabels: Record<FontSize, string> = { small: 'S', medium: 'M', large: 'L' };

export default function Reader() {
  const { id, difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const { updateProgress, getProgress, fontSize, setFontSize, readerDarkMode, setReaderDarkMode, showFurigana, setShowFurigana, writingMode, setWritingMode, displayMode, setDisplayMode } = useReadingProgressStore();
  const saved = id ? getProgress(id) : undefined;

  const [difficulty, setDifficulty] = useState<Difficulty>(
    (diffParam as Difficulty) || saved?.difficulty || 'simplified'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [miniPopup, setMiniPopup] = useState<{ text: string; baseForm?: string; pos?: string; contextSentence?: string; sentenceRect: { top: number; bottom: number; left: number; right: number }; sentenceIdx: number; tokenIdx: number } | null>(null);
  const sentenceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [fullPopupWord, setFullPopupWord] = useState<{ text: string; baseForm?: string; pos?: string; contextSentence?: string } | null>(null);
  
  const [scrollPercent, setScrollPercent] = useState(saved?.progressPercent || 0);
  const [showGrammar, setShowGrammar] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);
  const restoredScroll = useRef(false);

  const book = books.find((b) => b.id === id);

  // Use pre-baked Kuromoji tokens, then aggressively merge conjugated forms
  // (verb + auxiliaries + て-compound auxiliaries) into single clickable units.
  const tokens = useMemo(() => {
    if (!id) return [];
    const raw = bookTokens[id]?.[difficulty] || [];
    return mergeConjugatedTokens(raw);
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

  // Group sentences into visual paragraphs
  const paragraphs = useMemo(() => {
    const groups: { tokens: BookToken[] }[][] = [];
    let current: { tokens: BookToken[] }[] = [];

    sentences.forEach((sentence) => {
      const text = sentence.tokens.map((t) => t.t).join('');
      const startsDialogue = text.startsWith('「') || text.startsWith('『');
      const endsDialogue = text.includes('」') || text.includes('』');

      // Start new paragraph before dialogue
      if (startsDialogue && current.length > 0) {
        groups.push(current);
        current = [];
      }

      current.push(sentence);

      // Start new paragraph after dialogue ends
      if (endsDialogue) {
        groups.push(current);
        current = [];
      } else if (current.length >= 3 && !startsDialogue) {
        groups.push(current);
        current = [];
      }
    });

    if (current.length > 0) groups.push(current);
    return groups;
  }, [sentences]);

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
            {showFurigana ? <Eye className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowGrammar(true)}
            className="rounded p-2 text-muted-foreground active:scale-95"
            title="Grammar Notes"
          >
            <BookType className="h-5 w-5" />
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

          <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Writing Direction</p>
          <div className="flex gap-2">
            {(['horizontal', 'vertical'] as WritingMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setWritingMode(m)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  m === writingMode ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground'
                }`}
              >
                {m === 'vertical' && <AlignVerticalSpaceAround className="h-3 w-3" />}
                {m === 'horizontal' ? 'Normal' : '縦書き'}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Display Mode</p>
          <div className="flex gap-2">
            {(['normal', 'grammar'] as DisplayMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setDisplayMode(m)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  m === displayMode ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground'
                }`}
              >
                {m === 'grammar' && <Palette className="h-3 w-3" />}
                {m === 'normal' ? 'Normal' : 'Grammar'}
              </button>
            ))}
          </div>
        </div>
      )}

      <Progress value={scrollPercent} className="h-0.5 rounded-none" />

      {displayMode === 'grammar' && (
        <div className="mx-3 mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm dark:bg-card sm:mx-auto sm:max-w-2xl">
          {LEGEND.map((item) => (
            <span key={item.category} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <article ref={articleRef} className={`mx-3 my-4 rounded-2xl bg-white shadow-sm dark:bg-card sm:mx-auto sm:max-w-2xl sm:rounded-none sm:bg-transparent sm:shadow-none sm:dark:bg-transparent ${writingMode === 'vertical' ? 'writing-vertical' : ''}`}>
        <div className={`font-japanese tracking-wide px-5 py-8 sm:px-6 sm:py-10 ${fontSizeMap[fontSize]} ${showFurigana ? 'leading-[2.8]' : 'leading-relaxed'} ${writingMode === 'vertical' ? 'h-full' : ''}`}>
          {paragraphs.map((paragraph, pIdx) => (
            <p key={pIdx} className="mb-6" style={{ textIndent: '1em' }}>
              {paragraph.map((sentence, sIdx) => {
                const globalIdx = paragraphs.slice(0, pIdx).reduce((sum, p) => sum + p.length, 0) + sIdx;
                return (
                  <span
                    key={sIdx}
                    ref={(el) => { if (el) sentenceRefs.current.set(globalIdx, el); }}
                    className={`transition-opacity duration-200 ${
                      miniPopup && miniPopup.sentenceIdx !== globalIdx ? 'opacity-20' : ''
                    }`}
                  >
                    {sentence.tokens.map((token, i) => {
                      if (!token.j) {
                        return <span key={i}>{token.t}</span>;
                      }

                      const handleClick = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        // Toggle off if clicking the same word
                        if (miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i) {
                          setMiniPopup(null);
                          return;
                        }
                        const contextSentence = sentence.tokens.map(t => t.t).join('');
                        const spanEl = sentenceRefs.current.get(globalIdx);
                        const rect = spanEl?.getBoundingClientRect() || { top: e.clientY, bottom: e.clientY, left: e.clientX, right: e.clientX };
                        setMiniPopup({ text: token.t, baseForm: token.b, pos: token.p, contextSentence, sentenceRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }, sentenceIdx: globalIdx, tokenIdx: i });
                      };
                      // Prevent the popup's outside-click handler from firing before our click toggle
                      const stopDown = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();

                      const colorClass = displayMode === 'grammar' ? getPosColorClass(token.p) : '';
                      const isHighlighted = miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i;

                      if (showFurigana) {
                        return <FuriganaWord key={i} text={token.t} reading={token.r} colorClass={`${colorClass} ${isHighlighted ? 'bg-accent/25 rounded-sm' : ''}`} onClick={handleClick} onMouseDown={stopDown} onTouchStart={stopDown} />;
                      }

                      return (
                        <span
                          key={i}
                          onClick={handleClick}
                          onMouseDown={stopDown}
                          onTouchStart={stopDown}
                          className={`cursor-pointer rounded-sm px-0.5 transition-colors active:bg-accent/10 ${colorClass} ${isHighlighted ? 'bg-accent/25' : ''}`}
                        >
                          {token.t}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
      </article>

      {miniPopup && (
        <WordMiniPopup
          word={miniPopup.text}
          baseForm={miniPopup.baseForm}
          pos={miniPopup.pos}
          contextSentence={miniPopup.contextSentence}
          sentenceRect={miniPopup.sentenceRect}
          onClose={() => setMiniPopup(null)}
          onShowMore={() => {
            const { text, baseForm, pos, contextSentence } = miniPopup;
            setMiniPopup(null);
            setFullPopupWord({ text, baseForm, pos, contextSentence });
          }}
        />
      )}

      {fullPopupWord && (
        <WordPopup
          word={fullPopupWord.text}
          baseForm={fullPopupWord.baseForm}
          pos={fullPopupWord.pos}
          contextSentence={fullPopupWord.contextSentence}
          onClose={() => setFullPopupWord(null)}
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
