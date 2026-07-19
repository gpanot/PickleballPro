# Offerings — Feature Spec
## AcademyPro (CourtFlow)

**Version:** 1.2
**Status:** Ready for development
**Surfaces:** Supabase backend · Mobile app (React Native / Expo) · Web admin dashboard

---

## 1. Problem statement

Coaches on AcademyPro currently manage programs (curriculum content) but have no way to schedule or sell structured training experiences. A program describes what students will learn. An offering is the real product a coach sells: a scheduled run of that program with dates, a location, a price, a capacity limit, and a roster. Without offerings the platform cannot support the core business model of multi-location academies running recurring cohorts and one-off camps across a year.

---

## 2. Core concepts

**Program** — the content template (routines, exercises, structure). Already exists.

**Offering** — a named, publishable package built on a program. Describes format, location, skill level, and default capacity per run.

**Offering run** — a specific scheduled instance of an offering with its own price, dates, and independent roster. The same offering can have multiple runs (Q1, Q2, Summer Camp). Students pick the run that fits their schedule.

**Enrollment** — a student's confirmed or waitlisted spot in a specific run, with its own payment state.

---

## 3. Data model

All six tables are created in a single migration in Phase 0. They have foreign key dependencies between them and must land atomically.

---

### `offerings`

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Primary key |
| `academy_id` | uuid | | FK coaches.id — lead coach / academy owner |
| `program_id` | uuid | | FK programs.id — content template |
| `coach_id` | uuid | | FK coaches.id — who delivers it (can differ from academy owner) |
| `title` | text | | Display name, pre-filled from program name, editable |
| `type` | text | | `cohort` or `event` |
| `description` | text | null | Optional public-facing description |
| `location` | text | null | City / venue name |
| `facility_name` | text | null | Full facility name |
| `capacity_per_run` | integer | | Default max enrollments per run; overridable per run |
| `skill_level_min` | numeric | null | Min DUPR (e.g. 3.0) |
| `skill_level_max` | numeric | null | Max DUPR (e.g. 4.5) |
| `thumbnail_url` | text | null | Per-offering image; falls back to program thumbnail if null |
| `is_public` | boolean | false | Whether visible in student Explore |
| `status` | text | `draft` | `draft`, `open`, `completed`, `cancelled` |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

---

### `offering_runs`

Price lives here, not on the offering, because it can fluctuate between runs of the same offering (early-bird Q1 vs standard Q2, camp premium vs regular cohort).

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Primary key |
| `offering_id` | uuid | | FK offerings.id |
| `start_date` | date | | |
| `end_date` | date | | |
| `session_schedule` | text | | Human-readable, e.g. "Every Mon 9:00–12:00" |
| `sessions_json` | jsonb | `[]` | Array of `{ routine_id, date, start_time, end_time }` |
| `capacity` | integer | null | Overrides offering.capacity_per_run when set |
| `spots_filled` | integer | 0 | RPC-only write. Never updated directly. |
| `price_amount` | integer | 0 | Price in cents (e.g. 125000 = $1,250.00). 0 = free. |
| `price_currency` | text | `USD` | ISO 4217 code. |
| `payment_link_url` | text | null | Generic Stripe Payment Link set by coach, shared across all students for this run. Null if free or cash-only. |
| `status` | text | `open` | `open`, `full`, `closed`, `completed` |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Price display rule:** `price_amount / 100` formatted with `price_currency`. Zero displays as "Free". Null must not occur — enforce `DEFAULT 0` and `NOT NULL`.

---

### `enrollments`

Payment state lives here, not on the run, because each student's payment is independent of every other student in the same run.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Primary key |
| `offering_run_id` | uuid | | FK offering_runs.id |
| `student_id` | uuid | | FK users.id |
| `status` | text | | `confirmed`, `waitlisted`, `cancelled` |
| `waitlist_position` | integer | null | Null if confirmed. 1-based position if waitlisted. |
| `payment_status` | text | | See payment status values below |
| `payment_type` | text | null | See payment type values below. Null until payment is recorded. |
| `payment_amount_paid` | integer | null | Actual cents paid. May differ from run price (partial, discount, waiver). |
| `payment_session_url` | text | null | Per-student Stripe Checkout Session URL. Generated at booking if Stripe is configured. |
| `payment_reference` | text | null | Stripe PaymentIntent ID, cash receipt number, bank transfer ref, etc. Set by webhook or manually. |
| `payment_notes` | text | null | Free-text coach notes, e.g. "Paid via Venmo", "Instalment 1 of 2". |
| `payment_paid_at` | timestamptz | null | Timestamp of confirmed payment. Set by webhook or manual coach action. |
| `enrolled_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

**Payment status values:**

| Value | When it is set |
|---|---|
| `not_required` | Run price_amount = 0. Set on insert. No further payment action needed. |
| `pending` | Run is paid. Default on insert. Student booked but not yet paid. |
| `payment_link_sent` | Coach explicitly sent the payment link to the student. |
| `paid` | Payment confirmed via Stripe webhook or manual coach action. |
| `cash_collected` | Coach manually recorded an in-person cash payment. |
| `refunded` | Payment reversed. Coach handles the actual refund externally. |
| `waived` | Coach waived payment for this student (scholarship, staff, etc.). |

**Payment type values:**

| Value | Meaning |
|---|---|
| `stripe` | Online card payment via Stripe. |
| `cash` | In-person cash, manually recorded by coach. |
| `bank_transfer` | ACH, wire, or bank transfer. |
| `other` | Any other method (Venmo, PayPal, etc.) — detail in payment_notes. |

Payment type is null until a payment is recorded by the coach or a Stripe webhook.

---

### `push_tokens`

Stores Expo push tokens per device. Table is created in Phase 0. Token registration logic ships in Phase 2. Push sending ships in Phase 3.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | | FK users.id |
| `token` | text | | Expo push token (`ExponentPushToken[...]`) |
| `platform` | text | | `ios` or `android` |
| `device_id` | text | null | Prevents duplicate tokens on re-install. Upsert key with user_id. |
| `is_active` | boolean | true | Set to false when Expo returns DeviceNotRegistered. |
| `created_at` | timestamptz | now() | |
| `updated_at` | timestamptz | now() | |

---

### `notifications`

Tracks every notification sent or queued, across push and in-app channels. Table is created in Phase 0. In-app inbox reads from this table in Phase 2. Push delivery from this table ships in Phase 3.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Primary key |
| `user_id` | uuid | | FK users.id — recipient |
| `type` | text | | See notification types below |
| `title` | text | | Notification headline |
| `body` | text | | Notification body text |
| `data_json` | jsonb | `{}` | Contextual payload, e.g. `{ offering_run_id, enrollment_id }` |
| `channel` | text | | `push`, `in_app`, or `both` |
| `push_status` | text | `pending` | `pending`, `sent`, `failed`, `not_applicable` |
| `expo_ticket_id` | text | null | Expo push receipt ID for delivery verification |
| `read_at` | timestamptz | null | Null until the student opens the notification |
| `created_at` | timestamptz | now() | |

**Notification types:**

| Type | Trigger | Recipient |
|---|---|---|
| `enrollment_confirmed` | Student books a run | Student |
| `enrollment_waitlisted` | Student joins waitlist | Student |
| `waitlist_promoted` | A confirmed spot is freed | First waitlisted student |
| `payment_reminder` | Coach sends reminder or scheduled job fires | Student |
| `run_cancelled` | Coach closes a run with enrolled students | All enrolled students |
| `new_run_added` | Coach adds a run to an open offering | Students who enquired but did not book |
| `session_reminder` | 24h before a session date | All enrolled students for that run |

---

### `attendance`

Architecture is established now. No UI is built in Phases 0–2. The table must exist before runs go live so attendance rows can be auto-generated as sessions occur. UI ships in Phase 4.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | Primary key |
| `enrollment_id` | uuid | | FK enrollments.id |
| `offering_run_id` | uuid | | FK offering_runs.id |
| `session_date` | date | | Specific session date from sessions_json |
| `routine_id` | uuid | | FK routines.id — which routine was delivered |
| `status` | text | `absent` | `present`, `absent`, `excused` |
| `checked_in_at` | timestamptz | null | Null if absent or excused |
| `checked_in_by` | uuid | null | FK users.id — coach who marked it |
| `notes` | text | null | Optional per-session coach note |
| `created_at` | timestamptz | now() | |

On each session date, a scheduled Edge Function auto-inserts rows with `status = 'absent'` for all confirmed enrollments in that run. The check-in UI (Phase 4) only needs to flip rows to `present` — coaches never enter every row from scratch.

---

## 4. Indexes

Create these alongside the migration. Critical for query performance once enrollments scale.

```sql
-- offering_runs
CREATE INDEX idx_offering_runs_offering_id ON offering_runs(offering_id);
CREATE INDEX idx_offering_runs_status ON offering_runs(status);

