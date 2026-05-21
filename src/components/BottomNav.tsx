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
      className={`absolute right-3 top-1.5 h-1.5 w-1.5 rounded-full ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <SyncIndicator />
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const showBadge = path === '/flashcards' && dueCount > 0;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium tap-scale-sm smooth-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: active ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                </motion.div>
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white animate-scale-pop">
                    {dueCount > 9 ? '9+' : dueCount}
                  </span>
                )}
              </div>
              {label}
              <span className="relative mt-0.5 h-1 w-1">
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
