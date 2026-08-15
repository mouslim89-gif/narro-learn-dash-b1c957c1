import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { PlanId } from '@/lib/iap';

export type SubscriptionStatus = 'none' | 'active' | 'grace' | 'expired';

interface SubscriptionState {
  status: SubscriptionStatus;
  plan: PlanId | null;
  platform: 'ios' | 'android' | 'admin' | null;
  expiresAt: string | null;
  loading: boolean;
  hydratedFor: string | null;
  refresh: (userId: string, force?: boolean) => Promise<void>;
  reset: () => void;
}

const empty = {
  status: 'none' as SubscriptionStatus,
  plan: null,
  platform: null,
  expiresAt: null,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...empty,
      loading: false,
      hydratedFor: null,

      refresh: async (userId: string, force = false) => {
        if (!userId) return;
        if (!force && get().hydratedFor === userId && !get().loading) {
          // Still refresh in the background, but don't block the UI.
        }
        set({ loading: get().hydratedFor !== userId });
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, plan, platform, expires_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          set({ loading: false });
          return;
        }
        set({
          status: (data?.status as SubscriptionStatus) ?? 'none',
          plan: (data?.plan as PlanId) ?? null,
          platform: (data?.platform as SubscriptionState['platform']) ?? null,
          expiresAt: data?.expires_at ?? null,
          loading: false,
          hydratedFor: userId,
        });
      },

      reset: () => set({ ...empty, loading: false, hydratedFor: null }),
    }),
    {
      name: 'tsundoku-subscription',
      partialize: (s) => ({
        status: s.status,
        plan: s.plan,
        platform: s.platform,
        expiresAt: s.expiresAt,
        hydratedFor: s.hydratedFor,
      }),
    },
  ),
);

export function isEntitled(s: Pick<SubscriptionState, 'status' | 'expiresAt'>): boolean {
  if (s.status !== 'active' && s.status !== 'grace') return false;
  if (!s.expiresAt) return true;
  return new Date(s.expiresAt).getTime() > Date.now();
}
