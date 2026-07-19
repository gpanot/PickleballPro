# AcademyPro — Academy Product Spec

*Product management reference. Last updated: 2026-07-18 (Slice A + B implementation complete).*

**Related docs:** [`role-ux-analysis.md`](./role-ux-analysis.md) (engineering gap detail), [`onboarding-user-flows-v2.md`](./onboarding-user-flows-v2.md) (coach/player funnel).

---

## 1. Product thesis

AcademyPro is not a coach listing. It is **academy infrastructure**: one brand, shared programs, managed coaches, and student outcomes under a single organization.

| Persona | Job to be done |
|---|---|
| **Academy owner (manager)** | Turn coaching into a scalable brand — hire coaches, own curriculum, publish standards, see the whole roster. |
| **Academy coach** | Deliver sessions and programs under the academy brand, manage *my* students, use shared curriculum. |
| **Solo coach** | Same coach tools without an org layer; optional path to “Create Academy” when ready to grow. |
| **Player / student** | Train with programs, get coached, optionally find a coach — without needing to understand academy internals. |
| **Platform admin** | Operate content, coaches directory, and (eventually) all academies across sports. |

**Current model constraints (by design today):**
- One academy per user (multi-academy membership blocked).
- One sport per coach/academy for now (multi-sport backend-ready, UI single-sport by design).
- Creating an academy requires an existing coach profile (funnel: Coach → Create Academy).
- `staff` exists in the data model but has almost no product surface.
- `coach_students.coach_id` references `coaches.id` (not `auth.users.id`) — all code touching this table must join through the `coaches` table to reach `academy_members.user_id`.

---

## 2. Role architecture

```
Platform Admin
    │
    ├── Academy Owner / Manager   ← owns academies row + academy_members.role = manager
    │       ├── Academy Coach     ← academy_members.role = coach (+ coaches row)
    │       └── Staff             ← academy_members.role = staff (schema only; thin UX)
    │
    ├── Solo Coach                ← coaches row, no academy_members
    │
    └── Player                    ← no dashboard access
```

### How access is resolved (dashboard)

Checked in priority order — first match wins (`AdminRoute`):

| Priority | Condition | Dashboard label | `academyId` |
|---|---|---|---|
| 1 | Active row in `admin_users` | Admin Dashboard | No |
| 2 | `academy_members.role = 'manager'` | Academy Dashboard | Yes |
| 3 | Active row in `coaches` | Coach Dashboard | No* |
| — | None | Access denied | — |

\*Academy coaches still resolve as `sessionRole = 'coach'` unless they are also manager. Manager-who-coaches keeps `sessionRole = 'manager'` and still gets `coachId` for personal student ops.

**Mobile entry:** Profile shows Admin / Academy / Coach Dashboard by the same priority. Non-manager coaches also see **Create Academy**. The bottom "Academy" tab appears when `(isCoach && is_accepting_students) || isManager` — pure managers and manager-coaches who pause intake retain mobile access (C-4 fix shipped).

---

## 3. Capability matrix (what works today)

Legend: ✅ shipped · ⚠️ partial · ❌ missing · — N/A

### 3.1 Academy lifecycle & branding

| Capability | Solo coach | Academy coach | Academy owner | Admin |
|---|---|---|---|---|
| Create academy (name → slug auto) | ✅ | — | ✅ (bootstrap) | — |
| Logo / branding on create | ❌ (null; deferred) | — | ❌ | — |
| Edit academy name / logo later | — | — | ✅ **shipped (AO-4)** | ❌ |
| White-label student experience | ❌ | ❌ | ❌ | — |
| Multi-sport academy | ❌ UI | ❌ UI | ❌ UI | — (DB-ready) |

### 3.2 Team & membership

| Capability | Solo coach | Academy coach | Academy owner | Admin |
|---|---|---|---|---|
| Add member by email + role | — | — | ✅ (web My Academy) | ❌ no Academies UI |
| Remove member | — | — | ✅ **shipped (AO-2)** | ❌ |
| Change member role | — | — | ✅ **shipped (AO-2)** | ❌ |
| Invite link / pending invite | — | — | ✅ **shipped (AO-5)** | — |
| See peer coaches / “my academy” | — | ✅ **context card (C-2)** | ✅ member list | ❌ |
| Staff role meaningfully used | — | — | ⚠️ assignable only | — |

### 3.3 Curriculum & publishing

