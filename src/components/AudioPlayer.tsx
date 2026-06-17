import { useEffect, useRef, useState } from'react';
import { Play, Pause } from'lucide-react';
import { Slider } from'@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from'@/components/ui/popover';
import { cn } from'@/lib/utils';

interface AudioPlayerProps {
 src: string;
 bottomOffset?: number;
 onTimeUpdate?: (timeSec: number) => void;
 onLoadedMetadata?: (durationSec: number) => void;
 seekRequestRef?: React.MutableRefObject<((sec: number) => void) | null>;
 onScrub?: (timeSec: number) => void;
 onPlay?: () => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

function formatTime(sec: number): string {
 if (!isFinite(sec) || sec < 0) sec = 0;
 const m = Math.floor(sec / 60);
 const s = Math.floor(sec % 60);
 return`${m}:${s.toString().padStart(2,'0')}`;
}

export function AudioPlayer({
 src,
 bottomOffset = 0,
 onTimeUpdate,
 onLoadedMetadata,
 seekRequestRef,
 onScrub,
 onPlay,
}: AudioPlayerProps) {
 const audioRef = useRef<HTMLAudioElement>(null);
 const [playing, setPlaying] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [speed, setSpeed] = useState(1);
 const [showRemaining, setShowRemaining] = useState(false);

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

 const handleSliderChange = (val: number[]) => {
 if (audioRef.current && duration > 0) {
 const newTime = (val[0] / 100) * duration;
 audioRef.current.currentTime = newTime;
 setCurrentTime(newTime);
 onTimeUpdate?.(newTime);
 onScrub?.(newTime);
 }
 };

 const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
 const rightTime = showRemaining
 ?`-${formatTime(Math.max(0, duration - currentTime))}`: formatTime(duration);

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
 onPlay={() => { setPlaying(true); onPlay?.(); }}
 />
 <div
 data-audio-player
 style={{ bottom:`${bottomOffset + 12}px`}}
 className="fixed inset-x-0 z-40 px-3 pointer-events-none"
 >
 <div className="mx-auto max-w-md pointer-events-auto rounded-2xl bg-background/85 backdrop-blur-xl ring-1 ring-border/40 shadow-lg">
 <div className="flex items-center gap-3 px-3 py-2">
 <button
 onClick={togglePlay}
 className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/25 transition-transform"
 aria-label={playing ?'Pause':'Play'}
 >
 {playing ? <Pause className="h-4 w-4"/> : <Play className="ml-0.5 h-4 w-4"/>}
 </button>
 <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground w-9">
 {formatTime(currentTime)}
 </span>
 <Slider
 value={[progressPct]}
 onValueChange={handleSliderChange}
 max={100}
 step={0.1}
 className="flex-1 audio-slider"
 />
 <button
 onClick={() => setShowRemaining(v => !v)}
 className="shrink-0 hidden xs:block text-[11px] tabular-nums text-muted-foreground w-10 text-right"
 >
 {rightTime}
 </button>
 <Popover>
 <PopoverTrigger asChild>
 <button
 className="shrink-0 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground/80 ring-1 ring-border/40 transition"
 aria-label="Playback speed"
 >
 {speed}×
 </button>
 </PopoverTrigger>
 <PopoverContent align="end"side="top"className="w-24 p-1">
 <div className="flex flex-col">
 {SPEEDS.map((s) => (
 <button
 key={s}
 onClick={() => setSpeed(s)}
 className={cn('rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-left transition-colors',
 s === speed
 ?'bg-primary/10 text-primary':'text-foreground/70')}
 >
 {s}×
 </button>
 ))}
 </div>
 </PopoverContent>
 </Popover>
 </div>
 </div>
 </div>
 </>
 );
}
