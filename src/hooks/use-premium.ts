import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/lib/admin';
import { supabase } from '@/integrations/supabase/client';
import { isEntitled, useSubscriptionStore } from '@/stores/subscription';
import type { PremiumFeature } from '@/lib/entitlements';


/** Mounted once in App: hydrates the entitlement and keeps it fresh. */
export function useSubscriptionSync() {
  const { user } = useAuth();
  const refresh = useSubscriptionStore((s) => s.refresh);
  const reset = useSubscriptionStore((s) => s.reset);

  useEffect(() => {
    if (!user?.id) {
      reset();
      return;
    }
    refresh(user.id, true);

    const channel = supabaseChannel(user.id, () => refresh(user.id, true));
    const onFocus = () => refresh(user.id, true);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      channel?.unsubscribe();
    };
  }, [user?.id, refresh, reset]);
}

// Kept separate so the effect above stays readable.
function supabaseChannel(userId: string, onChange: () => void) {
  return supabase
    .channel(`subscription-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
      onChange,
    )
    .subscribe();
}


export function usePremium() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const status = useSubscriptionStore((s) => s.status);
  const plan = useSubscriptionStore((s) => s.plan);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const platform = useSubscriptionStore((s) => s.platform);
  const loading = useSubscriptionStore((s) => s.loading);

  const isPremium = isAdmin || isEntitled({ status, expiresAt });

  const requirePremium = useCallback(
    (feature: PremiumFeature) => {
      if (isPremium) return true;
      navigate('/premium', { state: { feature } });
      return false;
    },
    [isPremium, navigate],
  );

  return { isPremium, isAdmin, status, plan, platform, expiresAt, loading, requirePremium };
}
