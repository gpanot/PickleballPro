-- ============================================================
-- Offerings v1 — post-release fixes
-- 1. get_offering_with_runs: add access check (security fix)
-- 2. push_tokens: unique partial index for (user_id, platform) when device_id IS NULL
-- ============================================================

-- ── Fix 1: get_offering_with_runs access check ──────────────────────────────
--
-- Previously this SECURITY DEFINER function had no access guard, meaning any
-- authenticated user could fetch any offering (even private/draft) by UUID.
-- Now it requires either:
--   a) the offering is public (is_public = true), or
--   b) the caller is the coach who owns the offering
--
CREATE OR REPLACE FUNCTION public.get_offering_with_runs(p_offering_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'offering', row_to_json(o.*),
    'runs', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'run',             row_to_json(r.*),
            'confirmed_count', (
              SELECT COUNT(*) FROM public.enrollments e
              WHERE e.offering_run_id = r.id AND e.status = 'confirmed'
            ),
            'waitlist_count', (
              SELECT COUNT(*) FROM public.enrollments e
              WHERE e.offering_run_id = r.id AND e.status = 'waitlisted'
            )
          )
          ORDER BY r.start_date
        )
        FROM public.offering_runs r
        WHERE r.offering_id = p_offering_id
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM public.offerings o
  WHERE o.id = p_offering_id
    AND (
      o.is_public = true
      OR o.coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

  RETURN v_result;
END;
$$;


-- ── Fix 3: update_offering — allow admins (is_admin = true) to edit any offering ──
--
-- The original update_offering RPC only allowed the owning coach. Admin users in
-- the web admin panel (is_admin = true in public.users) need edit access too.
--
CREATE OR REPLACE FUNCTION public.update_offering(
  p_offering_id       uuid,
  p_title             text     DEFAULT NULL,
  p_description       text     DEFAULT NULL,
  p_location          text     DEFAULT NULL,
  p_facility_name     text     DEFAULT NULL,
  p_capacity_per_run  integer  DEFAULT NULL,
  p_skill_level_min   numeric  DEFAULT NULL,
  p_skill_level_max   numeric  DEFAULT NULL,
  p_thumbnail_url     text     DEFAULT NULL,
  p_is_public         boolean  DEFAULT NULL,
  p_status            text     DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE o.id = p_offering_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: offering not found or not your offering';
  END IF;

  UPDATE public.offerings
  SET title             = COALESCE(p_title, title),
      description       = COALESCE(p_description, description),
      location          = COALESCE(p_location, location),
      facility_name     = COALESCE(p_facility_name, facility_name),
      capacity_per_run  = COALESCE(p_capacity_per_run, capacity_per_run),
      skill_level_min   = COALESCE(p_skill_level_min, skill_level_min),
      skill_level_max   = COALESCE(p_skill_level_max, skill_level_max),
      thumbnail_url     = COALESCE(p_thumbnail_url, thumbnail_url),
      is_public         = COALESCE(p_is_public, is_public),
      status            = COALESCE(p_status, status),
      updated_at        = now()
  WHERE id = p_offering_id;
END;
$$;


-- ── Fix 4: Admin RLS policies — allow is_admin = true users to read everything ──
--
-- Without these policies, admins using the web admin panel only see public offerings.
-- is_admin is checked via a subquery to avoid duplicating user lookup logic.
--

CREATE POLICY "admin_read_all_offerings" ON public.offerings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_read_all_runs" ON public.offering_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_read_all_enrollments" ON public.enrollments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));


-- ── Fix 5: Admin access to get_run_roster, cancel_enrollment, record_payment ──
--
-- The admin web panel calls these three RPCs from OfferingRosterModal.
-- Without admin checks they fail with "Access denied: not the coach."
--

CREATE OR REPLACE FUNCTION public.get_run_roster(p_offering_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: not the coach for this run';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'enrollment_id',       e.id,
      'student_id',          e.student_id,
      'student_name',        u.name,
      'student_email',       u.email,
      'student_avatar_url',  u.avatar_url,
      'student_dupr',        u.dupr_rating,
      'status',              e.status,
      'waitlist_position',   e.waitlist_position,
      'payment_status',      e.payment_status,
      'payment_type',        e.payment_type,
      'payment_amount_paid', e.payment_amount_paid,
      'payment_reference',   e.payment_reference,
      'payment_notes',       e.payment_notes,
      'payment_paid_at',     e.payment_paid_at,
      'enrolled_at',         e.enrolled_at
    )
    ORDER BY
      CASE e.status WHEN 'confirmed' THEN 0 WHEN 'waitlisted' THEN 1 ELSE 2 END,
      e.waitlist_position NULLS LAST,
      e.enrolled_at
  )
  INTO v_result
  FROM public.enrollments e
  JOIN public.users u ON u.id = e.student_id
  WHERE e.offering_run_id = p_offering_run_id
    AND e.status != 'cancelled';

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


