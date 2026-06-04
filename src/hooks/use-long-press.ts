import { useCallback, useRef } from'react';

interface Options {
 delay?: number;
 moveThreshold?: number;
}

/**
 * Returns event handlers that detect a long-press (touch + mouse).
 * Cancelled if the pointer moves more than`moveThreshold`pixels
 * (so it doesn't fire during scroll).
 */
export function useLongPress(onLongPress: () => void, opts: Options = {}) {
 const delay = opts.delay ?? 400;
 const moveThreshold = opts.moveThreshold ?? 8;

 const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const start = useRef<{ x: number; y: number } | null>(null);
 const triggered = useRef(false);

 const clear = useCallback(() => {
 if (timer.current) {
 clearTimeout(timer.current);
 timer.current = null;
 }
 start.current = null;
 }, []);

 const begin = useCallback(
 (x: number, y: number) => {
 triggered.current = false;
 start.current = { x, y };
 timer.current = setTimeout(() => {
 triggered.current = true;
 onLongPress();
 }, delay);
 },
 [delay, onLongPress],
 );

 const move = useCallback(
 (x: number, y: number) => {
 if (!start.current || !timer.current) return;
 const dx = x - start.current.x;
 const dy = y - start.current.y;
 if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
 clear();
 }
 },
 [moveThreshold, clear],
 );

 const handlers = {
 onTouchStart: (e: React.TouchEvent) => {
 const t = e.touches[0];
 begin(t.clientX, t.clientY);
 },
 onTouchMove: (e: React.TouchEvent) => {
 const t = e.touches[0];
 move(t.clientX, t.clientY);
 },
 onTouchEnd: clear,
 onTouchCancel: clear,
 onMouseDown: (e: React.MouseEvent) => begin(e.clientX, e.clientY),
 onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY),
 onMouseUp: clear,
 onMouseLeave: clear,
 };

 return { handlers, didTrigger: () => triggered.current, reset: () => { triggered.current = false; } };
}
