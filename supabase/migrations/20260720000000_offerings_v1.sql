-- ============================================================
-- Offerings v1 — atomic migration
-- Covers: 6 tables · indexes · RLS · 14 RPCs · enable RLS
-- Decisions locked:
--   • payment_link_url lives on offering_runs (run-level)
--   • waitlisted enrollments get payment_status = 'not_required'
--   • coaches.currency (already exists) is inherited at offering creation
-- ============================================================

-- ── 0A: TABLES ──────────────────────────────────────────────

-- offerings
CREATE TABLE IF NOT EXISTS public.offerings (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id         uuid         NOT NULL REFERENCES public.coaches(id) ON DELETE RESTRICT,
  program_id         uuid         NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  coach_id           uuid         NOT NULL REFERENCES public.coaches(id) ON DELETE RESTRICT,
  title              text         NOT NULL,
  type               text         NOT NULL CHECK (type IN ('cohort', 'event')),
  description        text,
  location           text,
  facility_name      text,
  capacity_per_run   integer      NOT NULL,
  skill_level_min    numeric,
  skill_level_max    numeric,
  thumbnail_url      text,
  is_public          boolean      NOT NULL DEFAULT false,
  status             text         NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'open', 'completed', 'cancelled')),
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now()
);

-- offering_runs
CREATE TABLE IF NOT EXISTS public.offering_runs (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id        uuid         NOT NULL REFERENCES public.offerings(id) ON DELETE RESTRICT,
  start_date         date         NOT NULL,
  end_date           date         NOT NULL,
  session_schedule   text         NOT NULL,
  sessions_json      jsonb        NOT NULL DEFAULT '[]'::jsonb,
  capacity           integer,
  spots_filled       integer      NOT NULL DEFAULT 0,
  price_amount       integer      NOT NULL DEFAULT 0,
  price_currency     text         NOT NULL DEFAULT 'USD',
  payment_link_url   text,
  status             text         NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open', 'full', 'closed', 'completed')),
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now()
);

-- enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_run_id       uuid         NOT NULL REFERENCES public.offering_runs(id) ON DELETE RESTRICT,
  student_id            uuid         NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status                text         NOT NULL CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  waitlist_position     integer,
  payment_status        text         NOT NULL
                                     CHECK (payment_status IN (
                                       'not_required', 'pending', 'payment_link_sent',
                                       'paid', 'cash_collected', 'refunded', 'waived'
                                     )),
  payment_type          text         CHECK (payment_type IN ('stripe', 'cash', 'bank_transfer', 'other')),
  payment_amount_paid   integer,
  payment_session_url   text,
  payment_reference     text,
  payment_notes         text,
  payment_paid_at       timestamptz,
  enrolled_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now()
);

-- push_tokens (richer than device_push_tokens; both tables coexist)
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       text        NOT NULL,
  platform    text        NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id   text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            text        NOT NULL
                              CHECK (type IN (
                                'enrollment_confirmed', 'enrollment_waitlisted',
                                'waitlist_promoted', 'payment_reminder',
                                'run_cancelled', 'new_run_added', 'session_reminder'
                              )),
  title           text        NOT NULL,
  body            text        NOT NULL,
  data_json       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  channel         text        NOT NULL CHECK (channel IN ('push', 'in_app', 'both')),
  push_status     text        NOT NULL DEFAULT 'pending'
                              CHECK (push_status IN ('pending', 'sent', 'failed', 'not_applicable')),
  expo_ticket_id  text,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid        NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  offering_run_id uuid        NOT NULL REFERENCES public.offering_runs(id) ON DELETE CASCADE,
  session_date    date        NOT NULL,
  routine_id      uuid        REFERENCES public.routines(id) ON DELETE SET NULL,
  status          text        NOT NULL DEFAULT 'absent'
                              CHECK (status IN ('present', 'absent', 'excused')),
  checked_in_at   timestamptz,
  checked_in_by   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, session_date)
);

-- ── 0A: INDEXES ─────────────────────────────────────────────

