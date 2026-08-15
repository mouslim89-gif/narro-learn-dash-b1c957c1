import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionStore } from '@/stores/subscription';
import { usePremium } from '@/hooks/use-premium';
import { isIapAvailable, purchasePlan, restorePurchases, type PlanId } from '@/lib/iap';
import type { PremiumFeature } from '@/lib/entitlements';

interface PlanOption {
  id: PlanId;
  title: string;
  price: string;
  note: string;
  badge?: string;
}

const PLANS: PlanOption[] = [
  { id: 'monthly', title: 'Monthly', price: '$4.99', note: 'Billed every month' },
  { id: 'yearly', title: 'Yearly', price: '$44.99', note: 'Billed every 12 months', badge: 'Best value' },
  { id: 'lifetime', title: 'Lifetime', price: '$99.99', note: 'One payment, forever' },
];

const BENEFITS = [
  'Every chapter of every book',
  'Review mode with spaced repetition',
  'Grammar notes while you read',
  'Sentence translations',
  'Book audio with sentence sync',
];

const FEATURE_PITCH: Partial<Record<PremiumFeature, string>> = {
  chapters: 'Keep reading this book',
  review: 'Unlock review mode',
  'grammar-notes': 'Unlock grammar notes',
  translations: 'Unlock translations',
  audio: 'Unlock book audio',
};

export default function Premium() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const refresh = useSubscriptionStore((s) => s.refresh);
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  const feature = (location.state as { feature?: PremiumFeature } | null)?.feature;
  const heading = useMemo(
    () => (feature && FEATURE_PITCH[feature]) || 'Read without limits',
    [feature],
  );

  const available = isIapAvailable();

  const syncPurchases = async (purchases: Awaited<ReturnType<typeof purchasePlan>>) => {
    if (purchases.kind !== 'purchased') return false;
    let granted = false;
    for (const p of purchases.purchases) {
      const { data, error } = await supabase.functions.invoke('verify-purchase', {
        body: {
          platform: p.platform,
          productId: p.productId,
          receipt: p.receipt,
          purchaseToken: p.purchaseToken,
        },
      });
      if (error) continue;
      if (data?.status === 'active' || data?.status === 'grace') granted = true;
    }
    if (user?.id) await refresh(user.id, true);
    return granted;
  };

  const handleBuy = async () => {
    setBusy('buy');
    try {
      const outcome = await purchasePlan(selected);
      if (outcome.kind === 'unavailable') {
        toast.error('Purchases are available in the Tsundoku mobile app.');
        return;
      }
      if (outcome.kind === 'cancelled') return;
      if (outcome.kind === 'error') {
        toast.error(outcome.message);
        return;
      }
      const granted = await syncPurchases(outcome);
      if (granted) {
        toast.success('Welcome to Tsundoku Premium');
        navigate(-1);
      } else {
        toast.error('We could not confirm your purchase. Try Restore purchases.');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setBusy('restore');
    try {
      const outcome = await restorePurchases();
      if (outcome.kind === 'unavailable') {
        toast.error('Purchases are available in the Tsundoku mobile app.');
        return;
      }
      if (outcome.kind === 'error') {
        toast.error(outcome.message);
        return;
      }
      const granted = await syncPurchases(outcome);
      toast[granted ? 'success' : 'error'](
        granted ? 'Your subscription is active again' : 'No purchase found for this account',
      );
      if (granted) navigate(-1);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen pb-14">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 shrink-0 header-chip"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
      </header>

      <div className="px-6 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tsundoku Premium
        </p>
        <h1 className="mt-2 font-serif text-[30px] font-bold leading-tight">{heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chapter one of every book is free. Premium opens the rest of the library and every study tool.
        </p>

        <ul className="mt-6 space-y-2.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[15px]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/25">
                <Check className="h-3 w-3 text-accent" />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {isPremium ? (
          <div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-border/30 shadow-sm text-center">
            <p className="font-serif text-lg font-semibold">You already have Premium</p>
            <p className="mt-1 text-sm text-muted-foreground">Everything is unlocked on this account.</p>
          </div>
        ) : (
          <>
            <div className="mt-7 space-y-3">
              {PLANS.map((plan) => {
                const active = selected === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelected(plan.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-2xl bg-card px-4 py-4 text-left ring-1 smooth-colors tap-scale',
                      active
                        ? 'ring-2 ring-accent/60 shadow-md'
                        : 'ring-border/30 shadow-sm',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-[17px] font-semibold">{plan.title}</span>
                          {plan.badge && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{plan.note}</p>
                      </div>
                      <span className="font-serif text-[17px] font-bold tabular-nums">{plan.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              size="lg"
              onClick={handleBuy}
              disabled={busy !== null}
              className="btn-tsundoku-premium mt-6 h-12 w-full rounded-full text-[15px] font-semibold shadow-md"
            >
              {busy === 'buy' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
            </Button>

            {!available && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Purchases are handled by the App Store and Google Play, so they are available in the
                Tsundoku mobile app.
              </p>
            )}

            <button
              onClick={handleRestore}
              disabled={busy !== null}
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground tap-scale-sm"
            >
              {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
            </button>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
              Monthly and yearly plans renew automatically unless cancelled at least 24 hours before the
              end of the period. Manage or cancel in your App Store or Google Play account settings.
            </p>
          </>
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <Link to="/terms" className="underline underline-offset-2">Terms</Link>
          <Link to="/privacy" className="underline underline-offset-2">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
