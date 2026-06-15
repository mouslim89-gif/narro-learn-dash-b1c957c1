import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReadingProgressStore, type FontSize } from '@/stores/reading-progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { cn } from '@/lib/utils';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3 px-1">
      <h2 className="font-serif text-[13px] tracking-[0.14em] uppercase text-muted-foreground">
        {children}
      </h2>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

export default function Settings() {
  const { darkMode, setDarkMode, fontSize, setFontSize, showFurigana, setShowFurigana } =
    useReadingProgressStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useScrollProgress(headerRef, 0, 56);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await signOut();
      toast.success('Account deleted');
      navigate('/auth', { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete account');
      setDeleting(false);
    }
  };

  const initial = (user?.email ?? '?').slice(0, 1).toUpperCase();

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
        <span className="library-kanji-watermark !top-[60%]" aria-hidden="true">設</span>
        <div className="flex items-center gap-3 min-w-0 relative z-10">
          <button
            onClick={() => window.history.back()}
            aria-label="Back"
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip flex items-center justify-center smooth-colors tap-scale-sm"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
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

      <div className="stagger-children px-5 pt-5 space-y-7">
        {/* Account */}
        <section>
          <SectionLabel>Account</SectionLabel>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="h-11 w-11 rounded-full bg-accent/15 text-accent flex items-center justify-center font-serif text-lg font-bold ring-1 ring-accent/20">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Signed in as</div>
                <div className="text-sm font-medium truncate">{user?.email ?? '—'}</div>
              </div>
            </div>
            <div className="border-t border-border/40">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium smooth-colors tap-scale-sm"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Sign out
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <SectionLabel>Appearance</SectionLabel>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
            <div className="flex items-center justify-between px-4 py-4">
              <Label htmlFor="dark-mode" className="text-[15px] font-medium">Dark mode</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <Label className="text-[15px] font-medium">Font size</Label>
              <div className="flex gap-1 rounded-full bg-muted p-1">
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={cn('h-7 w-9 rounded-full text-sm font-semibold smooth-colors tap-scale-sm',
                      fontSize === opt.value
                        ? 'relief-raised bg-card text-foreground ring-1 ring-border/40' : 'text-muted-foreground')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <Label htmlFor="furigana" className="text-[15px] font-medium">Show furigana</Label>
              <Switch id="furigana" checked={showFurigana} onCheckedChange={setShowFurigana} />
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <SectionLabel>About</SectionLabel>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-serif text-base">Tsundoku</div>
                <div className="text-xs text-muted-foreground mt-0.5">Learn Japanese through reading</div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">v1.0</div>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full text-center text-sm font-medium text-destructive/80 py-2 smooth-colors">
                Delete account
              </button>
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
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </div>
  );
}