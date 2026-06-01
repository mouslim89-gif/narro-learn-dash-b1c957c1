import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef, useCallback, forwardRef, Fragment, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { ArrowLeft, ArrowRight, Settings, Sun, Moon, Type, BookType, Eye, EyeClosed, Wrench, Languages, List, CheckCircle2, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { books, difficultyConfig, type Difficulty, getChapterContent, chapterKey, DEFAULT_CHAPTER_ID, hasParts, parsePartId, partChapterId } from '@/data/books';
import { loadBookTokens, type BookToken, type BookTokenMap } from '@/data/book-tokens';
import { mergeConjugatedTokens, gluePhrasalCompounds, splitNoParticleNouns, mergeCounterCompounds } from '@/lib/merge-tokens';
import { applyTokenOverrides, applyRules } from '@/data/token-overrides';
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
import { useReadingProgressStore, fontSizeMap, japaneseFontClassMap, type FontSize, type JapaneseFont } from '@/stores/reading-progress';
import { useLongPress } from '@/hooks/use-long-press';
import { toast } from '@/hooks/use-toast';

import { loadAudioSync, buildAudioUrl, findSentenceAt, type AudioSync } from '@/lib/audio-sync';
import { useKnownWordsIndex, getKnownLevel, type KnownLevel } from '@/lib/known-words';
import { Switch } from '@/components/ui/switch';
import { useIsAdmin } from '@/lib/admin';
import { useTokenEditStore } from '@/stores/token-edit';
import { useUserRulesStore } from '@/stores/user-rules';
import { useSharedRulesStore } from '@/stores/shared-rules';
import { useAuth } from '@/contexts/AuthContext';
import { TokenEditPanel } from '@/components/TokenEditPanel';
import { TokenEditFloatingBar } from '@/components/TokenEditFloatingBar';
import { tokensToRule } from '@/lib/token-edit-rules';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { preloadTranslations, hashSentence, type TranslationMap } from '@/lib/sentence-translations';


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

// ============= Inline editorial UI helpers (Reader-only) =============

interface HeaderChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

const HeaderChip = forwardRef<HTMLButtonElement, HeaderChipProps>(
  ({ active, children, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md ring-1 transition-colors active:scale-[0.94]',
        active
          ? 'bg-primary/15 text-primary ring-primary/25'
          : 'bg-background/70 text-foreground/70 ring-border/40 hover:bg-background',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
HeaderChip.displayName = 'HeaderChip';

const SettingsSection = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground font-serif">
      {label}
    </p>
    <div className="mt-1 h-px w-8 bg-border/60" />
    <div className="mt-3">{children}</div>
  </div>
);

interface SegmentedRowProps<T extends string> {
  value: T;
  options: T[];
  labels: ReactNode[];
  onChange: (v: T) => void;
  coverColor: string;
}

function SegmentedRow<T extends string>({ value, options, labels, onChange, coverColor }: SegmentedRowProps<T>) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-xl border p-2.5 text-center text-[12px] font-semibold transition-all active:scale-[0.97]',
              selected
                ? 'ring-2 ring-primary/40 border-transparent shadow-sm text-foreground'
                : 'border-border/40 bg-background text-muted-foreground hover:border-border',
            )}
            style={
              selected
                ? { backgroundImage: `linear-gradient(140deg, ${coverColor}26 0%, hsl(var(--card)) 70%)` }
                : undefined
            }
          >
            {labels[i]}
          </button>
        );
      })}
    </div>
  );
}

