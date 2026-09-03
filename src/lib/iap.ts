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
import { Browser } from '@capacitor/browser';
import {
  store,
  ProductType,
  Platform,
  ErrorCode,
  type CdvPurchase,
} from 'capacitor-plugin-cdv-purchase';
import { supabase } from '@/integrations/supabase/client';

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
let storeReady = false;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function currentPlatformName(): 'ios' | 'android' | null {
  if (!isNative()) return null;
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return null;
}

function currentPlatformConstant(): Platform | null {
  const p = currentPlatformName();
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

/**
 * Custom validator: forwards the plugin's receipt validation payload to our
 * "verify-purchase" edge function with the user's auth token attached.
 */
async function validator(
  request: CdvPurchase.Validator.Request.Body,
  callback: CdvPurchase.Callback<CdvPurchase.Validator.Response.Payload>,
) {
  try {
    const { data, error } = await supabase.functions.invoke('verify-purchase', {
      body: request,
    });
    if (error || !data || typeof data !== 'object') {
      callback({ ok: false, message: error?.message ?? 'verification_failed' });
      return;
    }
    callback(data as CdvPurchase.Validator.Response.Payload);
  } catch (err: any) {
    callback({ ok: false, message: err?.message ?? 'verification_failed' });
  }
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
    const platform = currentPlatformConstant();
    if (!platform) return;

    store.validator = validator as any;

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
      .approved((transaction) => transaction.verify())
      .verified((receipt) => receipt.finish());

    await store.initialize([
      {
        platform,
        options: {
          needAppReceipt: platform === Platform.APPLE_APPSTORE,
        },
      },
    ]);

    storeReady = true;
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

    // Wait for the receipt to be verified server-side before resolving.
    const productId = PRODUCT_IDS[plan];
    const verified = waitForVerified(productId, 60_000);

    const error = await offer.order();
    if (error) {
      verified.cancel();
      if (error.code === ErrorCode.PAYMENT_CANCELLED) {
        return { kind: 'cancelled' };
      }
      return { kind: 'error', message: error.message || 'Purchase failed' };
    }

    await verified.promise;
    const platform = currentPlatformName();
    return {
      kind: 'purchased',
      purchases: platform ? [{ platform, productId }] : [],
    };
  } catch (err: any) {
    if (/cancel/i.test(err?.message ?? '')) return { kind: 'cancelled' };
    return { kind: 'error', message: err?.message ?? 'Purchase failed' };
  }
}

function waitForVerified(productId: string, timeoutMs: number) {
  let cleanup = () => {};
  const promise = new Promise<CdvPurchase.VerifiedReceipt>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Purchase verification timed out'));
    }, timeoutMs);

    const handler = store.when().verified((receipt) => {
      if (receipt.collection.some((p) => p.id === productId)) {
        clearTimeout(timer);
        cleanup();
        resolve(receipt);
      }
    });

    cleanup = () => {
      clearTimeout(timer);
      // The plugin keeps the listener; silence future callbacks by replacing the handler.
      handler.verified(() => {});
    };
  });

  return {
    promise,
    cancel: cleanup,
  };
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!isNative()) {
    return { kind: 'unavailable' };
  }

  try {
    await initIap();
    await store.restorePurchases();
    const platform = currentPlatformName();
    const purchases: NativePurchase[] = platform
      ? (Object.values(PRODUCT_IDS) as string[])
          .filter((id) => store.owned(id))
          .map((id) => ({ platform, productId: id }))
      : [];

    if (purchases.length === 0) {
      return { kind: 'error', message: 'No previous purchases found for this account.' };
    }
    return { kind: 'purchased', purchases };
  } catch (err: any) {
    return { kind: 'error', message: err?.message ?? 'Could not restore purchases' };
  }
}

/**
 * Returns the currently owned plan, or null. Useful on cold start when a
 * verified subscription is already present.
 */
export function ownedPlanId(): PlanId | null {
  if (!isNative() || !storeReady) return null;
  for (const plan of Object.keys(PRODUCT_IDS) as PlanId[]) {
    if (store.owned(PRODUCT_IDS[plan])) return plan;
  }
  return null;
}

/**
 * Open the platform's subscription management page.
 * No-op in browser builds.
 */
export async function openManageSubscriptions(): Promise<void> {
  if (!isNative()) return;
  const url =
    Capacitor.getPlatform() === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
  try {
    await Browser.open({ url });
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
