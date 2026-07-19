// C-3: notify-on-publish Edge Function
// Called by AdminDashboard.handlePublishProgram after a successful publish.
// Sends an FCM push notification to the program author's registered device.
//
// Expected request body: { programId: string, programName: string, authorUserId: string }
//
// Environment variables required:
//   FIREBASE_SERVICE_ACCOUNT_JSON — full service account JSON string
//   SUPABASE_URL                  — project URL (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY     — service role key (auto-injected by Supabase)

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Minimal Firebase Admin SDK — sends FCM via HTTP v1 API
async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
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
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import the private key
  const privateKeyPem = serviceAccount.private_key.replace(/\\n/g, "\n");
  const pemBody = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get FCM access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }

  try {
    const { programId, programName, authorUserId } = await req.json();

    if (!programId || !programName || !authorUserId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Read env vars
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!serviceAccountJson) {
      return new Response(JSON.stringify({ error: "FIREBASE_SERVICE_ACCOUNT_JSON not set" }), { status: 500 });
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.private_key?.includes("\\n")) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    // Look up the author's FCM token from device_push_tokens (service role bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: tokenRow, error: tokenError } = await supabase
      .from("device_push_tokens")
      .select("token, platform")
      .eq("user_id", authorUserId)
      .maybeSingle();

    if (tokenError) throw tokenError;
    if (!tokenRow) {
      // Author has no registered token — publish succeeds, notification silently skipped
      return new Response(JSON.stringify({ success: true, notification: "skipped_no_token" }), { status: 200 });
    }

    // Get FCM access token
    const accessToken = await getAccessToken(serviceAccount);

    // Send FCM message via HTTP v1 API
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
              title: "Program published!",
              body: `Your program "${programName}" is now live.`,
            },
            data: {
              programId,
              programName,
              title: "Program published!",
              body: `Your program "${programName}" is now live.`,
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
    if (!fcmRes.ok) {
      throw new Error(`FCM error: ${JSON.stringify(fcmResult)}`);
    }

    return new Response(JSON.stringify({ success: true, messageId: fcmResult.name }), { status: 200 });
  } catch (err) {
    console.error("[notify-on-publish] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