-- offering_runs
CREATE INDEX IF NOT EXISTS idx_offering_runs_offering_id ON public.offering_runs(offering_id);
CREATE INDEX IF NOT EXISTS idx_offering_runs_status ON public.offering_runs(status);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_offering_run_id ON public.enrollments(offering_run_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON public.enrollments(payment_status);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

-- push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_device
  ON public.push_tokens(user_id, device_id)
  WHERE device_id IS NOT NULL;

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_id ON public.attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_date ON public.attendance(session_date);

-- ── 0A: ENABLE RLS ──────────────────────────────────────────

ALTER TABLE public.offerings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_runs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance      ENABLE ROW LEVEL SECURITY;

-- ── 0B: RLS POLICIES ────────────────────────────────────────

-- offerings ─────────────────────────────────────────────────

-- Coaches can see their own offerings and all offerings in their academy
-- coach_id is a FK to coaches.id, NOT users.id — must resolve via coaches table
CREATE POLICY "coach_read_offerings" ON public.offerings FOR SELECT
  USING (
    coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    OR academy_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
  );

-- Coaches can insert offerings for their academy
CREATE POLICY "coach_insert_offerings" ON public.offerings FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT id FROM public.coaches WHERE user_id = auth.uid()
    )
  );

-- Coaches can update their own offerings only
CREATE POLICY "coach_update_offerings" ON public.offerings FOR UPDATE
  USING (
    coach_id IN (
      SELECT id FROM public.coaches WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM public.coaches WHERE user_id = auth.uid()
    )
  );

-- Students can read public offerings
CREATE POLICY "student_read_public_offerings" ON public.offerings FOR SELECT
  USING (is_public = true);

-- offering_runs ──────────────────────────────────────────────

