import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboarding';

const MAX_PULL = 220;

/** Nearest scrollable ancestor of the touched element, or null for the page. */
function findScroller(el: EventTarget | null): HTMLElement | null {
  let node = el instanceof HTMLElement ? el : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const oy = window.getComputedStyle(node).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Single app-wide driver for the pull-to-stretch effect.
 *
 * Tracks the downward pull at the top of the page (or of the inner scroller the
 * finger started in) and writes it as `--stretch` (0 → 1) on <html>. Global CSS
 * in index.css turns that value into extra vertical breathing room between
 * every stacked block. No React re-render happens during the gesture.
 */
export function StretchProvider() {
  const disableAnimation = useOnboardingStore((s) => s.disableAnimation);

  useEffect(() => {
    const root = document.documentElement;

    const reset = () => {
      root.style.setProperty('--stretch', '0');
      root.classList.remove('stretching');
    };

    if (disableAnimation || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reset();
      return;
    }

    let scroller: HTMLElement | null = null;
    let engaged = false;
    let startY = 0;
    let current = 0;

    const getScrollTop = () =>
      scroller ? scroller.scrollTop : window.scrollY || root.scrollTop || 0;

    const set = (v: number) => {
      if (v === current) return;
      current = v;
      root.style.setProperty('--stretch', String(v));
    };

    const onTouchStart = (e: TouchEvent) => {
      scroller = findScroller(e.target);
      startY = e.touches[0].clientY;
      engaged = getScrollTop() <= 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;

      if (getScrollTop() > 0) {
        if (engaged) {
          engaged = false;
          root.classList.remove('stretching');
          set(0);
        }
        return;
      }

      if (!engaged) {
        engaged = true;
        startY = y;
      }

      const delta = y - startY;
      if (delta > 0) {
        root.classList.add('stretching');
        set(Math.round(Math.min(1, delta / MAX_PULL) * 100) / 100);
      } else {
        set(0);
      }
    };

    const onTouchEnd = () => {
      engaged = false;
      root.classList.remove('stretching');
      set(0);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      reset();
    };
  }, [disableAnimation]);

  return null;
}
