import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Languages, X, Loader2 } from 'lucide-react';
import { translateSentence } from '@/lib/translate';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

interface Props {
  japanese: string;
  sentenceRect: { top: number; bottom: number; left: number; right: number };
  onClose: () => void;
}

export function SentenceTranslationPopup({ japanese, sentenceRect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [english, setEnglish] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    translateSentence(japanese)
      .then((t) => {
        if (!cancelled) {
          setEnglish(t);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Translation unavailable');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [japanese]);

  useBodyScrollLock();
  useLayoutEffect(() => {
    if (!ref.current) return;
    const popup = ref.current;
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const PADDING = 8;
    const GAP = 6;
    const BOTTOM_RESERVE = 88;

    const center = (sentenceRect.left + sentenceRect.right) / 2;
    let left = center - rect.width / 2;
    left = Math.max(PADDING, Math.min(left, vw - rect.width - PADDING));

    let placement: 'above' | 'below' = 'above';
    let top = sentenceRect.top - rect.height - GAP;
    if (top < PADDING + 56) {
      placement = 'below';
      top = sentenceRect.bottom + GAP;
    }
    const bottomLimit = vh - BOTTOM_RESERVE;
    if (top + rect.height > bottomLimit) {
      if (placement === 'below') {
        const above = sentenceRect.top - rect.height - GAP;
        if (above >= PADDING + 56) {
          placement = 'above';
          top = above;
        } else {
          top = Math.max(PADDING + 56, bottomLimit - rect.height);
        }
      } else {
        top = Math.max(PADDING + 56, bottomLimit - rect.height);
      }
    }
    setPosition({ top, left, placement });
  }, [sentenceRect, loading, english, error]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  return (
    <div
      ref={ref}
      className={`fixed z-[60] w-[min(340px,calc(100vw-16px))] rounded-2xl bg-card ring-1 ring-border/50 shadow-xl ${
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
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5">
        <Languages className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Translation</span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2">
        <div>
          <p className="font-japanese text-[13px] leading-relaxed text-foreground/90">
            {japanese}
          </p>
          {english && !loading && (
            <p className="mt-1.5 text-[12px] text-muted-foreground leading-snug">
              {english}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-0.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[11px]">Translating…</span>
          </div>
        )}

        {error && !loading && (
          <p className="text-[11px] text-destructive py-0.5">{error}</p>
        )}
      </div>
    </div>
  );
}

