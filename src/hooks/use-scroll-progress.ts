import { useEffect, type RefObject, useContext, createContext } from 'react';

export const ScrollContext = createContext<RefObject<HTMLDivElement> | null>(null);

/**
 * Writes a CSS variable `--p` (0 → 1) on `ref.current` based on window scrollY
 * between `start` and `end` pixels.
 *
 * The value is smoothed each frame with an exponential lerp toward the target,
 * so scroll inputs that arrive in discrete jumps (wheel, trackpad, momentum)
 * produce a continuous, spring-like interpolation. The whole header — scale,
 * blur, background, padding — stays perfectly in sync because they all read
 * the same variable.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement>,
  start = 0,
  end = 56,
  varName = '--p',
) {
  const containerRef = useContext(ScrollContext);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const range = Math.max(1, end - start);
    // Smoothing factor per frame (~60fps). Higher = snappier, lower = silkier.
    const SMOOTH = 0.35;
    // Snap to target once within this delta — avoids endless sub-pixel lerp
    // that makes backdrop-filter shimmer.
    const EPS = 0.01;

    let current = 0;
    let target = 0;
    let raf = 0;
    let running = false;

    const computeTarget = () => {
      // Use standard window scroll unless a container ref is provided
      const scrollY = containerRef?.current 
        ? containerRef.current.scrollTop 
        : window.scrollY;
      
      const y = Math.round(scrollY);
      target = Math.min(1, Math.max(0, (y - start) / range));
    };

    const write = (v: number) => {
      // Quantize to 2 decimals (~100 distinct values across the whole course)
      // so backdrop-filter only re-renders on meaningful steps.
      el.style.setProperty(varName, v.toFixed(2));
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < EPS) {
        current = target;
        write(current);
        running = false;
        raf = 0;
        return;
      }
      current += diff * SMOOTH;
      write(current);
      raf = requestAnimationFrame(tick);
    };

    const ensureRunning = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      computeTarget();
      ensureRunning();
    };

    // Initial sync (no animation on mount).
    computeTarget();
    current = target;
    write(current);

    if (containerRef?.current) {
      containerRef.current.addEventListener('scroll', onScroll, { passive: true });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    
    return () => {
      if (containerRef?.current) {
        containerRef.current.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, start, end, varName]);
}
