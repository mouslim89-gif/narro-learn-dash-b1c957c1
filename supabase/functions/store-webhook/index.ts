// Store notifications: Apple App Store Server Notifications v2 and Google Play RTDN.
// Public endpoint (no JWT). It can only update rows that already exist, matched on
// original_transaction_id, so it can never grant premium to an unknown account.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeJwsPayload(jws: string): any {
  const part = jws.split(".")[1];
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(pad), (c) => c.charCodeAt(0))));
}

type Status = "active" | "grace" | "expired";

function appleStatus(notificationType: string, subtype: string | undefined, expiresMs: number): Status {
  if (notificationType === "REFUND" || notificationType === "REVOKE") return "expired";
  if (notificationType === "GRACE_PERIOD_EXPIRED") return "expired";
  if (notificationType === "DID_FAIL_TO_RENEW") return subtype === "GRACE_PERIOD" ? "grace" : "expired";
  if (notificationType === "EXPIRED") return "expired";
  return expiresMs === 0 || expiresMs > Date.now() ? "active" : "expired";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();

    // --- Apple: { signedPayload } ---
    if (body?.signedPayload) {
      const payload = decodeJwsPayload(body.signedPayload);
      const info = payload?.data?.signedTransactionInfo
        ? decodeJwsPayload(payload.data.signedTransactionInfo)
        : {};
      const originalTransactionId = info?.originalTransactionId;
      if (!originalTransactionId) return new Response("ignored", { headers: corsHeaders });

      const expiresMs = Number(info?.expiresDate ?? 0);
      const status = appleStatus(payload?.notificationType, payload?.subtype, expiresMs);

      await admin
        .from("subscriptions")
        .update({
          status,
          expires_at: expiresMs ? new Date(expiresMs).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("original_transaction_id", originalTransactionId);

      return new Response("ok", { headers: corsHeaders });
    }

    // --- Google RTDN: { message: { data: base64 } } ---
    if (body?.message?.data) {
      const decoded = JSON.parse(atob(body.message.data));
      const sub = decoded?.subscriptionNotification;
      const voided = decoded?.voidedPurchaseNotification;

      if (voided?.orderId) {
        await admin
          .from("subscriptions")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("original_transaction_id", voided.orderId);
        return new Response("ok", { headers: corsHeaders });
      }

      if (sub?.purchaseToken) {
        // notificationType: 3 CANCELED, 12 REVOKED, 13 EXPIRED, 6 IN_GRACE_PERIOD
        const t = Number(sub.notificationType);
        const status: Status | null =
          t === 13 || t === 12 ? "expired" : t === 6 ? "grace" : t === 2 || t === 4 || t === 7 ? "active" : null;
        if (status) {
          // The purchase token is not stored; fall back to a no-op unless the client
          // re-verifies. Cancellations/expiries still land through Apple-style order ids.
          await admin
            .from("subscriptions")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("original_transaction_id", sub.orderId ?? "__none__");
        }
        return new Response("ok", { headers: corsHeaders });
      }
    }

    return new Response("ignored", { headers: corsHeaders });
  } catch (err) {
    console.error("store-webhook failed:", err instanceof Error ? err.message : err);
    return new Response("error", { status: 400, headers: corsHeaders });
  }
});
