import { useState } from'react';
import { Navigate, useLocation, useNavigate } from'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from'lucide-react';
import { Button } from'@/components/ui/button';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { useAuth } from'@/contexts/AuthContext';
import { supabase } from'@/integrations/supabase/client';
import { lovable } from'@/integrations/lovable';
import { toast } from'sonner';

type Mode ='signin'|'signup'|'forgot';

export default function Auth() {
 const { user, loading: authLoading } = useAuth();
 const location = useLocation();
 const navigate = useNavigate();
 const [mode, setMode] = useState<Mode>('signin');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const from = (location.state as { from?: string } | null)?.from ??'/';

 if (!authLoading && user) {
 return <Navigate to={from} replace />;
 }

 const handleOAuth = async (provider:'google'|'apple') => {
 setSubmitting(true);
 try {
 const result = await lovable.auth.signInWithOAuth(provider, {
 redirect_uri: window.location.origin,
 });
 if (result.error) {
 toast.error(`${provider ==='google'?'Google':'Apple'} sign-in failed`);
 setSubmitting(false);
 }
 } catch (e) {
 toast.error('Sign-in failed');
 setSubmitting(false);
 }
 };

 const handleEmail = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);
 try {
 if (mode ==='signup') {
 const { error } = await supabase.auth.signUp({
 email,
 password,
 options: { emailRedirectTo: window.location.origin },
 });
 if (error) throw error;
 toast.success('Account created! Check your email to verify.');
 } else if (mode ==='signin') {
 const { error } = await supabase.auth.signInWithPassword({ email, password });
 if (error) throw error;
 } else {
 const { error } = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo:`${window.location.origin}/reset-password`,
 });
 if (error) throw error;
 toast.success('Check your email for a reset link');
 setMode('signin');
 }
 } catch (err: any) {
 toast.error(err?.message ??'Something went wrong');
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="library-header-bg relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden">
 <span className="library-kanji-watermark"aria-hidden="true">読</span>

 <div className="relative z-10 w-full max-w-sm animate-fade-in-soft">
 <div className="mb-6 text-center">
 <h1 className="wordmark font-serif text-[44px] leading-none text-foreground">Tsundoku</h1>
 <p className="mt-3 text-[12px] tracking-[0.08em] text-muted-foreground">
 <span className="inline-block h-px w-6 bg-foreground/30 align-middle mr-2"/>
 {mode ==='signup'?'Create your account': mode ==='forgot'?'Reset your password':'Welcome back'}
 <span className="inline-block h-px w-6 bg-foreground/30 align-middle ml-2"/>
 </p>
 </div>

 <div className="rounded-3xl bg-card/95 backdrop-blur-md ring-1 ring-border/40 shadow-lg p-7">
 {mode !=='forgot'&& (
 <>
 <div className="space-y-2.5">
 <Button
 type="button"
 variant="outline"
 className="h-12 w-full justify-center gap-3 font-medium rounded-xl tap-scale-sm"
 onClick={() => handleOAuth('google')}
 disabled={submitting}
 >
 <GoogleIcon />
 Continue with Google
 </Button>
 <Button
 type="button"
 variant="outline"
 className="h-12 w-full justify-center gap-3 font-medium rounded-xl tap-scale-sm"
 onClick={() => handleOAuth('apple')}
 disabled={submitting}
 >
 <AppleIcon />
 Continue with Apple
 </Button>
 </div>

 <div className="my-5 flex items-center gap-3">
 <div className="h-px flex-1 bg-border"/>
 <span className="font-serif text-xs text-muted-foreground">・</span>
 <div className="h-px flex-1 bg-border"/>
 </div>
 </>
 )}

 <form onSubmit={handleEmail} className="space-y-4">
 <div className="space-y-1.5">
 <Label htmlFor="email"className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
 <div className="relative">
 <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
 <Input
 id="email"
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
 placeholder="you@example.com"
 />
 </div>
 </div>

 {mode !=='forgot'&& (
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <Label htmlFor="password"className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
 {mode ==='signin'&& (
 <button
 type="button"
 onClick={() => setMode('forgot')}
 className="text-xs text-accent"
 >
 Forgot?
 </button>
 )}
 </div>
 <div className="relative">
 <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
 <Input
 id="password"
 type="password"
 required
 minLength={6}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-background"
 placeholder="••••••••"
 />
 </div>
 </div>
 )}

 <Button type="submit"className="h-12 w-full gap-2 rounded-xl text-[15px] font-semibold tap-scale-sm"disabled={submitting}>
 {submitting ? (
 <Loader2 className="h-4 w-4 animate-spin"/>
 ) : (
 <>
 {mode ==='signup'?'Create account': mode ==='forgot'?'Send reset link':'Sign in'}
 <ArrowRight className="h-4 w-4"/>
 </>
 )}
 </Button>
 </form>
 </div>

 <div className="mt-6 text-center text-sm text-muted-foreground">
 {mode ==='signin'&& (
 <>
 No account?{''}
 <button onClick={() => setMode('signup')} className="font-medium text-accent">
 Sign up
 </button>
 </>
 )}
 {mode ==='signup'&& (
 <>
 Already have one?{''}
 <button onClick={() => setMode('signin')} className="font-medium text-accent">
 Sign in
 </button>
 </>
 )}
 {mode ==='forgot'&& (
 <button onClick={() => setMode('signin')} className="font-medium text-accent">
 Back to sign in
 </button>
 )}
 </div>
 </div>
 </div>
 );
}

function GoogleIcon() {
 return (
 <svg width="18"height="18"viewBox="0 0 24 24">
 <path fill="#4285F4"d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
 <path fill="#34A853"d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="#FBBC05"d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
 <path fill="#EA4335"d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 );
}

function AppleIcon() {
 return (
 <svg width="18"height="18"viewBox="0 0 24 24"fill="currentColor">
 <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
 </svg>
 );
}