| Capability | Solo coach | Academy coach | Academy owner | Admin |
|---|---|---|---|---|
| Create programs (draft) | ✅ | ✅ | ✅ | ✅ |
| Edit own programs | ✅ | ✅ | ✅ | ✅ |
| Edit other coaches’ academy drafts | — | ❌ | ✅ | ✅ |
| Publish academy program | ❌ (no self-publish) | ❌ | ✅ | ✅ |
| Unpublish | ❌ | ❌ | ✅ **shipped (AO-3)** | ⚠️ elsewhere |
| Assign academy library to students | ⚠️ own/`is_coach_program` only | ✅ **shipped (C-1)** | ⚠️ | — |
| Notify coach on publish | — | ✅ **FCM push (C-3)** | — triggers notify | — |
| Academy assessment templates | — | ⚠️ | ✅ Assessments tab | ✅ |

### 3.4 Students & coaching ops

| Capability | Solo coach | Academy coach | Academy owner | Admin |
|---|---|---|---|---|
| Add student by code (mobile) | ✅ | ✅ + writes `academy_id` **(C-1 fix)** | ✅ (as coach) | — |
| Personal student roster | ✅ | ✅ | ✅ (own links) | — |
| Academy-wide student roster | — | ❌ (own only) | ✅ **shipped (AO-1)** | ❌ |
| Assess / logbook / assign program | ✅ | ✅ | ✅ (own students) | — |
| Cross-coach student handoff | — | ❌ | ❌ (rank 11+) | — |

### 3.5 Surfaces by channel

| Surface | Solo / academy coach | Academy owner |
|---|---|---|
| **Web dashboard** | Dashboard + Content | Dashboard + Content + My Academy (member mgmt, roster, invite, settings) + Assessments |
| **Mobile coach tab** | Students + Programs + Academy context card **(C-2)** | Same as coach + Academy tab always visible **(C-4 fix)** |
| **Profile CTA** | Coach Dashboard + Create Academy | Academy Dashboard |

---

## 4. Ideal product jobs (target state)

### Academy owner — “I run the academy”

1. **Stand up the brand** — name, logo, sport, public presence.
2. **Hire and govern the team** — invite coaches/staff, change roles, remove people.
3. **Own the curriculum** — review drafts, publish/unpublish, set assessment standards.
4. **See the whole student picture** — academy roster across coaches, not only personal students.
5. **Operate day-to-day** — know when coaches need review, when content ships, basic health metrics.
6. **Monetize later** — pricing, packages, payouts (explicitly deferred until ops are stable).

### Academy coach — “I deliver under the brand”

1. **Know where I belong** — which academy, who manages me, who my peers are.
2. **Use shared curriculum** — assign published academy programs (not only my drafts / global coach programs).
3. **Run my students** — add, assess, assign, logbook (already strong).
4. **Contribute content** — write drafts that the owner can publish; get notified when published.
5. **Stay productive on mobile** — coaching ops stay mobile-first; org admin can stay web-first.

### Solo coach — “Grow into an academy”

1. Same coaching ops as above.
2. Clear upgrade path: Create Academy → claim existing programs → become manager.

---

## 5. Product gaps

Gaps are framed by **persona impact**, not ticket numbers. Engineering detail for older items lives in `role-ux-analysis.md`.

### 5.1 Academy owner gaps

| ID | Gap | Status | Severity |
|---|---|---|---|
| **AO-1** | No academy-wide student roster UI — owner cannot see all students under the brand; RLS already allows manager visibility. | ✅ **Shipped** | Critical |
| **AO-2** | Cannot remove members or change roles — can hire but cannot fire or promote; RLS supports DELETE/UPDATE. | ✅ **Shipped** | Critical |
| **AO-3** | No unpublish / retract published programs — outdated curriculum stays live with no owner control in UI. | ✅ **Shipped** | High |
| **AO-4** | No academy settings (name, logo) — brand set once at create; cannot evolve identity. | ✅ **Shipped** | High |
| **AO-5** | No invite flow — coaches must already be registered and have their email known to the manager. | ✅ **Shipped** (invite link + deep link + RPC) | High |
| **AO-6** | Almost no mobile academy management — owners who live on phone cannot run the org without web. | ❌ Open (rank 11+) | Medium |
| **AO-7** | Thin analytics / ops signals — no publish queue, inactive coaches, student engagement KPIs. | ❌ Open (rank 13+) | Medium |
| **AO-8** | Staff role has no distinct permissions or UX — assignable only, does nothing different. | ❌ Open (rank 16+) | Low |
| **AO-9** | No billing / packages / white-label — monetization deferred intentionally. | ❌ Open (Slice D) | Low (later) |

