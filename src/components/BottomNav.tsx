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
    status === 'syncing'
      ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] animate-soft-pulse'
      : 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.6)]';
  return (
    <span
      aria-label={status === 'syncing' ? 'Syncing' : 'Sync error'}
      className={`absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] pt-3 px-4 pointer-events-none">

      <nav
        className="pointer-events-auto relative mx-auto max-w-sm flex items-center justify-between rounded-[28px] bg-card/80 backdrop-blur-2xl ring-1 ring-border/60 border border-white/40 dark:border-white/5 shadow-[0_10px_40px_-12px_hsl(var(--foreground)/0.25),0_2px_6px_-2px_hsl(var(--foreground)/0.08),inset_0_1px_0_0_hsl(0_0%_100%/0.5)] px-1.5 py-1.5"
      >
        <SyncIndicator />
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const showBadge = path === '/flashcards' && dueCount > 0;
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex items-center justify-center h-11 tap-scale-sm group"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-y-1 inset-x-1 rounded-[20px] bg-gradient-to-b from-primary/15 to-primary/8 ring-1 ring-primary/15 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.4),0_4px_12px_-4px_hsl(var(--primary)/0.35)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <motion.div
                className="relative z-10 flex items-center gap-1.5 px-2"
                animate={{ scale: active ? 1 : 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              >
                <div className="relative">
                  <Icon
                    className={`h-[22px] w-[22px] transition-colors duration-200 ${
                      active
                        ? 'text-primary drop-shadow-[0_1px_2px_hsl(var(--primary)/0.35)]'
                        : 'text-muted-foreground/70 group-hover:text-foreground/80'
                    }`}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-gradient-to-b from-destructive to-destructive/85 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-card shadow-[0_2px_6px_-1px_hsl(var(--destructive)/0.6)] animate-scale-pop">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </div>
              </motion.div>

            </Link>
          );
        })}
      </nav>
    </div>
  );
}
