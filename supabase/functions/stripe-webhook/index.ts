/**
 * stripe-webhook Edge Function
 *
 * Verifies the Stripe-Signature header and processes:
 *   - payment_intent.succeeded  → enrollment.payment_status = 'paid'
 *   - payment_intent.payment_failed → log only, no DB corruption
 *
 * Matching strategy: PaymentIntent.metadata.payment_reference OR
 *   PaymentIntent.id matches enrollments.payment_reference.
 *
 * Environment variables:
 *   STRIPE_WEBHOOK_SECRET       — webhook signing secret from Stripe dashboard
 *   SUPABASE_URL                — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY   — auto-injected by Supabase
 */

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, stripe-signature",
};

// ─── Stripe signature verification ───────────────────────────────────────────
// Stripe uses HMAC-SHA256 over `timestamp.payload` and checks tolerance of 300s.

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const signature = parts["v1"];
    if (!timestamp || !signature) return false;

    // Reject events older than 5 minutes
    const tolerance = 300;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) {
      console.warn("[stripe-webhook] Timestamp tolerance exceeded");
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    );

    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === signature;
  } catch (e) {
    console.error("[stripe-webhook] Signature verification error:", e);
    return false;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const payload = await req.text();
  const sigHeader = req.headers.get("stripe-signature") ?? "";

  // Verify signature if secret is configured
  if (webhookSecret) {
    const valid = await verifyStripeSignature(payload, sigHeader, webhookSecret);
    if (!valid) {
      console.error("[stripe-webhook] Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid Stripe signature" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
  } else {
    // No secret configured — log and continue (useful in dev/staging)
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature check");
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log(`[stripe-webhook] Received event: ${event.type}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as {
          id: string;
          amount: number;
          currency: string;
          metadata?: { payment_reference?: string };
        };

        // Match via metadata.payment_reference first, then by pi.id
        const ref = pi.metadata?.payment_reference ?? pi.id;

        const { data: enrollment, error: findErr } = await supabase
          .from("enrollments")
          .select("id, payment_status, status")
          .eq("payment_reference", ref)
          .maybeSingle();

        if (findErr) throw findErr;

        if (!enrollment) {
          console.warn(`[stripe-webhook] No enrollment found for reference: ${ref}`);
          break;
        }

        // Idempotent: skip if already marked paid
        if (enrollment.payment_status === "paid") {
          console.log(`[stripe-webhook] Enrollment ${enrollment.id} already paid — skipping`);
          break;
        }

        const { error: updateErr } = await supabase
          .from("enrollments")
          .update({
            payment_status: "paid",
            payment_type: "stripe",
            payment_amount_paid: pi.amount / 100, // Stripe stores in cents
            payment_paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);

        if (updateErr) throw updateErr;

        // Insert an in-app notification for the student
        await supabase.from("notifications").insert({
          user_id: (await supabase
            .from("enrollments")
            .select("student_id")
            .eq("id", enrollment.id)
            .single()).data?.student_id,
          type: "enrollment_confirmed",
          title: "Payment received",
          body: "Your payment has been confirmed. Your spot is secured!",
          data_json: { enrollment_id: enrollment.id },
          channel: "in_app",
          push_status: "not_applicable",
        });

        console.log(`[stripe-webhook] Marked enrollment ${enrollment.id} as paid (PI: ${pi.id})`);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as {
          id: string;
          last_payment_error?: { message?: string };
          metadata?: { payment_reference?: string };
        };

        // Log the failure — do not corrupt the enrollment
        const ref = pi.metadata?.payment_reference ?? pi.id;
        console.warn(
          `[stripe-webhook] Payment failed for reference ${ref}: ${pi.last_payment_error?.message ?? "unknown error"}`
        );
        // Optionally: insert a failed-payment notification for the student.
        // For now we log only as per spec — no DB write.
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type} — ignored`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[stripe-webhook] Processing error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
