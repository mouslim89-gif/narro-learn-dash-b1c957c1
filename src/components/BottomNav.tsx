import { Link, useLocation } from 'react-router-dom';
import { Library, BookOpen, Layers, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlashcardStore } from '@/stores/flashcards';
import { useSyncStatus } from '@/lib/sync/sync-status';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', label: 'Library', icon: Library },
  { path: '/my-books', label: 'My Books', icon: BookOpen },
  { path: '/flashcards', label: 'Cards', icon: Layers },
  { path: '/dictionary', label: 'Dictionary', icon: Search },
];

function SyncIndicator() {
  const status = useSyncStatus(s => s.status);
  if (status === 'idle') return null;
  const syncing = status === 'syncing';
  return (
    <div
      className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2"
      style={{ bottom: 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 4.25rem)' }}
    >
      <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-md">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            syncing ? 'bg-primary animate-soft-pulse' : 'bg-destructive'
          )}
        />
        {syncing ? 'Syncing' : 'Sync error'}
      </div>
    </div>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <>
      <SyncIndicator />
      <nav
        className="fixed left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around rounded-full bg-background/85 px-2 py-2 ring-1 ring-border/40 backdrop-blur-xl shadow-[0_8px_28px_-12px_hsl(var(--foreground)/0.25)]">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
            const showBadge = path === '/flashcards' && dueCount > 0;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'relative flex flex-1 items-center justify-center tap-scale-sm smooth-colors',
                  active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 px-3 py-1.5">
                  <span className="relative">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                    {showBadge && (
                      <span
                        className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white animate-scale-pop"
                        style={{ backgroundColor: 'hsl(36 80% 55%)' }}
                      >
                        {dueCount > 9 ? '9+' : dueCount}
                      </span>
                    )}
                  </span>
                  {active && (
                    <span className="font-serif text-[13px] leading-none">{label}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
