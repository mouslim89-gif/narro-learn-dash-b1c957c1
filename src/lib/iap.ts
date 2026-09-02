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
import {
  store,
  ProductType,
  Platform,
  ErrorCode,
  type CdvPurchase,
} from 'capacitor-plugin-cdv-purchase';

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

let initPromise: Promise<void> | null = null;
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

function platformConstant(): Platform | null {
  const p = platformName();
  if (p === 'ios') return Platform.APPLE_APPSTORE;
  if (p === 'android') return Platform.GOOGLE_PLAY;
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
  let receipt: string | undefined;
  let purchaseToken: string | undefined;

  const native = tx.nativeTransaction as any;
  if (tx.platform === Platform.APPLE_APPSTORE) {
    receipt = native?.transactionReceipt as string | undefined;
  } else if (tx.platform === Platform.GOOGLE_PLAY) {
    purchaseToken = native?.purchaseToken as string | undefined;
    receipt = native?.receipt as string | undefined;
  }

  return { platform, productId, receipt, purchaseToken };
}

/**
 * Initialize the native store once.
 * Safe to call multiple times; the second call is a no-op.
 */
export async function initIap(): Promise<void> {
  if (!isNative()) return;
  if (initStarted) return initPromise ?? Promise.resolve();
  initStarted = true;

  initPromise = (async () => {
    const platform = platformConstant();
    if (!platform) return;

    store.register(
      (Object.values(PRODUCT_IDS) as string[]).map((id) => ({
        id,
        platform,
        type: id === PRODUCT_IDS.lifetime
          ? ProductType.NON_CONSUMABLE
          : ProductType.PAID_SUBSCRIPTION,
      })),
    );

    // Finish transactions immediately; Premium.tsx calls verify-purchase itself.
    store.when().approved((transaction) => {
      transaction.finish();
    });

    await store.initialize([
      {
        platform,
        options: {
          needAppReceipt: platform === Platform.APPLE_APPSTORE,
        },
      },
    ]);
  })();

  return initPromise;
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

    const productId = PRODUCT_IDS[plan];
    const purchasePromise = waitForApprovedTransaction(productId, 60_000);

    const error = await offer.order();
    if (error) {
      if (error.code === ErrorCode.PAYMENT_CANCELLED) {
        return { kind: 'cancelled' };
      }
      return { kind: 'error', message: error.message || 'Purchase failed' };
    }

    const tx = await purchasePromise;
    const purchase = nativePurchaseFromTransaction(tx);
    if (!purchase) {
      return { kind: 'error', message: 'Purchase completed but receipt was missing.' };
    }
    return { kind: 'purchased', purchases: [purchase] };
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
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const purchases: NativePurchase[] = [];
    const seen = new Set<string>();

    for (const tx of store.transactions) {
      const purchase = nativePurchaseFromTransaction(tx);
      if (purchase && !seen.has(purchase.productId)) {
        seen.add(purchase.productId);
        purchases.push(purchase);
      }
    }

    if (purchases.length === 0) {
      return { kind: 'error', message: 'No previous purchases found for this account.' };
    }
    return { kind: 'purchased', purchases };
  } catch (err: any) {
    return { kind: 'error', message: err?.message ?? 'Could not restore purchases' };
  }
}

function waitForApprovedTransaction(
  productId: string,
  timeoutMs: number,
): Promise<CdvPurchase.Transaction> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Purchase timed out'));
    }, timeoutMs);

    const handler = store.when().approved((transaction) => {
      if (transaction.products.some((p) => p.id === productId)) {
        cleanup();
        resolve(transaction);
      }
    });

    function cleanup() {
      clearTimeout(timer);
      handler?.stop?.();
    }
  });
}

/**
 * Returns the currently owned plan, or null. Useful on cold start when a
 * verified subscription is already present.
 */
export function ownedPlanId(): PlanId | null {
  if (!isNative()) return null;
  for (const plan of Object.keys(PRODUCT_IDS) as PlanId[]) {
    if (store.owned(PRODUCT_IDS[plan])) return plan;
  }
  return null;
}
