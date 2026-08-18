import { useMemo } from 'react';
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-serif text-lg font-semibold text-foreground">Activity</h3>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Last 30 days</p>
      </div>
      
      <div className="rounded-2xl border border-border/40 bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          <TooltipProvider delayDuration={0}>
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isRead = readDateStrings.has(dateStr);
              const isToday = isSameDay(day, today);

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: idx * 0.01,
                        duration: 0.2
                      }}
                      className={cn(
                        "aspect-square w-full rounded-md transition-colors duration-300",
                        isRead 
                          ? "bg-primary shadow-sm shadow-primary/20" 
                          : "bg-muted/40",
                        isToday && !isRead && "ring-1 ring-primary/30"
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">
                    <span className="font-medium">{format(day, 'MMM d, yyyy')}</span>
                    {isRead && <span className="ml-1 text-primary-foreground/70">• Read</span>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
        
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-2.5 w-2.5 rounded-[1px] bg-muted/40" />
            <div className="h-2.5 w-2.5 rounded-[1px] bg-primary/40" />
            <div className="h-2.5 w-2.5 rounded-[1px] bg-primary/70" />
            <div className="h-2.5 w-2.5 rounded-[1px] bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
