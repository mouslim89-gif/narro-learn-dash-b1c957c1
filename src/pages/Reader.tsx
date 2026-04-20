import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Settings, Sun, Moon, Type, BookType, Palette, Eye, EyeClosed } from 'lucide-react';
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
import { ReaderToken } from '@/components/ReaderToken';
import { SentenceTranslationPopup } from '@/components/SentenceTranslationPopup';
import { GrammarPanel } from '@/components/GrammarPanel';
import { Progress } from '@/components/ui/progress';
import { useReadingProgressStore, fontSizeMap, japaneseFontClassMap, type FontSize, type DisplayMode, type JapaneseFont } from '@/stores/reading-progress';
import { useLongPress } from '@/hooks/use-long-press';
import { toast } from '@/hooks/use-toast';
import { getPosColorClass, LEGEND } from '@/lib/pos-colors';

const fontSizes: FontSize[] = ['small', 'medium', 'large'];
const fontSizeLabels: Record<FontSize, string> = { small: 'S', medium: 'M', large: 'L' };
const japaneseFonts: { value: JapaneseFont; label: string; sample: string }[] = [
  { value: 'sans', label: 'Sans', sample: 'あ' },
  { value: 'serif', label: 'Serif', sample: 'あ' },
  { value: 'handwriting', label: 'Hand', sample: 'あ' },
];

export default function Reader() {
  const { id, difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const { updateProgress, getProgress, fontSize, setFontSize, readerDarkMode, setReaderDarkMode, showFurigana, setShowFurigana, displayMode, setDisplayMode, japaneseFont, setJapaneseFont, hasSeenLongPressHint, setHasSeenLongPressHint } = useReadingProgressStore();
  const saved = id ? getProgress(id) : undefined;

  const [difficulty, setDifficulty] = useState<Difficulty>(
    (diffParam as Difficulty) || saved?.difficulty || 'simplified'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [miniPopup, setMiniPopup] = useState<{ text: string; baseForm?: string; pos?: string; contextSentence?: string; sentenceRect: { top: number; bottom: number; left: number; right: number }; sentenceIdx: number; tokenIdx: number } | null>(null);
  const [sentenceTranslation, setSentenceTranslation] = useState<{ sentenceIdx: number; japanese: string; sentenceRect: { top: number; bottom: number; left: number; right: number } } | null>(null);
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

  // Discoverability hint (once per user)
  useEffect(() => {
    if (!hasSeenLongPressHint && book) {
      const t = setTimeout(() => {
        toast({
          title: 'Tip',
          description: 'Long-press a word to translate the whole sentence.',
        });
        setHasSeenLongPressHint(true);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [hasSeenLongPressHint, book, setHasSeenLongPressHint]);

  // Trigger sentence translation for a given sentence
  const triggerSentenceTranslation = useCallback((sentenceIdx: number, japanese: string) => {
    const spanEl = sentenceRefs.current.get(sentenceIdx);
    if (!spanEl) return;
    const rect = spanEl.getBoundingClientRect();
    setMiniPopup(null);
    setSentenceTranslation({
      sentenceIdx,
      japanese,
      sentenceRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
    });
  }, []);

  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  return (
    <div className={`min-h-screen bg-[hsl(40,30%,97%)] ${book.hasAudio ? 'pb-20' : 'pb-8'} dark:bg-background`}>
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

          <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Japanese Font</p>
          <div className="flex gap-2">
            {japaneseFonts.map((f) => (
              <button
                key={f.value}
                onClick={() => setJapaneseFont(f.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  f.value === japaneseFont ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground'
                }`}
              >
                <span className={`text-base leading-none ${japaneseFontClassMap[f.value]}`}>あ</span>
                {f.label}
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
        <div className="sticky top-14 z-10 border-b bg-card/95 px-3 py-2.5 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Color guide
            </span>
            {LEGEND.map((item) => (
              <span key={item.category} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span className={`inline-block h-3 w-3 rounded-full ${item.color}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <article ref={articleRef} className="mx-3 my-5 rounded-2xl bg-card px-6 py-8 shadow-sm sm:mx-auto sm:max-w-2xl sm:px-12 sm:py-12">
        <div className={`${japaneseFontClassMap[japaneseFont]} text-foreground/90 reader-text ${fontSizeMap[fontSize]} ${showFurigana ? 'leading-[2.6]' : 'leading-[2]'}`}>
          {paragraphs.map((paragraph, pIdx) => (
            <p key={pIdx} className="mb-6 indent-[1em]">
              {paragraph.map((sentence, sIdx) => {
                const globalIdx = paragraphs.slice(0, pIdx).reduce((sum, p) => sum + p.length, 0) + sIdx;
                const sentenceText = sentence.tokens.map(t => t.t).join('');
                const dimmed =
                  (miniPopup && miniPopup.sentenceIdx !== globalIdx) ||
                  (sentenceTranslation && sentenceTranslation.sentenceIdx !== globalIdx);
                const activeTranslation = sentenceTranslation?.sentenceIdx === globalIdx;
                return (
                  <span
                    key={sIdx}
                    ref={(el) => { if (el) sentenceRefs.current.set(globalIdx, el); }}
                    className={`transition-opacity duration-200 ${dimmed ? 'opacity-25' : ''} ${activeTranslation ? 'bg-primary/5 rounded' : ''}`}
                  >
                    {sentence.tokens.map((token, i) => {
                      if (!token.j) {
                        return <span key={i}>{token.t}</span>;
                      }

                      const colorClass = displayMode === 'grammar' ? getPosColorClass(token.p) : '';
                      const isHighlighted = !!(miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i);

                      return (
                        <ReaderToken
                          key={i}
                          token={token}
                          showFurigana={showFurigana}
                          colorClass={colorClass}
                          isHighlighted={isHighlighted}
                          onTap={() => {
                            if (miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i) {
                              setMiniPopup(null);
                              return;
                            }
                            const spanEl = sentenceRefs.current.get(globalIdx);
                            const rect = spanEl?.getBoundingClientRect();
                            if (!rect) return;
                            setSentenceTranslation(null);
                            setMiniPopup({
                              text: token.t,
                              baseForm: token.b,
                              pos: token.p,
                              contextSentence: sentenceText,
                              sentenceRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
                              sentenceIdx: globalIdx,
                              tokenIdx: i,
                            });
                          }}
                          onLongPress={() => triggerSentenceTranslation(globalIdx, sentenceText)}
                        />
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
          onTranslateSentence={() => {
            const idx = miniPopup.sentenceIdx;
            const jp = miniPopup.contextSentence || '';
            triggerSentenceTranslation(idx, jp);
          }}
        />
      )}

      {sentenceTranslation && (
        <SentenceTranslationPopup
          japanese={sentenceTranslation.japanese}
          sentenceRect={sentenceTranslation.sentenceRect}
          onClose={() => setSentenceTranslation(null)}
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

      {book.hasAudio && <AudioPlayer bottomOffset={0} />}
    </div>
  );
}
