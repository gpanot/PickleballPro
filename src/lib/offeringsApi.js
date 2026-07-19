/**
 * offeringsApi.js
 *
 * Thin wrappers over all 14 Offerings RPCs.
 * All functions return { data, error } — same pattern as the rest of supabase.js.
 *
 * RPC signatures match the migration in:
 *   supabase/migrations/20260720000000_offerings_v1.sql
 */

import { supabase } from './supabase';

// ─── Coach: create/update/delete ─────────────────────────────────────────────

/**
 * Create a new offering (coach only).
 * Returns { data: offering_id (uuid), error }
 */
export const createOffering = async ({
  programId,
  title,
  type,              // 'cohort' | 'event'
  location,
  facilityName,
  capacityPerRun,
  skillLevelMin = null,
  skillLevelMax = null,
  description   = null,
  thumbnailUrl  = null,
  isPublic      = false,
  status        = 'draft',
}) => {
  const { data, error } = await supabase.rpc('create_offering', {
    p_program_id:       programId,
    p_title:            title,
    p_type:             type,
    p_location:         location,
    p_facility_name:    facilityName,
    p_capacity_per_run: capacityPerRun,
    p_skill_level_min:  skillLevelMin,
    p_skill_level_max:  skillLevelMax,
    p_description:      description,
    p_thumbnail_url:    thumbnailUrl,
    p_is_public:        isPublic,
    p_status:           status,
  });
  return { data, error };
};

/**
 * Create a run for an existing offering.
 * Returns { data: offering_run_id (uuid), error }
 */
export const createOfferingRun = async ({
  offeringId,
  startDate,
  endDate,
  sessionSchedule,
  sessionsJson     = [],
  capacity         = null,
  priceAmount      = 0,
  priceCurrency    = 'USD',
  paymentLinkUrl   = null,
}) => {
  const { data, error } = await supabase.rpc('create_offering_run', {
    p_offering_id:       offeringId,
    p_start_date:        startDate,
    p_end_date:          endDate,
    p_session_schedule:  sessionSchedule,
    p_sessions_json:     sessionsJson,
    p_capacity:          capacity,
    p_price_amount:      priceAmount,
    p_price_currency:    priceCurrency,
    p_payment_link_url:  paymentLinkUrl,
  });
  return { data, error };
};

/**
 * Fetch offering + all runs + per-run confirmed/waitlist counts.
 * Returns { data: { offering, runs: [{ run, confirmed_count, waitlist_count }] }, error }
 */
export const getOfferingWithRuns = async (offeringId) => {
  const { data, error } = await supabase.rpc('get_offering_with_runs', {
    p_offering_id: offeringId,
  });
  return { data, error };
};

/**
 * Update offering fields (null values are ignored / not updated).
 */
export const updateOffering = async ({
  offeringId,
  title           = null,
  description     = null,
  location        = null,
  facilityName    = null,
  capacityPerRun  = null,
  skillLevelMin   = null,
  skillLevelMax   = null,
  thumbnailUrl    = null,
  isPublic        = null,
  status          = null,
}) => {
  const { data, error } = await supabase.rpc('update_offering', {
    p_offering_id:      offeringId,
    p_title:            title,
    p_description:      description,
    p_location:         location,
    p_facility_name:    facilityName,
    p_capacity_per_run: capacityPerRun,
    p_skill_level_min:  skillLevelMin,
    p_skill_level_max:  skillLevelMax,
    p_thumbnail_url:    thumbnailUrl,
    p_is_public:        isPublic,
    p_status:           status,
  });
  return { data, error };
};

/**
 * Update a run's fields (null values are ignored).
 */
export const updateOfferingRun = async ({
  offeringRunId,
  startDate        = null,
  endDate          = null,
  sessionSchedule  = null,
  sessionsJson     = null,
  capacity         = null,
  priceAmount      = null,
  priceCurrency    = null,
  paymentLinkUrl   = null,
}) => {
  const { data, error } = await supabase.rpc('update_offering_run', {
    p_offering_run_id:  offeringRunId,
    p_start_date:       startDate,
    p_end_date:         endDate,
    p_session_schedule: sessionSchedule,
    p_sessions_json:    sessionsJson,
    p_capacity:         capacity,
    p_price_amount:     priceAmount,
    p_price_currency:   priceCurrency,
    p_payment_link_url: paymentLinkUrl,
  });
  return { data, error };
};

/**
 * Close a run (status → 'closed').
 */
export const closeOfferingRun = async (offeringRunId) => {
  const { data, error } = await supabase.rpc('close_offering_run', {
    p_offering_run_id: offeringRunId,
  });
  return { data, error };
};

