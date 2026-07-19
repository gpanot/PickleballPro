/**
 * send-notification Edge Function
 *
 * Reads a notification row from the DB, looks up active FCM push tokens for the
 * recipient, sends via FCM HTTP v1 API, and updates push_status / expo_ticket_id.
 * On DeviceNotRegistered (or equivalent FCM error), deactivates the token.
 *
 * Expected request body: { notification_id: string }
 *
 * Environment variables:
 *   FIREBASE_SERVICE_ACCOUNT_JSON — full service account JSON (see firebase-admin-credentials.mdc)
 *   SUPABASE_URL                  — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY     — auto-injected by Supabase
 */

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// ─── FCM helpers (identical pattern to notify-on-student-added) ───────────────

async function getFcmAccessToken(
  serviceAccount: Record<string, string>
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pem = serviceAccount.private_key.replace(/\\n/g, "\n");
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(
      `[send-notification] FCM access token error: ${JSON.stringify(tokenData)}`
    );
  }
  return tokenData.access_token;
}

/**
 * Returns true if the FCM error indicates the token is permanently invalid and
 * should be deactivated in push_tokens.
 */
function isTokenInvalid(fcmError: string): boolean {
  return [
    "UNREGISTERED",
    "INVALID_ARGUMENT",
    "DeviceNotRegistered",
  ].some((e) => fcmError.toUpperCase().includes(e.toUpperCase()));
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({})) as { notification_id?: string };
    const { notification_id } = body;

    if (!notification_id) {
      return new Response(
        JSON.stringify({ error: "Missing notification_id" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!serviceAccountJson) {
      console.error("[send-notification] FIREBASE_SERVICE_ACCOUNT_JSON not set");
      return new Response(
        JSON.stringify({ error: "FIREBASE_SERVICE_ACCOUNT_JSON not set" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.private_key?.includes("\\n")) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Load the notification row
    const { data: notif, error: notifErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .maybeSingle();

    if (notifErr) throw notifErr;
    if (!notif) {
      return new Response(
        JSON.stringify({ error: "Notification not found", notification_id }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Skip if this is in_app only or already sent
    if (notif.channel === "in_app" || notif.push_status === "sent") {
      return new Response(
        JSON.stringify({ skipped: true, reason: notif.channel === "in_app" ? "in_app_only" : "already_sent" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 2. Look up active push tokens for the recipient
    const { data: tokens, error: tokenErr } = await supabase
      .from("push_tokens")
      .select("id, token, platform")
      .eq("user_id", notif.user_id)
      .eq("is_active", true);

    if (tokenErr) throw tokenErr;

    if (!tokens || tokens.length === 0) {
      // No active tokens — mark as not applicable
      await supabase
        .from("notifications")
        .update({ push_status: "not_applicable" })
        .eq("id", notification_id);

      return new Response(
        JSON.stringify({ sent: false, reason: "no_active_tokens" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 3. Get FCM access token
    const accessToken = await getFcmAccessToken(serviceAccount);

    const results: Array<{ token_id: string; success: boolean; message_id?: string; error?: string }> = [];

    // 4. Send to each active token
    for (const tokenRow of tokens) {
      const fcmRes = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: tokenRow.token,
              notification: {
                title: notif.title,
                body: notif.body,
              },
              data: {
                notification_id,
                type: notif.type,
                title: notif.title,
                body: notif.body,
                ...(notif.data_json ?? {}),
              },
              android: {
                priority: "high",
                notification: {
                  channelId: "default",
                  sound: "default",
                  priority: "max",
                },
              },
              apns: {
                payload: {
                  aps: { sound: "default", badge: 1, "content-available": 1 },
                },
                headers: { "apns-priority": "10" },
              },
            },
          }),
        }
      );

      const fcmResult = await fcmRes.json();

      if (fcmRes.ok && fcmResult.name) {
        results.push({ token_id: tokenRow.id, success: true, message_id: fcmResult.name });
      } else {
        const errDetail = JSON.stringify(fcmResult);
        console.error(`[send-notification] FCM error for token ${tokenRow.id}:`, errDetail);
        results.push({ token_id: tokenRow.id, success: false, error: errDetail });

        // Deactivate permanently invalid tokens
        if (isTokenInvalid(errDetail)) {
          await supabase
            .from("push_tokens")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", tokenRow.id);
          console.log(`[send-notification] Deactivated invalid token ${tokenRow.id}`);
        }
      }
    }

    // 5. Update notification push_status
    const anySuccess = results.some((r) => r.success);
    const firstSuccess = results.find((r) => r.success);

    await supabase
      .from("notifications")
      .update({
        push_status: anySuccess ? "sent" : "failed",
        // Store the first successful FCM message name in expo_ticket_id for parity with spec
        ...(firstSuccess ? { expo_ticket_id: firstSuccess.message_id } : {}),
      })
      .eq("id", notification_id);

    console.log(
      `[send-notification] notification ${notification_id}: ${anySuccess ? "sent" : "failed"}, results:`,
      results
    );

    return new Response(
      JSON.stringify({ sent: anySuccess, results }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-notification] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
