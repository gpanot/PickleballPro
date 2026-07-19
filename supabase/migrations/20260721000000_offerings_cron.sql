-- ─── Offerings — pg_cron jobs ─────────────────────────────────────────────────
-- Phase 3: session reminders + push notification dispatch.
-- Requires the pg_cron extension to be enabled in Supabase.
-- To verify: SELECT * FROM cron.job;
-- To enable: Dashboard → Database → Extensions → pg_cron

-- ─── Helper: call send-notification Edge Function ─────────────────────────────
-- Uses pg_net to POST to the Edge Function.
-- If pg_net is not enabled, these cron jobs silently do nothing.

-- ─── 1. Session reminders — runs daily at 07:00 UTC ──────────────────────────
-- For every session in offering_runs.sessions_json that falls exactly 24 h
-- from now, inserts a notification row and dispatches the push.
--
-- sessions_json is a JSONB array: [{"date": "2026-07-25", "label": "Session 1"}, ...]
-- We match sessions where session_date = CURRENT_DATE + INTERVAL '1 day'.

SELECT cron.schedule(
  'offerings-session-reminders',    -- job name (must be unique)
  '0 7 * * *',                      -- every day at 07:00 UTC
  $$
  DO $$
  DECLARE
    v_row   RECORD;
    v_sess  RECORD;
    v_notif_id uuid;
    v_enroll_row RECORD;
    v_supabase_url text := current_setting('app.supabase_url', true);
  BEGIN
    -- Iterate offering_runs that have at least one session tomorrow
    FOR v_row IN
      SELECT
        r.id              AS run_id,
        r.offering_id,
        o.title           AS offering_title,
        r.session_schedule,
        sess.value        AS session_obj
      FROM public.offering_runs r
      JOIN public.offerings o ON o.id = r.offering_id
      CROSS JOIN LATERAL jsonb_array_elements(r.sessions_json) AS sess(value)
      WHERE r.status IN ('open', 'full')
        AND (sess.value->>'date')::date = CURRENT_DATE + INTERVAL '1 day'
    LOOP
      -- Insert one notification per confirmed enrollment for this run
      FOR v_enroll_row IN
        SELECT e.id AS enrollment_id, e.student_id
        FROM public.enrollments e
        WHERE e.offering_run_id = v_row.run_id
          AND e.status = 'confirmed'
      LOOP
        INSERT INTO public.notifications (
          user_id, type, title, body, data_json, channel, push_status
        )
        VALUES (
          v_enroll_row.student_id,
          'session_reminder',
          'Session tomorrow!',
          'Your session for "' || v_row.offering_title || '" is tomorrow. See you on the court!',
          jsonb_build_object(
            'offering_run_id', v_row.run_id,
            'session_date',   (v_row.session_obj->>'date')
          ),
          'both',
          'pending'
        )
        RETURNING id INTO v_notif_id;

        -- Dispatch push via pg_net if available
        IF v_supabase_url IS NOT NULL THEN
          PERFORM net.http_post(
            url    := v_supabase_url || '/functions/v1/send-notification',
            body   := jsonb_build_object('notification_id', v_notif_id),
            params := '{}'::jsonb,
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
            )
          );
        END IF;
      END LOOP;
    END LOOP;
  END
  $$;
  $$
);

-- ─── 2. Generate attendance rows — runs daily at 00:01 UTC ──────────────────
-- Calls the generate-attendance Edge Function for today's date.
-- Requires app.supabase_url and app.supabase_service_role_key to be set as
-- database parameters (e.g. via Supabase Dashboard → Settings → Database → Parameters).

SELECT cron.schedule(
  'offerings-generate-attendance',
  '1 0 * * *',    -- every day at 00:01 UTC
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url', true) || '/functions/v1/generate-attendance',
    body    := jsonb_build_object('date', CURRENT_DATE::text),
    params  := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    )
  );
  $$
);

-- ─── 3. Push receipt check — runs every 15 min ────────────────────────────────
-- With FCM we don't have Expo-style receipts to poll.
-- This job optimistically marks notifications that have been in 'pending' state
-- for > 15 minutes as 'failed' so they can be retried or investigated.
-- Notifications already sent or non-applicable are untouched.

SELECT cron.schedule(
  'offerings-push-receipt-check',
  '*/15 * * * *',    -- every 15 minutes
  $$
  UPDATE public.notifications
  SET push_status = 'failed'
  WHERE push_status = 'pending'
    AND channel IN ('push', 'both')
    AND created_at < now() - INTERVAL '15 minutes';
  $$
);
