import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Settings, Sun, Moon, Type, BookType, Palette, Eye, EyeClosed } from 'lucide-react';
import { books, difficultyConfig, type Difficulty, getChapterContent, chapterKey, DEFAULT_CHAPTER_ID } from '@/data/books';
import { bookTokens, type BookToken } from '@/data/book-tokens';
import { mergeConjugatedTokens, gluePhrasalCompounds, splitNoParticleNouns } from '@/lib/merge-tokens';
import { applyTokenOverrides } from '@/data/token-overrides';
import { hydrateDictionaryForBook } from '@/lib/dictionary-db';
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
import { loadAudioSync, buildAudioUrl, findSentenceAt, type AudioSync } from '@/lib/audio-sync';
import { useKnownWordsIndex, getKnownLevel, type KnownLevel } from '@/lib/known-words';
import { Switch } from '@/components/ui/switch';

const fontSizes: FontSize[] = ['small', 'medium', 'large'];
const fontSizeLabels: Record<FontSize, string> = { small: 'S', medium: 'M', large: 'L' };
const japaneseFonts: { value: JapaneseFont; label: string; sample: string }[] = [
  { value: 'sans', label: 'Sans', sample: 'あ' },
  { value: 'serif', label: 'Serif', sample: 'あ' },
  { value: 'handwriting', label: 'Hand', sample: 'あ' },
];

// Defensive: never render Aozora-style inline ruby as visible text.
// If a token stream contains `下人 （ げにん ）`, keep `下人` and reuse
// `げにん` as its furigana reading instead of displaying parentheses.
const stripParens = (text: string): string =>
  text
    .replace(/[（(][^（）()\n\r]*[）)]/g, '')
    .replace(/([\u3040-\u30ff\u3400-\u9fff、。！？「」『』])[ \t　]+([\u3040-\u30ff\u3400-\u9fff、。！？「」『』])/g, '$1$2')
    .replace(/^一$/gm, '​');

const cleanRubyTokens = (raw: BookToken[]): BookToken[] => {
  const out: BookToken[] = [];
  const isHorizontalSpace = (text: string) => /^[ \t　]+$/.test(text);
  const isOpen = (text: string) => text === '（' || text === '(';
  const isClose = (text: string) => text === '）' || text === ')';
  const isKanaReading = (text: string) => /^[\s　\u3040-\u309f\u30a0-\u30ffー・]+$/.test(text);
  const hasKanji = (text: string) => /[\u3400-\u9fff]/.test(text);
  const isJapaneseText = (text: string) => /[\u3040-\u30ff\u3400-\u9fff、。！？「」『』]/.test(text);

  for (let i = 0; i < raw.length;) {
    let j = i;
    while (j < raw.length && isHorizontalSpace(raw[j].t)) j++;

    if (j < raw.length && isOpen(raw[j].t)) {
      let k = j + 1;
      while (k < raw.length && !isClose(raw[k].t)) k++;

      if (k < raw.length) {
        const reading = raw.slice(j + 1, k).map((tk) => tk.t).join('').trim();
        const previous = out.at(-1);
        if (previous && hasKanji(previous.t) && reading && isKanaReading(reading)) {
          previous.r = reading;
        }

        i = k + 1;
        while (i < raw.length && isHorizontalSpace(raw[i].t)) i++;
        continue;
      }
    }

    const token = raw[i];
    if (
      isHorizontalSpace(token.t) &&
      out.length > 0 &&
      i + 1 < raw.length &&
      isJapaneseText(out[out.length - 1].t) &&
      isJapaneseText(raw[i + 1].t)
    ) {
      i++;
      continue;
    }

    // Replace standalone "一" with zero-width space
    if (token.t === '一' && (i === 0 || raw[i-1].t === '\n') && (i === raw.length - 1 || raw[i+1].t === '\n')) {
      out.push({ ...token, t: '​' });
    } else {
      out.push({ ...token });
    }
    i++;
  }

  return out;
};