### 5.2 Coach gaps (solo + academy)

| ID | Gap | Status | Severity |
|---|---|---|---|
| **C-1** | Assign-program list ignores academy scope — coaches cannot reliably assign their academy’s published library. | ✅ **Shipped** (two-path loader + `academy_id` write) | Critical |
| **C-2** | No academy context on mobile coach dashboard — feels like solo coach software. | ✅ **Shipped** (context card) | High |
| **C-3** | No notification when owner publishes their draft — breaks content collaboration loop. | ✅ **Shipped** (FCM push via Edge Function) | High |
| **C-4** | Academy bottom tab gated on `is_accepting_students` — manager-coach loses mobile access when pausing intake. | ✅ **Shipped** (`|| isManager` gate) | Medium |
| **C-5** | Pending review vs dashboard access ambiguous — `is_active` label misleading. | ✅ **Shipped** (label + sub-text fix) | Medium |
| **C-6** | No self-publish for solo coaches — depends on admin or must create academy. | ❌ Open (Slice D, paywall later) | Medium |
| **C-7** | Multi-sport / multi-academy blocked — coaches teaching two sports or at two clubs have no path. | ❌ Open (Slice D) | Low (later) |

### 5.3 Cross-cutting / platform

| ID | Gap | Status | Severity |
|---|---|---|---|
| **P-1** | Admin has no Academies tab — support requires Supabase Studio. | ❌ Open (rank 12+) | Medium |
| **P-2** | Manager publish RLS has no column `WITH CHECK` — latent authorship integrity risk. | ❌ Open (rank 17+) | Low (latent) |
| **P-3** | Players never see academy affiliation — marketplace is still “find a coach,” not “join an academy.” | ❌ Open (rank 15+) | Low–Medium |
| **P-4** | Payments / paywall for solo vs academy tiers — deferred until core ops stable. | ❌ Open (Slice D) | Later |

---

## 6. Prioritized backlog (for planning)

Ranked for **product value to academy owners and coaches**, weighted by: blocks core job · already has backend/RLS · unblocks other work · effort vs impact.

| Rank | ID | Item | Primary persona | Rationale | Likely effort |
|---|---|---|---|---|---|
| **1** | **C-1** | Academy-scoped assign program library | Coach | Without this, shared curriculum does not reach students — the core academy value prop fails in the field. | S–M |
| **2** | **AO-2** | Remove member + change role | Owner | Org control incomplete; UI-only on existing RLS. | S |
| **3** | **AO-1** | Academy-wide student roster | Owner | Owners cannot operate the academy they “own.” RLS already there. | M |
| **4** | **AO-3** | Unpublish programs | Owner | Safety valve for curriculum mistakes; UI-only. | S |
| **5** | **C-2** | Academy context card on mobile coach home | Coach | Makes membership real on the surface coaches use daily. | S |
| **6** | **AO-4** | Academy settings (name, logo) | Owner | Brand continuity after create; matches marketing promise. | M |
| **7** | **C-3** | Push/in-app notify on publish | Coach | Closes the draft → publish collaboration loop. | M |
| **8** | **AO-5** | Coach invite (link or email invite) | Owner | Reduces friction to grow the team beyond “already registered users.” | M–L |
| **9** | **C-4** | Fix Academy tab gate for managers | Owner/Coach | Small reliability fix; unblocks mobile owner access. | S |
| **10** | **C-5** | Clarify pending-review vs dashboard access | Coach | Onboarding trust; avoids false “Access Denied.” | S |
| **11** | **AO-6** | Mobile-lite academy management | Owner | Web-first is OK short-term; expand after AO-1/2. | M–L |
| **12** | **P-1** | Admin Academies tab | Admin | Supportability as academy count grows. | M |
| **13** | **AO-7** | Owner ops dashboard (queue, health) | Owner | Differentiation once basics work. | L |
| **14** | **C-6** | Solo coach self-publish policy | Solo coach | Product decision first; then small UI. | S + decision |
| **15** | **P-3** | Surface academy on player coach discovery | Player | Marketplace story; after ops solid. | M |
| **16** | **AO-8** | Define Staff permissions | Owner | Schema cleanup / real third tier. | M |
| **17** | **P-2** | Tighten manager UPDATE RLS columns | Platform | Security hygiene before expanding edit paths. | S |
| **18** | **C-7 / AO-9 / P-4** | Multi-sport, monetization, white-label | All | Explicitly later — after ops MVP. | L+ |

