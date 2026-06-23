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
            {/* Refined Book Stack SVG */}
            <div className="relative h-48 w-full flex items-end justify-center mb-10">
              <motion.svg 
                viewBox="0 0 200 180" 
                className="w-56 h-48 drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)]"
                initial="initial"
                animate="animate"
              >
                <defs>
                  <linearGradient id="spine-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
                    <stop offset="15%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="30%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="85%" stopColor="rgba(0,0,0,0.1)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
                  </linearGradient>
                </defs>

                {/* Book 1 (Bottom - Navy) */}
                <motion.g
                  variants={{
                    initial: { y: -40, opacity: 0, scale: 0.95 },
                    animate: { y: 0, opacity: 1, scale: 1, transition: { delay: 0.1, type: 'spring', stiffness: 400, damping: 25 } }
                  }}
                >
                  <rect x="35" y="145" width="130" height="24" rx="3" fill="hsl(var(--primary))" />
                  <rect x="35" y="145" width="130" height="24" rx="3" fill="url(#spine-grad)" />
                  {/* Decorative bands */}
                  <rect x="45" y="148" width="2" height="18" fill="rgba(255,255,255,0.2)" />
                  <rect x="153" y="148" width="2" height="18" fill="rgba(255,255,255,0.2)" />
                </motion.g>

                {/* Book 2 (Beige) */}
                <motion.g
                  transform="rotate(-1.5 100 132)"
                  variants={{
                    initial: { y: -60, opacity: 0, scale: 0.95 },
                    animate: { y: 0, opacity: 1, scale: 1, transition: { delay: 0.22, type: 'spring', stiffness: 400, damping: 25 } }
                  }}
                >
                  <rect x="40" y="125" width="120" height="20" rx="3" fill="hsl(var(--secondary))" />
                  <rect x="40" y="125" width="120" height="20" rx="3" fill="url(#spine-grad)" />
                  <rect x="52" y="128" width="1.5" height="14" fill="rgba(0,0,0,0.1)" />
                  <rect x="146" y="128" width="1.5" height="14" fill="rgba(0,0,0,0.1)" />
                </motion.g>

                {/* Book 3 (Amber/Accent) */}
                <motion.g
                  transform="rotate(2 100 112)"
                  variants={{
                    initial: { y: -80, opacity: 0, scale: 0.95 },
                    animate: { y: 0, opacity: 1, scale: 1, transition: { delay: 0.34, type: 'spring', stiffness: 400, damping: 25 } }
                  }}
                >
                  <rect x="48" y="105" width="104" height="20" rx="3" fill="hsl(var(--accent))" />
                  <rect x="48" y="105" width="104" height="20" rx="3" fill="url(#spine-grad)" />
                  {/* Title lines */}
                  <rect x="75" y="112" width="50" height="1.5" rx="0.5" fill="rgba(255,255,255,0.4)" />
                  <rect x="75" y="116" width="30" height="1.5" rx="0.5" fill="rgba(255,255,255,0.3)" />
                </motion.g>

                {/* Book 4 (Top - Navy/Primary) */}
                <motion.g
                  transform="rotate(-3 100 90)"
                  variants={{
                    initial: { y: -100, opacity: 0, scale: 0.95, rotate: -8 },
                    animate: { 
                      y: 0, opacity: 1, scale: 1, rotate: -3,
                      transition: { delay: 0.46, type: 'spring', stiffness: 400, damping: 20 } 
                    }
                  }}
                >
                  <rect x="55" y="85" width="90" height="20" rx="3" fill="hsl(var(--primary))" />
                  <rect x="55" y="85" width="90" height="20" rx="3" fill="url(#spine-grad)" />
                  <rect x="65" y="88" width="2" height="14" fill="rgba(255,255,255,0.2)" />
                  <rect x="133" y="88" width="2" height="14" fill="rgba(255,255,255,0.2)" />
                </motion.g>
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
