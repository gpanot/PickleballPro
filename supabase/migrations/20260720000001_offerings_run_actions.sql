-- ─── cancel_offering_run ─────────────────────────────────────────────────────
-- Sets a run's status to 'cancelled', cancels all its enrollments,
-- and inserts a notification row for every confirmed / waitlisted student.
-- pg_net dispatch is attempted if the app.supabase_url setting is present.

CREATE OR REPLACE FUNCTION public.cancel_offering_run(p_offering_run_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_offering_title text;
  v_supabase_url   text;
  v_notif_id       uuid;
  v_enroll         RECORD;
BEGIN
  -- Auth check: must be the coach who owns this run
  IF NOT EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN  public.offerings o ON o.id = r.offering_id
    JOIN  public.coaches   c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT o.title INTO v_offering_title
  FROM public.offering_runs r
  JOIN public.offerings o ON o.id = r.offering_id
  WHERE r.id = p_offering_run_id;

  v_supabase_url := current_setting('app.supabase_url', true);

  -- Cancel all active enrollments for this run
  UPDATE public.enrollments
  SET    status     = 'cancelled',
         updated_at = now()
  WHERE  offering_run_id = p_offering_run_id
    AND  status NOT IN ('cancelled');

  -- Mark the run as cancelled
  UPDATE public.offering_runs
  SET    status     = 'cancelled',
         updated_at = now()
  WHERE  id = p_offering_run_id;

  -- Send PNS to every affected student
  FOR v_enroll IN
    SELECT e.student_id
    FROM   public.enrollments e
    WHERE  e.offering_run_id = p_offering_run_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data_json, channel, push_status)
    VALUES (
      v_enroll.student_id,
      'run_cancelled',
      'Run cancelled: ' || v_offering_title,
      'Sorry, this run of "' || v_offering_title || '" has been cancelled. Any payment will be refunded.',
      jsonb_build_object('offering_run_id', p_offering_run_id),
      'both',
      'pending'
    )
    RETURNING id INTO v_notif_id;

    IF v_supabase_url IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification',
        body    := jsonb_build_object('notification_id', v_notif_id),
        params  := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        )
      );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_offering_run(uuid) TO authenticated;

-- ─── delete_offering_run ─────────────────────────────────────────────────────
-- Hard-deletes a run from the DB (cascade deletes enrollments via FK).
-- Before deleting, sends cancellation PNS to every confirmed/waitlisted student.

CREATE OR REPLACE FUNCTION public.delete_offering_run(p_offering_run_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_offering_title text;
  v_supabase_url   text;
  v_notif_id       uuid;
  v_student_id     uuid;
BEGIN
  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN  public.offerings o ON o.id = r.offering_id
    JOIN  public.coaches   c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT o.title INTO v_offering_title
  FROM public.offering_runs r
  JOIN public.offerings o ON o.id = r.offering_id
  WHERE r.id = p_offering_run_id;

  v_supabase_url := current_setting('app.supabase_url', true);

  -- Send PNS before deleting rows
  FOR v_student_id IN
    SELECT DISTINCT e.student_id
    FROM   public.enrollments e
    WHERE  e.offering_run_id = p_offering_run_id
      AND  e.status IN ('confirmed', 'waitlisted')
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data_json, channel, push_status)
    VALUES (
      v_student_id,
      'run_cancelled',
      'Run removed: ' || v_offering_title,
      'A run of "' || v_offering_title || '" has been removed by your coach.',
      jsonb_build_object('offering_run_id', p_offering_run_id),
      'both',
      'pending'
    )
    RETURNING id INTO v_notif_id;

    IF v_supabase_url IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification',
        body    := jsonb_build_object('notification_id', v_notif_id),
        params  := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        )
      );
    END IF;
  END LOOP;

  -- Hard delete: FK on enrollments has ON DELETE CASCADE set via the main migration
  DELETE FROM public.offering_runs WHERE id = p_offering_run_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_offering_run(uuid) TO authenticated;

-- ─── hard_delete_offering ────────────────────────────────────────────────────
-- Fully removes an offering and ALL its runs from the database.
-- PNS is sent to every enrolled student before deletion.

CREATE OR REPLACE FUNCTION public.hard_delete_offering(p_offering_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_offering_title text;
  v_supabase_url   text;
  v_notif_id       uuid;
  v_student_id     uuid;
BEGIN
  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN  public.coaches c ON c.id = o.coach_id
    WHERE o.id = p_offering_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT title INTO v_offering_title FROM public.offerings WHERE id = p_offering_id;

  v_supabase_url := current_setting('app.supabase_url', true);

  -- PNS to every confirmed/waitlisted student across ALL runs
  FOR v_student_id IN
    SELECT DISTINCT e.student_id
    FROM   public.enrollments e
    JOIN   public.offering_runs r ON r.id = e.offering_run_id
    WHERE  r.offering_id = p_offering_id
      AND  e.status IN ('confirmed', 'waitlisted')
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data_json, channel, push_status)
    VALUES (
      v_student_id,
      'run_cancelled',
      'Program removed: ' || v_offering_title,
      '"' || v_offering_title || '" has been deleted by your coach.',
      jsonb_build_object('offering_id', p_offering_id),
      'both',
      'pending'
    )
    RETURNING id INTO v_notif_id;

    IF v_supabase_url IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification',
        body    := jsonb_build_object('notification_id', v_notif_id),
        params  := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        )
      );
    END IF;
  END LOOP;

  -- Hard delete offering (FK cascade removes runs + enrollments)
  DELETE FROM public.offerings WHERE id = p_offering_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hard_delete_offering(uuid) TO authenticated;
