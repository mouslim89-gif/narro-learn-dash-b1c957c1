import { useNavigate } from 'react-router-dom';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import { LogOut, Loader2, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReadingProgressStore, type FontSize } from '@/stores/reading-progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { cn } from '@/lib/utils';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { motion } from 'framer-motion';
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

export default function Settings() {
  const { darkMode, setDarkMode, fontSize, setFontSize, showFurigana, setShowFurigana } =
    useReadingProgressStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const goTo = useDelayedNav();
  const [deleting, setDeleting] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useScrollProgress(headerRef, 0, 56);

  const handleSignOut = async () => {
    await signOut();
    goTo('/auth', undefined, { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await signOut();
      toast.success('Account deleted');
      goTo('/auth', undefined, { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="pb-24">
      <header
        ref={headerRef}
        className="sticky top-0 z-30 px-6 flex items-center justify-between"
        style={{
          paddingTop: 'calc(40px - var(--p, 0) * 28px)',
          paddingBottom: 'calc(8px + var(--p, 0) * 4px)',
          backgroundColor: 'hsl(var(--background) / calc(var(--p, 0) * 0.85))',
          backdropFilter: 'blur(calc(var(--p, 0) * 16px))',
          WebkitBackdropFilter: 'blur(calc(var(--p, 0) * 16px))',
          borderBottom: '1px solid hsla(var(--border) / calc(var(--p, 0) * 0.5))',
          borderBottomColor: 'hsla(var(--border) / calc(var(--p, 0) * 0.5))',
          borderBottomWidth: 'calc(min(var(--p, 0), 1) * 1px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <AnimatedTitle
            text="Settings"
            className="font-serif font-bold leading-none tracking-tight"
            style={{ 
              '--title-scale': 'calc(1 - var(--p, 0) * 0.25)', 
              fontSize: '32px'
            } as any}
          />
        </div>
      </header>

      <div className="stagger-children mt-6 space-y-8 px-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Appearance</h2>
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="space-y-0.5">
                <p className="text-[15px] font-medium">Dark Mode</p>
                <p className="text-[12px] text-muted-foreground">Warm paper or dark navy</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="space-y-0.5">
                <p className="text-[15px] font-medium">Furigana</p>
                <p className="text-[12px] text-muted-foreground">Show readings above kanji</p>
              </div>
              <Switch checked={showFurigana} onCheckedChange={setShowFurigana} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Typography</h2>
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm p-4">
            <p className="text-[15px] font-medium mb-3">Font Size</p>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as FontSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={cn(
                    "flex-1 rounded-xl py-3 text-sm font-semibold capitalize smooth-colors tap-scale-sm",
                    fontSize === s ? "bg-primary text-primary-foreground relief-raised" : "bg-muted/40 text-muted-foreground ring-1 ring-border/40"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive">Danger Zone</h2>
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40 overflow-hidden">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-between px-4 py-4 text-left active:bg-muted/30 smooth-colors"
            >
              <div className="space-y-0.5">
                <p className="text-[15px] font-medium">Sign Out</p>
                <p className="text-[12px] text-muted-foreground">Logout of your account</p>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex w-full items-center justify-between px-4 py-4 text-left active:bg-muted/30 smooth-colors">
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-medium text-destructive">Delete Account</p>
                    <p className="text-[12px] text-muted-foreground">Permanently remove all data</p>
                  </div>
                  <Trash2 className="h-4 w-4 text-destructive/70" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}
