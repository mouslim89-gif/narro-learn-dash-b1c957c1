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
      className={`absolute right-4 top-2 h-1.5 w-1.5 rounded-full ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none">
      <div className="pointer-events-auto relative mx-auto flex max-w-md items-center justify-around rounded-full bg-card/80 backdrop-blur-xl p-1.5 ring-1 ring-border/40 shadow-[0_10px_30px_-12px_hsl(var(--foreground)/0.22)]">
        <SyncIndicator />
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const showBadge = path === '/flashcards' && dueCount > 0;
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              className={`relative flex flex-1 items-center justify-center rounded-full py-2 text-[11px] font-semibold tap-scale-sm smooth-colors ${
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-md"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span className="relative">
                  <motion.span
                    className="block"
                    animate={{ scale: active ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.9} />
                  </motion.span>
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white ring-2 ring-card animate-scale-pop">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </span>
                {active && <span className="pr-1">{label}</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
