import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReadingProgressStore, type FontSize } from '@/stores/reading-progress';
import { useOnboardingStore } from '@/stores/onboarding';
import { Button } from '@/components/ui/button';
import { useFlashcardStore } from '@/stores/flashcards';
import { HelpCircle, RefreshCw, Wrench, ChevronRight } from 'lucide-react';
import { useIsAdmin } from '@/lib/admin';

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
  const { alwaysReplayOnboarding, setAlwaysReplayOnboarding, disableAnimation, setDisableAnimation } = useOnboardingStore();
  const isAdmin = useIsAdmin();
  const { user, signOut } = useAuth();
  const { dailyGoal, setDailyGoal, dailyNewGoal, setDailyNewGoal } = useFlashcardStore();
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
        <div className="flex items-center gap-3 min-w-0">
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
                    className={cn(
                      'relative h-7 w-9 rounded-full text-sm font-semibold smooth-colors',
                      fontSize === opt.value ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {fontSize === opt.value && (
                      <motion.div
                        layoutId="seg-fontsize-settings"
                        className="absolute inset-0 rounded-full bg-card seg-pill ring-1 ring-border/40"
                        transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <Label htmlFor="furigana" className="text-[15px] font-medium">Show furigana</Label>
              <Switch id="furigana" checked={showFurigana} onCheckedChange={setShowFurigana} />
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex flex-col">
                <Label className="text-[15px] font-medium">Reviews / day</Label>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Main daily goal</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setDailyGoal(Math.max(5, dailyGoal - 5))}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-lg font-bold tap-scale-sm"
                >
                  -
                </button>
                <span className="w-8 text-center font-serif font-bold">{dailyGoal}</span>
                <button 
                  onClick={() => setDailyGoal(dailyGoal + 5)}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-lg font-bold tap-scale-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex flex-col">
                <Label className="text-[15px] font-medium">New cards / day</Label>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Daily intake goal</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setDailyNewGoal(Math.max(1, dailyNewGoal - 1))}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-lg font-bold tap-scale-sm"
                >
                  -
                </button>
                <span className="w-8 text-center font-serif font-bold">{dailyNewGoal}</span>
                <button 
                  onClick={() => setDailyNewGoal(dailyNewGoal + 1)}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-lg font-bold tap-scale-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Help */}
        <section>
          <SectionLabel>Help & Onboarding</SectionLabel>
          <div className="rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
            <button 
              onClick={() => {
                useOnboardingStore.getState().resetOnboarding();
                toast.success('Onboarding has been reset. It will appear on your next navigation.');
              }}
              className="w-full px-4 py-4 flex items-center justify-between text-sm font-medium smooth-colors tap-scale-sm"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span>Restart Onboarding</span>
              </div>
            </button>

            {isAdmin && user?.email === 'mouslim89@gmail.com' && (
              <>
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Always replay onboarding</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Admin only</span>
                    </div>
                  </div>
                  <Switch 
                    checked={alwaysReplayOnboarding} 
                    onCheckedChange={setAlwaysReplayOnboarding} 
                  />
                </div>

                <div className="flex items-center justify-between px-4 py-4 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Disable animations</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Admin only</span>
                    </div>
                  </div>
                  <Switch 
                    checked={disableAnimation} 
                    onCheckedChange={setDisableAnimation} 
                  />
                </div>

                <button 

                  onClick={async () => {
                    const t = toast.loading('Backfilling tokens (batch 50)...');
                    try {
                      const { data, error } = await supabase.functions.invoke('backfill-example-tokens', {
                        body: { batchSize: 50 }
                      });
                      if (error) throw error;
                      toast.success(`Processed ${data.processed} rows. ${data.message}`, { id: t });
                    } catch (err: any) {
                      toast.error(err.message || 'Backfill failed', { id: t });
                    }
                  }}
                  className="w-full px-4 py-4 flex items-center justify-between text-sm font-medium smooth-colors tap-scale-sm border-t border-border/40"
                >
                  <div className="flex items-center gap-3 text-accent">
                    <RefreshCw className="h-4 w-4" />
                    <div className="flex flex-col items-start text-left">
                      <span>Backfill Example Tokens</span>
                      <span className="text-[10px] uppercase tracking-tight opacity-80">Admin only (Warm up DB cache)</span>
                    </div>
                  </div>
                </button>
              </>
            )}
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

          <div className="mt-3 rounded-2xl bg-card ring-1 ring-border/30 shadow-sm divide-y divide-border/40">
            <Link to="/terms" className="flex items-center justify-between px-4 py-4 tap-scale">
              <span className="text-[15px]">Terms of Service</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/privacy" className="flex items-center justify-between px-4 py-4 tap-scale">
              <span className="text-[15px]">Privacy Policy</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
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