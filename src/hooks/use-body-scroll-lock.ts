import { useEffect } from'react';

/**
 * Lock body scroll while a popup/sheet is mounted.
 * Compensates for scrollbar width on desktop and preserves scroll position
 * by setting`position: fixed; top: -scrollY`.
 */
export function useBodyScrollLock(active = true) {
 useEffect(() => {
 if (!active) return;
 const scrollY = window.scrollY;
 const prevOverflow = document.body.style.overflow;
 const prevPosition = document.body.style.position;
 const prevTop = document.body.style.top;
 const prevWidth = document.body.style.width;

 document.body.style.overflow ='hidden';
 document.body.style.position ='fixed';
 document.body.style.top =`-${scrollY}px`;
 document.body.style.width ='100%';

 return () => {
 document.body.style.overflow = prevOverflow;
 document.body.style.position = prevPosition;
 document.body.style.top = prevTop;
 document.body.style.width = prevWidth;
 window.scrollTo(0, scrollY);
 };
 }, [active]);
}
