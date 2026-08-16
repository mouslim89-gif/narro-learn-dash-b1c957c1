import { motion, AnimatePresence } from 'framer-motion';
import { FuriganaWord } from '@/components/FuriganaWord';
import { Search, Globe, Volume2, BookType, Sparkles } from 'lucide-react';

export function WordTapDemo({ active }: { active: boolean }) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-muted/30">
      {/* Mock Reader Sentence */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm w-full max-w-[280px] mb-8 relative">
        <div className="flex flex-wrap gap-y-6 text-xl font-japanese leading-relaxed">
          <span>今日</span>
          <span>は</span>
          <motion.div
            animate={active ? {
              backgroundColor: ['rgba(var(--accent-rgb), 0)', 'rgba(var(--accent-rgb), 0.15)', 'rgba(var(--accent-rgb), 0.15)']
            } : {}}
            transition={{ delay: 1, duration: 0.5 }}
            className="rounded px-1 relative cursor-pointer"
          >
            <FuriganaWord 
              text="天気" 
              reading="てんき" 
              furiganaVisible={true}
              onClick={() => {}}
              className={active ? "text-accent font-bold transition-colors delay-1000" : ""}
            />
            
            {/* Animated Tap Indicator */}
            {active && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1], 
                  opacity: [0, 1, 0] 
                }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute inset-0 bg-accent/30 rounded-full scale-150 pointer-events-none"
              />
            )}
          </motion.div>
          <span>が</span>
          <span>いい</span>
          <span>です</span>
          <span>ね</span>
          <span>。</span>
        </div>
      </div>

      {/* Mock Popup */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, type: 'spring', damping: 20 }}
            className="w-full max-w-[300px] bg-card rounded-2xl border shadow-lg overflow-hidden"
          >
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-japanese font-bold">天気</h3>
                <span className="text-sm text-muted-foreground">てんき</span>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">Noun</span>
              </div>
              <p className="text-sm leading-snug">Weather; the elements.</p>
              
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-9 rounded-full border flex items-center justify-center text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <div className="h-9 w-9 rounded-full border flex items-center justify-center text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="h-9 w-9 rounded-full border flex items-center justify-center text-muted-foreground">
                  <BookType className="h-4 w-4" />
                </div>
                <button className="flex-1 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2">
                  <Sparkles className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-6 text-sm text-center font-medium text-muted-foreground"
      >
        Tap any word to see its meaning instantly.
      </motion.p>
    </div>
  );
}
