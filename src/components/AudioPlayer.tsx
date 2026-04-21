import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  /** Public URL of the MP3 file. */
  src: string;
  /** Distance in px from viewport bottom. Defaults to 60 (above BottomNav). Use 0 in fullscreen reader. */
  bottomOffset?: number;
  /** Called continuously while playing. */
  onTimeUpdate?: (timeSec: number) => void;
  /** Called once when audio metadata loads (for total duration). */
  onLoadedMetadata?: (durationSec: number) => void;
  /** Imperative seek handle — caller can call seek(time) to jump. */
  seekRequestRef?: React.MutableRefObject<((sec: number) => void) | null>;
  /** Called while user is dragging the slider — emits the previewed time in seconds. */
  onScrub?: (timeSec: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

export function AudioPlayer({
  src,
  bottomOffset = 60,
  onTimeUpdate,
  onLoadedMetadata,
  seekRequestRef,
  onScrub,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Expose seek function to parent
  useEffect(() => {
    if (seekRequestRef) {
      seekRequestRef.current = (sec: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = sec;
        }
      };
    }
    return () => {
      if (seekRequestRef) seekRequestRef.current = null;
    };
  }, [seekRequestRef]);

  // Apply playback speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch (e) {
        console.error('[AudioPlayer] play failed', e);
      }
    }
  };

  const nextSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const handleSliderChange = (val: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (val[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrentTime(t);
          onTimeUpdate?.(t);
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(d);
          onLoadedMetadata?.(d);
        }}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <div
        style={{ bottom: `${bottomOffset}px` }}
        className="fixed left-0 right-0 z-40 border-t bg-card/95 px-4 py-2.5 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          </button>
          <Slider
            value={[progressPct]}
            onValueChange={handleSliderChange}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={nextSpeed}
            className="rounded bg-muted px-2 py-1 text-[11px] font-semibold text-foreground"
          >
            {speed}x
          </button>
        </div>
      </div>
    </>
  );
}
