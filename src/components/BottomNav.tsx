import { Link, useLocation } from'react-router-dom';
import { Home as HomeIcon, Library, BookOpen, Layers, Search } from'lucide-react';
import { motion } from'framer-motion';
import { useFlashcardStore } from'@/stores/flashcards';
import { useSyncStatus } from'@/lib/sync/sync-status';

const tabs = [
  { path:'/', label:'Home', icon: HomeIcon },
  { path:'/library', label:'Library', icon: Library },
  { path:'/my-books', label:'Books', icon: BookOpen },
  { path:'/flashcards', label:'Cards', icon: Layers },
  { path:'/dictionary', label:'Search', icon: Search },
];

function SyncIndicator() {
 const status = useSyncStatus(s => s.status);
 if (status ==='idle') return null;
 const color =
 status ==='syncing'?'bg-primary animate-soft-pulse':'bg-destructive';
 return (
 <span
 aria-label={status ==='syncing'?'Syncing':'Sync error'}
 className={`absolute right-3 top-1.5 h-1.5 w-1.5 rounded-full ${color}`}
 />
 );
}

export function BottomNav() {
 const { pathname } = useLocation();
 const dueCount = useFlashcardStore(s => s.getDueCount());

 return (
 <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
 <SyncIndicator />
 <div className="mx-auto max-w-lg px-3 pb-2 pt-1">
 <div className="nav-dock relative flex items-center justify-between rounded-full border border-border/40 bg-card/90 px-1.5 py-1.5 backdrop-blur-xl">
 {tabs.map(({ path, label, icon: Icon }) => {
 const active = path ==='/'? pathname ==='/': pathname.startsWith(path);
 const showBadge = path ==='/flashcards'&& dueCount > 0;
 return (
 <Link
 key={path}
 to={path}
 className={`bottom-nav-link relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[11px] font-medium smooth-colors ${
 active ?'text-primary':'text-muted-foreground'}`}
 >
 {active && (
 <motion.span
 layoutId="bottom-nav-pill"
 className="nav-pill-active relief-raised pointer-events-none absolute inset-0 rounded-full"
 transition={{ type:'spring', stiffness: 380, damping: 32 }}
 />
 )}
 <div className="relative z-10">
 <Icon className="h-5 w-5"strokeWidth={active ? 2.2 : 1.8} />
            {showBadge && (
              <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground animate-scale-pop shadow-[0_0_8px_hsl(var(--destructive)/0.4)]">
                {dueCount > 9 ? '9+' : dueCount}
              </span>
            )}

 </div>
 <span className="relative z-10 leading-none">{label}</span>
 </Link>
 );
 })}
 </div>
 </div>
 </nav>
 );
}