CREATE OR REPLACE FUNCTION public.cancel_enrollment(p_enrollment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_enrollment         public.enrollments%ROWTYPE;
  v_run                public.offering_runs%ROWTYPE;
  v_promoted_id        uuid;
  v_promoted_user      uuid;
  v_capacity           integer;
  v_offering_title     text;
  v_new_payment_status text;
  v_run_price          integer;
BEGIN
  -- Verify caller is the coach of this run OR an admin
  SELECT e.* INTO v_enrollment
  FROM public.enrollments e
  JOIN public.offering_runs r ON r.id = e.offering_run_id
  JOIN public.offerings o ON o.id = r.offering_id
  JOIN public.coaches c ON c.id = o.coach_id
  WHERE e.id = p_enrollment_id AND (
    c.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found or access denied';
  END IF;

  SELECT * INTO v_run FROM public.offering_runs
  WHERE id = v_enrollment.offering_run_id FOR UPDATE;

  SELECT o.title INTO v_offering_title
  FROM public.offerings o
  JOIN public.offering_runs r ON r.offering_id = o.id
  WHERE r.id = v_enrollment.offering_run_id;

  UPDATE public.enrollments
  SET status         = 'cancelled',
      payment_status = CASE
                         WHEN payment_status IN ('paid', 'cash_collected') THEN 'refunded'
                         ELSE payment_status
                       END,
      updated_at     = now()
  WHERE id = p_enrollment_id;

  IF v_enrollment.status = 'confirmed' THEN
    v_capacity := public._offering_run_capacity(v_enrollment.offering_run_id);

    UPDATE public.offering_runs
    SET spots_filled = GREATEST(spots_filled - 1, 0),
        status       = CASE WHEN status = 'full' THEN 'open' ELSE status END,
        updated_at   = now()
    WHERE id = v_enrollment.offering_run_id;

    SELECT e.id, e.student_id INTO v_promoted_id, v_promoted_user
    FROM public.enrollments e
    WHERE e.offering_run_id = v_enrollment.offering_run_id
      AND e.status = 'waitlisted'
    ORDER BY e.waitlist_position LIMIT 1;

    IF v_promoted_id IS NOT NULL THEN
      SELECT price_amount INTO v_run_price
      FROM public.offering_runs WHERE id = v_enrollment.offering_run_id;

      v_new_payment_status := CASE WHEN v_run_price > 0 THEN 'pending' ELSE 'not_required' END;

      UPDATE public.enrollments
      SET status            = 'confirmed',
          waitlist_position = NULL,
          payment_status    = v_new_payment_status,
          updated_at        = now()
      WHERE id = v_promoted_id;

      UPDATE public.offering_runs
      SET spots_filled = spots_filled + 1, updated_at = now()
      WHERE id = v_enrollment.offering_run_id;

      UPDATE public.enrollments
      SET waitlist_position = sub.new_pos, updated_at = now()
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY waitlist_position) AS new_pos
        FROM public.enrollments
        WHERE offering_run_id = v_enrollment.offering_run_id AND status = 'waitlisted'
      ) sub
      WHERE public.enrollments.id = sub.id;

      INSERT INTO public.notifications (user_id, type, title, body, data_json, channel, push_status)
      VALUES (
        v_promoted_user, 'waitlist_promoted', 'Great news! You''re in!',
        'Your spot in "' || v_offering_title || '" has been confirmed.',
        jsonb_build_object('offering_run_id', v_enrollment.offering_run_id, 'enrollment_id', v_promoted_id),
        'both', 'pending'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'cancelled_enrollment_id', p_enrollment_id,
    'promoted_enrollment_id',  v_promoted_id
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.record_payment(
  p_enrollment_id       uuid,
  p_payment_type        text,
  p_payment_amount_paid integer  DEFAULT NULL,
  p_payment_reference   text     DEFAULT NULL,
  p_payment_notes       text     DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.offering_runs r ON r.id = e.offering_run_id
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE e.id = p_enrollment_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: not the coach for this enrollment';
  END IF;

  UPDATE public.enrollments
  SET payment_status        = CASE
                                WHEN p_payment_type = 'cash' THEN 'cash_collected'
                                ELSE 'paid'
                              END,
      payment_type          = p_payment_type,
      payment_amount_paid   = p_payment_amount_paid,
      payment_reference     = p_payment_reference,
      payment_notes         = p_payment_notes,
      payment_paid_at       = now(),
      updated_at            = now()
  WHERE id = p_enrollment_id;
END;
$$;


-- ── Fix 2: push_tokens unique partial index for (user_id, platform) ─────────
--
-- Without this index, multiple rows could accumulate for the same user/platform
-- pair when device_id IS NULL (the upsert_push_token RPC did ON CONFLICT DO NOTHING
-- without a backing unique constraint, so inserts never conflicted).
--
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_user_platform
  ON public.push_tokens(user_id, platform)
  WHERE device_id IS NULL;

-- Update upsert_push_token to use the new index
CREATE OR REPLACE FUNCTION public.upsert_push_token(
  p_token      text,
  p_platform   text,
  p_device_id  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user profile found';
  END IF;

  IF p_device_id IS NOT NULL THEN
    -- Upsert by (user_id, device_id) — backed by idx_push_tokens_device
    INSERT INTO public.push_tokens (user_id, token, platform, device_id, is_active, updated_at)
    VALUES (v_user_id, p_token, p_platform, p_device_id, true, now())
    ON CONFLICT (user_id, device_id) WHERE device_id IS NOT NULL
    DO UPDATE SET token = EXCLUDED.token, platform = EXCLUDED.platform,
                  is_active = true, updated_at = now();
  ELSE
    -- Upsert by (user_id, platform) — backed by idx_push_tokens_user_platform
    INSERT INTO public.push_tokens (user_id, token, platform, device_id, is_active, updated_at)
    VALUES (v_user_id, p_token, p_platform, NULL, true, now())
    ON CONFLICT (user_id, platform) WHERE device_id IS NULL
    DO UPDATE SET token = EXCLUDED.token, is_active = true, updated_at = now();
  END IF;
END;
$$;
