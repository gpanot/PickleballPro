# Club Sessions — Phased Build Plan for Cursor

**How to use this document:** run each phase prompt in Cursor in order. Do not skip ahead. Every phase prompt ends with the same mandatory line — Cursor must verify and test its own work before moving to the next phase, not just complete the task and stop. This is intentional and should not be removed or softened in any phase.

Source of truth for every phase: `club_sessions_spec.md` (the locked spec). Cursor should read the relevant section before implementing, not guess at field names, especially given the naming collisions already caught in the schema audit (§9 of the spec).

---

## Phase 1 — Schema & migrations

**Scope:** Prisma models only. No API routes, no UI, no business logic beyond what's enforced at the database level (constraints, defaults).

**Build:**
- `AppClub` model (spec §3.1), including the `creatorId` unique constraint
- `AppClubManager` model (spec §3.1b), including the `@@unique([appClubId, playerProfileId])` constraint
- `ClubSession` model (spec §3.2), with real `DateTime` fields (not strings, unlike the scraped `Session` model)
- `ClubSessionBooking` model (spec §3.3)
- Migration files, run against a dev database

**Cursor prompt:**
```
Read club_sessions_spec.md, sections 3 and 9, in full before starting.

Implement the following Prisma models exactly as specified in §3: AppClub,
AppClubManager, ClubSession, ClubSessionBooking. Use the exact field names,
types, and constraints listed in the spec, including:
- AppClub.creatorId as a unique foreign key to PlayerProfile.id
- AppClubManager's composite unique constraint on [appClubId, playerProfileId]
- ClubSession.startTime/endTime as real DateTime fields, not strings
- All status/privacy/role fields as plain String columns with defaults,
  not Postgres enums (confirm this matches the rest of the schema, per §9)

Do not reuse or modify the existing Club, Session, or AuthSession models.
Those are scraped Reclub entities and a separate NextAuth model respectively,
unrelated to this feature.

Generate and run the migration against the dev database. Do not build any
API routes, business logic, or UI in this phase.

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 2 — Core CRUD APIs

**Scope:** Basic create/read/update endpoints for clubs, managers, sessions, and bookings. No status-transition logic, no notifications, no soft-capacity behavior yet, just the plumbing.

**Build:**
- `/api/app-clubs` — create, get, update (no `/api/clubs`, that's taken)
- `/api/app-clubs/[id]/managers` — add/list managers
- `/api/club-sessions` — create, get, update, list with upcoming/past filtering
- `/api/bookings` — create a booking (defaults to whatever `requiresApproval` dictates), get, list by session
- `/api/memberships` — join a club

**Cursor prompt:**
```
Read club_sessions_spec.md §3 and §6 (user stories) before starting.

Build basic CRUD API routes for the four models from Phase 1:
- /api/app-clubs (create, get, update)
- /api/app-clubs/[id]/managers (add manager, list managers)
- /api/club-sessions (create, get, update, list — support filtering by
  upcoming vs past per §10 issue 4)
- /api/bookings (create, get, list by session)
- /api/memberships (join a club)

Use /api/app-clubs and /api/club-sessions, not /api/clubs or /api/sessions —
those prefixes are already taken by the Reclub scraper per the schema audit.

A booking's initial status should be "confirmed" if the session's
requiresApproval is false, or "requested" if true — but do NOT build the
full state machine yet (waitlist, auto-backfill, decline logic). That's
Phase 3. This phase is just CRUD plumbing.

Enforce the one-club-per-creator constraint at the API level too, not just
the database, with a clear error message if someone who already has a club
tries to create another.

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 3 — Booking state machine, soft capacity, and notifications

**Scope:** The actual business logic that makes this feature behave correctly. This is the most failure-prone phase, get it fully right before touching any UI.

**Build:**
- Full status transition logic: Requested → Confirmed / Waiting list / Declined, host-reversible at any time
- Soft capacity: confirming players past `maxPlayers` is allowed, never blocked
- Waitlist auto-backfill: a freed Confirmed spot automatically promotes the longest-waiting player
- The full notification matrix from spec §4, every transition fires, no silent path
- `attendanceStatus` (unmarked/checked_in/no_show) and `paidStatus` toggles, host-only, Confirmed bookings only

