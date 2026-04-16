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
  /** Click coordinates to position the popup near the word */
  anchorPos: { x: number; y: number };
  onClose: () => void;
  /** Opens the full drawer popup with all details */
  onShowMore: () => void;
}

export function WordMiniPopup({
  word,
  baseForm,
  pos,
  contextSentence,
  anchorPos,
  onClose,
  onShowMore,
}: WordMiniPopupProps) {
  const { addWord, hasWord } = useFlashcardStore();
  const popupRef = useRef<HTMLDivElement>(null);

  const lookupKey = baseForm || word;
  const cached = getCached(word) || (baseForm ? getCached(baseForm) : undefined);
  const [loading, setLoading] = useState(!cached);
  const [result, setResult] = useState<JishoResult | null>(cached?.results?.[0] ?? null);
  const [error, setError] = useState(false);

  const wordId = word;
  const saved = hasWord(wordId);

  // Position state
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (cached) {
      if (cached.results.length > 0) {
        setResult(cached.results[0]);
      } else {
        setError(true);
      }
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
        if (!cancelled && entry.results.length > 0) {
          setResult(entry.results[0]);
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    tryLookup();
    return () => { cancelled = true; };
  }, [word, baseForm, cached]);

  // Calculate position after mount
  useEffect(() => {
    if (!popupRef.current) return;
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const PADDING = 8;
    const POPUP_WIDTH = Math.min(320, vw - PADDING * 2);

    // Horizontal: center on click, clamp to viewport
    let left = anchorPos.x - POPUP_WIDTH / 2;
    left = Math.max(PADDING, Math.min(left, vw - POPUP_WIDTH - PADDING));

    // Vertical: prefer above the click point, fall back below
    let top = anchorPos.y - rect.height - 12;
    if (top < PADDING + 56) {
      // Not enough room above (56px for sticky header), place below
      top = anchorPos.y + 16;
    }
    // Clamp bottom
    if (top + rect.height > vh - PADDING) {
      top = vh - rect.height - PADDING;
    }

    setPosition({ top, left });
  }, [anchorPos, loading, result]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use timeout so the current click doesn't immediately close
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
      className="fixed z-[60] w-[min(320px,calc(100vw-16px))] rounded-xl border bg-card shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        opacity: position ? 1 : 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-japanese text-xl font-bold truncate">
            {result ? (result.japanese[0]?.word || word) : word}
          </span>
          <PlayWordButton
            word={result?.japanese[0]?.word || word}
            reading={result?.japanese[0]?.reading}
            size={18}
          />
        </div>
        {result?.jlpt && result.jlpt.length > 0 && (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
            {result.jlpt[0]?.replace('jlpt-', 'JLPT ')}
          </span>
        )}
      </div>

      {/* Reading */}
      {result?.japanese[0]?.reading && (
        <p className="font-japanese text-sm text-muted-foreground px-3 -mt-0.5">
          {result.japanese[0].reading}
        </p>
      )}

      {/* Content */}
      <div className="px-3 pt-1.5 pb-2">
        {loading && (
          <div className="flex items-center gap-2 py-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Looking up…</span>
          </div>
        )}

        {error && !loading && (
          <p className="text-xs text-muted-foreground py-2">No definition found.</p>
        )}

        {result && !loading && (
          <>
            {/* Show max 2 senses */}
            <div className="space-y-0.5">
              {result.senses.slice(0, 2).map((sense, i) => (
                <p key={i} className="text-sm font-semibold text-accent">
                  {i + 1}. {sense.english_definitions.join('; ')}
                </p>
              ))}
            </div>

            {/* POS */}
            {result.senses[0]?.parts_of_speech && (
              <p className="text-[10px] text-muted-foreground italic mt-1">
                {result.senses[0].parts_of_speech.join(', ')}
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {result && !loading && (
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all active:scale-[0.97] ${
              saved
                ? 'bg-muted text-muted-foreground'
                : 'bg-accent text-accent-foreground'
            }`}
          >
            <Star className="h-3.5 w-3.5" /> {saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={onShowMore}
            className="flex items-center justify-center gap-1 rounded-lg py-2 px-3 text-xs font-semibold bg-primary/10 text-primary transition-all active:scale-[0.97] hover:bg-primary/20"
          >
            More <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