### Suggested delivery slices

**Slice A — Academy ops MVP (ranks 1–5)**  
Shared curriculum reaches students; owners can manage people and retract content; coaches see they belong somewhere.

**Slice B — Brand & collaboration (ranks 6–8, 10)**  
Editable academy identity, invite path, publish notifications, clean onboarding access.

**Slice C — Scale & support (ranks 9, 11–13, 15)**  
Mobile owner lite, admin visibility, richer owner analytics, player-facing academy signal.

**Slice D — Business model (ranks 14, 16–18)**  
Staff model, solo publish policy, paywalls, multi-sport, white-label.

---

## 7. Open product decisions

Decided decisions are marked **RESOLVED**. Remaining open items still need a call before implementation.

| # | Question | Decision | Impact |
|---|---|---|---|
| D1 | Does creating an academy require a prior coach profile? | **RESOLVED — Yes, mandatory.** The funnel is Coach profile → Create Academy. A pure owner with no coach row cannot bootstrap an academy. The UI guard in `ProfileScreen` (`isCoach && !isManager`) stays intentional. | AO-5 invite flow must still require recipient to complete a coach profile before joining as coach. Onboarding docs reflect this dependency explicitly. |
| D2 | Can solo coaches self-publish without an academy? | **RESOLVED — Yes.** Solo coach self-publish is the first paid tier we will sell (payment not in scope now). For now, gap C-6 is unblocked: build the self-publish UI path without a paywall. The paywall gate will be added later as a feature flag when monetization ships. | C-6 moves from "product decision needed" to "build self-publish, paywall later." Update backlog rank when planning Slice D. |
| D3 | Is student membership academy-first or coach-first? | **RESOLVED — Depends on coach context.** If the coach has no academy: student is linked to the coach only (`academy_id = NULL` on `coach_students`). If the coach belongs to an academy: student is linked to the academy first (`academy_id` populated on the `coach_students` row). The student joined the academy's coaching system, not just one coach. | C-1 insert fix and AO-1 roster rely on this: `addStudentByCode` must write `academy_id` from the coach's membership when present. Backfill migration covers historical rows. |
| D4 | Should academy coaches see all academy students or only their own? | **RESOLVED — Own only by default; manager reassigns.** Each coach sees only their personal student list. The academy owner/manager can reassign a student from one coach to another (e.g. coach out sick). This reassignment feature is not in ranks 1–10 but the data model supports it: changing `coach_id` on the `coach_students` row is sufficient. | AO-1 roster is manager-only read. AC-AO1-4 (cross-coach isolation) stands. A future "Reassign Student" action in the manager roster (rank 11+) is the correct place for this. |
| D5 | What does Staff do? | Open — no decision yet. | AO-8 deferred. |
| D6 | Coach profile `is_active` vs directory listing | **RESOLVED (from C-5 fix)** — `is_active = true` grants dashboard access immediately on profile save. `is_accepting_students = true` gates public directory listing, which may require manual review. These are two independent flags. Label fix (C-5) makes this clear in the UI. | C-5 label fix is now correctly scoped: rename `is_active` checkbox only. No logic change. |
| D7 | One academy per sport forever, or multi-sport org later? | **RESOLVED — One academy, multi-sport on the backend architecture only.** The `academies` table and `academy_members` table have no `sport_id` constraint — an academy can span sports at the DB level. The UI is intentionally single-sport for now (one sport picker, one content view). No UI multi-sport work in ranks 1–10. | No new DB migration needed for D7. Do not add `sport_id` FK to `academies`. When the UI eventually exposes multi-sport, it reads from existing `programs.sport_id`. |

---

## 8. Success metrics (once Slice A ships)

| Metric | Definition | Target (initial) |
|---|---|---|
| Academy activation | Academies with ≥1 coach member besides owner within 14 days | Track baseline |
| Curriculum usage | % of academy student assignments using academy-scoped published programs | Rising after C-1 |
| Owner retention | Managers returning to My Academy / Content weekly | Track |
| Publish cycle time | Draft created → published (median) | Falling after AO-3 + C-3 |
| Support load | Tickets needing Studio for membership disputes | Falling after AO-2 + P-1 |