/**
 * Soft-delete an offering and cascade-close all its runs.
 */
export const deleteOffering = async (offeringId) => {
  const { data, error } = await supabase.rpc('delete_offering', {
    p_offering_id: offeringId,
  });
  return { data, error };
};

// ─── Coach: roster & payments ────────────────────────────────────────────────

/**
 * Fetch the full roster for a run (confirmed + waitlisted, excluding cancelled).
 * Returns { data: [...enrollment rows with student profile], error }
 */
export const getRunRoster = async (offeringRunId) => {
  const { data, error } = await supabase.rpc('get_run_roster', {
    p_offering_run_id: offeringRunId,
  });
  return { data, error };
};

/**
 * Record a manual payment (cash / bank transfer / other).
 * @param paymentType  'stripe' | 'cash' | 'bank_transfer' | 'other'
 */
export const recordPayment = async ({
  enrollmentId,
  paymentType,
  paymentAmountPaid = null,
  paymentReference  = null,
  paymentNotes      = null,
}) => {
  const { data, error } = await supabase.rpc('record_payment', {
    p_enrollment_id:        enrollmentId,
    p_payment_type:         paymentType,
    p_payment_amount_paid:  paymentAmountPaid,
    p_payment_reference:    paymentReference,
    p_payment_notes:        paymentNotes,
  });
  return { data, error };
};

/**
 * Cancel an enrollment (coach-initiated).
 * Promotes the first waitlisted student automatically.
 * Returns { data: { cancelled_enrollment_id, promoted_enrollment_id }, error }
 */
export const cancelEnrollment = async (enrollmentId) => {
  const { data, error } = await supabase.rpc('cancel_enrollment', {
    p_enrollment_id: enrollmentId,
  });
  return { data, error };
};

/**
 * Send a payment reminder to a confirmed student.
 * Inserts a notification row; push fires in Phase 3.
 */
export const sendPaymentReminder = async (enrollmentId) => {
  const { data, error } = await supabase.rpc('send_payment_reminder', {
    p_enrollment_id: enrollmentId,
  });
  return { data, error };
};

// ─── Student ─────────────────────────────────────────────────────────────────

/**
 * Book a run as a student.
 * Returns { data: { enrollment_id, status, payment_status, waitlist_position }, error }
 */
export const bookOfferingRun = async (offeringRunId) => {
  const { data, error } = await supabase.rpc('book_offering_run', {
    p_offering_run_id: offeringRunId,
  });
  return { data, error };
};

// ─── Push tokens ─────────────────────────────────────────────────────────────

/**
 * Register or refresh a push token for the current user's device.
 */
export const upsertPushToken = async ({ token, platform, deviceId = null }) => {
  const { data, error } = await supabase.rpc('upsert_push_token', {
    p_token:     token,
    p_platform:  platform,
    p_device_id: deviceId,
  });
  return { data, error };
};

// ─── Notifications ───────────────────────────────────────────────────────────

/**
 * Mark a list of notification IDs as read.
 * @param notificationIds  uuid[]
 */
export const markNotificationsRead = async (notificationIds) => {
  const { data, error } = await supabase.rpc('mark_notifications_read', {
    p_notification_ids: notificationIds,
  });
  return { data, error };
};

/**
 * Fetch all notifications for the current user, most recent first.
 * Returns { data: [...notification rows], error }
 */
export const getMyNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return { data, error };
};

/**
 * Fetch the count of unread notifications for the current user.
 * Returns { count: number, error }
 */
export const getUnreadNotificationCount = async () => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  return { count: count ?? 0, error };
};

// ─── Student: browse offerings ────────────────────────────────────────────────

/**
 * Fetch all public offerings with their runs for the Explore screen.
 * Returns { data: [...offerings with runs], error }
 */
