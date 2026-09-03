// Verifies an App Store / Google Play purchase and upserts the user's entitlement.
// Supports both the legacy client payload { platform, productId, receipt, purchaseToken }
// and the capacitor-plugin-cdv-purchase validator payload.
// The client never writes to public.subscriptions: only this function (service role) does.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTS: Record<string, "monthly" | "yearly" | "lifetime"> = {
  "tsundoku.premium.monthly": "monthly",
  "tsundoku.premium.yearly": "yearly",
  "tsundoku.premium.lifetime": "lifetime",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Verified {
  expiresAt: string | null;
  originalTransactionId: string | null;
  status: "active" | "grace" | "expired";
}

/** Extract verification inputs from either the legacy or plugin-validator payload. */
function parsePayload(body: any): {
  platform: "ios" | "android";
  productId: string;
  receipt?: string;
  purchaseToken?: string;
} {
  if (body?.transaction) {
    const tx = body.transaction;
    const productId = (body.id as string) || (tx.id as string) || "";
    if (tx.type === "ios-appstore") {
      return {
        platform: "ios",
        productId,
        receipt: tx.appStoreReceipt || tx.transactionReceipt,
      };
    }
    if (tx.type === "android-playstore") {
      return {
        platform: "android",
        productId,
        purchaseToken: tx.purchaseToken,
      };
    }
    throw new Error("unsupported_transaction_type");
  }

  const platform = body?.platform as "ios" | "android";
  const productId = body?.productId as string;
  return {
    platform,
    productId,
    receipt: body?.receipt,
    purchaseToken: body?.purchaseToken,
  };
}

/** Apple verifyReceipt (legacy endpoint, works for both sandbox and production). */
async function verifyApple(receipt: string, productId: string): Promise<Verified> {
  const secret = Deno.env.get("APPLE_SHARED_SECRET");
  if (!secret) throw new Error("not_configured");

  const call = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receipt,
        password: secret,
        "exclude-old-transactions": true,
      }),
    });
    return await res.json();
  };

  let data = await call("https://buy.itunes.apple.com/verifyReceipt");
  // 21007 = sandbox receipt sent to production.
  if (data?.status === 21007) data = await call("https://sandbox.itunes.apple.com/verifyReceipt");
  if (data?.status !== 0) throw new Error(`apple_invalid_receipt_${data?.status}`);

  const plan = PRODUCTS[productId];
  if (plan === "lifetime") {
    const purchases: any[] = data?.receipt?.in_app ?? [];
    const match = purchases.find((p) => p.product_id === productId);
    if (!match) throw new Error("apple_product_not_found");
    return { expiresAt: null, originalTransactionId: match.original_transaction_id ?? null, status: "active" };
  }

  const info: any[] = data?.latest_receipt_info ?? [];
  const match = info
    .filter((i) => i.product_id === productId)
    .sort((a, b) => Number(b.expires_date_ms ?? 0) - Number(a.expires_date_ms ?? 0))[0];
  if (!match) throw new Error("apple_product_not_found");

  const expiresMs = Number(match.expires_date_ms ?? 0);
  const renewal: any[] = data?.pending_renewal_info ?? [];
  const inGrace = renewal.some(
    (r) => r.product_id === productId && Number(r.grace_period_expires_date_ms ?? 0) > Date.now(),
  );
  const status = expiresMs > Date.now() ? "active" : inGrace ? "grace" : "expired";
  return {
    expiresAt: new Date(expiresMs).toISOString(),
    originalTransactionId: match.original_transaction_id ?? null,
    status,
  };
}

/** Google Play Developer API v3 using a service account (JWT -> access token). */
async function googleAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const b64 = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${b64(header)}.${b64(claims)}`;

  const pem = (sa.private_key as string)
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)),
  );
  const sigB64 = btoa(String.fromCharCode(...sig))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sigB64}`,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("google_token_failed");
  return data.access_token as string;
}

async function verifyGoogle(purchaseToken: string, productId: string): Promise<Verified> {
  const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  const pkg = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
  if (!raw || !pkg) throw new Error("not_configured");
  const sa = JSON.parse(raw);
  const token = await googleAccessToken(sa);
  const plan = PRODUCTS[productId];

  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`;
  const url =
    plan === "lifetime"
      ? `${base}/purchases/products/${productId}/tokens/${purchaseToken}`
      : `${base}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(`google_invalid_purchase_${res.status}`);

  if (plan === "lifetime") {
    // purchaseState: 0 = purchased
    if (data.purchaseState !== 0) throw new Error("google_not_purchased");
    return { expiresAt: null, originalTransactionId: data.orderId ?? null, status: "active" };
  }

  const expiresMs = Number(data.expiryTimeMillis ?? 0);
  const inGrace = expiresMs <= Date.now() && data.paymentState === 0 && data.autoRenewing === true;
  return {
    expiresAt: new Date(expiresMs).toISOString(),
    originalTransactionId: data.orderId ?? null,
    status: expiresMs > Date.now() ? "active" : inGrace ? "grace" : "expired",
  };
}

/** Upsert the entitlement and return a capacitor-plugin-cdv-purchase response payload. */
async function finalize(
  admin: ReturnType<typeof createClient>,
  userId: string,
  platform: "ios" | "android",
  productId: string,
  verified: Verified,
) {
  const plan = PRODUCTS[productId];
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      status: verified.status,
      plan,
      platform,
      original_transaction_id: verified.originalTransactionId,
      expires_at: verified.expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  const now = Date.now();
  const expiryMs = verified.expiresAt ? new Date(verified.expiresAt).getTime() : 0;

  return {
    ok: true,
    data: {
      id: productId,
      latest_receipt: true,
      transaction: {
        type: platform === "ios" ? "ios-appstore" : "android-playstore",
        product_id: productId,
        status: verified.status,
        expires_date_ms: expiryMs || undefined,
      },
      collection: [
        {
          id: productId,
          platform: platform === "ios" ? "apple-appstore" : "google-play",
          purchaseDate: now,
          expiryDate: expiryMs || undefined,
          isExpired: verified.status === "expired",
          isAcknowledged: true,
        },
      ],
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { platform, productId, receipt, purchaseToken } = parsePayload(body);
    const plan = PRODUCTS[productId];

    if (!plan) return json({ ok: false, message: "unknown_product" }, 400);
    if (platform !== "ios" && platform !== "android") {
      return json({ ok: false, message: "unknown_platform" }, 400);
    }

    const verified =
      platform === "ios"
        ? await verifyApple(String(receipt ?? ""), productId)
        : await verifyGoogle(String(purchaseToken ?? ""), productId);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const result = await finalize(admin, auth.user.id, platform, productId, verified);
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "verification_failed";
    console.error("verify-purchase failed:", message);
    return json({ ok: false, message }, message === "not_configured" ? 503 : 400);
  }
});
