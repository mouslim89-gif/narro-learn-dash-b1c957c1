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
      className={`absolute -top-1.5 right-3 h-1.5 w-1.5 rounded-full ring-2 ring-background ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="pointer-events-auto relative w-full max-w-sm rounded-full bg-card/85 backdrop-blur-xl ring-1 ring-border/40 shadow-[0_10px_30px_-10px_hsl(var(--foreground)/0.22)]">
        <SyncIndicator />
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
            const showBadge = path === '/flashcards' && dueCount > 0;
            return (
              <Link
                key={path}
                to={path}
                aria-label={label}
                className={`relative flex min-w-[56px] flex-col items-center gap-0.5 px-3 py-1 tap-scale-sm smooth-colors ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.7} />
                  </motion.div>
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white animate-scale-pop">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </div>
                <div className="h-[14px] flex items-center">
                  {active ? (
                    <motion.span
                      key={label}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="font-serif text-[11px] font-semibold tracking-tight leading-none"
                    >
                      {label}
                    </motion.span>
                  ) : null}
                </div>
                <span className="relative h-1 w-1">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-bullet"
                      className="absolute inset-0 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