export const getPublicOfferings = async ({ type = null, skillMin = null, skillMax = null } = {}) => {
  let query = supabase
    .from('offerings')
    .select(`
      id, title, type, description, location, facility_name,
      thumbnail_url, skill_level_min, skill_level_max, status,
      program_id,
      coach:coaches!coach_id (
        id, name, bio, avatar_url, rating_avg, rating_count
      ),
      runs:offering_runs (
        id, start_date, end_date, session_schedule, sessions_json,
        capacity, spots_filled, price_amount, price_currency,
        payment_link_url, status
      )
    `)
    .eq('is_public', true)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }
  if (skillMin !== null) {
    query = query.gte('skill_level_max', skillMin);
  }
  if (skillMax !== null) {
    query = query.lte('skill_level_min', skillMax);
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Fetch all enrollments for the current user (My Bookings screen).
 * Returns { data: [...enrollment rows with run + offering info], error }
 */
export const getMyEnrollments = async () => {
  // Explicit student_id filter prevents coaches from seeing their students'
  // enrollments on the My Bookings screen (multiple RLS policies would otherwise merge).
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id, status, waitlist_position, payment_status, payment_type,
      payment_amount_paid, payment_paid_at, enrolled_at,
      run:offering_runs (
        id, start_date, end_date, session_schedule, sessions_json,
        price_amount, price_currency, payment_link_url, status, capacity, spots_filled,
        offering:offerings (
          id, title, type, location, thumbnail_url,
          coach:coaches!coach_id ( id, name, avatar_url )
        )
      )
    `)
    .eq('student_id', user.id)
    .not('status', 'eq', 'cancelled')
    .order('enrolled_at', { ascending: false });
  return { data, error };
};

// ─── Coach: list own offerings ────────────────────────────────────────────────

/**
 * Fetch all offerings for the calling coach, with run count and next run date.
 */
export const getCoachOfferings = async () => {
  const { data, error } = await supabase
    .from('offerings')
    .select(`
      id, title, type, description, location, thumbnail_url,
      capacity_per_run, skill_level_min, skill_level_max, is_public, status,
      created_at, updated_at,
      runs:offering_runs (
        id, start_date, end_date, price_amount, price_currency, status,
        spots_filled, capacity
      )
    `)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false });
  return { data, error };
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Format a price for display.
 * price_amount is in cents (e.g. 125000 = $1,250).
 * price_amount = 0 displays as 'Free'.
 */
export const formatPrice = (priceAmount, priceCurrency = 'USD') => {
  if (!priceAmount || priceAmount === 0) return 'Free';
  const amount = priceAmount / 100;
  if (priceCurrency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(priceAmount); // VND stored as-is (not in cents)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: priceCurrency,
  }).format(amount);
};

/**
 * Compute the price range label for an offering based on its runs.
 * E.g. "From $399" or "Free" or "$399 – $599"
 */
export const getPriceRangeLabel = (runs = []) => {
  const openRuns = runs.filter(r => r.status !== 'closed' && r.status !== 'completed');
  if (!openRuns.length) return '';

  const prices = openRuns.map(r => r.price_amount || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === 0 && max === 0) return 'Free';
  const currency = openRuns[0].price_currency || 'USD';
  if (min === max) return formatPrice(min, currency);
  return `From ${formatPrice(min, currency)}`;
};

/**
 * Returns the next open run from a list (soonest start_date where status='open').
 */
export const getNextOpenRun = (runs = []) => {
  const today = new Date().toISOString().split('T')[0];
  return runs
    .filter(r => r.status === 'open' && r.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] || null;
};

/**
 * Effective capacity for a run.
 * Uses run.capacity if set, else defaults to a provided offeringCapacity.
 */
export const effectiveCapacity = (run, offeringCapacity) =>
  run.capacity ?? offeringCapacity;

/**
 * Spots remaining for a run.
 */
export const spotsRemaining = (run, offeringCapacity) =>
  effectiveCapacity(run, offeringCapacity) - (run.spots_filled || 0);

// ─── Attendance ───────────────────────────────────────────────────────────────

/**
 * Fetch attendance rows for a specific run and session date.
 * Joins enrollment → user so the coach sees student names.
 * Returns { data: [{ id, enrollment_id, session_date, status, student_name, student_email }], error }
 */
export const getAttendanceForSession = async (offeringRunId, sessionDate) => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      enrollment_id,
      session_date,
      status,
      checked_in_at,
      enrollment:enrollments (
        student:users ( id, name, email )
      )
    `)
    .eq('offering_run_id', offeringRunId)
    .eq('session_date', sessionDate)
    .order('created_at', { ascending: true });

  const rows = (data ?? []).map((row) => ({
    id:            row.id,
    enrollment_id: row.enrollment_id,
    session_date:  row.session_date,
    status:        row.status,
    checked_in_at: row.checked_in_at,
    student_name:  row.enrollment?.student?.name ?? 'Unknown',
    student_email: row.enrollment?.student?.email ?? '',
  }));

  return { data: rows, error };
};

/**
 * Toggle a student's attendance status for a session.
 * status: 'present' | 'absent'
 */
export const updateAttendanceStatus = async (attendanceId, status) => {
  const update = {
    status,
    ...(status === 'present'
      ? { checked_in_at: new Date().toISOString() }
      : { checked_in_at: null }),
  };
  const { data, error } = await supabase
    .from('attendance')
    .update(update)
    .eq('id', attendanceId)
    .select('id, status, checked_in_at')
    .single();
  return { data, error };
};