export default function Reader() {
  const { id, difficulty: diffParam, chapterId: chapterParam } = useParams();
  const navigate = useNavigate();
  const { updateProgress, getProgress, fontSize, setFontSize, readerDarkMode, setReaderDarkMode, showFurigana, setShowFurigana, displayMode, setDisplayMode, japaneseFont, setJapaneseFont, hasSeenLongPressHint, setHasSeenLongPressHint, showKnownHighlights, setShowKnownHighlights, highlightNew, setHighlightNew, highlightLearning, setHighlightLearning, highlightKnown, setHighlightKnown } = useReadingProgressStore();
  const knownIndex = useKnownWordsIndex();
  const knownTogglesByLevel: Record<KnownLevel, boolean> = {
    new: highlightNew,
    learning: highlightLearning,
    known: highlightKnown,
  };
  const chapterId = chapterParam || DEFAULT_CHAPTER_ID;
  const saved = id ? getProgress(id, chapterId) : undefined;

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

  // --- Audio sync state ---
  const [audioSync, setAudioSync] = useState<AudioSync | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioCurrentSentence, setAudioCurrentSentence] = useState<number | null>(null);
  const audioSeekRef = useRef<((sec: number) => void) | null>(null);
  // Auto-scroll is OFF by default. It turns ON when the user plays/resumes audio
  // or scrubs the slider — and turns OFF the moment they scroll the page manually.
  const autoScrollRef = useRef<boolean>(false);
  const programmaticScrollUntilRef = useRef<number>(0);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const scrollTargetRef = useRef<number | null>(null);

  const book = books.find((b) => b.id === id);
  const audioVariant = book?.audio?.[difficulty];
  const audioUrl = useMemo(
    () => (id && audioVariant ? buildAudioUrl(id, difficulty) : null),
    [id, difficulty, audioVariant]
  );

  // Use pre-baked Kuromoji tokens, then aggressively merge conjugated forms
  // (verb + auxiliaries + て-compound auxiliaries) into single clickable units.
  // Multi-chapter books are keyed by `${bookId}__${chapterId}`.
  // Fallback: if no pre-baked tokens exist, build naive char-level tokens so the
  // text is at least readable (interactivity will be limited until tokens are
  // generated by the build script).
  const tokens = useMemo(() => {
    if (!id) return [];
    const tokenKey = chapterKey(id, chapterId);
    const raw = bookTokens[tokenKey]?.[difficulty] || bookTokens[id]?.[difficulty];
    if (raw && raw.length > 0) {
      return gluePhrasalCompounds(mergeConjugatedTokens(splitNoParticleNouns(applyTokenOverrides(id, cleanRubyTokens(raw)))));
    }
    // Fallback — split text into char-level tokens
    const fallbackText = book ? stripParens(getChapterContent(book, chapterId, difficulty)) : '';
    const out: BookToken[] = [];
    for (const ch of fallbackText) {
      const isJp = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(ch);
      out.push({ t: ch, j: isJp });
    }
    return out;
  }, [id, chapterId, difficulty, book]);

  const bookText = useMemo(() => {
    if (!book) return '';
    return stripParens(getChapterContent(book, chapterId, difficulty));
  }, [book, chapterId, difficulty]);

  // Split tokens into sentences. A sentence breaks on 。！？ OR on a newline
  // (newlines in source are authoritative paragraph hints from the book).
  // We strip pure-newline tokens so they never render visually, but record a
  // `breakAfter` flag on the sentence so paragraph grouping can use it.
  const sentences = useMemo(() => {
    const result: { tokens: BookToken[]; breakAfter: boolean }[] = [];
    let current: BookToken[] = [];
    const flush = (breakAfter: boolean) => {
      if (current.length > 0) {
        result.push({ tokens: current, breakAfter });
        current = [];
      } else if (breakAfter && result.length > 0) {
        result[result.length - 1].breakAfter = true;
      }
    };
    tokens.forEach((token) => {
      // Newline-only tokens act purely as paragraph separators.
      if (/^[\n\r]+$/.test(token.t)) {
        flush(true);
        return;
      }
      // Tokens containing embedded newlines: split off the newline as a break.
      if (token.t.includes('\n')) {
        const cleaned = token.t.replace(/[\n\r]+/g, '');
        if (cleaned.length > 0) current.push({ ...token, t: cleaned });
        flush(true);
        return;
      }
      current.push(token);
      if (token.t.includes('。') || token.t.includes('！') || token.t.includes('？')) {
        flush(false);
      }
    });
    flush(false);
    return result;
  }, [tokens]);

  // Group sentences into visual paragraphs.
  // Rules:
  //  - A sentence with `breakAfter` (newline in source) closes the paragraph.
  //  - But: never close while a Japanese quote 「…」 / 『…』 is still open —
  //    keep the whole quoted span in one visual paragraph.
  const paragraphs = useMemo(() => {
    const groups: { tokens: BookToken[] }[][] = [];
    let current: { tokens: BookToken[] }[] = [];
    let quoteDepth = 0;

    const countQuotes = (text: string) => {
      let depth = 0;
      for (const ch of text) {
        if (ch === '「' || ch === '『') depth++;
        else if (ch === '」' || ch === '』') depth--;
      }
      return depth;
    };

    sentences.forEach((sentence) => {
      const text = sentence.tokens.map((t) => t.t).join('');
      const startsDialogue = quoteDepth === 0 && (text.trimStart().startsWith('「') || text.trimStart().startsWith('『'));

      // Start new paragraph before a fresh dialogue line.
      if (startsDialogue && current.length > 0 && quoteDepth === 0) {
        groups.push(current);
        current = [];
      }

      current.push(sentence);
      quoteDepth = Math.max(0, quoteDepth + countQuotes(text));

      // Only flush when no quote is open.
      if (quoteDepth === 0 && sentence.breakAfter) {
        groups.push(current);
        current = [];
      }
    });

    if (current.length > 0) groups.push(current);
    return groups;
  }, [sentences]);

  useEffect(() => {
    restoredScroll.current = false;
    if (id) hydrateDictionaryForBook(id);
  }, [id, chapterId, difficulty]);

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
  // Plain scroll handler: only updates progress percent. We do NOT use it to
  // detect "user scrolled", because programmatic scrolls also fire it.
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH <= 0) return;
      const pct = Math.min(100, (window.scrollY / scrollH) * 100);
      setScrollPercent(Math.round(pct));
      if (id) updateProgress(id, chapterId, difficulty, pct);
    });
  }, [id, chapterId, difficulty, updateProgress]);

  // Detect *real* user-initiated scroll inputs and immediately disengage
  // auto-follow + cancel any in-flight programmatic scroll animation.
  const disengageAutoScroll = useCallback(() => {
    if (!autoScrollRef.current && scrollAnimationFrameRef.current == null) return;
    autoScrollRef.current = false;
    if (scrollAnimationFrameRef.current != null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
    scrollTargetRef.current = null;
    programmaticScrollUntilRef.current = 0;
  }, []);

  const stopAnimatedScroll = useCallback(() => {
    if (scrollAnimationFrameRef.current != null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
  }, []);

  const animateScrollToTarget = useCallback(() => {
    if (scrollAnimationFrameRef.current != null) return;

    const step = () => {
      const target = scrollTargetRef.current;
      if (target == null) {
        scrollAnimationFrameRef.current = null;
        return;
      }

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const clampedTarget = Math.min(Math.max(target, 0), maxScroll);
      const current = window.scrollY;
      const distance = clampedTarget - current;

      if (Math.abs(distance) < 1) {
        window.scrollTo({ top: clampedTarget });
        scrollAnimationFrameRef.current = null;
        return;
      }

      const next = current + distance * 0.16;
      window.scrollTo({ top: next });
      scrollAnimationFrameRef.current = requestAnimationFrame(step);
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(step);
  }, []);

  const queueSentenceScroll = useCallback(
    (sentenceIdx: number) => {
      const el = sentenceRefs.current.get(sentenceIdx);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const target = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
      scrollTargetRef.current = target;
      animateScrollToTarget();
    },
    [animateScrollToTarget]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Listen for genuine user input that scrolls the page. These events fire
  // ONLY for direct user interaction (never for programmatic scrollTo).
  useEffect(() => {
    const onWheel = () => disengageAutoScroll();
    const onTouchMove = () => disengageAutoScroll();
    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'];
      if (keys.includes(e.key)) disengageAutoScroll();
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [disengageAutoScroll]);

  // --- Audio sync: load sentence timestamps when audio is available ---
  // We need the canonical sentences (joined Japanese text) for the edge function alignment.
  const sentenceTexts = useMemo(
    () => sentences.map((s) => s.tokens.map((t) => t.t).join('')),
    [sentences]
  );

  useEffect(() => {
    if (!id || !audioUrl || sentenceTexts.length === 0) {
      setAudioSync(null);
      return;
    }
    let cancelled = false;
    setAudioLoading(true);
    loadAudioSync(id, difficulty, sentenceTexts)
      .then((sync) => {
        if (cancelled) return;
        setAudioSync(sync);
        if (!sync) {
          // Sync failed but audio file is set: still let user play, just no highlight.
          console.warn('[Reader] Audio sync unavailable; playback works without highlight.');
        }
      })
      .finally(() => {
        if (!cancelled) setAudioLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, difficulty, audioUrl, sentenceTexts]);

  // Update highlighted sentence when audio plays
  const handleAudioTime = useCallback(
    (timeSec: number) => {
      if (!audioSync) return;
      const idx = findSentenceAt(audioSync, timeSec);
      setAudioCurrentSentence(idx);
    },
    [audioSync]
  );

  // While the user drags the audio slider, re-engage auto-scroll and follow
  // the target sentence.
  const handleAudioScrub = useCallback(
    (timeSec: number) => {
      if (!audioSync) return;
      const idx = findSentenceAt(audioSync, timeSec);
      if (idx == null) return;
      autoScrollRef.current = true;
      setAudioCurrentSentence(idx);
      queueSentenceScroll(idx);
    },
    [audioSync, queueSentenceScroll]
  );

  // Called when the user presses play / resume — re-engage auto-follow and
  // snap to the currently active sentence.
  const handleAudioPlay = useCallback(() => {
    autoScrollRef.current = true;
    if (audioCurrentSentence != null) queueSentenceScroll(audioCurrentSentence);
  }, [audioCurrentSentence, queueSentenceScroll]);

  // Auto-scroll active sentence into view ONLY when auto-follow is engaged.
  useEffect(() => {
    if (audioCurrentSentence == null) return;
    if (!autoScrollRef.current) return;
    queueSentenceScroll(audioCurrentSentence);
  }, [audioCurrentSentence, queueSentenceScroll]);

  useEffect(() => {
    return () => stopAnimatedScroll();
  }, [stopAnimatedScroll]);

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
    <div className={`min-h-screen bg-[hsl(40,30%,97%)] ${audioUrl ? 'pb-20' : 'pb-8'} dark:bg-background`}>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-card/80 px-3 py-2.5 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="reader-icon-btn"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-japanese text-sm font-bold">{book.titleJp}</p>
          <p className="text-[10px] text-muted-foreground">
            {difficultyConfig[difficulty].label}
            {timeRemaining && ` · ~${timeRemaining} min left`}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className="reader-icon-btn"
            data-active={showFurigana ? 'true' : undefined}
            title={showFurigana ? 'Hide Furigana' : 'Show Furigana'}
          >
            {showFurigana ? <Eye className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowGrammar(true)}
            className="reader-icon-btn"
            title="Grammar Notes"
          >
            <BookType className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="reader-icon-btn"
            data-active={showSettings ? 'true' : undefined}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="reader-settings-panel sticky top-[3.25rem] z-20 border-b border-border/40 bg-card px-4 py-5 animate-fade-in">
          <p className="reader-settings-section"><span className="reader-settings-bullet" />Reading Level</p>
          <div className="flex gap-2">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  d === difficulty ? 'bg-primary text-primary-foreground shadow-sm btn-primary-glow' : 'bg-muted text-foreground'
                }`}
              >
                {difficultyConfig[d].label}
              </button>
            ))}
          </div>

          <p className="reader-settings-section mt-5"><span className="reader-settings-bullet" />Font Size</p>
          <div className="flex gap-2">
            {fontSizes.map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  s === fontSize ? 'bg-primary text-primary-foreground shadow-sm btn-primary-glow' : 'bg-muted text-foreground'
                }`}
              >
                <Type className="h-3 w-3" /> {fontSizeLabels[s]}
              </button>
            ))}
          </div>

          <p className="reader-settings-section mt-5"><span className="reader-settings-bullet" />Japanese Font</p>
          <div className="flex gap-2">
            {japaneseFonts.map((f) => (
              <button
                key={f.value}
                onClick={() => setJapaneseFont(f.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  f.value === japaneseFont ? 'bg-primary text-primary-foreground shadow-sm btn-primary-glow' : 'bg-muted text-foreground'
                }`}
              >
                <span className={`text-base leading-none ${japaneseFontClassMap[f.value]}`}>あ</span>
                {f.label}
              </button>
            ))}
          </div>

          <p className="reader-settings-section mt-5"><span className="reader-settings-bullet" />Theme</p>
          <button
            onClick={() => setReaderDarkMode(!readerDarkMode)}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-semibold transition-all"
          >
            {readerDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {readerDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <p className="reader-settings-section mt-5"><span className="reader-settings-bullet" />Display Mode</p>
          <div className="flex gap-2">
            {(['normal', 'grammar'] as DisplayMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setDisplayMode(m)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  m === displayMode ? 'bg-primary text-primary-foreground shadow-sm btn-primary-glow' : 'bg-muted text-foreground'
                }`}
              >
                {m === 'grammar' && <Palette className="h-3 w-3" />}
                {m === 'normal' ? 'Normal' : 'Grammar'}
              </button>
            ))}
          </div>

          {/* Highlights — saved words */}
          <p className="reader-settings-section mt-5"><span className="reader-settings-bullet" />Highlights</p>
          <div className="space-y-2.5">
            <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
              <span className="text-xs font-semibold">Highlight saved words</span>
              <Switch
                checked={showKnownHighlights}
                onCheckedChange={setShowKnownHighlights}
                aria-label="Toggle saved-word highlights"
              />
            </label>
            {showKnownHighlights && (
              <div className="space-y-1.5 pl-1">
                <label className="flex items-center justify-between gap-3 px-2 py-1">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="color-dot color-dot-new" />
                    New words
                  </span>
                  <Switch checked={highlightNew} onCheckedChange={setHighlightNew} />
                </label>
                <label className="flex items-center justify-between gap-3 px-2 py-1">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="color-dot color-dot-learning" />
                    Learning
                  </span>
                  <Switch checked={highlightLearning} onCheckedChange={setHighlightLearning} />
                </label>
                <label className="flex items-center justify-between gap-3 px-2 py-1">
                  <span className="flex items-center gap-2 text-xs">
                    <span className="color-dot color-dot-known" />
                    Known
                  </span>
                  <Switch checked={highlightKnown} onCheckedChange={setHighlightKnown} />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slim gradient progress bar */}
      <div className="reader-progress-track">
        <div className="reader-progress-fill" style={{ width: `${scrollPercent}%` }} />
      </div>

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
                const activeAudio = audioCurrentSentence === globalIdx;
                return (
                  <span
                    key={sIdx}
                    ref={(el) => { if (el) sentenceRefs.current.set(globalIdx, el); }}
                    onClick={(e) => {
                      // Only seek if there's an audio sync AND user clicked on the span
                      // background (not on a child token, which has its own onTap).
                      if (!audioSync || !audioSeekRef.current) return;
                      if (e.target !== e.currentTarget) return;
                      const ts = audioSync.sentences[globalIdx];
                      if (ts) audioSeekRef.current(ts.startSec);
                    }}
                    className={`transition-all duration-200 rounded ${dimmed ? 'opacity-25' : ''} ${activeTranslation ? 'bg-primary/5' : ''} ${activeAudio ? 'bg-primary/10 px-0.5' : ''}`}
                  >
                    {sentence.tokens.map((token, i) => {
                      if (!token.j) {
                        return <span key={i}>{token.t}</span>;
                      }

                      const colorClass = displayMode === 'grammar' ? getPosColorClass(token.p) : '';
                      const isHighlighted = !!(miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i);

                      // Known-word highlight: disabled in grammar mode (POS colors prevail).
                      let knownLevel: KnownLevel | null = null;
                      if (displayMode !== 'grammar' && showKnownHighlights) {
                        const lvl = getKnownLevel(token, knownIndex);
                        if (lvl && knownTogglesByLevel[lvl]) knownLevel = lvl;
                      }

                      return (
                        <ReaderToken
                          key={i}
                          token={token}
                          showFurigana={showFurigana}
                          colorClass={colorClass}
                          isHighlighted={isHighlighted}
                          knownLevel={knownLevel}
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

      {audioUrl && (
        <AudioPlayer
          src={audioUrl}
          bottomOffset={0}
          onTimeUpdate={handleAudioTime}
          onScrub={handleAudioScrub}
          onPlay={handleAudioPlay}
          seekRequestRef={audioSeekRef}
        />
      )}
    </div>
  );
}
