import type { ReactNode } from 'react';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { useScrollProgress } from '@/hooks/use-scroll-progress';

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (a: number, b: number, p: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

interface ShrinkHeaderProps {
  title: string;
  actions?: ReactNode;
  /** Title size at scroll = 0 (px). Default 32. */
  largePx?: number;
  /** Title size at full collapse (px). Default 18. */
  smallPx?: number;
  /** Scroll distance over which the shrink happens (px). Default 80. */
  range?: number;
}

/**
 * A-pattern sticky header: single title that progressively shrinks as the page scrolls.
 * Background fades in and a subtle border appears once collapsed.
 */
export function ShrinkHeader({
  title,
  actions,
  largePx = 32,
  smallPx = 18,
  range = 80,
}: ShrinkHeaderProps) {
  const p = useScrollProgress(0, range);
  const titlePx = lerp(largePx, smallPx, p);
  const headerPt = lerp(40, 10, p);
  const headerPb = lerp(8, 10, p);
  const bgAlpha = smooth(0.05, 0.85, p) * 0.92;

  return (
    <header
      className="sticky top-0 z-30 px-6 flex items-center justify-between border-b border-border/0"
      style={{
        paddingTop: `${headerPt}px`,
        paddingBottom: `${headerPb}px`,
        backgroundColor: `hsl(var(--background) / ${bgAlpha})`,
        backdropFilter: p > 0.05 ? `blur(${p * 18}px) saturate(140%)` : undefined,
        WebkitBackdropFilter: p > 0.05 ? `blur(${p * 18}px) saturate(140%)` : undefined,
        borderBottomColor: `hsl(var(--border) / ${smooth(0.7, 1, p) * 0.6})`,
      }}
    >
      <AnimatedTitle
        text={title}
        className="font-serif font-bold leading-none tracking-tight text-foreground origin-left whitespace-nowrap"
        style={{ fontSize: `${titlePx}px`, willChange: 'font-size' }}
      />
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