**Cursor prompt:**
```
Read club_sessions_spec.md §3.3 and §4 in full before starting. This phase
implements the actual rules, get this right, it's the core of the feature.

Implement:
1. Status transitions on ClubSessionBooking: requested → confirmed /
   waiting_list / declined. Any transition must be host-reversible at any
   time (e.g. waiting_list → confirmed, confirmed → declined).
2. Soft capacity: a host can confirm bookings past ClubSession.maxPlayers.
   Never block this at the API or database level. maxPlayers is a target,
   not a cap.
3. Waitlist auto-backfill: when a Confirmed booking's status changes away
   from confirmed (player cancels, or host moves them off), automatically
   promote the longest-waiting "waiting_list" booking on that session to
   "confirmed". No host action required. If no one is on the waiting list,
   the spot simply opens with no action.
4. Every notification row in spec §4's table, fired on the matching
   transition. Pay specific attention to: host gets notified when a
   confirmed player cancels (this is the one notification direction that's
   easy to miss, since it's host-facing rather than player-facing).
5. attendanceStatus (unmarked/checked_in/no_show) and paidStatus as
   host-only manual toggles, only actionable on Confirmed bookings.

Write tests for the auto-backfill logic specifically — this is the one
piece of business logic in the whole feature most likely to have an edge
case bug (e.g. multiple cancellations in quick succession, empty waiting
list, etc).

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 4 — Club Sessions entry flow (reuse existing auth/onboarding, do not rebuild)

**Scope:** This phase is routing logic, not new screens. The existing app already has working Google/Apple OAuth and a 4-step onboarding (auth → DUPR → time preferences → gender, plus Reclub linking) writing to `PlayerProfile`. Do not build any of that again.

**Build:**
- A check on Club Sessions entry: if `PlayerProfile` already has nickname, DUPR, and gender populated, skip onboarding entirely and go straight to Club Sessions home.
- If not populated, reuse the existing auth screen, the existing `@nickname` step (the same one used for Squadd, this is the one shared nickname field, not a second one), the existing DUPR step, and the existing gender step, in that order, exactly as they exist today, just skip the time-of-day preference step, the Reclub-linking step, and the "Build your crew" carousel that currently follows nickname capture, none of those three apply to Club Sessions.
- On completion, route to Club Sessions home instead of Circle's "People you may know," since that's where this entry sequence started.

**Cursor prompt:**
```
Read club_sessions_spec.md §13 in full before starting. This phase is
about reuse and routing, not building a new signup system. Do not create
new auth screens, new OAuth logic, or any new nickname/profile-field-
capture screens or fields.

The app already has working Google/Apple OAuth (which already provides
the person's real name) and an existing onboarding sequence (auth,
@nickname, DUPR, time-of-day preferences, gender, plus Reclub player
linking, plus a "Build your crew" carousel that follows nickname capture
when entered via Squadd) that writes to PlayerProfile. There is exactly
ONE nickname field in this app, the existing @nickname step — do not
create a second "display name" field or anything resembling one. Find
and reuse the existing nickname component/screen and its existing API
endpoint.

Implement only this routing logic:
1. On Club Sessions entry, check whether PlayerProfile already has
   nickname, DUPR, and gender populated. If yes, skip onboarding entirely
   and go straight to Club Sessions home — do not show any signup screens
   to a returning user, regardless of which tab they entered through.
2. If those fields are NOT populated, run the existing auth screen, then
   the existing @nickname step, then the existing DUPR step, then the
   existing gender step, in that order, using the existing components and
   endpoints as-is.
3. Skip the existing time-of-day preference step entirely for this entry
   path — that field is Play-tab-specific and not needed here.
4. Skip the existing Reclub-linking step entirely for this entry path —
   Club Sessions is independent of Reclub per this spec's locked decisions.
