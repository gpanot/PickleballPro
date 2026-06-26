# Role & UX Analysis — Pickleball Hero
*Last updated: 2026-06-26 — Sprint 3 pass complete.*

---

## 1. Role Architecture Overview

```
Global Admin
    │
    ├── Academy Manager  (owns one academy, has coach_students of their own)
    │       └── Academy Coach  (belongs to one academy, has coach_students)
    │
    ├── Solo Coach  (no academy, has coach_students)
    │
    └── Player  (has user_programs, logbook, dupr rating)
```

### Role Determination (at login time — `AdminRoute.checkAccess`)

| Priority | Source table | `sessionRole` value | `academyId` set? |
|---|---|---|---|
| 1 | `admin_users.is_active = true` | `'admin'` | No |
| 2 | `academy_members.role = 'manager'` | `'manager'` | Yes |
| 3 | `coaches.is_active = true` | `'coach'` | No |
| 4 | (none matched) | `null` → Access Denied | No |

**Note:** A manager who is also a coach receives `sessionRole = 'manager'` (broader tier). Their `coachId` is also fetched and available for student-management operations.

---

## 2. Sprint History

### Sprint 1 — Academy DB Layer
- Created `academies` and `academy_members` tables
- Added `academy_id` to `programs` and `coach_students`
- Deployed `become_academy_manager` and `add_coach_to_academy` RPCs
- RLS policies deployed and verified

### Sprint 2 — Manager Web Dashboard Tier
- `AdminRoute`: 3-tier role check (admin → manager → coach), `academyId` passed downstream
- `AdminSidebar`: "Academy Dashboard" label, "My Academy" nav tab for managers
- `AdminDashboard`: manager-scoped `fetchPrograms` (by `academy_id`), `fetchStats`, `renderAcademyTab`, `handlePublishProgram`, `handleAddCoachToAcademy`
- `ProgramsTable`: author badge on non-own programs, Publish button for managers

### Sprint 3 — Manager Bootstrap + Write-Path Parity (this pass)
- **GAP-01 ✅** `StartAcademyModal` built — 2-step (form → confirm), calls `become_academy_manager` RPC
- **GAP-02 ✅** `WebCreateProgramModal`: `isCoachRole` now includes `'manager'`; manager info text updated
- **GAP-03 ✅** Manager edit-path for coach drafts: direct `.update()` via RLS policy (Option B), no RPC change
- **GAP-06 ✅** `ProfileScreen`: detects `isManager` via `academy_members` query; shows "Academy Dashboard" for managers, "Start Your Academy" for non-manager coaches
- **GAP-10 ✅** Confirmation step in `StartAcademyModal` step 2: shows count of programs to be bulk-claimed + warning copy

---

## 3. What Each Role Can Do — Current State

### 3.1 Global Admin (`sessionRole = 'admin'`)

**Web Dashboard tabs:** Dashboard · Content Management · User Management · Coach Management · Feedback · Analytics · Settings

| Capability | Status |
|---|---|
| View all programs (published + draft, any author) | ✅ |
| Create/edit any program (full field control — rating, user count, publish status) | ✅ |
| Delete any program | ✅ (`delete_program_as_admin` RPC) |
| View all users | ✅ |
| View/create/edit/delete coaches | ✅ |
| View all feedback | ✅ |
| View analytics | ✅ (UI stub, no live data) |
| Reorder programs per category | ✅ |
| Manage category order | ✅ |
| View/manage academy data | ❌ No Academies tab in admin dashboard (GAP-09) |

---

### 3.2 Academy Manager (`sessionRole = 'manager'`)

**Web Dashboard tabs:** Dashboard · Content Management · My Academy

| Capability | Status |
|---|---|
| View dashboard stats (academy programs count, member count, own students) | ✅ |
| View all programs in their academy (published + drafts by any author) | ✅ |
| See author badge on programs not authored by self | ✅ |
| Publish a draft academy-scoped program | ✅ (Publish button in ProgramsTable) |
| Unpublish a published program | ❌ No UI (GAP-04) |
| Create a new program (saved as draft) | ✅ (`create_program_as_user` RPC) |
| Edit own programs | ✅ (`update_program_as_user` RPC) |
| Edit a coach's draft (not own) | ✅ (direct `.update()` via RLS, Sprint 3) |
| View academy member list | ✅ |
| Add a new member by email | ✅ (`add_coach_to_academy` RPC) |
| Remove a member / change role | ❌ No UI (GAP-05) |
| Create academy from mobile app (solo coach flow) | ✅ `StartAcademyModal` in ProfileScreen (Sprint 3) |
| "Academy Dashboard" button label on mobile | ✅ ProfileScreen updated (Sprint 3) |
| View cross-coach student list | ❌ RLS policy exists, no UI (listed in gaps) |
| Mobile academy management screen | ❌ No mobile manager UI beyond ProfileScreen button |

---

### 3.3 Solo Coach / Academy Coach (`sessionRole = 'coach'`)

