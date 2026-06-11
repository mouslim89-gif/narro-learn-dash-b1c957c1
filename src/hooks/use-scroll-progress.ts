import { useEffect, useState } from 'react';

/**
 * Returns a 0→1 progress value driven by window scroll between `start` and `end` px.
 * rAF-throttled, passive listener, no re-renders when value is unchanged.
 */
export function useScrollProgress(start = 0, end = 80): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = -1;

    const update = () => {
      raf = 0;
      const y = window.scrollY || window.pageYOffset || 0;
      const span = Math.max(1, end - start);
      const raw = (y - start) / span;
      const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      // Round to 3 decimals to dedupe near-equal updates.
      const rounded = Math.round(clamped * 1000) / 1000;
      if (rounded !== last) {
        last = rounded;
        setProgress(rounded);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [start, end]);

  return progress;
}
