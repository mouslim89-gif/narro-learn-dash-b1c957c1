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
    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-border/40 shadow-sm backdrop-blur">
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          syncing ? 'bg-primary animate-soft-pulse' : 'bg-destructive'
        )}
      />
      <span>{syncing ? 'Syncing' : 'Sync error'}</span>
    </div>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const dueCount = useFlashcardStore(s => s.getDueCount());

  return (
    <nav
      className="fixed left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <SyncIndicator />
      <div
        className="relative flex items-center justify-around gap-1 rounded-full bg-background/85 px-2 py-1.5 ring-1 ring-border/40 backdrop-blur-xl"
        style={{ boxShadow: '0 10px 30px -10px hsl(var(--foreground) / 0.25)' }}
      >
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const showBadge = path === '/flashcards' && dueCount > 0;
          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 tap-scale-sm smooth-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
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
                  <span className="font-serif text-[12px] leading-none">{label}</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