**Web Dashboard tabs:** Dashboard · Content Management

| Capability | Status |
|---|---|
| View dashboard stats (own programs, own student count) | ✅ |
| View only programs they created | ✅ |
| Create a new program (saved as draft) | ✅ |
| Edit own programs | ✅ |
| Delete own programs | ✅ |
| Reorder own programs | ✅ |
| View assigned students | ✅ |
| Add students (via student code) | ✅ (mobile only) |
| Publish own programs | ❌ No self-publish path (GAP listed, not in scope this sprint) |
| View own academy membership | ❌ No UI anywhere (GAP-07) |
| Assign academy-published programs to students | ❌ `AssignProgramListScreen` ignores academy scope (GAP-08) |
| See other coaches in the same academy | ❌ No UI (GAP-07) |

**Mobile:** "Academy" bottom tab shown only if `isCoach && coachPublished` (GAP-12).

---

### 3.4 Player (end user, no dashboard access)

| Capability | Status |
|---|---|
| Browse published programs | ✅ |
| Start/save assigned program | ✅ |
| Log workouts | ✅ |
| View leaderboard | ✅ |
| Find a coach | ✅ |
| See which academy a coach belongs to | ❌ No UI |

---

## 4. Remaining Open Gaps

> Gaps closed this sprint (GAP-01, GAP-02, GAP-03, GAP-06, GAP-10) are removed from this section.

---

### GAP-04 — No "Unpublish" action for managers
**Severity: Medium**

The Publish button in `ProgramsTable` is one-way: once a program is published, there is no retract option in any UI. The `programs_update_academy_manager_publish` RLS policy supports any UPDATE (including flipping `is_published` back to `false`), so this is purely a missing UI control.

**Needs:** A toggle or "Unpublish" menu item on published academy-scoped programs, visible to managers and admins.

---

### GAP-05 — Manager cannot remove a member or change their role
**Severity: Medium**

`academy_members` RLS has both `DELETE` (manager can delete any row in their academy) and `UPDATE` (manager can change roles) policies deployed. The Academy tab member list table has no action menu — no remove button, no role-change control.

**Needs:** A "…" action menu on each member row with "Change Role" (dropdown) and "Remove from Academy" (with confirmation) options.

---

### GAP-07 — Mobile `CoachDashboardScreen` has no academy context
**Severity: Medium**

A coach who belongs to an academy sees the same `CoachDashboardScreen` as a solo coach. There is no indication of which academy they are in, who the manager is, or which other coaches are peers. The screen only loads `created_by = auth.uid()` data.

**Needs:** A "My Academy" card in the mobile coach dashboard showing academy name, manager contact, and (optionally) a list of peer coaches in the same academy.

---

### GAP-08 — `AssignProgramListScreen` ignores academy programs
**Severity: Medium**

`AssignProgramListScreen` fetches programs with `is_published = true AND is_coach_program = true` globally — no `academy_id` scoping. This means:
1. A coach in Academy A can see published programs from Academy B.
2. Academy programs marked `is_coach_program = false` (typical for academy-level programs) are invisible to coaches when assigning.

**Needs:** Scope the list to `academy_id = coach's academy` when the coach has academy membership, or include all published programs regardless of `is_coach_program` when in an academy context.

---

### GAP-09 — Admin dashboard: no visibility into academies
**Severity: Low–Medium**

The admin has RLS-level read access to all `academies` and `academy_members` rows (`is_admin()` passes), but the admin dashboard has no "Academies" tab. An admin cannot see how many academies exist, who manages them, their member counts, or intervene in a membership dispute without going directly to Supabase Studio.

**Needs:** An "Academies" tab in the admin dashboard listing all academies with manager name, member count, program count, and a drill-down to members.

---

### GAP-11 — No push notification when a manager publishes a coach's program
**Severity: Low**

When a manager flips a draft to published, the authoring coach has no way of knowing. The FCM/PNS infrastructure is deployed but is not wired to program publish events.

**Needs:** A notification trigger (API route, DB webhook, or Supabase Edge Function) that fires `is_published = false → true` on an academy-scoped program and sends an FCM push to the authoring coach's registered device token.

---

### GAP-12 — `MainTabNavigator` gates the "Academy" tab on `coachPublished`
**Severity: Low**

The mobile bottom tab for the coach/academy dashboard is shown only when `isCoach && coachPublished` (`is_accepting_students = true`). A manager who is also a coach but has paused student intake loses the mobile dashboard entry point entirely.

**File:** `src/navigation/MainTabNavigator.js` line 177.

**Needs:** Change condition to `isCoach && (coachPublished || isManager)` so the manager role independently grants the tab, regardless of accepting-students status.

---

### GAP-13 — `ProfileScreen` "Start Your Academy" requires `isCoach` — pure players cannot start an academy
**Severity: Low**

