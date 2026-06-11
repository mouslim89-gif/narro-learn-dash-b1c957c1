import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface AnimatedTitleProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  /** Delay between letters in ms */
  stagger?: number;
  /** Initial delay before first letter, ms */
  delay?: number;
  style?: CSSProperties;
}

/**
 * Animates a title letter-by-letter with a soft fade-in-up.
 * Preserves spaces as non-animated gaps. Re-runs when `text` changes
 * because the component remounts via key.
 */
export function AnimatedTitle({
  text,
  className,
  as: Tag = "h1",
  stagger = 22,
  delay = 0,
  style,
}: AnimatedTitleProps) {
  const chars = Array.from(text);
  
  // Extract custom scale variable and margin/font-size if provided
  const { 
    '--title-scale': titleScale, 
    fontSize,
    marginBottom,
    ...restStyle 
  } = (style || {}) as any;

  return (
    <Tag 
      className={cn("animated-title", className)} 
      aria-label={text} 
      style={restStyle}
    >
      <span 
        className="inline-block origin-left will-change-transform"
        style={{ 
          transform: titleScale ? `scale(${titleScale})` : undefined,
          fontSize: fontSize || undefined,
          marginBottom: marginBottom || undefined,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {chars.map((ch, i) => {
          if (ch === " ") {
            return (
              <span key={i} aria-hidden className="inline-block">
                &nbsp;
              </span>
            );
          }
          return (
            <span
              key={i}
              aria-hidden
              className="animated-title__char"
              style={{ animationDelay: `${delay + i * stagger}ms` }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