-- Coaches see runs for offerings they can see
CREATE POLICY "coach_read_runs" ON public.offering_runs FOR SELECT
  USING (
    offering_id IN (
      SELECT id FROM public.offerings
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
         OR academy_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  );

-- Coaches insert/update runs on their own offerings only
CREATE POLICY "coach_insert_runs" ON public.offering_runs FOR INSERT
  WITH CHECK (
    offering_id IN (
      SELECT id FROM public.offerings
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "coach_update_runs" ON public.offering_runs FOR UPDATE
  USING (
    offering_id IN (
      SELECT id FROM public.offerings
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    offering_id IN (
      SELECT id FROM public.offerings
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  );

-- Students read runs on public offerings
CREATE POLICY "student_read_public_runs" ON public.offering_runs FOR SELECT
  USING (
    offering_id IN (
      SELECT id FROM public.offerings WHERE is_public = true
    )
  );

-- enrollments ────────────────────────────────────────────────

-- Coaches see enrollments for their runs
CREATE POLICY "coach_read_enrollments" ON public.enrollments FOR SELECT
  USING (
    offering_run_id IN (
      SELECT r.id FROM public.offering_runs r
      JOIN public.offerings o ON o.id = r.offering_id
      WHERE o.coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
         OR o.academy_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  );

-- Coaches can update payment columns (via RPC — but policy layer must allow)
CREATE POLICY "coach_update_enrollments" ON public.enrollments FOR UPDATE
  USING (
    offering_run_id IN (
      SELECT r.id FROM public.offering_runs r
      JOIN public.offerings o ON o.id = r.offering_id
      WHERE o.coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  );

-- Students see only their own enrollments
CREATE POLICY "student_read_own_enrollments" ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

-- push_tokens ────────────────────────────────────────────────

CREATE POLICY "user_manage_own_tokens" ON public.push_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- notifications ──────────────────────────────────────────────

-- Users read their own notifications
CREATE POLICY "user_read_own_notifications" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can only update read_at on their own notifications
CREATE POLICY "user_mark_read" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- attendance ─────────────────────────────────────────────────

-- Coaches read and write attendance for their runs
CREATE POLICY "coach_manage_attendance" ON public.attendance FOR ALL
  USING (
    offering_run_id IN (
      SELECT r.id FROM public.offering_runs r
      JOIN public.offerings o ON o.id = r.offering_id
      WHERE o.coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    offering_run_id IN (
      SELECT r.id FROM public.offering_runs r
      JOIN public.offerings o ON o.id = r.offering_id
      WHERE o.coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    )
  );

-- Students read their own attendance
CREATE POLICY "student_read_own_attendance" ON public.attendance FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM public.enrollments WHERE student_id = auth.uid()
    )
  );

-- ── 0C: RPCs ────────────────────────────────────────────────

-- Helper: resolve effective capacity for a run
-- Returns offering_runs.capacity if set, else offerings.capacity_per_run
CREATE OR REPLACE FUNCTION public._offering_run_capacity(p_run_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(r.capacity, o.capacity_per_run)
  FROM public.offering_runs r
  JOIN public.offerings o ON o.id = r.offering_id
  WHERE r.id = p_run_id
$$;

-- 1. create_offering
CREATE OR REPLACE FUNCTION public.create_offering(
  p_program_id        uuid,
  p_title             text,
  p_type              text,
  p_location          text,
  p_facility_name     text,
  p_capacity_per_run  integer,
  p_skill_level_min   numeric  DEFAULT NULL,
  p_skill_level_max   numeric  DEFAULT NULL,
  p_description       text     DEFAULT NULL,
  p_thumbnail_url     text     DEFAULT NULL,
  p_is_public         boolean  DEFAULT false,
  p_status            text     DEFAULT 'draft'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_coach_id  uuid;
  v_new_id    uuid;
BEGIN
  -- Resolve coach record for the calling user
  SELECT id INTO v_coach_id
  FROM public.coaches
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Caller is not a registered coach';
  END IF;

  INSERT INTO public.offerings (
    academy_id, program_id, coach_id, title, type, description,
    location, facility_name, capacity_per_run,
    skill_level_min, skill_level_max, thumbnail_url,
    is_public, status
  ) VALUES (
    v_coach_id, p_program_id, v_coach_id, p_title, p_type, p_description,
    p_location, p_facility_name, p_capacity_per_run,
    p_skill_level_min, p_skill_level_max, p_thumbnail_url,
    p_is_public, p_status
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 2. create_offering_run
CREATE OR REPLACE FUNCTION public.create_offering_run(
  p_offering_id       uuid,
  p_start_date        date,
  p_end_date          date,
  p_session_schedule  text,
  p_sessions_json     jsonb    DEFAULT '[]'::jsonb,
  p_capacity          integer  DEFAULT NULL,
  p_price_amount      integer  DEFAULT 0,
  p_price_currency    text     DEFAULT 'USD',
  p_payment_link_url  text     DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  -- Verify the caller owns this offering
  IF NOT EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE o.id = p_offering_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: offering not found or you are not the coach';
  END IF;

  INSERT INTO public.offering_runs (
    offering_id, start_date, end_date, session_schedule,
    sessions_json, capacity, price_amount, price_currency, payment_link_url
  ) VALUES (
    p_offering_id, p_start_date, p_end_date, p_session_schedule,
    p_sessions_json, p_capacity, COALESCE(p_price_amount, 0),
    COALESCE(p_price_currency, 'USD'), p_payment_link_url
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 3. get_offering_with_runs
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
            'run',          row_to_json(r.*),
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
  WHERE o.id = p_offering_id;

  RETURN v_result;
END;
$$;

-- 4. book_offering_run  (most critical — atomic spot-claiming)
CREATE OR REPLACE FUNCTION public.book_offering_run(p_offering_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_run            public.offering_runs%ROWTYPE;
  v_capacity       integer;
  v_student_id     uuid;
  v_enrollment_id  uuid;
  v_waitlist_pos   integer;
  v_is_confirmed   boolean;
  v_payment_status text;
  v_notif_type     text;
  v_offering_title text;
BEGIN
  -- Resolve student
  SELECT id INTO v_student_id
  FROM public.users
  WHERE id = auth.uid();

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'No user profile found';
  END IF;

  -- Prevent coaches from booking their own runs
  IF EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Coaches cannot enrol in their own offerings';
  END IF;

  -- Prevent duplicate booking
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE offering_run_id = p_offering_run_id
      AND student_id = v_student_id
      AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Already enrolled or waitlisted for this run';
  END IF;

  -- Lock the run row
  SELECT * INTO v_run
  FROM public.offering_runs
  WHERE id = p_offering_run_id
  FOR UPDATE;

  IF v_run.id IS NULL THEN
    RAISE EXCEPTION 'Run not found';
  END IF;

  IF v_run.status = 'closed' OR v_run.status = 'completed' THEN
    RAISE EXCEPTION 'This run is not open for booking';
  END IF;

  v_capacity := public._offering_run_capacity(p_offering_run_id);

  -- Get offering title for notification
  SELECT o.title INTO v_offering_title
  FROM public.offerings o
  JOIN public.offering_runs r ON r.offering_id = o.id
  WHERE r.id = p_offering_run_id;

  IF v_run.spots_filled < v_capacity THEN
    -- Confirmed spot
    v_is_confirmed   := true;
    v_payment_status := CASE WHEN v_run.price_amount > 0 THEN 'pending' ELSE 'not_required' END;
    v_notif_type     := 'enrollment_confirmed';

    INSERT INTO public.enrollments (
      offering_run_id, student_id, status, waitlist_position, payment_status
    ) VALUES (
      p_offering_run_id, v_student_id, 'confirmed', NULL, v_payment_status
    )
    RETURNING id INTO v_enrollment_id;

    UPDATE public.offering_runs
    SET spots_filled = spots_filled + 1,
        status       = CASE
                         WHEN spots_filled + 1 >= v_capacity THEN 'full'
                         ELSE status
                       END,
        updated_at   = now()
    WHERE id = p_offering_run_id;

  ELSE
    -- Waitlisted
    v_is_confirmed   := false;
    v_payment_status := 'not_required';  -- Locked decision: waitlist = not_required
    v_notif_type     := 'enrollment_waitlisted';

    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
    FROM public.enrollments
    WHERE offering_run_id = p_offering_run_id AND status = 'waitlisted';

    INSERT INTO public.enrollments (
      offering_run_id, student_id, status, waitlist_position, payment_status
    ) VALUES (
      p_offering_run_id, v_student_id, 'waitlisted', v_waitlist_pos, v_payment_status
    )
    RETURNING id INTO v_enrollment_id;
  END IF;

  -- Insert notification row (in-app inbox reads this immediately; push fires in Phase 3)
  INSERT INTO public.notifications (
    user_id, type, title, body, data_json, channel, push_status
  ) VALUES (
    v_student_id,
    v_notif_type,
    CASE v_notif_type
      WHEN 'enrollment_confirmed'  THEN 'Booking confirmed!'
      WHEN 'enrollment_waitlisted' THEN 'Added to waitlist'
    END,
    CASE v_notif_type
      WHEN 'enrollment_confirmed'  THEN 'Your spot in "' || v_offering_title || '" is confirmed.'
      WHEN 'enrollment_waitlisted' THEN 'You''re on the waitlist for "' || v_offering_title || '". We''ll notify you if a spot opens.'
    END,
    jsonb_build_object(
      'offering_run_id', p_offering_run_id,
      'enrollment_id',   v_enrollment_id
    ),
    'both',
    'pending'
  );

  RETURN jsonb_build_object(
    'enrollment_id',   v_enrollment_id,
    'status',          CASE WHEN v_is_confirmed THEN 'confirmed' ELSE 'waitlisted' END,
    'payment_status',  v_payment_status,
    'waitlist_position', v_waitlist_pos
  );
END;
$$;

-- 5. cancel_enrollment  (coach-initiated; promotes first waitlisted student)
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
  -- Verify caller is the coach of this run
  SELECT e.* INTO v_enrollment
  FROM public.enrollments e
  JOIN public.offering_runs r ON r.id = e.offering_run_id
  JOIN public.offerings o ON o.id = r.offering_id
  JOIN public.coaches c ON c.id = o.coach_id
  WHERE e.id = p_enrollment_id AND c.user_id = auth.uid();

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found or access denied';
  END IF;

  -- Lock the run row
  SELECT * INTO v_run
  FROM public.offering_runs
  WHERE id = v_enrollment.offering_run_id
  FOR UPDATE;

  -- Get offering title
  SELECT o.title INTO v_offering_title
  FROM public.offerings o
  JOIN public.offering_runs r ON r.offering_id = o.id
  WHERE r.id = v_enrollment.offering_run_id;

  -- Mark cancelled; refund if was paid
  UPDATE public.enrollments
  SET status         = 'cancelled',
      payment_status = CASE
                         WHEN payment_status IN ('paid', 'cash_collected') THEN 'refunded'
                         ELSE payment_status
                       END,
      updated_at     = now()
  WHERE id = p_enrollment_id;

  -- Decrement spots_filled only for confirmed cancellations
  IF v_enrollment.status = 'confirmed' THEN
    v_capacity := public._offering_run_capacity(v_enrollment.offering_run_id);

    UPDATE public.offering_runs
    SET spots_filled = GREATEST(spots_filled - 1, 0),
        status       = CASE WHEN status = 'full' THEN 'open' ELSE status END,
        updated_at   = now()
    WHERE id = v_enrollment.offering_run_id;

    -- Promote first waitlisted student
    SELECT e.id, e.student_id INTO v_promoted_id, v_promoted_user
    FROM public.enrollments e
    WHERE e.offering_run_id = v_enrollment.offering_run_id
      AND e.status = 'waitlisted'
    ORDER BY e.waitlist_position
    LIMIT 1;

    IF v_promoted_id IS NOT NULL THEN
      SELECT price_amount INTO v_run_price
      FROM public.offering_runs
      WHERE id = v_enrollment.offering_run_id;

      v_new_payment_status := CASE WHEN v_run_price > 0 THEN 'pending' ELSE 'not_required' END;

      UPDATE public.enrollments
      SET status            = 'confirmed',
          waitlist_position = NULL,
          payment_status    = v_new_payment_status,
          updated_at        = now()
      WHERE id = v_promoted_id;

      UPDATE public.offering_runs
      SET spots_filled = spots_filled + 1,
          updated_at   = now()
      WHERE id = v_enrollment.offering_run_id;

      -- Reorder remaining waitlist positions
      UPDATE public.enrollments
      SET waitlist_position = sub.new_pos,
          updated_at        = now()
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY waitlist_position) AS new_pos
        FROM public.enrollments
        WHERE offering_run_id = v_enrollment.offering_run_id
          AND status = 'waitlisted'
      ) sub
      WHERE public.enrollments.id = sub.id;

      -- Notify promoted student
      INSERT INTO public.notifications (
        user_id, type, title, body, data_json, channel, push_status
      ) VALUES (
        v_promoted_user,
        'waitlist_promoted',
        'Great news! You''re in!',
        'Your spot in "' || v_offering_title || '" has been confirmed.',
        jsonb_build_object(
          'offering_run_id', v_enrollment.offering_run_id,
          'enrollment_id',   v_promoted_id
        ),
        'both',
        'pending'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'cancelled_enrollment_id', p_enrollment_id,
    'promoted_enrollment_id',  v_promoted_id
  );
END;
$$;

-- 6. record_payment
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
  -- Verify caller is coach of this run
  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.offering_runs r ON r.id = e.offering_run_id
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE e.id = p_enrollment_id AND c.user_id = auth.uid()
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

-- 7. get_run_roster
CREATE OR REPLACE FUNCTION public.get_run_roster(p_offering_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify caller is the coach
  IF NOT EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
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

-- 8. update_offering
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

-- 9. update_offering_run
CREATE OR REPLACE FUNCTION public.update_offering_run(
  p_offering_run_id   uuid,
  p_start_date        date     DEFAULT NULL,
  p_end_date          date     DEFAULT NULL,
  p_session_schedule  text     DEFAULT NULL,
  p_sessions_json     jsonb    DEFAULT NULL,
  p_capacity          integer  DEFAULT NULL,
  p_price_amount      integer  DEFAULT NULL,
  p_price_currency    text     DEFAULT NULL,
  p_payment_link_url  text     DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: run not found or not your run';
  END IF;

  UPDATE public.offering_runs
  SET start_date        = COALESCE(p_start_date, start_date),
      end_date          = COALESCE(p_end_date, end_date),
      session_schedule  = COALESCE(p_session_schedule, session_schedule),
      sessions_json     = COALESCE(p_sessions_json, sessions_json),
      capacity          = COALESCE(p_capacity, capacity),
      price_amount      = COALESCE(p_price_amount, price_amount),
      price_currency    = COALESCE(p_price_currency, price_currency),
      payment_link_url  = COALESCE(p_payment_link_url, payment_link_url),
      updated_at        = now()
  WHERE id = p_offering_run_id;
END;
$$;

-- 10. close_offering_run
CREATE OR REPLACE FUNCTION public.close_offering_run(p_offering_run_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.offering_runs r
    JOIN public.offerings o ON o.id = r.offering_id
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE r.id = p_offering_run_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: run not found or not your run';
  END IF;

  UPDATE public.offering_runs
  SET status     = 'closed',
      updated_at = now()
  WHERE id = p_offering_run_id;
END;
$$;

-- 11. delete_offering  (soft delete: cancel all runs, mark offering cancelled)
CREATE OR REPLACE FUNCTION public.delete_offering(p_offering_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Allow superadmins (is_admin=true in users) or the coach themselves
  IF NOT EXISTS (
    SELECT 1 FROM public.offerings o
    JOIN public.coaches c ON c.id = o.coach_id
    WHERE o.id = p_offering_id AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: not the coach or admin';
  END IF;

  -- Cascade-close all open runs
  UPDATE public.offering_runs
  SET status     = 'closed',
      updated_at = now()
  WHERE offering_id = p_offering_id
    AND status NOT IN ('completed', 'closed');

  -- Mark offering cancelled
  UPDATE public.offerings
  SET status     = 'cancelled',
      is_public  = false,
      updated_at = now()
  WHERE id = p_offering_id;
END;
$$;

-- 12. send_payment_reminder
--     Inserts a notification row. Excludes waitlisted students.
--     Calls the send-notification Edge Function via pg_net (gracefully degrades if pg_net is not enabled).
CREATE OR REPLACE FUNCTION public.send_payment_reminder(p_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_enrollment     public.enrollments%ROWTYPE;
  v_offering_title text;
  v_notif_id       uuid;
  v_supabase_url   text;
BEGIN
  -- Verify caller is coach
  SELECT e.* INTO v_enrollment
  FROM public.enrollments e
  JOIN public.offering_runs r ON r.id = e.offering_run_id
  JOIN public.offerings o ON o.id = r.offering_id
  JOIN public.coaches c ON c.id = o.coach_id
  WHERE e.id = p_enrollment_id AND c.user_id = auth.uid();

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found or access denied';
  END IF;

  -- Skip waitlisted students (locked decision)
  IF v_enrollment.status = 'waitlisted' THEN
    RAISE EXCEPTION 'Cannot send payment reminder to waitlisted student';
  END IF;

  -- Skip students who already paid
  IF v_enrollment.payment_status IN ('paid', 'cash_collected', 'waived', 'not_required') THEN
    RAISE EXCEPTION 'No payment required or already completed for this enrollment';
  END IF;

  -- Get offering title
  SELECT o.title INTO v_offering_title
  FROM public.offerings o
  JOIN public.offering_runs r ON r.offering_id = o.id
  WHERE r.id = v_enrollment.offering_run_id;

  -- Insert notification row
  INSERT INTO public.notifications (
    user_id, type, title, body, data_json, channel, push_status
  ) VALUES (
    v_enrollment.student_id,
    'payment_reminder',
    'Payment reminder',
    'Your coach has sent a payment reminder for "' || v_offering_title || '".',
    jsonb_build_object(
      'offering_run_id', v_enrollment.offering_run_id,
      'enrollment_id',   p_enrollment_id
    ),
    'both',
    'pending'
  )
  RETURNING id INTO v_notif_id;

  -- Attempt to invoke Edge Function via pg_net (graceful no-op if extension not enabled)
  BEGIN
    v_supabase_url := current_setting('app.supabase_url', true);
    IF v_supabase_url IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification',
        body    := jsonb_build_object('notification_id', v_notif_id)::text,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- pg_net not available or misconfigured — notification row already inserted, skip push
    NULL;
  END;
END;
$$;

-- 13. upsert_push_token
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
    -- Upsert by (user_id, device_id)
    INSERT INTO public.push_tokens (user_id, token, platform, device_id, is_active, updated_at)
    VALUES (v_user_id, p_token, p_platform, p_device_id, true, now())
    ON CONFLICT (user_id, device_id) WHERE device_id IS NOT NULL
    DO UPDATE SET token = EXCLUDED.token, platform = EXCLUDED.platform,
                  is_active = true, updated_at = now();
  ELSE
    -- Upsert by (user_id, platform) when no device_id
    INSERT INTO public.push_tokens (user_id, token, platform, device_id, is_active, updated_at)
    VALUES (v_user_id, p_token, p_platform, NULL, true, now())
    ON CONFLICT DO NOTHING;

    UPDATE public.push_tokens
    SET token = p_token, is_active = true, updated_at = now()
    WHERE user_id = v_user_id AND platform = p_platform AND device_id IS NULL;
  END IF;
END;
$$;

-- 14. mark_notifications_read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_ids uuid[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;