---

## 9. One-line roadmap summary

**Now (Slice A):** Make the academy real in the field — shared programs assignable, owners can manage people and retract content, coaches see the brand.  
**Next (Slice B):** Brand settings, invite links, notify-on-publish, solo coach self-publish (no paywall yet).  
**Later (Slice C/D):** Paywall on solo publish, white-label, multi-sport UI, staff as a real role, student reassignment by manager.

---

## 10. User stories & acceptance criteria (Slice A — ranks 1–10)

Format: **As [persona], I want [action], so that [outcome].**  
Acceptance criteria (AC) are the minimum bar for a story to be considered done. Failing any AC = bug. Used for implementation validation and QA testing.

---

### C-1 — Academy-scoped assign-program list

**Story (Academy Coach):** As an academy coach, I want to assign my academy's published programs to my students, so that students receive the curriculum my manager has approved — not random programs from the global pool.

**Story (Solo Coach):** As a solo coach, I want the assign-program list to still show global coach programs when I am not in an academy, so that my workflow is unchanged.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-C1-1 | Academy coach opens "Assign Program" for any student → list shows only programs where `academy_id = coach's academy` and `is_published = true`. No programs from other academies appear. | Log in as academy coach, open Assign Program. |
| AC-C1-2 | Programs without `is_coach_program = true` appear in the list when they belong to the coach's academy. | Verify a program flagged `is_coach_program = false` but in the academy appears in list. |
| AC-C1-3 | Solo coach (no `academy_members` row) still sees `is_published = true AND is_coach_program = true` — no regression. | Log in as solo coach, confirm old list behaviour. |
| AC-C1-4 | When a coach adds a new student via code, the resulting `coach_students` row has `academy_id` populated (not `null`). | Insert student, query `coach_students` in Supabase Studio to confirm. |
| AC-C1-5 | Academy coach's Programs tab in `CoachDashboardScreen` applies the same academy-scoped filter. | Switch to Programs tab, verify list matches AC-C1-1. |

---

### C-2 — Academy context card on mobile coach home

**Story (Academy Coach):** As an academy coach, I want to see my academy name and manager contact on my home screen, so that I know which organization I belong to without navigating elsewhere.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-C2-1 | Academy coach's home screen shows a card with: academy name, academy slug, and manager's display name. Manager name is resolved via `users.name` join — not a column on `academy_members`. | Log in as academy coach; verify name matches DB `users.name` for the manager. |
| AC-C2-2 | Solo coach sees no academy card (no empty or broken card rendered). | Log in as solo coach, confirm card is absent. |
| AC-C2-3 | Card is visible on both Students and Programs sub-tabs. | Switch tabs, confirm card persists. |
| AC-C2-4 | If the coach's academy has no manager with a name (edge case), the card shows academy name only — no crash. | Test with a manager whose `users.name` is null. |

---

### C-3 — FCM push notification on publish

**Story (Academy Coach):** As an academy coach who submitted a draft program, I want to receive a push notification when my manager publishes it, so that I know the curriculum went live without checking the dashboard.

**Story (Academy Manager):** As a manager who publishes a coach's draft, I want the notification to fire automatically, so that I do not have to manually inform each coach.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-C3-1 | Fresh install on Android: app requests notification permission on first authenticated launch. | Install, launch, confirm system permission dialog appears. |
| AC-C3-2 | After permission granted, an FCM token is upserted into `device_push_tokens` for the authenticated user. | Grant permission, query `device_push_tokens` in Studio. |
| AC-C3-3 | Manager publishes a coach's draft → the authoring coach receives a push notification within 30 seconds (foreground or background). | Manager publishes, coach device receives push. |
| AC-C3-4 | Push notification body includes program name and a clear label ("Your program 'X' is now live"). | Read notification on device. |
| AC-C3-5 | If the authoring coach has no `device_push_tokens` row, publish still succeeds and no error is surfaced to the manager. | Remove coach token from DB, manager publishes — no error shown. |
| AC-C3-6 | Notification fires only once per publish event (no duplicates). | Publish once, confirm single notification received. |
| AC-C3-7 | App in background or killed still receives the notification (background handler wired). | Kill app, manager publishes, notification appears in tray. |
| AC-C3-8 | If the Edge Function returns an error (e.g. Firebase Admin misconfigured), publish still succeeds and the manager sees a non-blocking toast: "Program published. Notification to coach may not have delivered." | Break the Edge Function temporarily, publish — confirm toast appears and publish succeeds. |

