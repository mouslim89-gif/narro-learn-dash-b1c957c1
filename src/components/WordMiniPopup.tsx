import { useState, useEffect, useRef } from 'react';
import { Star, ChevronRight, Loader2 } from 'lucide-react';
import { PlayWordButton } from '@/components/PlayWordButton';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { getCached, lookupWord, type JishoResult, type CacheEntry } from '@/lib/jisho';

interface WordMiniPopupProps {
  word: string;
  baseForm?: string;
  pos?: string;
  contextSentence?: string;
  sentenceRect: { top: number; bottom: number; left: number; right: number };
  onClose: () => void;
  onShowMore: () => void;
}

export function WordMiniPopup({
  word,
  baseForm,
  pos,
  contextSentence,
  sentenceRect,
  onClose,
  onShowMore,
}: WordMiniPopupProps) {
  const { addWord, hasWord } = useFlashcardStore();
  const popupRef = useRef<HTMLDivElement>(null);

  const cached = getCached(word) || (baseForm ? getCached(baseForm) : undefined);
  const [loading, setLoading] = useState(!cached);
  const [result, setResult] = useState<JishoResult | null>(cached?.results?.[0] ?? null);
  const [error, setError] = useState(false);

  const wordId = word;
  const saved = hasWord(wordId);

  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);

  useEffect(() => {
    if (cached) {
      if (cached.results.length > 0) setResult(cached.results[0]);
      else setError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const tryLookup = async () => {
      try {
        let entry: CacheEntry | null = null;
        if (baseForm && baseForm !== word) {
          entry = await lookupWord(baseForm);
          if (entry.results.length > 0) {
            if (!cancelled) setResult(entry.results[0]);
            return;
          }
        }
        entry = await lookupWord(word);
        if (!cancelled && entry.results.length > 0) setResult(entry.results[0]);
        else if (!cancelled) setError(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    tryLookup();
    return () => { cancelled = true; };
  }, [word, baseForm, cached]);

  // Position based on sentence rect
  useEffect(() => {
    if (!popupRef.current) return;
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const PADDING = 8;
    const GAP = 6;

    // Center horizontally on sentence, clamp to viewport
    const sentenceCenter = (sentenceRect.left + sentenceRect.right) / 2;
    let left = sentenceCenter - rect.width / 2;
    left = Math.max(PADDING, Math.min(left, vw - rect.width - PADDING));

    // Prefer above the sentence
    let placement: 'above' | 'below' = 'above';
    let top = sentenceRect.top - rect.height - GAP;
    if (top < PADDING + 56) {
      // Not enough room above, place below
      placement = 'below';
      top = sentenceRect.bottom + GAP;
    }
    if (top + rect.height > vh - PADDING) {
      top = vh - rect.height - PADDING;
    }

    setPosition({ top, left, placement });
  }, [sentenceRect, loading, result]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler as any);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler as any);
    };
  }, [onClose]);

  const handleSave = () => {
    if (!result) return;
    const entry: SavedWord = {
      id: wordId,
      word: result.japanese[0]?.word || word,
      reading: result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
      contextSentence,
      mastery: 0,
    };
    addWord(entry);
  };

  return (
    <div
      ref={popupRef}
      className={`fixed z-[60] w-[min(300px,calc(100vw-16px))] rounded-xl border bg-card shadow-xl ${
        position
          ? position.placement === 'above'
            ? 'animate-mini-slide-up'
            : 'animate-mini-slide-down'
          : ''
      }`}
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        opacity: position ? 1 : 0,
      }}
    >
      {/* Header: word + actions inline */}
      <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-0.5">
        <span className="font-japanese text-lg font-bold truncate min-w-0">
          {result ? (result.japanese[0]?.word || word) : word}
        </span>
        <PlayWordButton
          word={result?.japanese[0]?.word || word}
          reading={result?.japanese[0]?.reading}
          size={16}
        />
        {result && !loading && (
          <button
            onClick={handleSave}
            disabled={saved}
            className={`p-0.5 transition-colors ${saved ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
          >
            <Star className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
        <div className="flex-1" />
        {(result as any)?.is_common && (
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary/80 border border-primary/15">
            ✦
          </span>
        )}
        {result?.jlpt && result.jlpt.length > 0 && (
          <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
            {result.jlpt[0]?.replace('jlpt-', '')}
          </span>
        )}
        {result && !loading && (
          <button
            onClick={onShowMore}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            More <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Reading */}
      {result?.japanese[0]?.reading && (
        <p className="font-japanese text-xs text-muted-foreground px-2.5 -mt-0.5">
          {result.japanese[0].reading}
        </p>
      )}

      {/* Content */}
      <div className="px-2.5 pt-1 pb-1.5">
        {loading && (
          <div className="flex items-center gap-2 py-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[11px]">Looking up…</span>
          </div>
        )}

        {error && !loading && (
          <p className="text-[11px] text-muted-foreground py-1">No definition found.</p>
        )}

        {result && !loading && (
          <>
            <div className="space-y-0.5">
              {result.senses.slice(0, 2).map((sense, i) => (
                <p key={i} className="text-[13px] font-semibold text-accent">
                  {i + 1}. {sense.english_definitions.join('; ')}
                </p>
              ))}
            </div>
            {result.senses[0]?.parts_of_speech && (
              <p className="text-[9px] text-muted-foreground italic mt-0.5">
                {result.senses[0].parts_of_speech.join(', ')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