5. Skip the "Build your crew" carousel that currently follows nickname
   capture when entered via Squadd — that carousel stays Squadd-specific.
   Only the nickname field itself is shared, not the screens around it.
6. On completion, route to Club Sessions home, not to Circle's "People you
   may know," since the person entered via Club Sessions.

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 5 — Navigation shell (stack-based routing, no visual design yet)

**Scope:** Wire up the actual screen routing using a real navigation stack (e.g. React Navigation's native stack), matching the push / replace / back model from spec §14. Build this with placeholder/unstyled screens first, the goal here is correct navigation behavior, not visuals.

**Build:**
- All 20 screens from spec §5 as routes, even if just stubbed content at this point
- Push behavior for drill-in actions (tapping a card, FAB, list row)
- Replace behavior for completion actions (Save, Publish, Create, destructive confirmations, explicit "Done" exits) — see the full list in spec §14
- Back behavior that pops the real stack, not a hardcoded per-screen target

**Cursor prompt:**
```
Read club_sessions_spec.md §5 and §14 in full before starting.

Build the navigation shell for all 20 screens listed in §5, using the
platform's real navigation stack (e.g. React Navigation), not custom
state-based screen swapping. Screens can be unstyled stubs at this point,
the goal of this phase is correct navigation behavior only.

Apply the push / replace / back model exactly as specified in §14:
- PUSH for drill-in actions (tapping a card, a FAB, a list row) — the
  destination's back action should return to wherever the person actually
  came from.
- REPLACE for completion actions (Save, Publish, Create, a destructive
  confirmation, an explicit "Done" or "Back to X" exit) — these must NOT
  leave the just-completed form or sheet in the navigation history.
- BACK pops the real stack. No screen should have a hardcoded single back
  target if it has more than one possible entry point. club-detail
  (reachable from both Home and Profile) and session-create (reachable
  from both Home's FAB and Club Detail's FAB) are the two screens most
  likely to get this wrong, double check both specifically.

Confirm tab-root screens (Club Sessions home, both empty-state variants)
correctly have no back action, and that the two terminal confirmation
screens (session-cancelled, booking-cancelled) exit forward only, never
back into the action that produced them.

Implement the persistent bottom tab bar (Circle, Squadd, Play, Club
Sessions) per spec §15. It must be visible on Club Sessions home, both
empty-state variants, Club detail, Search/Calendar, Session detail,
Roster & approvals, Profile (both variants), My booking, and the
Published session management view — and hidden on every signup step,
every create/edit form, both bottom sheets, and the two terminal
confirmation screens plus Booking confirmation. On the three screens that
have both the tab bar and a footer action, make sure the footer sits
above the tab bar, not behind or overlapping it.

An HTML prototype of all 20 screens with this exact navigation logic
already implemented in vanilla JS is available as a visual and behavioral
reference — match its push/replace/back assignments exactly, don't
re-derive them from scratch.

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 6 — UI implementation, host flow

**Scope:** Real visual implementation of every host-facing screen, using the existing SQUADD design system plus the flat-button treatment specific to this feature (no 3D gradient buttons, that's reserved for the game layer).

**Build:** Screens #2 (host view), #3, #4, #5, #6, #7, #8, #9, #10, #11/#12, #18 (Profile, host variant), #19 from spec §5.

**Cursor prompt:**
```
Read club_sessions_spec.md §10 (UI/UX review) in full before starting, and
reference the existing squadd-mobile-ux skill for design tokens.

Implement the visual design for every host-facing screen from spec §5:
club detail (host view), quick-create club, create club (full), edit club,
create session, preview/draft, published session management, edit session,
cancel session sheet, roster & approvals (merged into one screen with
status filter pills per §10 issue 4, not two separate screens), Profile
(host variant), and the session-cancelled confirmation screen.

Specific things to get right, all called out in §10 and corrected in
later review rounds:
- Buttons are flat (solid fill, no gradient, no 3D border-bottom treatment)
  throughout this feature — that styling is reserved for the game layer.
- The roster screen uses avatar visual states (confirmed = solid, waiting
  list = faded/desaturated, requested = dashed outline placeholder), not
  just text labels, mirroring the squad chest member-grid pattern.
- A session that's been confirmed past its target capacity shows a clear
  "FULL · N over target" pill, never an overflowing progress bar.
- A session sitting at "venue to be determined" shows a visible reminder
  pill on the management view, not just a static label.
- Club creation is only ever reachable through Profile, never from a Home
  FAB or any Club Sessions browsing surface.
- All icons are real icon components (e.g. lucide-react), never emoji.
- Avatars are deterministic colored initials (or real photos once
  available), never emoji.

A fully built HTML/CSS prototype matching this exact visual direction
(icon system, avatar system, color tokens, spacing) is available as the
reference implementation. Match it closely rather than re-interpreting
the design language from the written spec alone.

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 7 — UI implementation, player flow

**Scope:** Real visual implementation of every player-facing screen.

**Build:** Screens #1 (player view), #2 (player view), #13, #14, #15, #16, #17, #20 from spec §5.

**Cursor prompt:**
```
Read club_sessions_spec.md §10 and §11 in full before starting.

Implement the visual design for every player-facing screen: Club Sessions
home (player view), club detail (player view, with "Join club" action),
search/calendar, session detail, booking confirmation, my booking/cancel,
both empty-state variants, and the booking-cancelled confirmation screen.

Specific things to get right:
- Session detail must show the level self-check indicator under the level
  range field ("Your level: 3.2 · within range" or a below-range warning),
  using the DUPR/level captured during the Phase 4 entry flow. This was
  flagged in §10 issue 3 and is now unblocked per §13.
- The CTA on session detail adapts: "Book my spot" for sessions with
  requiresApproval off, "Request to join" when on, and the player's
  current status (pending/waiting list/confirmed) if they've already
  acted on this session.
- Both empty states need an actual icon-in-badge visual, not text alone,
  per the explicit anti-pattern called out in §10 issue 6.
- The cancel-booking confirmation sheet must mention the waitlist
  auto-backfill behavior in its copy ("if someone is on the waiting list,
  your spot will automatically go to them"), since that's real Phase 3
  behavior the player should understand before confirming.
- All icons are real icon components, never emoji. Avatars are
  deterministic colored initials, never emoji.

Match the reference HTML/CSS prototype's visual direction exactly.

Verify your work and do a complete test, fix eventual gaps or bugs, then
only continue to the next phase.
```

---

## Phase 8 — Full integration QA pass

**Scope:** No new features. This phase exists purely to catch the gaps that only show up once backend and UI are actually wired together end to end, things no single earlier phase could have caught in isolation.

**Cursor prompt:**
```
No new features in this phase. Run a full integration pass across the
entire Club Sessions feature, backend and UI together, and fix anything
broken. Specifically check:

1. Every notification in spec §4's matrix actually fires and deep-links to
   a screen that reflects the correct state (e.g. tapping a "you're on the
   waiting list" notification should land on session detail with that
   status banner already showing, not a generic screen).
2. The waitlist auto-backfill from Phase 3 is visible live in the host's
   roster screen without requiring a manual refresh.
3. Every navigation push/replace/back assignment from Phase 5 still holds
   now that real data and real screens are wired in, re-test club-detail
   and session-create specifically, since those are the two screens with
   multiple entry points.
4. One club per creator is enforced and surfaces a clear error in the UI,
   not just a backend 400, if violated.
5. The host-viewing-their-own-session routing rule from §10 issue 1: a
   host tapping into their own published session from anywhere (search,
   notification, club detail) lands on the management view, never the
   player booking view.
6. Soft capacity displays correctly once real bookings push a session
   past its target — confirm the "FULL · N over target" treatment renders
   correctly with live data, not just the static mock.
7. The persistent bottom tab bar (spec §15) shows and hides on exactly
   the right screens, and the footer-above-tab-bar layout on Published,
   Session detail, and My booking doesn't clip content or overlap once
   real (longer, variable-length) data is rendered instead of the mock.

Verify your work and do a complete test, fix eventual gaps or bugs, before
considering this feature ready to ship.
```
