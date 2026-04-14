import { useState, useCallback, useRef } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const audioCache = new Map<string, string>();

interface PlayWordButtonProps {
  word: string;
  reading?: string;
  className?: string;
  size?: number;
}

export function PlayWordButton({ word, reading, className = '', size = 18 }: PlayWordButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === 'loading') return;

    // If already playing, stop
    if (state === 'playing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState('idle');
      return;
    }

    const text = reading || word;
    const cacheKey = text;

    try {
      setState('loading');

      let dataUrl = audioCache.get(cacheKey);
      if (!dataUrl) {
        const { data, error } = await supabase.functions.invoke('tts-japanese', {
          body: { text },
        });

        if (error || !data?.audioContent) {
          console.error('TTS error:', error);
          setState('idle');
          return;
        }

        dataUrl = `data:audio/mp3;base64,${data.audioContent}`;
        audioCache.set(cacheKey, dataUrl);
      }

      const audio = new Audio(dataUrl);
      audioRef.current = audio;
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('idle');
      setState('playing');
      await audio.play();
    } catch (err) {
      console.error('Play error:', err);
      setState('idle');
    }
  }, [word, reading, state]);

  return (
    <button
      onClick={play}
      className={`inline-flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent active:scale-95 ${
        state === 'playing' ? 'text-accent animate-pulse' : ''
      } ${className}`}
      aria-label={`Play pronunciation of ${word}`}
      type="button"
    >
      {state === 'loading' ? (
        <Loader2 style={{ width: size, height: size }} className="animate-spin" />
      ) : (
        <Volume2 style={{ width: size, height: size }} />
      )}
    </button>
  );
}
