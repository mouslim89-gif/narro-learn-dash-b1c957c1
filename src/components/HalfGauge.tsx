import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HalfGaugeProps {
  value: number;
  max: number;
  label: string;
  centerText: string;
  subText?: string;
  tone?: 'primary' | 'accent';
  complete?: boolean;
}

export function HalfGauge({
  value,
  max,
  label,
  centerText,
  subText,
  tone = 'primary',
  complete = false
}: HalfGaugeProps) {
  const percentage = Math.min(100, (value / Math.max(1, max)) * 100);
  
  // SVG Arc calculation for 180 degrees
  // Viewbox 100x60
  // Radius 40, Center (50, 50)
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius; // Half circle circumference
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-[2/1] max-w-[140px]">
        <svg viewBox="0 0 100 55" className="w-full h-full -rotate-0">
          {/* Background track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted/20"
          />
          {/* Progress arc */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "transition-colors duration-500",
              tone === 'primary' ? 'text-primary' : 'text-accent',
              complete && tone === 'primary' && "text-green-500",
              complete && tone === 'accent' && "text-amber-500"
            )}
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-[2%]">
          <span className="text-xl font-bold font-serif tabular-nums leading-none">
            {centerText}
          </span>
          {subText && (
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {subText}
            </span>
          )}
        </div>
      </div>
      
      {/* Label */}
      <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </span>
    </div>
  );
}
