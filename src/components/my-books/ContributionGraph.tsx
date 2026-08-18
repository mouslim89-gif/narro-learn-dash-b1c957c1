import { useMemo, useRef, useEffect, useState } from 'react';
import { format, subDays, startOfToday, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContributionGraphProps {
  readDateStrings: Set<string>;
}

export function ContributionGraph({ readDateStrings }: ContributionGraphProps) {
  const today = startOfToday();
  const daysToShow = 30;
  
  const days = useMemo(() => {
    const interval = eachDayOfInterval({
      start: subDays(today, daysToShow - 1),
      end: today,
    });
    return interval;
  }, [today]);

  return (
    <section className="mt-4">
      <div className="rounded-xl border border-border/40 bg-card/50 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">Activity</p>
          <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Last 30 days</p>
        </div>
        
        <div className="flex w-full gap-[3px]">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isRead = readDateStrings.has(dateStr);

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "h-[7px] flex-1 rounded-[1.5px] transition-colors duration-300",
                  isRead 
                    ? "bg-primary shadow-[0_0_8px_-2px_hsl(var(--primary)/0.3)]" 
                    : "bg-muted/40"
                )}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