---

### C-4 — Academy tab gate fix

**Story (Academy Manager who is also a coach):** As a manager-coach who has paused student intake, I want the Academy tab to still appear in my bottom nav, so that I can access my dashboard without toggling the intake flag.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-C4-1 | Manager-coach with `is_accepting_students = false` sees the Academy bottom tab. | Set flag to false in DB, relaunch app. |
| AC-C4-2 | Solo coach with `is_accepting_students = false` does NOT see the Academy tab (no regression). | Confirm solo coach tab is absent when not accepting students. |
| AC-C4-3 | Pure manager (no `coaches` row) sees the Academy tab. | Create manager with no coach profile, confirm tab appears. |

---

### C-5 — Correct is_active label

**Story (New Coach):** As a coach completing my profile, I want the checkbox labels to clearly tell me what each one controls, so that I do not accidentally deactivate my dashboard access by confusing the two flags.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-C5-1 | `CreateCoachProfileScreen` shows "Activate my coach account" (not "Available for new students") for the `is_active` checkbox. | Open coach profile form, read label. |
| AC-C5-2 | Sub-text reads: "Enables access to the coach dashboard. Uncheck only if you want to deactivate your account." | Read sub-text. |
| AC-C5-3 | `is_accepting_students` checkbox retains its label "Publish my profile in the coach directory" — unchanged. | Confirm second checkbox label. |
| AC-C5-4 | Saving with `isActive = true` still writes `is_active = true` to the DB — no logic regression. | Save form, query `coaches` table. |

---

### AO-1 — Academy-wide student roster

**Story (Academy Owner):** As an academy manager, I want to see all students enrolled under any coach in my academy, so that I can monitor overall student engagement and know who is being coached.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-AO1-1 | My Academy tab → Students section lists all active `coach_students` rows where `academy_id = manager's academy`. | Add students via two different academy coaches, view as manager. |
| AC-AO1-2 | Each row shows: student name, email, assigned coach name, and date added. | Read each column. |
| AC-AO1-3 | Students added by solo coaches (`academy_id = NULL`) do not appear in the academy roster. | Confirm pre-fix solo coach rows are absent. |
| AC-AO1-4 | Academy coaches viewing their own dashboard still see only their own students — no cross-coach bleed. | Log in as academy coach, confirm only own students visible. |
| AC-AO1-5 | Roster is read-only: no edit or delete actions on student rows. | Confirm no action buttons on student rows. |
| AC-AO1-6 | Empty state shown with helpful copy when no students are enrolled yet. | Test on fresh academy with no students. |

---

### AO-2 — Remove member + change role

**Story (Academy Owner):** As a manager, I want to remove a coach from my academy or change their role, so that I have full control over my team without needing Supabase Studio.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-AO2-1 | Each member row in the Members table has a "..." or action menu. | Open My Academy, inspect member rows. |
| AC-AO2-2 | "Change Role" action opens a dropdown with Coach / Staff / Manager options; selecting saves immediately and refreshes the list. | Change a coach to Staff, confirm role badge updates. |
| AC-AO2-3 | "Remove" action shows a confirmation dialog before executing. | Tap Remove, confirm dialog appears. |
| AC-AO2-4 | After removal, the member row disappears from the list. | Confirm member gone after Remove confirmed. |
| AC-AO2-5 | The manager cannot remove their own row — their row has no Remove action (or it is disabled with a tooltip). | Log in as manager, confirm own row has no Remove. |
| AC-AO2-6 | Removing a member does NOT delete the coach's programs or student records. | After removal, confirm coach's programs still exist in Content Management. |
| AC-AO2-7 | After a coach is removed, their students no longer appear in the AO-1 academy roster. Verify `coach_students.academy_id` is `NULL` for those rows. | Add a student via a coach, remove the coach, open the academy roster — student row is gone; confirm DB field is null. |

---

### AO-3 — Unpublish programs

