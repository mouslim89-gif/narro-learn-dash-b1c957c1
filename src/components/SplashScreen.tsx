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
            {/* Book Stack SVG Illustration */}
            <div className="relative h-40 w-full flex items-end justify-center mb-8">
              <motion.svg 
                viewBox="0 0 200 160" 
                className="w-48 h-40 drop-shadow-sm"
                initial="initial"
                animate="animate"
              >
                {/* Book 1 (Bottom) */}
                <motion.rect
                  x="40" y="130" width="120" height="20" rx="2"
                  fill="hsl(var(--muted-foreground) / 0.2)"
                  variants={{
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1, transition: { delay: 0.08, type: 'spring', stiffness: 300, damping: 20 } }
                  }}
                />
                <motion.rect
                  x="40" y="130" width="114" height="20" rx="2"
                  fill="hsl(var(--primary))"
                  variants={{
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1, transition: { delay: 0.08, type: 'spring', stiffness: 300, damping: 20 } }
                  }}
                />
                
                {/* Book 2 */}
                <motion.rect
                  x="45" y="110" width="110" height="18" rx="2"
                  fill="hsl(var(--accent))"
                  transform="rotate(-1 100 119)"
                  variants={{
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1, transition: { delay: 0.19, type: 'spring', stiffness: 300, damping: 20 } }
                  }}
                />
                
                {/* Book 3 */}
                <motion.rect
                  x="50" y="90" width="100" height="18" rx="2"
                  fill="hsl(var(--secondary))"
                  transform="rotate(2 100 99)"
                  variants={{
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1, transition: { delay: 0.30, type: 'spring', stiffness: 300, damping: 20 } }
                  }}
                />
                
                {/* Book 4 (Top, Tilted) */}
                <motion.path
                  d="M60 72 L140 72 L145 52 L65 52 Z"
                  fill="hsl(var(--primary))"
                  transform="rotate(-4 100 62)"
                  variants={{
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1, transition: { delay: 0.41, type: 'spring', stiffness: 300, damping: 20 } }
                  }}
                />
                <motion.rect
                  x="60" y="70" width="80" height="18" rx="2"
                  fill="hsl(var(--primary))"
                  transform="rotate(-4 100 79)"
                  variants={{
                    initial: { y: 20, opacity: 0 },
                    animate: { y: 0, opacity: 1, transition: { delay: 0.41, type: 'spring', stiffness: 300, damping: 20 } }
                  }}
                />
              </motion.svg>
            </div>

            {/* Wordmark */}
            <div className="relative mb-3">
              <motion.div className="flex gap-0.5 overflow-hidden">
                {"Tsundoku".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="wordmark text-5xl font-serif font-black text-foreground inline-block"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      delay: 0.72 + (i * 0.05),
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
                transition={{ delay: 1.15, duration: 0.3 }}
              />
            </div>

            {/* Tagline */}
            <motion.p 
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.35, duration: 0.5 }}
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
