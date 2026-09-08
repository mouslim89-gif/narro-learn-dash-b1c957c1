import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Moon } from 'lucide-react';
import { books, difficultyConfig, type Difficulty } from '@/data/books';
import { buildAudioUrl } from '@/lib/audio-sync';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SPEEDS = [0.75, 1, 1.25, 1.5];
const SLEEP_OPTIONS = [0, 15, 30, 45];

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function posKey(bookId: string, difficulty: string) {
  return `listen-pos:${bookId}:${difficulty}`;
}

export default function ListenMode() {
  const { id, difficulty: diffParam } = useParams();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);

  const availableDifficulties = useMemo(
    () =>
      book
        ? (Object.keys(difficultyConfig) as Difficulty[]).filter((d) => book.audio?.[d])
        : [],
    [book]
  );

  const [difficulty, setDifficulty] = useState<Difficulty>(
    (diffParam as Difficulty) || availableDifficulties[0] || 'simplified'
  );
  const audioUrl = id && book?.audio?.[difficulty] ? buildAudioUrl(id, difficulty) : null;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sleepMin, setSleepMin] = useState(0);
  const sleepTimerRef = useRef<number | null>(null);
  const restoredRef = useRef(false);

  // Restore last listen position for this book+difficulty.
  useEffect(() => {
    restoredRef.current = false;
    if (!id) return;
    try {
      const saved = localStorage.getItem(posKey(id, difficulty));
      if (saved) {
        const sec = parseFloat(saved);
        if (Number.isFinite(sec) && sec > 0) {
          const a = audioRef.current;
          if (a && a.readyState >= 1) a.currentTime = sec;
          else restoredRef.current = true; // apply on loadedmetadata
        }
      }
    } catch {
      /* ignore */
    }
  }, [id, difficulty]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Persist position (throttled by timeupdate cadence) and on pause/unmount.
  const savePosition = useCallback(() => {
    if (!id || !audioRef.current) return;
    try {
      localStorage.setItem(posKey(id, difficulty), String(audioRef.current.currentTime));
    } catch {
      /* ignore */
    }
  }, [id, difficulty]);

  useEffect(() => savePosition, [savePosition]);

  // Sleep timer
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (sleepMin > 0) {
      sleepTimerRef.current = window.setTimeout(() => {
        audioRef.current?.pause();
        setSleepMin(0);
      }, sleepMin * 60_000);
    }
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [sleepMin]);

  // Lockscreen / OS media controls.
  useEffect(() => {
    if (!book || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: book.titleEn,
      artist: book.author,
      album: 'Tsundoku',
      artwork: [{ src: '/favicon.png', sizes: '512x512', type: 'image/png' }],
    });
    const a = audioRef.current;
    ms.setActionHandler('play', () => a?.play());
    ms.setActionHandler('pause', () => a?.pause());
    ms.setActionHandler('seekbackward', () => {
      if (a) a.currentTime = Math.max(0, a.currentTime - 10);
    });
    ms.setActionHandler('seekforward', () => {
      if (a) a.currentTime = Math.min(a.duration || Infinity, a.currentTime + 10);
    });
    ms.setActionHandler('seekto', (d) => {
      if (a && d.seekTime != null) a.currentTime = d.seekTime;
    });
    return () => {
      ms.metadata = null;
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      ms.setActionHandler('seekbackward', null);
      ms.setActionHandler('seekforward', null);
      ms.setActionHandler('seekto', null);
    };
  }, [book]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }, [playing]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  if (!book) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl font-semibold">Book not found</p>
        <button onClick={() => navigate('/')} className="text-sm text-muted-foreground underline-offset-4">
          Back to Library
        </button>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl font-semibold">No audio for this level</p>
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground underline-offset-4">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header
        className="flex items-center px-5"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: '12px' }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 ring-1 ring-border/40 backdrop-blur-md header-chip smooth-colors tap-scale-sm"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <p className="flex-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Now listening
        </p>
        <div className="h-10 w-10" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-8 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="book-paper relative flex h-64 w-44 items-end overflow-hidden rounded-2xl p-4 shadow-xl ring-1 ring-black/5"
          style={{ backgroundColor: book.coverColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40" />
          <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
          <p className="font-japanese relative text-lg font-bold leading-tight text-white drop-shadow-sm">
            {book.titleJp}
          </p>
        </motion.div>

        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold leading-tight">{book.titleEn}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        </div>

        {availableDifficulties.length > 1 && (
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {availableDifficulties.map((d) => (
              <button
                key={d}
                onClick={() => {
                  savePosition();
                  setDifficulty(d);
                  setPlaying(false);
                }}
                className={cn(
                  'relative h-8 rounded-full px-3 text-xs font-semibold smooth-colors',
                  d === difficulty ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {d === difficulty && (
                  <motion.div
                    layoutId="seg-difficulty-listen"
                    className="absolute inset-0 rounded-full bg-card relief-raised ring-1 ring-border/40"
                    transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                  />
                )}
                <span className="relative z-10">{difficultyConfig[d].label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="w-full max-w-sm">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={([v]) => {
              if (audioRef.current) audioRef.current.currentTime = v;
              setCurrentTime(v);
            }}
            className="audio-slider"
          />
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
            }}
            aria-label="Back 10 seconds"
            className="flex h-12 w-12 items-center justify-center rounded-full text-foreground/70 tap-scale-sm"
          >
            <RotateCcw className="h-6 w-6" />
          </button>
          <button
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg btn-primary-glow tap-scale"
          >
            {playing ? <Pause className="h-8 w-8 fill-current" /> : <Play className="ml-1 h-8 w-8 fill-current" />}
          </button>
          <button
            onClick={() => {
              if (audioRef.current)
                audioRef.current.currentTime = Math.min(duration || Infinity, audioRef.current.currentTime + 10);
            }}
            aria-label="Forward 10 seconds"
            className="flex h-12 w-12 items-center justify-center rounded-full text-foreground/70 tap-scale-sm"
          >
            <RotateCw className="h-6 w-6" />
          </button>
        </div>

        {/* Speed + sleep */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
            className="h-9 min-w-[3.5rem] rounded-full bg-muted px-3 text-[13px] font-semibold tabular-nums smooth-colors tap-scale-sm"
            aria-label="Playback speed"
          >
            {speed}x
          </button>
          <button
            onClick={() => setSleepMin(SLEEP_OPTIONS[(SLEEP_OPTIONS.indexOf(sleepMin) + 1) % SLEEP_OPTIONS.length])}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold smooth-colors tap-scale-sm',
              sleepMin > 0 ? 'bg-accent/15 text-accent ring-1 ring-accent/25' : 'bg-muted text-muted-foreground'
            )}
            aria-label="Sleep timer"
          >
            <Moon className="h-3.5 w-3.5" />
            {sleepMin > 0 ? `${sleepMin}m` : 'Sleep'}
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          savePosition();
        }}
        onEnded={() => {
          setPlaying(false);
          savePosition();
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          savePosition();
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          if (restoredRef.current && id) {
            try {
              const saved = localStorage.getItem(posKey(id, difficulty));
              if (saved) {
                const sec = parseFloat(saved);
                if (Number.isFinite(sec) && sec > 0 && sec < e.currentTarget.duration) {
                  e.currentTarget.currentTime = sec;
                }
              }
            } catch {
              /* ignore */
            }
            restoredRef.current = false;
          }
        }}
      />
    </div>
  );
}
