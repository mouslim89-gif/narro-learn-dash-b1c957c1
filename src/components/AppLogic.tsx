import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReadingProgressStore } from '@/stores/reading-progress';
import { toast } from 'sonner';

export default function AppLogic() {
  const { user } = useAuth();
  const { darkMode } = useReadingProgressStore();

  // Dark mode sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // A11y: Add lang="en" to root
  useEffect(() => {
    document.documentElement.setAttribute('lang', 'en');
  }, []);

  return null;
}
