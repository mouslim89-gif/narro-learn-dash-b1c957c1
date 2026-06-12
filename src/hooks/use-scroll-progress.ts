import { useEffect, type RefObject } from 'react';

/**
 * Writes a CSS variable `--p` (0 → 1) on `ref.current` based on window scrollY
 * between `start` and `end` pixels. rAF-throttled, passive listener.
 *
 * Use with inline `calc()` styles to interpolate font-size, padding, blur, etc.
 * No React re-renders → 60fps guaranteed.
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

    let raf = 0;
    let last = -1;
    const range = Math.max(1, end - start);

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, (y - start) / range));
      // Quantize to 3 decimals → 200 discrete rest positions, no GPU shimmer
      const q = Math.round(p * 200) / 200;
      if (q === last) return;
      last = q;
      el.style.setProperty(varName, q.toFixed(3));
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
  }, [ref, start, end, varName]);
}
