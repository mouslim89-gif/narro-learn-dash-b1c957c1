import { useEffect, useRef, useState } from 'react';
import { Languages, X, Loader2 } from 'lucide-react';
import { translateSentence } from '@/lib/translate';

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

  useEffect(() => {
    if (!ref.current) return;
    const popup = ref.current;
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const PADDING = 8;
    const GAP = 6;

    const center = (sentenceRect.left + sentenceRect.right) / 2;
    let left = center - rect.width / 2;
    left = Math.max(PADDING, Math.min(left, vw - rect.width - PADDING));

    let placement: 'above' | 'below' = 'above';
    let top = sentenceRect.top - rect.height - GAP;
    if (top < PADDING + 56) {
      placement = 'below';
      top = sentenceRect.bottom + GAP;
    }
    if (top + rect.height > vh - PADDING) {
      top = vh - rect.height - PADDING;
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
      className={`fixed z-[60] w-[min(340px,calc(100vw-16px))] rounded-xl border bg-card shadow-xl ${
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
      <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1 border-b border-border/50">
        <Languages className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Translation</span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-2.5 py-2 space-y-1.5">
        <p className="font-japanese text-xs text-muted-foreground leading-relaxed">
          {japanese}
        </p>

        {loading && (
          <div className="flex items-center gap-2 py-1 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[11px]">Translating…</span>
          </div>
        )}

        {error && !loading && (
          <p className="text-[11px] text-destructive py-0.5">{error}</p>
        )}

        {english && !loading && (
          <p className="text-[13px] font-semibold text-accent leading-snug">
            {english}
          </p>
        )}
      </div>
    </div>
  );
}
