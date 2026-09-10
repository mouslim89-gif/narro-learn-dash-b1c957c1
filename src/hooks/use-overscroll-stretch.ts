import { useEffect, useState, type RefObject } from 'react';

interface UseOverscrollStretchOptions {
  /** Pull distance in px that maps to stretch = 1. Default 220. */
  maxPull?: number;
  /** When true the hook returns 0 and no listeners are attached. */
  disabled?: boolean;
}

/** Nearest scrollable ancestor, or null when the page itself is the scroller. */
function findScroller(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Returns a value in [0, 1] that grows linearly as the user pulls down
 * past the top of the page (window scroll) or the nearest scrollable
 * ancestor. Resets to 0 when the touch ends.
 *
 * Does not re-enable native rubber-band bounce; it works on top of
 * `overscroll-behavior: none` by tracking touch deltas directly.
 */
export function useOverscrollStretch<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  options: UseOverscrollStretchOptions = {}
): number {
  const { maxPull = 220, disabled = false } = options;
  const [stretch, setStretch] = useState(0);

  useEffect(() => {
    if (disabled) return;

    // Resolved lazily on each touchstart: the scroller may only become
    // scrollable after content hydrates.
    let scroller: HTMLElement | null = null;
    const getScrollTop = () =>
      scroller
        ? scroller.scrollTop
        : window.scrollY || document.documentElement.scrollTop || 0;

    let engaged = false;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      scroller = findScroller(ref.current);
      startY = e.touches[0].clientY;
      engaged = getScrollTop() <= 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;

      if (getScrollTop() > 0) {
        if (engaged) {
          engaged = false;
          setStretch(0);
        }
        return;
      }

      if (!engaged) {
        engaged = true;
        startY = y;
      }

      const delta = y - startY;
      setStretch(delta > 0 ? Math.min(1, delta / maxPull) : 0);
    };

    const onTouchEnd = () => {
      engaged = false;
      setStretch(0);
    };

    // Always listen on the window: touch events bubble up from whichever
    // element the finger started on, page-scrolled or not.
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [maxPull, disabled, ref]);

  return stretch;
}
