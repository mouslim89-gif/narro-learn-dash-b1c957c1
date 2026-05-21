import { Link, useLocation } from 'react-router-dom';
import { Library, BookOpen, Layers, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlashcardStore } from '@/stores/flashcards';
import { useSyncStatus } from '@/lib/sync/sync-status';

const tabs = [
  { path: '/', label: 'Library', icon: Library },
  { path: '/my-books', label: 'My Books', icon: BookOpen },
  { path: '/flashcards', label: 'Cards', icon: Layers },
  { path: '/dictionary', label: 'Dictionary', icon: Search },
];

function SyncIndicator() {
  const status = useSyncStatus(s => s.status);
  if (status === 'idle') return null;
  const color =
    status === 'syncing' ? 'bg-primary animate-soft-pulse' : 'bg-destructive';
  return (
    <span
      aria-label={status === 'syncing' ? 'Syncing' : 'Sync error'}
      className={`absolute right-4 top-1 h-1.5 w-1.5 rounded-full ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 px-3 pointer-events-none">
      <nav className="pointer-events-auto relative mx-auto max-w-md flex items-center justify-between rounded-full bg-card/70 backdrop-blur-xl ring-1 ring-border/50 shadow-[0_8px_32px_-8px_hsl(var(--foreground)/0.18)] px-2 py-1.5">
        <SyncIndicator />
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const showBadge = path === '/flashcards' && dueCount > 0;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 tap-scale-sm"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-1.5 inset-y-0.5 rounded-full bg-primary/12"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <div className="relative">
                  <motion.div
                    animate={{ scale: active ? 1.05 : 1, y: active ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  >
                    <Icon
                      className={`h-[22px] w-[22px] transition-colors ${
                        active ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      strokeWidth={active ? 2.4 : 1.9}
                    />
                  </motion.div>
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white ring-2 ring-card animate-scale-pop">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
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
