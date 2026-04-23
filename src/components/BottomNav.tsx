import { Link, useLocation } from 'react-router-dom';
import { Library, BookOpen, Layers, Search } from 'lucide-react';
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
    status === 'syncing' ? 'bg-primary animate-pulse' : 'bg-destructive';
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background/95 to-transparent" />
      <div className="relative border-t border-border/60 bg-card/85 backdrop-blur-xl">
        <SyncIndicator />
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
            const showBadge = path === '/flashcards' && dueCount > 0;
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition-all ${active ? 'bg-primary/10' : ''}`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground shadow-sm">
                      {dueCount > 9 ? '9+' : dueCount}
                    </span>
                  )}
                </div>
                <span className="tracking-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