**Story (Academy Owner):** As a manager, I want to retract a published program back to draft, so that students stop seeing outdated or incorrect curriculum.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-AO3-1 | Published academy program in Content Management shows an "Unpublish" button for managers. | Open Content Management as manager, find published program. |
| AC-AO3-2 | Clicking Unpublish sets `is_published = false` and the program moves to the Draft filter without page reload. | Unpublish, switch to Draft filter — program appears. |
| AC-AO3-3 | Status badge updates from "Published" to "Draft" immediately in the row. | Read badge after action. |
| AC-AO3-4 | Unpublish only applies to academy-scoped programs — the button is absent on non-academy or global programs. | Attempt to unpublish a non-academy program — button must be absent. |
| AC-AO3-5 | After unpublish, players can no longer browse or start the program on next app open. The player-facing query already filters `is_published = true`; in-memory cache clears on relaunch. | Force-quit and reopen the player app after unpublish; confirm program is absent from browse view. |

---

### AO-4 — Academy settings (name + logo)

**Story (Academy Owner):** As a manager, I want to update my academy's name and logo after creation, so that my brand can evolve without starting over.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-AO4-1 | My Academy tab shows an "Academy Settings" card with a pre-filled name field and current logo (or placeholder). | Open My Academy, inspect settings card. |
| AC-AO4-2 | Saving a new name updates `academies.name` in the DB and the card header refreshes. | Change name, save, re-open tab. |
| AC-AO4-3 | Logo upload opens the image picker; selecting an image uploads to `avatars` bucket under `academy-logos/<academyId>/` and updates `academies.logo_url`. | Pick a new logo, confirm upload and `logo_url` updated in DB. |
| AC-AO4-4 | Saving with an empty name field shows a validation error and does not call the DB. | Clear name, tap Save — error shown. |
| AC-AO4-5 | If upload fails, the old logo is retained and an error message is shown. | Simulate network failure during upload. |

---

### AO-5 — Invite link / token flow

**Story (Academy Owner):** As a manager, I want to generate a shareable invite link for a new coach, so that they can join my academy without needing to already be registered.

**Story (Coach receiving invite):** As a coach who received an invite link, I want to tap it and be taken directly to join the academy, so that onboarding takes under a minute.

| # | Acceptance criterion | How to test |
|---|---|---|
| AC-AO5-1 | My Academy tab shows a "Generate Invite Link" button with a role selector (Coach / Staff / Manager). | Open My Academy, find button. |
| AC-AO5-2 | Clicking Generate creates a row in `academy_invites` and displays a copyable link in the format `academypro://invite/<token>`. | Generate, inspect DB row and displayed link. |
| AC-AO5-3 | Generated link expires after 7 days — `expires_at` is set correctly. | Query `academy_invites`, verify `expires_at`. |
| AC-AO5-4 | Tapping the invite link on a device with the app installed opens `AcceptInviteScreen` showing academy name and offered role. | Open link on test device. |
| AC-AO5-5a | Authenticated user with an active coach profile taps "Join" on a coach-role invite → RPC succeeds → user appears in Members list with role "Coach". | Accept invite as a user with a `coaches` row, verify member list and DB. |
| AC-AO5-5b | Authenticated user with NO coach profile taps "Join" on a coach-role invite → error "You must complete your coach profile before joining an academy as a coach." → CTA navigates to `CreateCoachProfileScreen`. The invite token is NOT consumed (`used_at` remains null). | Accept invite as user with no `coaches` row, verify error, CTA, and that `academy_invites.used_at` is still null. |
| AC-AO5-5c | Authenticated user taps "Join" on a staff- or manager-role invite → RPC succeeds regardless of whether they have a coach profile. | Accept staff invite as non-coach user, verify member list. |
| AC-AO5-6 | User who already belongs to an academy sees "You already belong to an academy" — invite is not consumed. | Accept link as existing academy member. |
| AC-AO5-7 | Expired invite shows "This invite link has expired" — invite is not consumed. | Manually set `expires_at` to past, open link. |
| AC-AO5-8 | Already-used invite shows "This invite has already been used." | Use invite once, try a second time — error shown. |
| AC-AO5-9 | Unauthenticated user opening an invite link is taken to Sign Up / Log In first; after auth completes, `AppContent` reads the pending token from AsyncStorage and navigates to `AcceptInviteScreen` automatically. The token is cleared from AsyncStorage after navigation. | Open link logged out, sign up, confirm `AcceptInviteScreen` appears and join succeeds without re-tapping the link. |
| AC-AO5-10 | Manager can generate multiple active invites for different roles simultaneously. | Generate two links with different roles, verify both rows in DB. |

