import { Link, useLocation } from 'react-router-dom';
import { Library, BookOpen, Layers, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlashcardStore } from '@/stores/flashcards';
import { useSyncStatus } from '@/lib/sync/sync-status';

const tabs = [
  { path: '/', label: 'Library', icon: Library },
  { path: '/my-books', label: 'Books', icon: BookOpen },
  { path: '/flashcards', label: 'Cards', icon: Layers },
  { path: '/dictionary', label: 'Dict', icon: Search },
];

function SyncIndicator() {
  const status = useSyncStatus(s => s.status);
  if (status === 'idle') return null;
  const color =
    status === 'syncing' ? 'bg-primary animate-soft-pulse' : 'bg-destructive';
  return (
    <span
      aria-label={status === 'syncing' ? 'Syncing' : 'Sync error'}
      className={`absolute right-5 top-1.5 h-1.5 w-1.5 rounded-full ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] pt-3 px-4 pointer-events-none">
      {/* Soft gradient fade behind the bar for depth on scroll */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent -z-10"
      />

      <nav
        className="
          pointer-events-auto relative mx-auto max-w-md
          flex items-center justify-between
          rounded-[28px]
          bg-card/75 backdrop-blur-2xl backdrop-saturate-150
          ring-1 ring-border/60
          shadow-[0_1px_0_0_hsl(var(--background))_inset,0_-1px_0_0_hsl(var(--foreground)/0.04)_inset,0_12px_40px_-12px_hsl(var(--foreground)/0.22),0_4px_12px_-6px_hsl(var(--foreground)/0.12)]
          px-2 py-2
        "
      >
        {/* subtle top highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        />

        <SyncIndicator />

        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const showBadge = path === '/flashcards' && dueCount > 0;
          return (
            <Link
              key={path}
              to={path}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex items-center justify-center py-1 tap-scale-sm"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="
                    absolute inset-x-1 inset-y-0
                    rounded-2xl
                    bg-gradient-to-b from-primary/15 to-primary/8
                    ring-1 ring-primary/15
                    shadow-[0_1px_0_0_hsl(var(--background)/0.6)_inset,0_6px_16px_-8px_hsl(var(--primary)/0.4)]
                  "
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1 px-1.5">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: active ? 1.08 : 1,
                      y: active ? -1 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  >
                    <Icon
                      className={`h-[22px] w-[22px] transition-colors duration-200 ${
                        active ? 'text-primary' : 'text-muted-foreground/80'
                      }`}
                      strokeWidth={active ? 2.5 : 1.9}
                    />
                  </motion.div>

                  {showBadge && (
                    <span
                      className="
                        absolute -right-2.5 -top-2
                        flex h-[18px] min-w-[18px] items-center justify-center
                        rounded-full bg-destructive px-1
                        text-[10px] font-bold leading-none text-white
                        ring-2 ring-card
                        shadow-[0_2px_6px_-1px_hsl(var(--destructive)/0.5)]
                        animate-scale-pop
                      "
                    >
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.08em] leading-none transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-muted-foreground/70'
                  }`}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
