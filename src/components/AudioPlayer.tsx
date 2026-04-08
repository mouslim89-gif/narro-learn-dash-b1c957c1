import { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [speed, setSpeed] = useState(1);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  const nextSpeed = () => {
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-40 border-t bg-card/95 px-4 py-2 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <Slider
          value={progress}
          onValueChange={setProgress}
          max={100}
          step={1}
          className="flex-1"
        />
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={nextSpeed}
          className="rounded-lg bg-muted px-2 py-1 text-xs font-bold text-foreground"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}
