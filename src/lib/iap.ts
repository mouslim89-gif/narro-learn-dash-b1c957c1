// Thin bridge to native in-app purchases.
// Purchases only happen inside the native shell (App Store / Google Play).
// In a browser this resolves with `unavailable`, and the paywall says so.
// When the native wrapper is added, it only has to expose window.Tsundoku.iap.

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

export const PRODUCT_IDS: Record<PlanId, string> = {
  monthly: 'tsundoku.premium.monthly',
  yearly: 'tsundoku.premium.yearly',
  lifetime: 'tsundoku.premium.lifetime',
};

export interface NativePurchase {
  platform: 'ios' | 'android';
  productId: string;
  receipt?: string;
  purchaseToken?: string;
}

interface NativeIap {
  purchase(productId: string): Promise<NativePurchase>;
  restore(): Promise<NativePurchase[]>;
  manageSubscriptions?(): Promise<void>;
}

declare global {
  interface Window {
    Tsundoku?: { iap?: NativeIap };
  }
}

export function getNativeIap(): NativeIap | null {
  if (typeof window === 'undefined') return null;
  return window.Tsundoku?.iap ?? null;
}

export function isIapAvailable(): boolean {
  return getNativeIap() !== null;
}

export type PurchaseOutcome =
  | { kind: 'purchased'; purchases: NativePurchase[] }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' }
  | { kind: 'error'; message: string };

export async function purchasePlan(plan: PlanId): Promise<PurchaseOutcome> {
  const iap = getNativeIap();
  if (!iap) return { kind: 'unavailable' };
  try {
    const purchase = await iap.purchase(PRODUCT_IDS[plan]);
    if (!purchase) return { kind: 'cancelled' };
    return { kind: 'purchased', purchases: [purchase] };
  } catch (err: any) {
    if (err?.code === 'cancelled' || /cancel/i.test(err?.message ?? '')) return { kind: 'cancelled' };
    return { kind: 'error', message: err?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  const iap = getNativeIap();
  if (!iap) return { kind: 'unavailable' };
  try {
    const purchases = await iap.restore();
    return { kind: 'purchased', purchases: purchases ?? [] };
  } catch (err: any) {
    return { kind: 'error', message: err?.message ?? 'Restore failed' };
  }
}

/** Opens the platform subscription management screen. */
export async function openManageSubscriptions() {
  const iap = getNativeIap();
  if (iap?.manageSubscriptions) {
    await iap.manageSubscriptions();
    return;
  }
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  window.open(
    isIos
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions',
    '_blank',
  );
}
