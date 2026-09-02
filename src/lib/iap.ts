/**
 * Native in-app purchase bridge.
 *
 * Uses capacitor-plugin-cdv-purchase for Apple App Store / Google Play.
 * The browser build has no store, so purchases return "unavailable".
 *
 * Server-side verification goes through the "verify-purchase" Supabase
 * edge function; the client never writes entitlements directly.
 */
import { Capacitor } from '@capacitor/core';
import { store, ProductType, Platform } from 'capacitor-plugin-cdv-purchase';
import type { CdvPurchase } from 'capacitor-plugin-cdv-purchase';

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

export type PurchaseOutcome =
  | { kind: 'purchased'; purchases: NativePurchase[] }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' }
  | { kind: 'error'; message: string };

let storeReady = false;
let initStarted = false;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function platformName(): 'ios' | 'android' | null {
  if (!isNative()) return null;
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return null;
}

function planIdFromProductId(id: string): PlanId | null {
  for (const key of Object.keys(PRODUCT_IDS) as PlanId[]) {
    if (PRODUCT_IDS[key] === id) return key;
  }
  return null;
}

function nativePurchaseFromTransaction(
  tx: CdvPurchase.Transaction,
): NativePurchase | null {
  const platform = platformName();
  if (!platform) return null;
  const productId = tx.products[0]?.id ?? '';
  return {
    platform,
    productId,
    receipt: tx.platform === Platform.APPLE_APPSTORE
      ? (tx.nativeTransaction as any)?.transactionReceipt as string | undefined
      : undefined,
    purchaseToken: tx.platform === Platform.GOOGLE_PLAY
      ? (tx.nativeTransaction as any)?.purchaseToken as string | undefined
      : undefined,
  };
}

/**
 * Initialize the native store once.
 * Safe to call multiple times; the second call is a no-op.
 */
export async function initIap(): Promise<void> {
  if (!isNative()) return;
  if (initStarted) return;
  initStarted = true;

  const platform =
    Capacitor.getPlatform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

  store.register(
    (Object.values(PRODUCT_IDS) as string[]).map((id) => ({
      id,
      platform,
      type: id === PRODUCT_IDS.lifetime
        ? ProductType.NON_CONSUMABLE
        : ProductType.PAID_SUBSCRIPTION,
    })),
  );

  store.when()
    .approved((transaction) => {
      transaction.verify();
    })
    .verified((receipt) => {
      receipt.finish();
    })
    .unverified((receipt) => {
      console.warn('[IAP] unverified receipt', receipt);
    });

  await store.initialize([
    {
      platform,
      options: {
        needAppReceipt: platform === Platform.APPLE_APPSTORE,
      },
    },
  ]);

  storeReady = true;
}

export function isIapAvailable(): boolean {
  return isNative();
}

export async function purchasePlan(plan: PlanId): Promise<PurchaseOutcome> {
  if (!isNative()) {
    return { kind: 'unavailable' };
  }

  try {
    await initIap();
    const product = store.get(PRODUCT_IDS[plan]);
    if (!product) {
      return { kind: 'error', message: 'Product not found in the store.' };
    }

    const offer = product.getOffer();
    if (!offer) {
      return { kind: 'error', message: 'No offer available for this product.' };
    }

    const error = await offer.order();
    if (error) {
      if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
        return { kind: 'cancelled' };
      }
      return { kind: 'error', message: error.message || 'Purchase failed' };
    }

    // Wait a moment for the verified receipt to be processed, then collect owned purchases.
    await new Promise((resolve) => setTimeout(resolve, 800));
    const purchases = collectOwnedPurchases();
    return { kind: 'purchased', purchases };
  } catch (err: any) {
    if (/cancel/i.test(err?.message ?? '')) return { kind: 'cancelled' };
    return { kind: 'error', message: err?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!isNative()) {
    return { kind: 'unavailable' };
  }

  try {
    await initIap();
    await store.restorePurchases();
    // Give the store a beat to surface restored receipts.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const purchases = collectOwnedPurchases();
    if (purchases.length === 0) {
      return { kind: 'error', message: 'No previous purchases found for this account.' };
    }
    return { kind: 'purchased', purchases };
  } catch (err: any) {
    return { kind: 'error', message: err?.message ?? 'Could not restore purchases' };
  }
}

function collectOwnedPurchases(): NativePurchase[] {
  const out: NativePurchase[] = [];
  const seen = new Set<string>();
  for (const id of Object.values(PRODUCT_IDS)) {
    if (store.owned(id)) {
      // We do not have a per-product receipt here; Premium.tsx sends the
      // purchase info to verify-purchase which will re-verify server-side.
      const platform = platformName();
      if (platform && !seen.has(id)) {
        seen.add(id);
        out.push({ platform, productId: id });
      }
    }
  }
  return out;
}

/**
 * Returns the currently owned plan, or null. Useful when restoring without a
 * fresh purchase (the caller still calls verify-purchase).
 */
export function ownedPlanId(): PlanId | null {
  if (!isNative() || !storeReady) return null;
  for (const plan of Object.keys(PRODUCT_IDS) as PlanId[]) {
    if (store.owned(PRODUCT_IDS[plan])) return plan;
  }
  return null;
}
