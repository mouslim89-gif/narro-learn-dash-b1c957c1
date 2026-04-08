import { Link, useLocation } from 'react-router-dom';
import { Library, BookOpen, Layers, Search } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Library', icon: Library },
  { path: '/my-books', label: 'My Books', icon: BookOpen },
  { path: '/flashcards', label: 'Cards', icon: Layers },
  { path: '/dictionary', label: 'Dictionary', icon: Search },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
