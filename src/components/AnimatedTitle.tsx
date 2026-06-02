import { cn } from "@/lib/utils";

interface AnimatedTitleProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  /** Delay between letters in ms */
  stagger?: number;
  /** Initial delay before first letter, ms */
  delay?: number;
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
}: AnimatedTitleProps) {
  const chars = Array.from(text);
  return (
    <Tag className={cn("animated-title", className)} aria-label={text}>
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
    </Tag>
  );
}
