import { useRef, createElement, type ElementType } from 'react';
import { useOnboardingStore } from '@/stores/onboarding';
import { useOverscrollStretch } from '@/hooks/use-overscroll-stretch';
import { cn } from '@/lib/utils';

interface StretchyCardsProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'ul' | 'ol';
  /** Tailwind spacing unit for the base row gap (n * 0.25rem). Default 2. */
  gap?: number;
}

const GAP_REM = 0.25;

/**
 * Wraps a vertical card list so its row gap stretches up to double when the
 * user pulls down past the top. Respects reduced motion and the global
 * "Disable app animation" setting.
 *
 * The caller keeps control of layout (flex-col, grid, flex-wrap, etc.) and
 * horizontal/column gap via Tailwind classes; only the vertical row gap is
 * animated by this component.
 */
export function StretchyCards({
  as = 'div',
  gap = 2,
  className,
  style,
  children,
  ...props
}: StretchyCardsProps) {
  const ref = useRef<HTMLElement>(null);
  const disableAnimation = useOnboardingStore((s) => s.disableAnimation);
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stretch = useOverscrollStretch(ref as React.RefObject<HTMLElement>, {
    maxPull: 220,
    disabled: disableAnimation || prefersReduced,
  });

  const baseGap = gap * GAP_REM;

  return createElement(as as ElementType, {
    ref,
    className: cn(className),
    style: {
      ...style,
      rowGap: `calc(${baseGap}rem * (1 + ${stretch}))`,
      transition:
        stretch === 0
          ? 'row-gap 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'none',
    },
    ...props,
  }, children);
}