export default function Reader() {
  const { id, difficulty: diffParam, chapterId: chapterParam } = useParams();
  const navigate = useNavigate();
  const { updateProgress, getProgress, fontSize, setFontSize, readerDarkMode, setReaderDarkMode, showFurigana, setShowFurigana, showTranslations, setShowTranslations, japaneseFont, setJapaneseFont, hasSeenLongPressHint, setHasSeenLongPressHint, showKnownHighlights, setShowKnownHighlights, highlightNew, setHighlightNew, highlightLearning, setHighlightLearning, highlightKnown, setHighlightKnown } = useReadingProgressStore();

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
  const [showChapters, setShowChapters] = useState(false);
  const progressMap = useReadingProgressStore((s) => s.progress);
  const [miniPopup, setMiniPopup] = useState<{ text: string; baseForm?: string; reading?: string; pos?: string; contextSentence?: string; contextTokens?: { t: string; r?: string }[]; sentenceRect: { top: number; bottom: number; left: number; right: number }; sentenceIdx: number; tokenIdx: number } | null>(null);
  const [sentenceTranslation, setSentenceTranslation] = useState<{ sentenceIdx: number; japanese: string; sentenceRect: { top: number; bottom: number; left: number; right: number } } | null>(null);
  const sentenceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [fullPopupWord, setFullPopupWord] = useState<{ text: string; baseForm?: string; reading?: string; pos?: string; contextSentence?: string; contextTokens?: { t: string; r?: string }[] } | null>(null);

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
  const setAutoFollow = useCallback((on: boolean) => {
    autoScrollRef.current = on;
  }, []);
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
  const isAdmin = useIsAdmin();
  const isMobile = useIsMobile();
  const { enabled: tokenEditMode, setEnabled: setTokenEditMode } = useTokenEditStore();
  const { user } = useAuth();
  const { saved: savedRules, pending: pendingRules, addPending, loadFromCloud } = useUserRulesStore();
  const { saved: sharedRules, loadShared } = useSharedRulesStore();

  // Load user rules from cloud whenever the user changes
  useEffect(() => {
    if (user?.id) {
      loadFromCloud(user.id).catch(() => {});
    }
  }, [user?.id, loadFromCloud]);

  // Load shared rules once on mount (visible to everyone, including guests)
  useEffect(() => {
    loadShared().catch(() => {});
  }, [loadShared]);
  // Selection state for merge & edit panel
  const [selectedIdx, setSelectedIdx] = useState<number[]>([]);
  const [editPanel, setEditPanel] = useState<{ matchedIdx: number[] } | null>(null);
  const tokenByKey = useRef<Map<number, BookToken>>(new Map());
  // Drag-to-select state (token edit mode only)
  const dragRef = useRef<{ active: boolean; startKey: number | null; addedKeys: Set<number>; startX: number; startY: number; moved: boolean }>(
    { active: false, startKey: null, addedKeys: new Set(), startX: 0, startY: 0, moved: false }
  );

  // Global pointer up to end drag
  useEffect(() => {
    if (!tokenEditMode) return;
    const onUp = () => { dragRef.current.active = false; dragRef.current.startKey = null; dragRef.current.addedKeys.clear(); };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => { window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };
  }, [tokenEditMode]);

  // Lazy-load per-book tokens: ship one chunk per book instead of one giant bundle.
  const [tokensForBook, setTokensForBook] = useState<BookTokenMap>({});
  const [tokensLoading, setTokensLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setTokensLoading(true);
    loadBookTokens(id).then((map) => {
      if (cancelled) return;
      setTokensForBook(map);
      setTokensLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const tokensFull = useMemo(() => {
    if (!id) return [];
    if (tokensLoading) return [];
    const tokenKey = chapterKey(id, chapterId);
    const raw = tokensForBook[tokenKey]?.[difficulty] || tokensForBook[id]?.[difficulty];
    // Layer rules: shared (admin-published, visible to all) → user saved (cloud) → user pending (local).
    const allRules = [
      ...((sharedRules[id] ?? []).map((r) => r.rule)),
      ...((sharedRules['*'] ?? []).map((r) => r.rule)),
      ...((savedRules[id] ?? []).map((r) => r.rule)),
      ...((savedRules['*'] ?? []).map((r) => r.rule)),
      ...(pendingRules[id] ?? []),
      ...(pendingRules['*'] ?? []),
    ];
    if (raw && raw.length > 0) {
      let out = applyTokenOverrides(id, cleanRubyTokens(raw));
      // Apply custom rules before automatic post-processing so rules like
      // ["九|時", "九時:くじ"] can override the raw Kuromoji split.
      if (allRules.length > 0) out = applyRules(allRules, out);
      out = gluePhrasalCompounds(mergeCounterCompounds(mergeConjugatedTokens(splitNoParticleNouns(out))));
      // Apply them again after post-processing to keep rules targeting displayed tokens working.
      if (allRules.length > 0) out = applyRules(allRules, out);
      return out;
    }
    // Fallback — split text into char-level tokens
    const fallbackText = book ? stripParens(getChapterContent(book, chapterId, difficulty)) : '';
    const out: BookToken[] = [];
    for (const ch of fallbackText) {
      const isJp = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(ch);
      out.push({ t: ch, j: isJp });
    }
    return out;
  }, [id, chapterId, difficulty, book, savedRules, pendingRules, sharedRules, tokensForBook, tokensLoading]);

  // Part-based slicing: when the URL points at part-N of a parts-book, slice the
  // full flat token stream down to that part's char window. Tokens are stored as
  // a single array per difficulty; their concatenated `.t` matches `parts.join("\n\n")`.
  const partIdx = parsePartId(chapterId);
  const tokens = useMemo(() => {
    if (partIdx === null || !book?.parts) return tokensFull;
    const partsArr = book.parts[difficulty];
    if (!partsArr || !partsArr[partIdx]) return tokensFull;
    const sep = '\n\n';
    // Use stripped lengths so offsets align with the cleaned token stream
    // (cleanRubyTokens removes parenthesized ruby annotations from tokens,
    // so raw `part.length` would overshoot into the next part).
    let start = 0;
    for (let i = 0; i < partIdx; i++) start += stripParens(partsArr[i]).length + sep.length;
    const end = start + stripParens(partsArr[partIdx]).length;
    const out: BookToken[] = [];
    let pos = 0;
    for (const t of tokensFull) {
      const tStart = pos;
      const tEnd = pos + t.t.length;
      pos = tEnd;
      if (tEnd <= start) continue;
      if (tStart >= end) break;
      out.push(t);
    }
    return out;
  }, [tokensFull, partIdx, book, difficulty]);

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

  // ============ Inline English translations ============
  // Per-sentence Japanese text + hash, computed once per sentences change.
  const [sentenceHashes, setSentenceHashes] = useState<string[]>([]);
  const [translations, setTranslations] = useState<TranslationMap>(new Map());

  useEffect(() => {
    if (!showTranslations || sentences.length === 0) return;
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      const texts = sentences.map((s) => s.tokens.map((t) => t.t).join('').trim());
      const hashes = await Promise.all(texts.map(hashSentence));
      if (cancelled) return;
      setSentenceHashes(hashes);

      await preloadTranslations(texts, {
        signal: controller.signal,
        onProgress: (map) => {
          if (!cancelled) setTranslations(new Map(map));
        },
      });
    })().catch((e) => console.warn('translation preload failed', e));

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sentences, showTranslations]);


  useEffect(() => {
    restoredScroll.current = false;
    if (id) hydrateDictionaryForBook(id, chapterId);
  }, [id, chapterId, difficulty]);

  useEffect(() => {
    if (restoredScroll.current || !saved?.progressPercent) return;
    restoredScroll.current = true;
    // If the chapter was already completed, start fresh at the top.
    if (saved.progressPercent >= 100) {
      window.scrollTo(0, 0);
      return;
    }
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
    setAutoFollow(false);
    if (scrollAnimationFrameRef.current != null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
    scrollTargetRef.current = null;
    programmaticScrollUntilRef.current = 0;
  }, [setAutoFollow]);

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
    const isFromAudioPlayer = (e: Event) =>
      (e.target as HTMLElement | null)?.closest?.('[data-audio-player]') != null;
    const onWheel = (e: Event) => { if (!isFromAudioPlayer(e)) disengageAutoScroll(); };
    const onTouchMove = (e: Event) => { if (!isFromAudioPlayer(e)) disengageAutoScroll(); };
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
      setAutoFollow(true);
      setAudioCurrentSentence(idx);
      queueSentenceScroll(idx);
    },
    [audioSync, queueSentenceScroll, setAutoFollow]
  );

  // Called when the user presses play / resume — re-engage auto-follow and
  // snap to the currently active sentence.
  const handleAudioPlay = useCallback(() => {
    setAutoFollow(true);
    if (audioCurrentSentence != null) queueSentenceScroll(audioCurrentSentence);
  }, [audioCurrentSentence, queueSentenceScroll, setAutoFollow]);


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
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ backgroundImage: `linear-gradient(180deg, ${book.coverColor}1f 0%, hsl(var(--background) / 0.85) 100%)` }}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <HeaderChip onClick={() => navigate(`/book/${id}`)} aria-label="Back to book">
            <ArrowLeft className="h-5 w-5" />
          </HeaderChip>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="min-w-0 flex-1 text-center tap-scale-sm rounded-lg px-2 py-0.5 -my-0.5 hover:bg-foreground/5 active:bg-foreground/10 smooth-colors"
                aria-label="Change reading level"
              >
                <p className="font-japanese text-sm font-bold truncate">{book.titleJp}</p>
                <p className="text-[10px] text-muted-foreground">
                  {difficultyConfig[difficulty].label}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" sideOffset={8} className="w-auto p-2 rounded-2xl">
              <div className="flex flex-col gap-1.5">
                <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reading level</p>
                <div className="flex gap-1 rounded-full bg-muted p-1">
                  {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        'h-8 px-4 rounded-full text-xs font-semibold smooth-colors tap-scale-sm flex items-center justify-center',
                        d === difficulty
                          ? 'bg-card text-foreground shadow-sm ring-1 ring-border/40'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {difficultyConfig[d].label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-1">
            <HeaderChip
              onClick={() => setShowFurigana(!showFurigana)}
              active={showFurigana}
              title={showFurigana ? 'Hide Furigana' : 'Show Furigana'}
            >
              {showFurigana ? <Eye className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}
            </HeaderChip>
            <HeaderChip
              onClick={() => setShowTranslations(!showTranslations)}
              active={showTranslations}
              title={showTranslations ? 'Hide translations' : 'Show translations'}
            >
              <Languages className="h-5 w-5" />
            </HeaderChip>

            <HeaderChip onClick={() => setShowGrammar(true)} title="Grammar Notes">
              <BookType className="h-5 w-5" />
            </HeaderChip>
            {(hasParts(book) || (book.chapters && book.chapters.length > 1)) && (
              <HeaderChip onClick={() => setShowChapters(true)} title="Chapters">
                <List className="h-5 w-5" />
              </HeaderChip>
            )}
            <HeaderChip
              onClick={() => setShowSettings(!showSettings)}
              active={showSettings}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </HeaderChip>
          </div>
        </div>
        <div className="h-[2px] w-full bg-border/30">
          <div
            className="h-full transition-[width] duration-200"
            style={{ width: `${scrollPercent}%`, backgroundColor: book.coverColor }}
          />
        </div>
      </header>

      {(() => {
        const SectionLabel = ({ children }: { children: ReactNode }) => (
          <div className="flex items-center gap-3 mb-3 px-1">
            <h2 className="font-serif text-[13px] tracking-[0.14em] uppercase text-muted-foreground">
              {children}
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
        );

        const pillBase = 'h-7 px-3 rounded-full text-xs font-semibold smooth-colors tap-scale-sm flex items-center justify-center gap-1';
        const pillActive = 'bg-card text-foreground shadow-sm ring-1 ring-border/40';
        const pillIdle = 'text-muted-foreground hover:text-foreground';

        const settingsBody = (
          <div className="space-y-7">
            {/* Reading */}
            <section>
              <SectionLabel>Reading</SectionLabel>
              <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[15px] font-medium">Reading level</span>
                  <div className="flex gap-1 rounded-full bg-muted p-1 self-stretch sm:self-auto">
                    {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(pillBase, 'flex-1 sm:flex-none', d === difficulty ? pillActive : pillIdle)}
                      >
                        {difficultyConfig[d].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[15px] font-medium">Font size</span>
                  <div className="flex gap-1 rounded-full bg-muted p-1 self-stretch sm:self-auto">
                    {fontSizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={cn('h-7 rounded-full text-sm font-semibold smooth-colors tap-scale-sm flex-1 sm:w-9 sm:flex-none', s === fontSize ? pillActive : pillIdle)}
                      >
                        {fontSizeLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[15px] font-medium">Japanese font</span>
                  <div className="flex gap-1 rounded-full bg-muted p-1 self-stretch sm:self-auto">
                    {japaneseFonts.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setJapaneseFont(f.value)}
                        className={cn(pillBase, 'flex-1 sm:flex-none', f.value === japaneseFont ? pillActive : pillIdle)}
                      >
                        <span className={cn('text-base leading-none', japaneseFontClassMap[f.value])}>あ</span>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Display */}
            <section>
              <SectionLabel>Display</SectionLabel>
              <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <span className="flex items-center gap-2 text-[15px] font-medium">
                    {readerDarkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                    Dark mode
                  </span>
                  <Switch checked={readerDarkMode} onCheckedChange={setReaderDarkMode} />
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <span className="flex items-center gap-2 text-[15px] font-medium">
                    {showFurigana ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeClosed className="h-4 w-4 text-muted-foreground" />}
                    Show furigana
                  </span>
                  <Switch checked={showFurigana} onCheckedChange={setShowFurigana} />
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <span className="flex items-center gap-2 text-[15px] font-medium">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    Show English translations
                  </span>
                  <Switch checked={showTranslations} onCheckedChange={setShowTranslations} />
                </div>
              </div>

            </section>

            {/* Highlights */}
            <section>
              <SectionLabel>Highlights</SectionLabel>
              <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <span className="text-[15px] font-medium">Highlight saved words</span>
                  <Switch checked={showKnownHighlights} onCheckedChange={setShowKnownHighlights} />
                </div>
                {showKnownHighlights && (
                  <>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 pl-8">
                      <span className="flex items-center gap-2.5 text-sm">
                        <span className="color-dot color-dot-new" />
                        New words
                      </span>
                      <Switch checked={highlightNew} onCheckedChange={setHighlightNew} />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 pl-8">
                      <span className="flex items-center gap-2.5 text-sm">
                        <span className="color-dot color-dot-learning" />
                        Learning
                      </span>
                      <Switch checked={highlightLearning} onCheckedChange={setHighlightLearning} />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 pl-8">
                      <span className="flex items-center gap-2.5 text-sm">
                        <span className="color-dot color-dot-known" />
                        Known
                      </span>
                      <Switch checked={highlightKnown} onCheckedChange={setHighlightKnown} />
                    </div>
                  </>
                )}
              </div>
            </section>

            {isAdmin && (
              <section>
                <SectionLabel>Admin</SectionLabel>
                <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm">
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2 text-[15px] font-medium">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        Token edit mode
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">Tap tokens to merge or split</span>
                    </span>
                    <Switch
                      checked={tokenEditMode}
                      onCheckedChange={(on) => {
                        setTokenEditMode(on);
                        setSelectedIdx([]);
                        setMiniPopup(null);
                        setSentenceTranslation(null);
                      }}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        );

        if (isMobile) {
          return (
            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetContent
                side="bottom"
                className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <h1 className="wordmark font-serif text-[24px] leading-none">Reader Settings</h1>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                {settingsBody}
              </SheetContent>
            </Sheet>
          );
        }

        return showSettings ? (
          <div className="sticky top-[3.25rem] z-20 border-b border-border/40 bg-background px-5 py-6 animate-fade-in">
            <div className="mx-auto max-w-2xl">
              <div className="mb-5 flex items-center gap-3">
                <h1 className="wordmark font-serif text-[24px] leading-none">Reader Settings</h1>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              {settingsBody}
            </div>
          </div>
        ) : null;
      })()}

      <Sheet open={showChapters} onOpenChange={setShowChapters}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[80vh] overflow-y-auto bg-background p-0"
        >
          {(() => {
            type Entry = { id: string; title: string; pct: number };
            let entries: Entry[] = [];
            let currentId: string | null = null;
            if (hasParts(book) && book.anchors) {
              entries = book.anchors.map((title, i) => {
                const pid = partChapterId(i);
                const cp = progressMap[chapterKey(id!, pid)];
                return { id: pid, title, pct: cp?.progressPercent ?? 0 };
              });
              currentId = partIdx !== null ? partChapterId(partIdx) : null;
            } else if (book.chapters && book.chapters.length > 1) {
              entries = book.chapters.map((ch) => {
                const cp = progressMap[chapterKey(id!, ch.id)];
                return { id: ch.id, title: ch.title, pct: cp?.progressPercent ?? 0 };
              });
              currentId = chapterId;
            }
            const currentIdx = entries.findIndex((e) => e.id === currentId);

            return (
              <>
                <div className="sticky top-0 z-10 bg-background px-5 pt-6 pb-3 border-b border-border/40">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="wordmark font-serif text-[22px] leading-none">Chapters</h2>
                    {entries.length > 0 && (
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {Math.max(currentIdx, 0) + 1} / {entries.length}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 px-4 py-4">
                  {entries.map((e, idx) => {
                    const done = e.pct >= 100;
                    const isCurrent = e.id === currentId;
                    return (
                      <li key={e.id}>
                        <button
                          ref={(el) => { if (el && isCurrent) requestAnimationFrame(() => el.scrollIntoView({ block: 'center' })); }}
                          onClick={() => {
                            setShowChapters(false);
                            if (!isCurrent) navigate(`/reader/${id}/${difficulty}/${e.id}`);
                          }}
                          className={cn(
                            'card-lift tap-scale w-full rounded-xl border bg-card p-4 text-left ring-1 transition-colors',
                            isCurrent ? 'ring-2 ring-primary bg-primary/5 border-transparent' : 'ring-border/30 border-border/40',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums ring-1',
                              done
                                ? 'bg-primary/15 text-primary ring-primary/20'
                                : isCurrent
                                  ? 'bg-primary text-primary-foreground ring-primary/30'
                                  : 'bg-muted text-muted-foreground ring-border/40',
                            )}>
                              {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-serif text-[15px] font-semibold leading-snug">{e.title}</p>
                              {e.pct > 0 && !done && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <Progress value={e.pct} className="h-1 flex-1" />
                                  <span className="text-[10px] font-semibold tabular-nums text-foreground/70">{e.pct}%</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>





      <article ref={articleRef} className="mx-3 my-5 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/30 sm:mx-auto sm:max-w-2xl">

        {(() => {
          const isFirstChapter = book.chapters && book.chapters.length > 1
            ? book.chapters.findIndex((c) => c.id === chapterId) === 0
            : hasParts(book)
              ? partIdx === 0
              : true;
          if (!isFirstChapter) return null;
          return (
            <div className="px-6 pt-8 pb-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{book.author}</p>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">{book.titleJp}</h1>
              <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-muted-foreground">
                <span className="h-px w-8 bg-border/60" />
                <p className="font-serif italic text-sm tracking-wide">{book.titleEn}</p>
                <span className="h-px w-8 bg-border/60" />
              </div>
            </div>
          );
        })()}

        {book.chapters && book.chapters.length > 1 && (() => {
          const chapter = book.chapters.find((c) => c.id === chapterId);
          const chapterIndex = book.chapters.findIndex((c) => c.id === chapterId);
          if (!chapter || chapterIndex < 0) return null;
          return (
            <div className="px-6 pt-6 pb-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Chapter {chapterIndex + 1}
              </p>
              <p className="mt-1 font-serif text-lg font-bold">{chapter.title}</p>
              <div className="mx-auto mt-3 h-px w-12 bg-border/60" />
            </div>
          );
        })()}

        {hasParts(book) && partIdx !== null && book.anchors && book.anchors[partIdx] && (
          <div className="px-6 pt-6 pb-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Chapter {partIdx + 1}
            </p>
            <p className="mt-1 font-serif text-lg font-bold">{book.anchors[partIdx]}</p>
            <div className="mx-auto mt-3 h-px w-12 bg-border/60" />
          </div>
        )}



        <div className="px-6 py-8 sm:px-12 sm:py-12">
        <div
          className={`${japaneseFontClassMap[japaneseFont]} text-foreground/90 reader-text ${fontSizeMap[fontSize]}`}
          style={{
            lineHeight: showFurigana ? 2.6 : 2,
            transition: 'line-height 320ms var(--ease-out-soft)',
          }}
        >
          {paragraphs.map((paragraph, pIdx) => (
            <p key={pIdx} className="mb-6">
              {paragraph.map((sentence, sIdx) => {
                const globalIdx = paragraphs.slice(0, pIdx).reduce((sum, p) => sum + p.length, 0) + sIdx;
                const sentenceText = sentence.tokens.map(t => t.t).join('');
                const sentenceHash = sentenceHashes[globalIdx];
                const englishLine = showTranslations && sentenceHash ? translations.get(sentenceHash) : undefined;
                const dimmed =
                  (miniPopup && miniPopup.sentenceIdx !== globalIdx) ||
                  (sentenceTranslation && sentenceTranslation.sentenceIdx !== globalIdx);
                const activeTranslation = sentenceTranslation?.sentenceIdx === globalIdx;
                const activeAudio = audioCurrentSentence === globalIdx;

                return (
                  <Fragment key={sIdx}>
                  <span
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
                      if (!token.j && !tokenEditMode) {
                        return <span key={i}>{token.t}</span>;
                      }

                      const colorClass = '';
                      const isHighlighted = !!(miniPopup && miniPopup.sentenceIdx === globalIdx && miniPopup.tokenIdx === i);
                      const tokKey = globalIdx * 10000 + i;
                      if (tokenEditMode) tokenByKey.current.set(tokKey, token);
                      const isSelected = tokenEditMode && selectedIdx.includes(tokKey);

                      let knownLevel: KnownLevel | null = null;
                      if (!tokenEditMode && showKnownHighlights) {
                        const lvl = getKnownLevel(token, knownIndex);
                        if (lvl && knownTogglesByLevel[lvl]) knownLevel = lvl;
                      }

                      const editClass = tokenEditMode
                        ? `outline outline-1 outline-border/60 rounded-sm mx-[1px] ${isSelected ? 'bg-primary/30 outline-primary' : 'hover:bg-primary/10'}`
                        : '';

                      const tokenNode = (
                        <ReaderToken
                          key={i}
                          token={token}
                          showFurigana={showFurigana}
                          colorClass={`${colorClass} ${editClass}`.trim()}
                          isHighlighted={isHighlighted && !tokenEditMode}
                          knownLevel={knownLevel}
                          onTap={() => {
                            if (tokenEditMode) {
                              // Suppress tap if a drag-select just happened.
                              if (dragRef.current.moved) { dragRef.current.moved = false; return; }
                              if (selectedIdx.length > 0) {
                                setSelectedIdx((arr) =>
                                  arr.includes(tokKey) ? arr.filter((k) => k !== tokKey) : [...arr, tokKey].sort((a, b) => a - b)
                                );
                              } else {
                                setEditPanel({ matchedIdx: [tokKey] });
                              }
                              return;
                            }
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
                              reading: token.r,
                              pos: token.p,
                              contextSentence: sentenceText,
                              contextTokens: sentence.tokens.map(t => ({ t: t.t, r: t.r })),
                              sentenceRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
                              sentenceIdx: globalIdx,
                              tokenIdx: i,
                            });
                          }}
                          onLongPress={() => {
                            if (tokenEditMode) {
                              setSelectedIdx((arr) => arr.includes(tokKey) ? arr : [...arr, tokKey].sort((a, b) => a - b));
                              return;
                            }
                            triggerSentenceTranslation(globalIdx, sentenceText);
                          }}
                        />
                      );

                      if (!tokenEditMode) return tokenNode;

                      return (
                        <span
                          key={i}
                          style={{ touchAction: 'none' }}
                          onPointerDown={(e) => {
                            dragRef.current.active = true;
                            dragRef.current.startKey = tokKey;
                            dragRef.current.addedKeys = new Set([tokKey]);
                            dragRef.current.startX = e.clientX;
                            dragRef.current.startY = e.clientY;
                            dragRef.current.moved = false;
                          }}
                          onPointerMove={(e) => {
                            if (!dragRef.current.active) return;
                            const dx = e.clientX - dragRef.current.startX;
                            const dy = e.clientY - dragRef.current.startY;
                            if (!dragRef.current.moved && Math.sqrt(dx*dx + dy*dy) > 6) {
                              dragRef.current.moved = true;
                              // Capture pointer only now → keeps the click working for taps.
                              try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch {}
                              const startKey = dragRef.current.startKey;
                              if (startKey != null) {
                                setSelectedIdx((arr) => arr.includes(startKey) ? arr : [...arr, startKey].sort((a, b) => a - b));
                              }
                            }
                            if (!dragRef.current.moved) return;
                            const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
                            const wrap = el?.closest('[data-tok-key]') as HTMLElement | null;
                            if (!wrap) return;
                            const k = Number(wrap.dataset.tokKey);
                            if (Number.isFinite(k) && !dragRef.current.addedKeys.has(k)) {
                              dragRef.current.addedKeys.add(k);
                              setSelectedIdx((arr) => arr.includes(k) ? arr : [...arr, k].sort((a, b) => a - b));
                            }
                          }}
                          data-tok-key={tokKey}
                        >
                          {tokenNode}
                        </span>
                      );
                    })}
                  </span>
                  {showTranslations && (
                    englishLine ? (
                      <span className="block text-sm text-muted-foreground/80 italic mt-0.5 mb-3 leading-snug">
                        {englishLine}
                      </span>
                    ) : (
                      <span className="block h-3 mt-1 mb-3 rounded bg-muted/40 animate-pulse" style={{ width: '60%' }} />
                    )
                  )}
                  </Fragment>

                );

              })}
            </p>
          ))}
        </div>
        </div>
      </article>

      {hasParts(book) && partIdx !== null && book.anchors && (
        <nav className="mx-4 mb-10 mt-2 flex items-center justify-between gap-3 sm:mx-auto sm:max-w-2xl">
          {partIdx > 0 ? (
            <button
              onClick={() => navigate(`/reader/${id}/${difficulty}/${partChapterId(partIdx - 1)}`)}
              className="tap-scale group inline-flex items-center gap-2 rounded-full bg-card px-4 h-11 text-[13px] font-semibold ring-1 ring-border/40 shadow-sm transition-colors hover:bg-muted/40"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              Chapter {partIdx}
            </button>
          ) : <span />}
          {partIdx < book.anchors.length - 1 ? (
            <button
              onClick={() => navigate(`/reader/${id}/${difficulty}/${partChapterId(partIdx + 1)}`)}
              className="tap-scale group ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 h-11 text-[13px] font-semibold text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
            >
              Chapter {partIdx + 2}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : <span />}
        </nav>
      )}



      {miniPopup && (
        <WordMiniPopup
          word={miniPopup.text}
          baseForm={miniPopup.baseForm}
          reading={miniPopup.reading}
          pos={miniPopup.pos}
          contextSentence={miniPopup.contextSentence}
          contextTokens={miniPopup.contextTokens}
          sentenceRect={miniPopup.sentenceRect}
          onClose={() => setMiniPopup(null)}
          onShowMore={() => {
            const { text, baseForm, reading, pos, contextSentence, contextTokens } = miniPopup;
            setMiniPopup(null);
            setFullPopupWord({ text, baseForm, reading, pos, contextSentence, contextTokens });
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
          reading={fullPopupWord.reading}
          pos={fullPopupWord.pos}
          contextSentence={fullPopupWord.contextSentence}
          contextTokens={fullPopupWord.contextTokens}
          onClose={() => setFullPopupWord(null)}
        />
      )}

      <GrammarPanel
        text={bookText}
        bookId={id || ''}
        difficulty={difficulty}
        partIdx={partIdx}
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

      {tokenEditMode && isAdmin && id && (
        <TokenEditFloatingBar
          bookId={id}
          selectionCount={selectedIdx.length}
          onMerge={() => setEditPanel({ matchedIdx: [...selectedIdx] })}
          onClearSelection={() => setSelectedIdx([])}
          onExitEditMode={() => { setTokenEditMode(false); setSelectedIdx([]); }}
        />
      )}

      {editPanel && (
        <TokenEditPanel
          open={!!editPanel}
          onClose={() => setEditPanel(null)}
          matched={editPanel.matchedIdx.map((k) => tokenByKey.current.get(k)).filter((t): t is BookToken => !!t)}
          isAdmin={isAdmin}
          onSubmit={(replacement, opts) => {
            const matched = editPanel.matchedIdx.map((k) => tokenByKey.current.get(k)).filter((t): t is BookToken => !!t);
            if (matched.length > 0 && id) {
              const rule = tokensToRule(matched, replacement);
              const scope = opts.global ? '*' : id;
              if (opts.shared && isAdmin && user?.id) {
                useSharedRulesStore.getState().addShared(scope, rule, user.id)
                  .then(() => toast({ title: 'Published', description: 'Rule visible to all accounts.' }))
                  .catch((e) => toast({ title: 'Publish failed', description: (e as Error).message, variant: 'destructive' }));
              } else {
                addPending(scope, rule);
                toast({ title: 'Rule pending', description: opts.global ? 'Global rule — click Apply to save.' : 'Click Apply to save it.' });
              }
            }
            setEditPanel(null);
            setSelectedIdx([]);
          }}
        />
      )}
    </div>
  );
}