-- enrollments
CREATE INDEX idx_enrollments_offering_run_id ON enrollments(offering_run_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;

-- push_tokens
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE UNIQUE INDEX idx_push_tokens_device ON push_tokens(user_id, device_id) WHERE device_id IS NOT NULL;

-- attendance
CREATE INDEX idx_attendance_enrollment_id ON attendance(enrollment_id);
CREATE INDEX idx_attendance_session_date ON attendance(session_date);
```

---

## 5. RLS policies

Write and verify all policies before writing any RPC. Bugs here are invisible and dangerous.

### `offerings`
```sql
-- Coaches can see their own offerings and all offerings in their academy
CREATE POLICY "coach_read_offerings" ON offerings FOR SELECT
  USING (
    coach_id = auth.uid()
    OR academy_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
  );

-- Coaches can insert offerings for their academy
CREATE POLICY "coach_insert_offerings" ON offerings FOR INSERT
  WITH CHECK (academy_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- Coaches can update their own offerings only
CREATE POLICY "coach_update_offerings" ON offerings FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Students can read public offerings
CREATE POLICY "student_read_public_offerings" ON offerings FOR SELECT
  USING (is_public = true);
```

### `offering_runs`
```sql
-- Coaches see runs for offerings they can see
CREATE POLICY "coach_read_runs" ON offering_runs FOR SELECT
  USING (offering_id IN (SELECT id FROM offerings WHERE coach_id = auth.uid()
    OR academy_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())));

-- Coaches insert/update runs on their own offerings only
CREATE POLICY "coach_write_runs" ON offering_runs FOR INSERT
  WITH CHECK (offering_id IN (SELECT id FROM offerings WHERE coach_id = auth.uid()));

CREATE POLICY "coach_update_runs" ON offering_runs FOR UPDATE
  USING (offering_id IN (SELECT id FROM offerings WHERE coach_id = auth.uid()))
  WITH CHECK (offering_id IN (SELECT id FROM offerings WHERE coach_id = auth.uid()));

-- Students read runs on public offerings
CREATE POLICY "student_read_public_runs" ON offering_runs FOR SELECT
  USING (offering_id IN (SELECT id FROM offerings WHERE is_public = true));

-- spots_filled is never written directly by any client — RPC only
-- No INSERT or UPDATE policy grants column-level access to spots_filled
```

### `enrollments`
```sql
-- Coaches see enrollments for their runs
CREATE POLICY "coach_read_enrollments" ON enrollments FOR SELECT
  USING (offering_run_id IN (
    SELECT r.id FROM offering_runs r
    JOIN offerings o ON o.id = r.offering_id
    WHERE o.coach_id = auth.uid()
    OR o.academy_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
  ));

-- Students see only their own enrollments
CREATE POLICY "student_read_own_enrollments" ON enrollments FOR SELECT
  USING (student_id = auth.uid());

-- No direct INSERT for any role — book_offering_run RPC only
-- No direct UPDATE for students — record_payment RPC only (coach-gated)
-- Coaches update payment columns via record_payment RPC (service role function)
```

### `push_tokens`
```sql
CREATE POLICY "user_manage_own_tokens" ON push_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### `notifications`
```sql
-- Users read their own notifications
CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can only update read_at on their own notifications
CREATE POLICY "user_mark_read" ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Inserts only via RPC (service role) — no direct client insert
```

### `attendance`
```sql
-- Coaches read and write attendance for their runs
CREATE POLICY "coach_manage_attendance" ON attendance FOR ALL
  USING (offering_run_id IN (
    SELECT r.id FROM offering_runs r
    JOIN offerings o ON o.id = r.offering_id
    WHERE o.coach_id = auth.uid()
  ))
  WITH CHECK (offering_run_id IN (
    SELECT r.id FROM offering_runs r
    JOIN offerings o ON o.id = r.offering_id
    WHERE o.coach_id = auth.uid()
  ));

-- Students read their own attendance
CREATE POLICY "student_read_own_attendance" ON attendance FOR SELECT
  USING (enrollment_id IN (
    SELECT id FROM enrollments WHERE student_id = auth.uid()
  ));
```

---

## 6. RPC reference

All RPCs are written and tested in Phase 0 before any UI is built.

| RPC | Caller | Purpose |
|---|---|---|
| `create_offering` | Coach | Insert offering row, return id |
| `create_offering_run` | Coach | Insert run row with price and payment link, return id |
| `update_offering` | Coach | Edit offering fields |
| `update_offering_run` | Coach | Edit run dates, schedule, price, payment link |
| `close_offering_run` | Coach | Set run status to `closed` |
| `delete_offering` | Admin | Soft delete offering and cascade-close all runs |
| `book_offering_run` | Student | Atomic: check capacity → insert enrollment with payment_status → increment spots_filled → flip run to full if needed → insert notification row |
| `cancel_enrollment` | Coach | Set enrollment to `cancelled` → decrement spots_filled → reopen run if was full → promote first waitlisted student → insert notification rows |
| `record_payment` | Coach | Update payment_status, payment_type, payment_amount_paid, payment_paid_at, payment_reference, payment_notes |
| `send_payment_reminder` | Coach | Insert payment_reminder notification row → invoke send-notification Edge Function stub |
| `get_offering_with_runs` | Coach + Student | Return offering + all runs + per-run enrolled/waitlist counts + price |
| `get_run_roster` | Coach | Return confirmed + waitlisted enrollments for a run including all payment columns |
| `upsert_push_token` | Student | Insert or update push_tokens row for the current device |
| `mark_notifications_read` | Student | Set read_at = now() on a list of notification IDs owned by the caller |

---

## 7. Booking logic

### On booking

1. Within a transaction, lock the run row (`SELECT ... FOR UPDATE`).
2. Resolve effective capacity: use `offering_runs.capacity` if set, else `offerings.capacity_per_run`.
3. If `spots_filled < capacity`: insert enrollment with `status = 'confirmed'`, `payment_status = 'not_required'` if `price_amount = 0` else `payment_status = 'pending'`. Increment `spots_filled`. If `spots_filled` now equals capacity, set run `status = 'full'`.
4. If `spots_filled >= capacity`: insert enrollment with `status = 'waitlisted'`, `waitlist_position` = current waitlist count + 1, `payment_status = 'pending'`.
5. Insert a `notifications` row (`enrollment_confirmed` or `enrollment_waitlisted`). The in-app inbox reads this immediately. Push delivery fires in Phase 3.

### On cancellation (coach-initiated)

1. Set enrollment `status = 'cancelled'`.
2. Decrement `spots_filled` on the run.
3. Set run `status = 'open'` if it was `full`.
4. Find the lowest `waitlist_position` enrollment on the same run with `status = 'waitlisted'`.
5. If found: set `status = 'confirmed'`, clear `waitlist_position`, increment `spots_filled`, insert `waitlist_promoted` notification.
6. If the cancelled enrollment had `payment_status = 'paid'`, set to `refunded`. Actual refund is handled externally by the coach. Log in `payment_notes`.

### On Stripe webhook (Phase 3)

When `payment_intent.succeeded` arrives at the `stripe-webhook` Edge Function:
1. Match `payment_reference` (PaymentIntent ID) to an enrollment.
2. Set `payment_status = 'paid'`, `payment_type = 'stripe'`, `payment_amount_paid`, `payment_paid_at = now()`.
3. Insert `enrollment_confirmed` or a payment confirmation notification.

The enrollment row is fully structured to receive this without a migration.

### On manual payment recording (coach)

Coach calls `record_payment` RPC with enrollment id, payment_type, optional amount and reference. RPC updates all payment columns and inserts a `payment_confirmed` notification.

---

## 8. Edge Functions

Both functions are created as stubs in Phase 0. Real logic ships in Phase 3.

### `stripe-webhook` (stub in Phase 0, full in Phase 3)

Receives POST from Stripe. Verifies signature with `STRIPE_WEBHOOK_SECRET`. Handles `payment_intent.succeeded` and `payment_intent.payment_failed` events. Matches PaymentIntent to enrollment via `payment_reference`. Updates payment columns via service role.

### `send-notification` (stub in Phase 0, full in Phase 3)

Invoked by RPCs via `pg_net.http_post`. Reads notification row. Looks up active push tokens for recipient. Calls Expo Push API. Stores `expo_ticket_id`. Updates `push_status` to `sent` or `failed`. On `DeviceNotRegistered` error: sets token `is_active = false`.

### `generate-attendance` (Phase 4)

Scheduled via pg_cron. Runs at 00:01 on each day that has a session. Selects all confirmed enrollments for runs with a session on that date. Inserts `attendance` rows with `status = 'absent'` where a row does not already exist for that enrollment + session_date combination.

---

## 9. Push notification system (PNS)

### Token registration (Phase 2)

1. On app launch (authenticated), request permission via `expo-notifications`.
2. If granted, call `Notifications.getExpoPushTokenAsync()`.
3. Call `upsert_push_token` RPC with token, platform, and device_id.
4. On foreground launch: confirm `is_active = true`.
5. On `DeviceNotRegistered` error returned from Expo in Phase 3: set `is_active = false`.

### Notification delivery (Phase 3)

All sends go through the `send-notification` Edge Function. Never called directly from the client.

Trigger sources:
- RPC side effects (booking, waitlist promotion): RPC inserts `notifications` row then calls Edge Function via `pg_net`.
- Scheduled jobs via pg_cron (session reminders 24h before session date): cron selects upcoming sessions, inserts notification rows, invokes Edge Function.
- Manual coach action (payment reminder button in roster): client calls `send_payment_reminder` RPC.

### Delivery receipt verification (Phase 3)

A pg_cron job runs 15 minutes after each send batch. Calls Expo receipt API with stored `expo_ticket_id` values. On `DeviceNotRegistered`: sets `is_active = false` on the token. Updates `push_status` accordingly.

---

## 10. Session check-in (architecture only — UI in Phase 4)

The `attendance` table exists from Phase 0. No screens are built until Phase 4.

When Phase 4 is built:

- Attendance section appears in `OfferingDetailScreen` on the coach side, visible only on the session's date.
- Sessions are derived from `sessions_json` on the run.
- Each confirmed enrollment shows a Present / Absent toggle for the current session.
- Tapping Present: writes `status = 'present'`, `checked_in_at = now()`, `checked_in_by = coach_user_id`.
- Absent rows pre-exist from the `generate-attendance` Edge Function — coach only marks present.

**QR check-in (Phase 4 option):** Each enrollment gets a unique QR code (encoded `enrollment_id + run_id + session_date`). Coach scans with the app camera — reuses the existing `expo-camera` dependency in the stack.

---

## 11. Navigation changes

### Mobile app

**Coach side:** No new bottom tab. `CoachDashboardScreen` gains a third sub-tab (Offerings) alongside Students and Programs.

New screens in `CoachNavigator`:

| Screen | Route | Purpose |
|---|---|---|
| `OfferingsListScreen` | `OfferingsList` | Offerings sub-tab in coach dashboard |
| `CreateOfferingStep1Screen` | `CreateOfferingStep1` | Pick program |
| `CreateOfferingStep2Screen` | `CreateOfferingStep2` | Set offering details and default capacity |
| `CreateOfferingStep3Screen` | `CreateOfferingStep3` | Add run dates, schedules, and prices |
| `OfferingDetailScreen` | `OfferingDetail` | Coach view: runs with fill bars + roster with payment status |

**Student side:** New Explore tab (see open decisions on placement).

New screens in main stack:

| Screen | Route | Purpose |
|---|---|---|
| `ExploreScreen` | `Explore` | Browse public offerings with filters |
| `OfferingPublicDetailScreen` | `OfferingPublicDetail` | Student view: info, coach, pick a run |
| `BookingConfirmScreen` | `BookingConfirm` | Review and confirm a run booking |
| `BookingSuccessScreen` | `BookingSuccess` | Confirmed state with price, Pay now button if link set, first session |
| `MyBookingsScreen` | `MyBookings` | Student's enrollments with payment status and inline Pay now |
| `NotificationsScreen` | `Notifications` | In-app notification inbox, accessible from bell icon or profile |

### Web admin dashboard

New top-level tab in `AdminDashboard.js`: **Offerings**

New components in `src/screens/admindashboard/`:

| Component | Purpose |
|---|---|
| `OfferingsTable` | Table with stats header, search, filters |
| `OfferingDetailPanel` | Right-side drawer: runs, roster preview, payment summary |
| `CreateOfferingModal` | 3-step modal (program → details → run dates + prices) |
| `EditOfferingModal` | Edit offering and manage individual runs |
| `OfferingRosterModal` | Full roster per run: payment status, Mark as paid, Send payment link, Remove |

---

## 12. Screen-by-screen spec

---

### Phase 1 screens — Coach side

---

#### S1 — Offerings list (OfferingsListScreen)

Entry: Third sub-tab in CoachDashboardScreen.

Content: "Your Offerings" header with New button. Cards show: gradient thumbnail, type badge (Cohort / Event), title, number of runs scheduled, next run date, price range if runs vary (e.g. "From $399"), status pill. Sorted: Open → Draft → Completed.

Empty state: "You haven't created any offerings yet. Tap New to get started."

Actions: Card tap → OfferingDetailScreen. New button → CreateOfferingStep1Screen.

---

#### S2 — Create step 1: Pick program (CreateOfferingStep1Screen)

Content: 3-pip step indicator, first active. List of coach's published programs: thumbnail, name, session count, tier. Radio-style selection.

Validation: Cannot proceed without a selection.

---

#### S3 — Create step 2: Offering details (CreateOfferingStep2Screen)

Fields: Offering name (pre-filled from program name, editable), Type toggle (Cohort / Event) with hint copy, Location / Facility, Default capacity per run, Skill level min/max DUPR, Description (optional).

Validation: Name, type, location, and capacity required.

---

#### S4 — Create step 3: Run dates and prices (CreateOfferingStep3Screen)

Content: Helper text: "Each run is a separate instance. Students pick the one that fits their schedule." Run cards, each with:
- Run number label
- Start date / End date
- Session schedule (e.g. "Every Monday 9:00 AM – 12:00 PM")
- Price field: amount in dollars (stored as cents on insert) + currency selector. Defaults to $0 / Free.
- Payment link URL (optional). Label: "Payment link — leave blank if collecting cash or payment TBD."

Dashed "Add another run" button. Minimum 1 run to publish.

Validation: Each run needs start date, end date, schedule. Price defaults to 0 if blank. URL must be valid if provided.

Actions: "Publish offering" — creates offering + all runs + attendance skeleton structure, navigates to list. "Save as draft" — same but status = draft, is_public = false.

---

#### S5 — Offering detail: coach view (OfferingDetailScreen)

Header: Gradient hero, title, type + status badges. Options button: edit, close all, delete.

Stats row: Enrolled total, Runs, Sessions, Waitlisted, Payments collected (paid / total confirmed).

**Runs tab:** Each run card: date range, schedule, price formatted, fill bar (spots_filled / capacity), payment summary ("7 / 9 paid"), status pill. Per-run actions: View roster, Edit, Close. "Add run" dashed button below.

**Roster tab:** Confirmed students. Each row: avatar, name, run label, DUPR, payment status badge (green = paid/cash, yellow = pending, blue = link sent, grey = not required, red = refunded). Coach taps a row to open a payment action sheet: "Mark as paid" (selects type, optional amount, reference, notes), "Send payment link" (copies link or opens share sheet), "Waive payment". Waitlist section below confirmed list.

Footer: Edit offering / Close all runs.

---

#### W1 — Admin web: Offerings table (OfferingsTable)

Stats header: Active offerings, Total enrolled, Spots remaining, Payments pending (confirmed enrollments where payment_status = pending and price > 0).

Filter bar: Search, type, status, coach, payment status, list/grid toggle.

Table columns: Offering (thumbnail + title + program ref), Type, Runs (count + next date), Fill rate (bar + enrolled/total + spots remaining, colour coded), Payments (paid / confirmed), Status, Actions.

Row click: Opens OfferingDetailPanel.

---

#### W2 — Admin web: Offering detail panel (OfferingDetailPanel)

Right-side drawer. Does not navigate away from the table.

Header: Gradient thumbnail, title, badges, close and options.

Stats (4 columns): Total enrolled, Runs, Spots remaining, Payments pending.

Runs section: Per-run cards with date range, price, fill bar, payment summary, status. Actions per run: View roster, Edit, Close. "Add run" link.

Recent enrollments: Last 5 with avatar, name, run label, enrolled date, DUPR, payment status badge. "View all" opens OfferingRosterModal.

Footer (sticky): Edit offering / Close all runs.

---

#### W3 — Admin web: Create offering modal (CreateOfferingModal)

3-step modal with step pills in header.

Step 1: Search and select program. Preview card when selected.

Step 2: Same fields as S3 plus Assigned coach selector (all coaches in the academy, lead coach as default).

Step 3: Same as S4 — run cards with date, schedule, price, payment link.

Footer: Cancel / Back / Next / Publish or Save as draft.

---

#### W4 — Admin web: Roster modal (OfferingRosterModal)

Opened from "View roster" on a run.

Header: Run label, date range, price, enrolled / capacity, payment summary bar.

Table: Avatar, name, DUPR, enrolled date, payment status badge, payment type, amount paid, actions (Mark as paid, Send payment link, Remove).

"Mark as paid" opens an inline form: payment type selector (Cash / Bank transfer / Other), amount, reference, notes.

Waitlist section below confirmed list.

Export button: Download CSV with all roster and payment data.

---

### Phase 2 screens — Student side

---

#### S6 — Explore (ExploreScreen)

Entry: Explore bottom tab or sub-tab (see open decisions).

Content: "Explore" title, subtitle. Filter chips (horizontal scroll): All, Cohorts, Events, skill ranges, Near me. Offering cards: gradient thumbnail, type badge, urgency badge ("3 spots left" in orange when any run is under 20% capacity remaining), price from cheapest available run (e.g. "From $399" or "Free"), title, coach avatar + name, next open run date, location.

Empty state: "No offerings match your filters. Try adjusting them or check back soon."

---

#### S7 — Offering detail: student view (OfferingPublicDetailScreen)

Header: Gradient hero, title, type + status badges, back button.

Coach strip: Avatar, name, academy, rating.

Tabs: Overview / Sessions.

Overview: Description, info rows (Dates from next open run, Location + facility, Spots bar colour-coded).

Sessions: Session list for the selected run (number, routine name, date).

**Pick your run section:**

Label and copy: "All runs follow the same curriculum."

Run cards — one per run:
- Calendar date block (month + day)
- Date range and session schedule
- Price formatted (e.g. "$1,250" or "Free")
- Spots remaining colour-coded (green above 50%, orange below 20%, grey if full)
- Selection checkbox
- Tapping: selects this run, deselects others, expands first 3 session dates with a link for remaining
- Full runs: greyed, labelled "Full", not tappable

Footer (sticky):
- Primary button: "Book [date] run" — label reflects selected run
- Price + spots line: "$1,250 · 3 spots left" or "Free · 9 spots left"
- If price > 0: sub-caption "Payment details will be shared after booking."
- If full: "Join waitlist" replaces primary button

---

#### S8 — Booking confirmation (BookingConfirmScreen)

Pattern: Bottom sheet slides up over detail screen.

Content: Drag handle, check icon, "Confirm your booking" title, sub-copy. Review card: thumbnail, offering title + run number, coach name, date range + session count, location, price row (bold if paid; "Free" if not). Cancel / Confirm buttons.

On confirm: Call `book_offering_run` RPC. Navigate to BookingSuccessScreen. Show error toast if run filled between browse and confirm (race condition).

---

#### S9 — Booking confirmed (BookingSuccessScreen)

Content: Animated check circle. "You're in!" title. Sub-copy with offering name and run number. First session card (date, time, routine name, location, "Confirmed" badge).

If price > 0 and `payment_link_url` is set:
- Payment card: price, "Pay now" button that opens `payment_link_url` via `Linking.openURL`, note: "You can also pay later from My Bookings."

If price > 0 and no payment link:
- Note: "Your coach will send payment details soon."

If free: no payment section shown.

Two buttons: "Browse more offerings" / "Done".

---

#### S10 — My bookings (MyBookingsScreen)

Entry: Profile screen > My Bookings.

Content: List of all enrollments. Each row: offering title, run date range, status badge (Confirmed / Waitlisted), payment status badge (Paid / Pending payment / Free), coach name.

Tapping a confirmed row: expands session list for that run. If `payment_status = 'pending'` and `payment_link_url` is set on the run: "Pay now" button inline.

Waitlisted rows: "Waitlist position 2. Payment due only if your spot is confirmed."

---

#### S11 — Notifications inbox (NotificationsScreen)

Entry: Bell icon in app header (with unread badge count) or Profile screen.

Content: List of notifications sorted by created_at descending. Each row: icon per type, title, body, timestamp, grey background if unread. Tapping a row: marks it read (calls `mark_notifications_read`), navigates to the relevant screen based on `data_json` (e.g. opens OfferingPublicDetailScreen for an enrollment notification).

Empty state: "No notifications yet."

---

## 13. Out of scope

- Payment capture inside the app (Stripe SDK, Apple Pay, Google Pay)
- Student self-service cancellation
- Public discovery web page (thecourtflow.com/[academy-slug]/offerings)
- Session check-in UI (table created in Phase 0; UI is Phase 4)
- Push notification sending (token registration in Phase 2; Expo push API in Phase 3)
- Post-cohort ratings and reviews
- Instalment or split payment plans

---

## 14. Phases

---

### Phase 0 — Backend: migration, RLS, RPCs, Edge Function stubs

**Goal:** The entire backend is built, tested, and validated before any UI is written. Every booking scenario is verified at the RPC level.

**Scope:**

**0a — Migration (one file, atomic)**
Create all 6 tables: `offerings`, `offering_runs`, `enrollments`, `push_tokens`, `notifications`, `attendance`. Include all column defaults, NOT NULL constraints, foreign keys, and indexes from sections 3 and 4.

**0b — RLS policies**
Write all policies from section 5 before writing any RPCs. Test with three Supabase test users (coach, student A enrolled, student B not enrolled) and verify access boundaries.

**0c — RPCs (in dependency order)**
1. `create_offering` + `create_offering_run`
2. `get_offering_with_runs`
3. `book_offering_run` — most critical; full transaction + spot counting
4. `cancel_enrollment` — waitlist promotion chain
5. `record_payment`
6. `get_run_roster`
7. Remaining: `update_offering`, `update_offering_run`, `close_offering_run`, `delete_offering`, `send_payment_reminder`, `upsert_push_token`, `mark_notifications_read`

**0d — Edge Function stubs**
Create `stripe-webhook` and `send-notification` as stubs: log payload, return 200. Verify CORS, secrets env vars, and that `pg_net` can invoke them from an RPC without error.

**Validation checklist — all must pass before Phase 1 starts:**

| Scenario | Expected result |
|---|---|
| Book a run with available spots | enrollment confirmed, spots_filled +1, notification inserted |
| Book the last available spot | enrollment confirmed, run status flips to `full` |
| Book a full run | enrollment waitlisted, waitlist_position assigned |
| Cancel a confirmed enrollment | spots_filled -1, run reopens, first waitlisted promoted, notification inserted |
| Cancel when no waitlist | spots_filled -1, run reopens, no promotion attempt |
| Book a free run (price_amount = 0) | payment_status = `not_required` |
| Book a paid run (price_amount > 0) | payment_status = `pending` |
| Record cash payment as coach | payment columns updated, student cannot call the same RPC |
| Attempt to book as coach role | RLS blocks enrollment insert |
| Student reads another student's enrollment | RLS blocks select |
| Coach reads a run not in their academy | RLS blocks select |
| Direct write to spots_filled | blocked — no policy grants this |

**Done when:** All 12 validation scenarios pass. RPCs are documented and confirmed working via Supabase Studio or a test script.

**DO NOT TOUCH:** Any existing tables (programs, routines, exercises, coaches, users, etc.). No UI code. No changes to existing RPCs.

---

### Phase 1 — Coach-side UI (mobile + web admin)

**Goal:** A coach can create an offering with multiple priced runs, publish it, view enrollments per run, and manually record payments. The admin web dashboard mirrors the same data.

**Prerequisite:** Phase 0 fully validated.

**Scope:**
- Mobile: S1 OfferingsListScreen, S2–S4 CreateOfferingStep1–3 (with price and payment link fields on step 3), S5 OfferingDetailScreen (Runs tab + Roster tab with payment status badges and manual payment recording)
- Web admin: W1 OfferingsTable, W2 OfferingDetailPanel, W3 CreateOfferingModal, W4 OfferingRosterModal (with payment columns, Mark as paid, Send payment link, Export CSV)

**Done when:** A coach creates an offering with 2 runs at different prices, publishes it, a test student is manually added to a roster, and the coach marks them as paid (Cash). Admin web shows the same data with correct payment summary stats.

**DO NOT TOUCH:**
- `MainTabNavigator.js`
- `ProgramScreen` and sub-tabs
- Existing coach screens: Students tab, Programs tab, assessment flow
- Admin tabs: Dashboard, Content Management, Coaches, Users

---

### Phase 2 — Student-side UI, in-app notifications, push token registration

**Goal:** A student can discover offerings, pick a run, book a spot, follow a payment link, and receive in-app notifications. Push tokens are registered but push sending is not yet live.

**Prerequisite:** Phase 1 tested end to end with a real coach account creating real offerings.

**Scope:**
- Mobile: S6 ExploreScreen, S7 OfferingPublicDetailScreen (price on run cards, interactive run selection), S8 BookingConfirmScreen (price in review card), S9 BookingSuccessScreen (Pay now button if payment_link_url is set), S10 MyBookingsScreen (payment status + inline Pay now), S11 NotificationsScreen (in-app inbox, unread badge)
- `MainTabNavigator.js` update: add Explore tab (or decide sub-tab placement — see open decisions)
- Push token registration on app launch (permission request + `upsert_push_token`)
- `book_offering_run` RPC integration (write path already tested in Phase 0)
- Waitlist display and "Join waitlist" CTA

**Done when:** A student finds an offering in Explore, selects a run, confirms booking, sees the price and "Pay now" button on the success screen, opens the payment link in the browser, and sees an in-app notification in their inbox confirming the booking.

**DO NOT TOUCH:**
- Create/edit offering flow from Phase 1
- Any admin web screens
- Existing program, logbook, leaderboard, or game screens

---

### Phase 3 — Stripe webhook + push notification sending

**Goal:** Payment status updates automatically when a student pays via Stripe. Push notifications are delivered to student devices.

**Prerequisite:** Phase 2 live with real student bookings and push tokens registered.

**Scope:**
- `stripe-webhook` Edge Function: full implementation — verify Stripe signature, handle `payment_intent.succeeded` and `payment_intent.payment_failed`, match PaymentIntent to enrollment via `payment_reference`, update payment columns
- `send-notification` Edge Function: full implementation — look up active push tokens, call Expo Push API, store `expo_ticket_id`, update `push_status`, deactivate tokens on DeviceNotRegistered
- pg_cron jobs: session reminders (24h before session date), delivery receipt verification (15 min after send batch)
- Coach payment reminder button in roster: calls `send_payment_reminder` RPC which inserts notification row and invokes Edge Function

**Done when:** A student pays via the Stripe Payment Link in their browser. Within seconds, their enrollment's `payment_status` flips to `paid` and they receive a push notification confirming payment. A coach sends a payment reminder from the roster and the student receives it as a push.

---

### Phase 4 — Session check-in UI

**Goal:** Coaches can mark attendance per session. QR check-in optional.

**Prerequisite:** At least one cohort run is underway with confirmed enrollments.

**Scope:**
- `generate-attendance` Edge Function: pg_cron scheduled at 00:01 daily, auto-inserts absent attendance rows for all confirmed enrollments on that day's sessions
- Attendance section in `OfferingDetailScreen` (Runs tab): visible only on the session date, shows all confirmed enrollments with Present / Absent toggle per student
- Optional: unique QR code per enrollment, camera-based scan to mark present (reuses `expo-camera`)

**Done when:** A coach opens a run on session day, sees their student list, and can mark attendance with a single tap per student.

---

## 15. Open decisions — resolve before Phase 1 build starts

**1. Explore tab placement.**
Fifth bottom tab (Program / Academy / Leaderboard / Logbook / Explore) or sub-tab inside Program alongside My Program and Library? A dedicated fifth tab gives Explore the prominence the public discovery goal requires. Decision affects `MainTabNavigator.js` and must be confirmed before Phase 2 begins. Phase 1 does not touch navigation so this can be decided any time before Phase 2 starts.

**2. Payment link: run-level vs enrollment-level.**
Currently `payment_link_url` is on `offering_runs` — one shared Stripe Payment Link for all students in that run. Simple to implement but Stripe cannot pre-identify the paying student. If per-student Stripe Checkout Sessions are needed (to prefill email, attach customer ID, track per-customer payment history), add `payment_session_url` to `enrollments` and generate it via a `create_payment_session` RPC called at booking time. Decide before Phase 2 so `BookingSuccessScreen` knows which URL to open and the Phase 0 schema is correct.

**3. Currency default.**
Spec defaults to USD. Confirm whether AUD should be the default for the Australian market, or whether currency is set per academy (which would require a future `academies` table). If per-academy, add `default_currency` to the `coaches` table now so it can be inherited by offerings.

**4. Coach assignment on mobile.**
The web create modal includes an Assigned coach selector. The mobile create flow (Phase 1) assumes the creating coach is the assigned coach. If a lead coach needs to assign a run to another coach from mobile, add a coach selector to step 2 (S3).

**5. Waitlist payment timing.**
Currently `payment_status = 'pending'` is set on insert for waitlisted enrollments. A payment reminder blast from the coach could accidentally target waitlisted students. Two options: (a) exclude waitlisted enrollments from payment reminders in the `send_payment_reminder` RPC, or (b) set `payment_status = 'not_required'` until a waitlisted student is promoted to confirmed. Decide before Phase 0 so the booking RPC sets the correct initial value.

---

## 16. Implementation record

**Completed:** 2026-07-19
**Phases shipped:** 0, 1, 2, 3, 4 (all)
**Commit:** `3883b30b` on `main`

---

### What was built

#### Database (Supabase migrations)

| Migration file | Contents |
|---|---|
| `20260720000000_offerings_v1.sql` | All 6 tables, indexes, RLS policies, 14 RPCs |
| `20260721000000_offerings_cron.sql` | `pg_cron` jobs: session reminders, attendance generation, push receipt check |
| `20260722000000_offerings_fixes.sql` | Security + correctness fixes (see bugs section below) |

#### Edge Functions

| Function | Location | Status |
|---|---|---|
| `stripe-webhook` | `supabase/functions/stripe-webhook/index.ts` | Full — verifies Stripe signature, handles `payment_intent.succeeded` / `.payment_failed`, updates enrollment payment columns, inserts in-app notification |
| `send-notification` | `supabase/functions/send-notification/index.ts` | Full — FCM HTTP v1 API (not Expo Push API), deactivates stale tokens on `UNREGISTERED` error |
| `generate-attendance` | `supabase/functions/generate-attendance/index.ts` | Full — idempotent upsert of absent rows for confirmed enrollments on each session date |

> **Architecture note:** Push notifications use FCM HTTP v1 directly (not the Expo Push API) for consistency with the existing `@react-native-firebase/messaging` setup. The `expo_ticket_id` column stores the FCM message ID instead of an Expo receipt ID.

#### Mobile screens

| Screen | Route | Profile |
|---|---|---|
| `OfferingsListScreen` | `OfferingsList` | Coach |
| `CreateOfferingStep1Screen` | `CreateOfferingStep1` | Coach |
| `CreateOfferingStep2Screen` | `CreateOfferingStep2` | Coach |
| `CreateOfferingStep3Screen` | `CreateOfferingStep3` | Coach |
| `OfferingDetailScreen` | `OfferingDetail` | Coach |
| `ExploreScreen` | `ExploreRoot` | Student |
| `OfferingPublicDetailScreen` | `OfferingPublicDetail` | Student |
| `BookingConfirmScreen` | `BookingConfirm` | Student |
| `BookingSuccessScreen` | `BookingSuccess` | Student |
| `MyBookingsScreen` | `MyBookings` | Student (Profile → My Bookings) |
| `NotificationsScreen` | `Notifications` | Student (Profile → Notifications) |

#### Web admin components

| Component | Purpose |
|---|---|
| `OfferingsTable` | Stats header, search, filter, sortable table, row click → detail panel |
| `OfferingDetailPanel` | Right-side drawer: runs, roster preview, payment summary |
| `CreateOfferingModal` | 3-step modal: program → details → run dates + prices |
| `EditOfferingModal` | Edit offering fields + manage individual runs |
| `OfferingRosterModal` | Full roster: payment actions, Mark as paid, Send link, Cancel enrollment |

#### Navigation changes

- `ExploreNavigator.js` created as a dedicated stack navigator for the student browse-to-book flow
- `MainTabNavigator.js` updated: Explore added as a fifth bottom tab with a custom compass icon in `TabIcon.js`
- `CoachNavigator.js` updated: offerings screens added
- `App.js` updated: `MyBookings` and `Notifications` added to the root stack; push token registration now also calls `upsert_push_token` RPC to populate `push_tokens` table
- `ProfileScreen.js` updated: links to My Bookings and Notifications

---

### Bugs found and fixed

| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | Critical | `updateAttendanceStatus` tried to set `updated_at` — column does not exist on `attendance` → every attendance toggle crashed | Removed `updated_at` from the update object in `offeringsApi.js` |
| 2 | Security | `get_offering_with_runs` (SECURITY DEFINER) had no access guard — any authenticated user could read private/draft offerings by UUID | Added `is_public OR is coach OR is_admin` WHERE clause in `20260722000000_offerings_fixes.sql` |
| 3 | Bug | `getMyEnrollments` leaked coach-side enrollments — a user who is both coach and student saw all their students on "My Bookings" | Added explicit `.eq('student_id', user.id)` filter after `supabase.auth.getUser()` |
| 4 | Bug | `BookingSuccessScreen` "Back to Explore" used `navigate('Explore')` which did not consistently reset the navigator stack | Changed to `navigation.popToTop()` |
| 5 | Perf/Bug | `OfferingDetailScreen.load` had `selectedRunId` in `useCallback` deps — `useFocusEffect` re-triggered a full DB reload on every run selection | Used a `useRef` flag (`firstRunAutoSelectedRef`) so auto-select only fires once on initial mount |
| 6 | UX | `ExploreScreen` silently showed an empty list on network error — no user feedback | Added `loadError` state, error message, and a Retry button |
| 7 | Security | `update_offering` RPC blocked admin users from editing offerings via the admin panel | Added `OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)` check |
| 8 | Bug | No admin RLS policies on offerings tables — admins only saw public offerings in the admin panel | Added `admin_read_all_offerings`, `admin_read_all_runs`, `admin_read_all_enrollments` policies |
| 9 | Bug | `get_run_roster`, `cancel_enrollment`, `record_payment` RPCs blocked admin users from roster operations | Added `is_admin` check to all three RPCs |
| 10 | Bug | `push_tokens` had no UNIQUE constraint for `(user_id, platform)` when `device_id IS NULL` — duplicate rows accumulated on re-register | Added `idx_push_tokens_user_platform` partial unique index; updated `upsert_push_token` RPC |

---

## 17. User stories

These are the canonical acceptance criteria. Each story maps to a specific flow and should be validated in order on a staging environment before any production release.

---

### Profile: Coach

---

#### CS-1 — Create and publish an offering

**As a coach, I want to create a new offering from an existing program, add at least one priced run, and publish it so students can discover and book it.**

Steps:
1. Open the Coach tab → Offerings sub-tab.
2. Tap **New** → pick a published program.
3. Enter offering name, type (Cohort), location, capacity (10), skill range.
4. Add one run: start date, end date, schedule, price $500, optional payment link.
5. Tap **Publish offering**.

Expected:
- Offering appears in `OfferingsListScreen` with status "Open".
- Offering is visible to students in `ExploreScreen` (`is_public = true`).
- Run shows "0 / 10" fill in the Runs tab.
- `offerings` row created with `status = 'open'`, `is_public = true`.
- `offering_runs` row created with correct `price_amount = 50000`.

---

#### CS-2 — View run roster and payment status

**As a coach, I want to see who has enrolled in a run and what their payment status is.**

Steps:
1. Open `OfferingDetailScreen` for an offering with at least one confirmed enrollment.
2. Navigate to the **Roster** tab.
3. Tap a student row.

Expected:
- Confirmed enrollments listed with name, DUPR, payment status badge.
- Waitlisted students shown in a separate section with their position.
- Payment action sheet appears: "Mark as paid", "Send payment link", "Waive payment".

---

#### CS-3 — Record a cash payment

**As a coach, I want to manually record a cash payment so the enrollment payment status reflects reality.**

Steps:
1. Open the roster for a run with a student in `pending` payment status.
2. Tap the student row → **Mark as paid** → select **Cash** → enter amount and optional reference → confirm.

Expected:
- Enrollment `payment_status` changes to `cash_collected`.
- `payment_type = 'cash'`, `payment_amount_paid` set, `payment_paid_at` set.
- Student's payment status badge updates immediately.

---

#### CS-4 — Cancel an enrollment and promote the waitlist

**As a coach, I want to cancel a confirmed enrollment so the first waitlisted student gets promoted automatically.**

Steps:
1. Open the roster for a full run with at least one waitlisted student.
2. Tap a confirmed enrollment → **Remove** → confirm.

Expected:
- Cancelled enrollment `status = 'cancelled'`.
- Run `spots_filled` decrements by 1.
- If run was `full`, status changes to `open`.
- First waitlisted student: `status = 'confirmed'`, `waitlist_position = null`, `spots_filled` increments.
- `waitlist_promoted` notification row inserted for the promoted student.

---

#### CS-5 — Take attendance on a session day

**As a coach, I want to mark which students attended today's session without entering every row from scratch.**

Steps:
1. Open `OfferingDetailScreen` for a run that has a session scheduled for today.
2. Tap the **Check-In** tab (visible only today).
3. Tap a student row to toggle from Absent → Present.

Expected:
- `attendance` row for that student + today's date flips to `status = 'present'`, `checked_in_at` set.
- Row is pre-seeded as `absent` by the `generate-attendance` Edge Function.
- Toggling back sets `status = 'absent'`, `checked_in_at = null`.

---

#### CS-6 — Add a second run to an existing offering

**As a coach, I want to add another run to an existing offering so returning students can re-enrol in a later cohort.**

Steps:
1. Open `OfferingDetailScreen` → Runs tab.
2. Tap **Add run** → fill in dates, schedule, price → save.

Expected:
- New `offering_runs` row created linked to the offering.
- Run appears in the Runs tab sorted by start date.
- Run appears in `OfferingPublicDetailScreen` for students.

---

### Profile: Student

---

#### SS-1 — Discover and book a confirmed spot

**As a student, I want to browse available offerings, pick a run that fits my schedule, and confirm my booking.**

Steps:
1. Open the **Explore** tab.
2. Browse cards; optionally filter by type.
3. Tap an offering card → `OfferingPublicDetailScreen`.
4. Select an available run → tap **Book [date] run**.
5. Review the confirmation sheet → tap **Confirm**.

Expected:
- `BookingSuccessScreen` shown with offering name, first session date.
- If `price_amount > 0` and `payment_link_url` is set: "Pay now" button visible.
- Enrollment row created: `status = 'confirmed'`, `payment_status = 'pending'` (or `'not_required'` if free).
- `enrollment_confirmed` notification inserted.
- Booking appears in **My Bookings** immediately.

---

#### SS-2 — Join a waitlist when a run is full

**As a student, I want to join the waitlist for a full run so I get notified if a spot opens.**

Steps:
1. Open an offering where at least one run is full.
2. Select the full run → the primary button reads **Join waitlist**.
3. Tap **Join waitlist** → confirm.

Expected:
- `BookingSuccessScreen` shown with waitlist context copy.
- Enrollment row: `status = 'waitlisted'`, `waitlist_position` assigned (1-based).
- `enrollment_waitlisted` notification inserted.
- Booking appears in **My Bookings** with "Waitlisted" badge and position text.

---

#### SS-3 — Pay via payment link from My Bookings

**As a student, I want to open my coach's Stripe payment link directly from My Bookings so I can pay without searching for an email.**

Steps:
1. Open **Profile → My Bookings**.
2. Find an enrollment with payment status "Pending payment" and an available payment link.
3. Tap **Pay now**.

Expected:
- Device browser opens the `payment_link_url`.
- After payment, Stripe fires `payment_intent.succeeded` webhook.
- Enrollment `payment_status` updates to `paid` via `stripe-webhook` Edge Function.
- In-app notification inserted confirming payment.

---

#### SS-4 — View and dismiss in-app notifications

**As a student, I want to see all notifications about my bookings and mark them as read.**

Steps:
1. Open **Profile → Notifications**.
2. Observe unread rows (grey background).
3. Tap a notification row.

Expected:
- `read_at` timestamp set on tapped notification (`mark_notifications_read` RPC called).
- Row background changes to white (read state).
- Navigation goes to the relevant screen based on `data_json` (e.g. `OfferingPublicDetailScreen`).
- Unread badge count on the profile or bell icon decrements.

---

#### SS-5 — Error recovery on Explore

**As a student, I want to see a clear error message and be able to retry if the Explore screen fails to load.**

Steps:
1. Simulate a network failure or Supabase error.
2. Open the **Explore** tab.

Expected:
- Error icon and message displayed (not a blank screen or empty list).
- **Retry** button present; tapping it re-triggers `getPublicOfferings`.

---

### Profile: Admin

---

#### AS-1 — View all offerings across all coaches

**As an admin, I want to see every offering on the platform regardless of which coach created it.**

Steps:
1. Log in to the web admin dashboard.
2. Open the **Offerings** tab.

Expected:
- `OfferingsTable` shows offerings from all coaches (not filtered by `coach_id`).
- Stats header shows correct totals: active offerings, total enrolled, spots remaining, payments pending.
- Row click opens `OfferingDetailPanel`.

---

#### AS-2 — Edit an offering as admin

**As an admin, I want to correct an offering's details (e.g. fix a typo in the title) even if I am not the creating coach.**

Steps:
1. Open the **Offerings** tab → click a row → **Edit offering** button.
2. Change the title → save.

Expected:
- `update_offering` RPC called with admin's session (not coach's).
- Change persists: `offerings.title` updated.
- No "Access denied" error (admin bypass in RPC verified).

---

#### AS-3 — View roster and record payment as admin

**As an admin, I want to open the roster for any run, see payment statuses, and record a payment on behalf of a coach.**

Steps:
1. Open `OfferingDetailPanel` → click **View roster** on a run.
2. In `OfferingRosterModal`, tap a student with pending payment → **Mark as paid** → Cash → confirm.

Expected:
- Roster loads (not blocked by RLS or `get_run_roster` access check).
- `record_payment` RPC executes successfully with admin's JWT.
- Enrollment `payment_status` updates to `cash_collected`.

---

#### AS-4 — Cancel an enrollment as admin

**As an admin, I want to remove a student from a run to handle a special-case refund or error.**

Steps:
1. In `OfferingRosterModal`, find a confirmed enrollment.
2. Click **Remove** → confirm.

Expected:
- `cancel_enrollment` RPC executes with admin's JWT (no "Access denied" error).
- Enrollment `status = 'cancelled'`, `spots_filled` decrements.
- Waitlist promotion logic fires if applicable.
- Roster modal refreshes and the cancelled row disappears.
