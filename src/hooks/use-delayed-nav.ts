import { useCallback, useEffect, useRef } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

const PRESS_DELAY_MS = 120;

/**
 * Returns a navigate function that defers the route change by ~120ms so
 * the press animation (`active:scale-[…]`) has time to render before the
 * page unmounts. Respects prefers-reduced-motion. Ignores modifier keys
 * and middle-click (lets the browser open in a new tab).
 */
export function useDelayedNav() {
  const navigate = useNavigate();
  const pendingRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  useEffect(
    () => () => {
      if (pendingRef.current) window.clearTimeout(pendingRef.current);
    },
    [],
  );

  return useCallback(
    (
      to: string | number,
      e?: React.MouseEvent | React.KeyboardEvent,
      options?: NavigateOptions,
    ) => {
      if (e && "button" in e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        e.preventDefault();
      } else if (e) {
        e.preventDefault();
      }
      if (lockedRef.current) return;
      lockedRef.current = true;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const delay = reduce ? 0 : PRESS_DELAY_MS;

      pendingRef.current = window.setTimeout(() => {
        lockedRef.current = false;
        pendingRef.current = null;
        if (typeof to === "number") navigate(to);
        else navigate(to, options);
      }, delay);
    },
    [navigate],
  );
}
