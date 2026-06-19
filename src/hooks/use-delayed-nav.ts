import { useCallback, useEffect, useRef } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

const PRESS_DELAY_MS = 120;

/**
 * Returns a function that defers an action by ~120ms so
 * tap animations have time to render.
 */
function useDelayedTimer() {
  const pendingRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  useEffect(
    () => () => {
      if (pendingRef.current) window.clearTimeout(pendingRef.current);
    },
    [],
  );

  const getDelay = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduce ? 0 : PRESS_DELAY_MS;
  }, []);

  const startTimer = useCallback((callback: () => void) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    pendingRef.current = window.setTimeout(() => {
      lockedRef.current = false;
      pendingRef.current = null;
      callback();
    }, getDelay());
  }, [getDelay]);

  return { startTimer, locked: lockedRef.current };
}

/**
 * Returns a navigate function that defers the route change by ~120ms so
 * the press animation (`active:scale-[…]`) has time to render before the
 * page unmounts. Respects prefers-reduced-motion. Ignores modifier keys
 * and middle-click (lets the browser open in a new tab).
 */
export function useDelayedNav() {
  const navigate = useNavigate();
  const { startTimer } = useDelayedTimer();

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

      startTimer(() => {
        if (typeof to === "number") navigate(to);
        else navigate(to, options);
      });
    },
    [navigate, startTimer],
  );
}

/**
 * Returns a function that defers any state-changing action by ~120ms.
 */
export function useDelayedAction() {
  const { startTimer } = useDelayedTimer();

  return useCallback((callback: () => void, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    startTimer(callback);
  }, [startTimer]);
}

