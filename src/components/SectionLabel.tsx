import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-3 mb-3 px-1", className)}>
      <h2 className="font-serif text-[13px] tracking-[0.14em] uppercase text-muted-foreground whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}