The "Start Your Academy" button in `ProfileScreen` is gated to `!isAdmin && isCoach && !isManager`. A user who has **never registered as a coach** (no row in the `coaches` table) but wants to create an academy and start coaching has no entry point — they must first go through "Become a Coach", then return to this button. This is a deliberate sequential funnel but the dependency is implicit and undocumented.

**Not a bug** — the RPC has no `coaches` table requirement; the UI guard is a product choice. Worth noting in case the flow is ever expanded to allow non-coaches to create academies directly.

---

### GAP-14 — `programs_update_academy_manager_publish` has no column restriction
**Severity: Low (latent — not currently exploitable via UI)**

The RLS policy used for both manager publish actions and the GAP-03 Option B edit path has `WITH CHECK = null`, meaning it places no restriction on which columns a manager can write once the row-level scope (academy match) passes. Today this is safe only because `WebCreateProgramModal` never exposes `created_by` or `id` as editable fields, so authorship cannot actually be reassigned through the current UI.

This is a UI-level accident, not a policy-level guarantee. If this edit path is ever extended, or if any other code calls `.update()` on `programs` under a manager session, authorship could be silently reassigned, breaking the immutable-authorship rule the academy architecture was built on.

**Needs:** Tighten the policy's `WITH CHECK` to explicitly exclude `created_by` (and ideally `id`) from manager-writable columns, rather than relying on the UI to never expose them. Not urgent, but should be done before this edit path is extended further.

---

## 5. Summary Matrix — Remaining Gaps

| Gap | Who is affected | Severity | Requires DB change? | Requires new RPC? |
|---|---|---|---|---|
| GAP-04: No unpublish action | Manager, Admin | Medium | No | No |
| GAP-05: No remove/role-change for members | Academy manager | Medium | No | No |
| GAP-07: No academy context in mobile coach dashboard | Academy coach on mobile | Medium | No | No |
| GAP-08: `AssignProgramListScreen` ignores academy scope | Academy coach assigning to students | Medium | No | No |
| GAP-09: Admin can't see academies | Admin | Low–Medium | No | No |
| GAP-11: No notification on publish | Coach whose program was published | Low | No | No (API hook) |
| GAP-12: `MainTabNavigator` gates manager on `coachPublished` | Manager-coach not accepting students | Low | No | No |
| GAP-13: `ProfileScreen` "Start Your Academy" requires prior coach registration | Non-coach wanting to start academy | Low | No | No |
| GAP-14: No column restriction on manager publish/edit RLS policy | Coach (authorship integrity risk) | Low (latent) | Yes (`WITH CHECK` tightening) | No |

---

## 6. Code Verification Snapshot

*Verified against live code as of Sprint 3.*

| File | What was verified |
|---|---|
| `src/components/AdminRoute.js` | 3-tier check: admin → manager → coach; `academyId` passed to dashboard ✅ |
| `src/screens/AdminDashboard.js` | `isManagerSession`, `MANAGER_ALLOWED_TABS`, manager-scoped `fetchPrograms`, `fetchAcademyMembers`, `handlePublishProgram`, `handleAddCoachToAcademy`, `renderAcademyTab` all present ✅ |
| `src/screens/admindashboard/AdminSidebar.js` | `MANAGER_NAV_IDS`, "My Academy" nav item, "Academy Dashboard" label ✅ |
| `src/screens/admindashboard/components/ProgramsTable.js` | `sessionRole`, `handlePublishProgram`, `publishingProgramId` props; author badge; Publish button ✅ |
| `src/screens/ProfileScreen.js` | `isManager` state; manager query on `academy_members`; "Academy Dashboard" label; "Start Your Academy" button (coach + non-manager only); `StartAcademyModal` wired with `onSuccess → checkAdmin()` ✅ |
| `src/components/StartAcademyModal.js` | 2-step flow; `become_academy_manager` RPC call matches param names (`academy_name`, `academy_slug`, `academy_logo_url`); program count scoped to `created_by = auth.uid()`; RPC errors surfaced as-is ✅ |
| `src/components/WebCreateProgramModal.js` | `isCoachRole = sessionRole === 'coach' \|\| sessionRole === 'manager'` ✅; manager info text updated ✅; GAP-03 Option B: `isManagerEditingOthersProgram` → direct `.update()` ✅ |
| `src/navigation/MainTabNavigator.js` | Academy tab still gated on `isCoach && coachPublished` only — GAP-12 open |
| `src/screens/coach/AssignProgramListScreen.js` | Still filters globally on `is_coach_program = true` — GAP-08 open |
| `src/screens/coach/CoachDashboardScreen.js` | No academy awareness — GAP-07 open |
| DB: RLS `programs_update_academy_manager_publish` | `WITH CHECK = null` confirmed — allows any field update by manager on academy-scoped programs; GAP-03 Option B valid ✅ |
| DB: `become_academy_manager` RPC | Param names confirmed: `academy_name text, academy_slug text, academy_logo_url text DEFAULT NULL` ✅ |
