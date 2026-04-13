import { useState, useCallback, useRef } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

interface PlayWordButtonProps {
  /** The Japanese text to speak (word or reading in kana) */
  text: string;
  /** Optional size variant */
  size?: 'sm' | 'md';
  className?: string;
}

export function PlayWordButton({ text, size = 'sm', className = '' }: PlayWordButtonProps) {
  const [state, setState] = useState<'idle' | 'playing'>('idle');
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const play = useCallback(() => {
    if (!text || !window.speechSynthesis) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 0.85;

    // Try to pick a Japanese voice
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith('ja'));
    if (jaVoice) utter.voice = jaVoice;

    utter.onstart = () => setState('playing');
    utter.onend = () => setState('idle');
    utter.onerror = () => setState('idle');

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [text]);

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); play(); }}
      className={`rounded-full transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 ${btnSize} ${className}`}
      aria-label={`Play pronunciation of ${text}`}
    >
      <Volume2
        className={`${iconSize} ${state === 'playing' ? 'text-primary animate-pulse' : ''}`}
      />
    </button>
  );
}
