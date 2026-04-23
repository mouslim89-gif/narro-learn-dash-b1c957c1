import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReadingProgressStore, type FontSize } from '@/stores/reading-progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fontSizeOptions: { label: string; value: FontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

export default function Settings() {
  const { darkMode, setDarkMode, fontSize, setFontSize, showFurigana, setShowFurigana } =
    useReadingProgressStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete profile row → cascade removes flashcards & reading_progress
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      await signOut();
      toast.success('Account deleted');
      navigate('/auth', { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => window.history.back()} aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Section: Account */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Account
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border bg-card px-4 py-3">
              <div className="text-xs text-muted-foreground">Signed in as</div>
              <div className="text-sm font-medium truncate">{user?.email ?? '—'}</div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes your account, flashcards, and reading progress. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Section: Appearance */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Appearance
          </h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-base font-medium">Dark mode</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Default font size</Label>
              <div className="flex gap-1">
                {fontSizeOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={fontSize === opt.value ? 'default' : 'outline'}
                    size="sm"
                    className="w-10 h-8 text-sm font-semibold"
                    onClick={() => setFontSize(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="furigana" className="text-base font-medium">Show furigana</Label>
              <Switch id="furigana" checked={showFurigana} onCheckedChange={setShowFurigana} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
