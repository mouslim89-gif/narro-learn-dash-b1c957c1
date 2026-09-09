import { useEffect, useState, type RefObject } from 'react';

interface UseOverscrollStretchOptions {
  /** Pull distance in px that maps to stretch = 1. Default 220. */
  maxPull?: number;
  /** When true the hook returns 0 and no listeners are attached. */
  disabled?: boolean;
}

/**
 * Returns a value in [0, 1] that grows linearly as the user pulls down
 * past the top of the page (window scroll) or a scrollable container.
 * The value resets to 0 with a smooth CSS transition when the touch ends.
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

    const el = ref.current;
    const getScrollTop = () => (el ? el.scrollTop : window.scrollY);
    const target = el ?? document;

    let engaged = false;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      engaged = getScrollTop() <= 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const atTop = getScrollTop() <= 0;

      if (!atTop) {
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
      if (delta > 0) {
        setStretch(Math.min(1, delta / maxPull));
      } else {
        setStretch(0);
      }
    };

    const onTouchEnd = () => {
      if (engaged) {
        engaged = false;
        setStretch(0);
      }
    };

    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: true });
    target.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [maxPull, disabled, ref]);

  return stretch;
}
