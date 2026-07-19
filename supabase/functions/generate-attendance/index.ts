/**
 * generate-attendance Edge Function
 *
 * Runs daily (via pg_cron at 00:01 UTC) or can be triggered manually.
 * For every session in `offering_runs.sessions_json` that falls on today's date,
 * inserts one `attendance` row per confirmed enrollment with `status = 'absent'`.
 *
 * Idempotent: uses INSERT ... ON CONFLICT DO NOTHING, so re-running on the same
 * date will not create duplicates.
 *
 * Environment variables:
 *   SUPABASE_URL              — auto-injected by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 */

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase       = createClient(supabaseUrl, serviceRoleKey);

  // Allow an optional date override for manual testing (ISO date string 'YYYY-MM-DD')
  let targetDate: string;
  try {
    const body = await req.json().catch(() => ({})) as { date?: string };
    targetDate = body.date ?? new Date().toISOString().split("T")[0];
  } catch {
    targetDate = new Date().toISOString().split("T")[0];
  }

  console.log(`[generate-attendance] Running for date: ${targetDate}`);

  try {
    // 1. Find all active offering_runs that have a session on targetDate.
    //    sessions_json is a JSONB array: [{ "date": "YYYY-MM-DD", "label": "Session N" }, ...]
    const { data: runs, error: runsErr } = await supabase
      .from("offering_runs")
      .select("id, sessions_json")
      .in("status", ["open", "full"]);

    if (runsErr) throw runsErr;

    let totalInserted = 0;
    let totalSkipped  = 0;

    for (const run of runs ?? []) {
      const sessions: Array<{ date?: string }> = Array.isArray(run.sessions_json)
        ? run.sessions_json
        : [];

      const hasSession = sessions.some((s) => s?.date === targetDate);
      if (!hasSession) continue;

      // 2. Get all confirmed enrollments for this run
      const { data: enrollments, error: enrollErr } = await supabase
        .from("enrollments")
        .select("id, student_id")
        .eq("offering_run_id", run.id)
        .eq("status", "confirmed");

      if (enrollErr) throw enrollErr;

      for (const enrollment of enrollments ?? []) {
        // 3. Idempotent insert: one row per (enrollment_id, offering_run_id, session_date)
        const { error: insertErr } = await supabase
          .from("attendance")
          .upsert(
            {
              enrollment_id:   enrollment.id,
              offering_run_id: run.id,
              session_date:    targetDate,
              status:          "absent",
            },
            {
              onConflict:       "enrollment_id,session_date",
              ignoreDuplicates: true,
            }
          );

        if (insertErr) {
          // Log and continue — don't abort the whole batch for one row failure
          console.error(
            `[generate-attendance] Insert failed for enrollment ${enrollment.id} on ${targetDate}:`,
            insertErr
          );
          totalSkipped++;
        } else {
          totalInserted++;
        }
      }
    }

    console.log(
      `[generate-attendance] Done for ${targetDate}: ${totalInserted} rows inserted, ${totalSkipped} errors`
    );

    return new Response(
      JSON.stringify({
        success: true,
        date: targetDate,
        rows_inserted: totalInserted,
        errors: totalSkipped,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-attendance] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
