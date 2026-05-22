import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="library-header-bg relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden">
      <span className="library-kanji-watermark" aria-hidden="true">鍵</span>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 text-center">
          <h1 className="wordmark font-serif text-[32px] leading-none text-foreground">Set new password</h1>
          <p className="mt-3 text-[12px] tracking-[0.08em] text-muted-foreground">
            <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2" />
            Choose something memorable
            <span className="inline-block h-px w-6 bg-foreground/30 align-middle ml-2" />
          </p>
        </div>

        <div className="rounded-3xl bg-card/95 backdrop-blur-md ring-1 ring-border/40 shadow-lg p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw" className="text-xs uppercase tracking-wider text-muted-foreground">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pw2"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
                />
              </div>
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl text-[15px] font-semibold tap-scale-sm" disabled={submitting || !ready}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