---

## 11. Implementation notes (Slice A + B — shipped 2026-07-18)

### Schema gotcha: `coach_students.coach_id` is NOT `auth.users.id`

`coach_students.coach_id` references `coaches.id` (the coach profile PK), **not** `auth.users.id`. Every function that touches `coach_students` must resolve the indirection:

```sql
-- Correct: join through coaches to reach user context
SELECT cs.*
FROM coach_students cs
JOIN coaches c ON c.id = cs.coach_id
JOIN academy_members am ON am.user_id = c.user_id
WHERE am.academy_id = :academy_id;
```

This affected two bugs found during verification:
- `handleRemoveMember` in `AdminDashboard.js` — cleanup of `coach_students` rows after member removal.
- `20260718000003_backfill_coach_students_academy_id.sql` — the backfill migration join condition.

Both are fixed. A comment has been added to the top of each affected function.

### Deep link scheme

The invite link scheme is `academypro://invite/<token>`. **This scheme must be registered in `app.json`** under the `scheme` field for the OS to hand off the URL to the app. The `deepLinkHandler.js` branch is dead code until `app.json` lists `academypro` as a scheme. Verify before shipping a production build.

### FCM setup (greenfield)

FCM was installed from scratch (no prior Expo notifications). Key files:

| File | Purpose |
|---|---|
| `android/app/google-services.json` | FCM config for Android — downloaded from Firebase Console, added to `.gitignore` |
| `ios/PicklePro/GoogleService-Info.plist` | FCM config for iOS — replaced placeholder with full file, added to `.gitignore` |
| `supabase/functions/notify-on-publish/index.ts` | Edge Function — fetches FCM token from DB, sends push via Firebase HTTP v1 API |
| `supabase/migrations/20260718000002_device_push_tokens.sql` | `device_push_tokens` table + RLS |
| `App.js` | Permission request, token upsert, background handler, foreground handler |

Neither config file should ever be committed to git. If they are missing on a fresh clone, download them from the Firebase Console (project: `picklepro-373b6`, app bundle: `com.picklepro.mobile`).

### `addStudentByCode` — two-path `academy_id` resolution

When a new student is added via invite code, `addStudentByCode` in `src/lib/supabase.js` now:
1. Looks up the coach’s `user_id` from `coaches` (using `coachId` = `coaches.id`).
2. Queries `academy_members` for that `user_id` to get `academy_id`.
3. Writes `academy_id` to the new (or reactivated) `coach_students` row.

The reactivation path (existing inactive row) also refreshes `academy_id` — so a solo coach who later joins an academy will have their existing students correctly attributed on the next re-add.

### Backfill migration

`20260718000003_backfill_coach_students_academy_id.sql` sets `academy_id` on any `coach_students` rows created before the C-1 fix (where `academy_id IS NULL`). It is idempotent and safe to re-run. Run it once after deploying Slice A to populate the AO-1 academy roster for existing data.

### `AdminDashboard.js` — `handleRemoveMember` two-step cleanup

Removing a coach does two writes:
1. `DELETE FROM academy_members WHERE id = member.id`
2. Fetch the coach’s `coaches.id` from their `user_id`, then `UPDATE coach_students SET academy_id = NULL WHERE coach_id = coaches_id`

Step 2 is required so removed coaches’ students disappear from the AO-1 academy roster immediately. Without it, the roster bleeds stale rows.

### Non-blocking toast on FCM failure

If the `notify-on-publish` Edge Function fails, `handlePublishProgram` catches the error silently and sets `bannerMessage` state. The banner renders at the top of the main content area and does **not** block the publish action. The program is always published regardless of notification outcome (AC-C3-8).

### Open items before next build

| Item | Risk | Action |
|---|---|---|
| Register `academypro://` in `app.json` | AO-5 invite deep link is dead code without it | Add to `scheme` field or confirm existing scheme covers it |
| Run backfill migration on production DB | AO-1 roster will be empty for pre-fix data | Apply `20260718000003_backfill_coach_students_academy_id.sql` |
| Set `FIREBASE_SERVICE_ACCOUNT_JSON` on Supabase Edge Function env | C-3 push will fail silently | Paste service account JSON in Supabase dashboard → Edge Functions → notify-on-publish |
| Test FCM on physical Android device | Simulator does not receive FCM | Use a physical device for C-3 acceptance testing |
