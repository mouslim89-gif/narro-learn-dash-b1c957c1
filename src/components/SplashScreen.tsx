import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1850);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, []);

  if (prefersReducedMotion) {
    // Immediate static view for accessibility
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
          >
            <StaticSplashContent />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background p-6"
        >
          {/* Main container with layout prop to handle the centering shift automatically */}
          <motion.div 
            layout 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex items-center gap-4"
          >
            {/* Vertical Stack of Bars (Books) */}
            <div className="flex flex-col items-end gap-2 overflow-hidden">
              {[1, 2, 3].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-[13px] bg-foreground rounded-[1px] w-8"
                  initial={{ x: 80, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: 1,
                    transition: { 
                      delay: 0.8 + (i * 0.08),
                      type: 'spring',
                      stiffness: 250,
                      damping: 25
                    }
                  }}
                />
              ))}
            </div>

            {/* Wordmark */}
            <div className="flex gap-0.5 overflow-hidden">
              {"Tsundoku".split("").map((letter, i) => (
                <motion.span
                  key={i}
                  className="wordmark text-6xl font-serif font-black text-foreground inline-block"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: 0.1 + (i * 0.06),
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StaticSplashContent() {
  return (
    <div className="flex flex-col items-center max-w-xs w-full text-center">
      <div className="wordmark text-5xl font-serif font-black text-foreground mb-2">
        Tsundoku
      </div>
      <div className="h-0.5 bg-accent w-24 mx-auto mb-3" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Read. Tap. Remember.
      </p>
    </div>
  );
}
