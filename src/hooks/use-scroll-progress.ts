import { useEffect, type RefObject } from 'react';

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
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const range = Math.max(1, end - start);
    // Smoothing factor per frame (~60fps). Higher = snappier, lower = silkier.
    const SMOOTH = 0.18;
    // Stop animating once we're within this delta of the target.
    const EPS = 0.0005;

    let current = 0;
    let target = 0;
    let raf = 0;
    let running = false;

    const computeTarget = () => {
      const y = window.scrollY;
      target = Math.min(1, Math.max(0, (y - start) / range));
    };

    const write = (v: number) => {
      // Quantize lightly to avoid sub-pixel churn while staying smooth.
      el.style.setProperty(varName, v.toFixed(4));
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

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, start, end, varName]);
}
