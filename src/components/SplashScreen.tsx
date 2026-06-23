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
          <div className="flex flex-col items-center max-w-xs w-full text-center">
            {/* Abstract Minimalist Book Stack */}
            <div className="relative h-48 w-full flex items-end justify-center mb-10">
              <motion.svg 
                viewBox="0 0 200 180" 
                className="w-56 h-48"
                initial="initial"
                animate="animate"
              >
                {/* Book 1 (Bottom) */}
                <motion.rect
                  x="40" y="150" width="120" height="4" rx="2"
                  fill="hsl(var(--primary))"
                  variants={{
                    initial: { x: -200, opacity: 0 },
                    animate: { x: 0, opacity: 1, transition: { delay: 0.1, type: 'spring', stiffness: 300, damping: 25 } }
                  }}
                />

                {/* Book 2 */}
                <motion.rect
                  x="45" y="140" width="110" height="4" rx="2"
                  fill="hsl(var(--muted-foreground))"
                  variants={{
                    initial: { x: -200, opacity: 0 },
                    animate: { x: 0, opacity: 1, transition: { delay: 0.2, type: 'spring', stiffness: 300, damping: 25 } }
                  }}
                />

                {/* Book 3 */}
                <motion.rect
                  x="50" y="130" width="100" height="4" rx="2"
                  fill="hsl(var(--accent))"
                  variants={{
                    initial: { x: -200, opacity: 0 },
                    animate: { x: 0, opacity: 1, transition: { delay: 0.3, type: 'spring', stiffness: 300, damping: 25 } }
                  }}
                />

                {/* Book 4 */}
                <motion.rect
                  x="55" y="120" width="90" height="4" rx="2"
                  fill="hsl(var(--primary))"
                  variants={{
                    initial: { x: -200, opacity: 0 },
                    animate: { x: 0, opacity: 1, transition: { delay: 0.4, type: 'spring', stiffness: 300, damping: 25 } }
                  }}
                />

                {/* Book 5 (Top) */}
                <motion.rect
                  x="60" y="110" width="80" height="4" rx="2"
                  fill="hsl(var(--secondary-foreground))"
                  variants={{
                    initial: { x: -200, opacity: 0 },
                    animate: { x: 0, opacity: 1, transition: { delay: 0.5, type: 'spring', stiffness: 300, damping: 25 } }
                  }}
                />
              </motion.svg>
            </div>

            {/* Wordmark */}
            <div className="relative mb-4">
              <motion.div className="flex gap-0.5 overflow-hidden">
                {"Tsundoku".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="wordmark text-5xl font-serif font-black text-foreground inline-block"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      delay: 0.85 + (i * 0.04),
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>
              
              {/* Underline */}
              <motion.div 
                className="h-0.5 bg-accent w-24 mx-auto mt-2"
                initial={{ scaleX: 0, transformOrigin: 'center' }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.25, duration: 0.4 }}
              />
            </div>

            {/* Tagline */}
            <motion.p 
              className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.45, duration: 0.6 }}
            >
              Read. Tap. Remember.
            </motion.p>
          </div>
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
