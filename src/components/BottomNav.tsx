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
      className={`absolute -top-1 right-3 h-1.5 w-1.5 rounded-full ${color}`}
    />
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 px-4 pointer-events-none">
      <div className="relative mx-auto max-w-sm pointer-events-auto">
        <SyncIndicator />
        <div className="flex items-center justify-between gap-1 rounded-full bg-card border border-border shadow-[0_8px_24px_-8px_hsl(var(--foreground)/0.18)] px-2 py-2">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
            const showBadge = path === '/flashcards' && dueCount > 0;
            return (
              <Link
                key={path}
                to={path}
                aria-label={label}
                className="relative flex-1"
              >
                <div
                  className={`relative flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold tap-scale-sm smooth-colors ${
                    active
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <span className="relative">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
                      {showBadge && (
                        <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white animate-scale-pop">
                          {dueCount > 9 ? '9+' : dueCount}
                        </span>
                      )}
                    </span>
                    {active && <span className="whitespace-nowrap">{label}</span>}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
