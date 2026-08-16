import { motion } from 'framer-motion';
import { Volume2, Play } from 'lucide-react';

export function AudioDemo({ active }: { active: boolean }) {
  const words = ['今日', 'は', '天気', 'が', 'いい', 'です', 'ね', '。'];
  const [currentIdx, setCurrentIdx] = React.useState(-1);

  React.useEffect(() => {
    if (!active) {
      setCurrentIdx(-1);
      return;
    }
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % (words.length + 2));
    }, 400);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-[300px] bg-card p-8 rounded-3xl border shadow-sm mb-10">
        <div className="flex flex-wrap gap-y-4 text-xl font-japanese leading-relaxed">
          {words.map((word, i) => (
            <motion.span
              key={i}
              animate={{
                backgroundColor: i === currentIdx ? 'rgba(var(--accent-rgb), 0.2)' : 'rgba(var(--accent-rgb), 0)',
                color: i === currentIdx ? 'hsl(var(--accent))' : 'hsl(var(--foreground))'
              }}
              className="px-0.5 rounded transition-colors duration-200"
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Play className="h-6 w-6 ml-1" />
        </div>
        <div className="flex flex-col gap-1.5 w-32">
          <div className="flex items-end gap-1 h-8">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={active ? {
                  height: [8, Math.random() * 20 + 10, 8]
                } : { height: 8 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5 + Math.random() * 0.5,
                  delay: i * 0.05
                }}
                className="w-1.5 bg-accent/40 rounded-full"
              />
            ))}
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
            <span>0:12</span>
            <span><Volume2 className="h-3 w-3" /></span>
          </div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-center font-medium text-muted-foreground"
      >
        Synchronized audio to master pitch and rhythm.
      </motion.p>
    </div>
  );
}
import React from 'react';