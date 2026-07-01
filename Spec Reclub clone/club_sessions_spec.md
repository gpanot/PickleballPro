# Club Sessions — Feature Spec v1

## 1. Purpose

A new, independent bottom tab, **Club Sessions**, that lets a host create an open-play session (date, time, venue, capacity) and lets players find and book it, without depending on Reclub. Manual payment and check-in tracking by the host, same as Reclub today, no in-app payment processing.

**Reclub independence.** Play and Circle tabs are untouched and continue to be fed entirely by Reclub-scraped data. Club Sessions is a clean-room feature with its own data path. If Reclub shuts down, Play and Circle degrade, but Squadd and Club Sessions are unaffected.

**Shared infrastructure.** Club Sessions shares the same Postgres database as Squadd. No shared UI today, but built so a future version can connect a Club Session to a Squad Chest or XP event without a data migration.

---

## 2. Navigation

Bottom tabs become four, left to right:

| Tab | Data source | Status |
|---|---|---|
| Circle | Reclub scraper | Unchanged |
| Squadd | SQUADD-native | Unchanged |
| Play | Reclub scraper | Unchanged |
| **Club Sessions** | SQUADD-native (new) | New |

Club Sessions has its own home screen (not a sub-tab of Play or Squadd), reached directly from the bottom nav.

---

## 3. Data model

### 3.1 AppClub (new — sits above ClubSession)

**Naming note (post-audit):** `Club` is already taken by the scraped Reclub club entity (`clubs` table, fields like `reclubId`, `slug`, `zaloUrl`). The app-managed club in this spec is named **`AppClub`** to avoid collision. (`/api/clubs` is also taken by the scraper, the app endpoint will be `/api/app-clubs`.)

An AppClub is the parent entity. A host creates an AppClub once, then creates any number of ClubSessions under it. Players join an AppClub as a member (free, no approval complexity in v1) before or while booking a session under it.

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(uuid()) | matches existing convention (string PKs use uuid) |
| `name` | String | e.g. "Challengers 2" |
| `icon` | String? | emoji or image URL, simple picker |
| `sportId` | Int? | |
| `privacy` | String | `"public"` / `"private"` — plain string, no enum, matching schema-wide convention (no Postgres enums exist anywhere in this schema) |
| `level` | String? | "All levels" or a range string, mirrors Reclub's club-level field |
| `autoApproveNewMembers` | Boolean | **moved here from session-level.** Default `true`. When true, booking a session under this club auto-enrolls the player as a member, no separate confirmation step. When false, joining the club itself requires host approval, independent of any session-level approval setting. |
| `creatorId` | String → `PlayerProfile.id` **@unique** | the player who originally created this club. **One club per creator, still enforced** — see below, this constraint is about club ownership, not management capacity. **FKs to `PlayerProfile.id`, not the scraped `Player` model.** |
| `createdAt` | DateTime @default(now()) | |

**Kept deliberately simple for v1**, per the instruction that Reclub's club layer is overbuilt:
- No membership fee, no paid tiers
- No member approval queue at the club level beyond the single `autoApproveNewMembers` toggle
- No club-level chat, activities, or library tabs — those are Reclub features not being replicated
- Editable by the creator or any manager at any time: name, icon, sport, privacy, level

An AppClub shows its list of upcoming and past ClubSessions. Joining an AppClub is a simple one-tap "Join" action, membership has no state machine, you're either a member or not.

### 3.1b AppClubManager (new — multi-host support)

**Locked decision, revised:** a single club can have multiple managers, typically 2–3, who can all create, edit, and run sessions under that club. This replaces the earlier "single host per club" limitation, which was wrong — managing a real club is genuinely a multi-person job (someone handles bookings, someone handles the court relationship, someone's just an active co-organizer), and forcing one name on everything would have been the actual oversight.

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(uuid()) | |
| `appClubId` | String → `AppClub.id` | |
| `playerProfileId` | String → `PlayerProfile.id` | |
| `role` | String @default("manager") | `"creator"` / `"manager"` — plain string per schema-wide convention. The creator row is seeded automatically when the club is made; additional managers are added afterward |
| `addedAt` | DateTime @default(now()) | |
| `addedById` | String → `PlayerProfile.id` | who invited this manager, for accountability |

`@@unique([appClubId, playerProfileId])` — a player can't be added twice to the same club's manager list.

**What this changes elsewhere in this spec:**
- The "one club per host" constraint becomes "one club per **creator**" — a player can still only *found* one club, which preserves the original anti-ghost-club, anti-sprawl intent. But that club can now have 2–3 people actively running it, which is a different axis entirely and was the actual real-world need.
- Any screen or permission described earlier as "host can edit / cancel / manage" should read as "any manager on this club can edit / cancel / manage," with no hierarchy between creator and manager in v1 (no "creator can remove a manager but not vice versa" logic yet — see open items).
- `ClubSession.hostId` (§3.2) identifies which specific manager created or is running a *given session*, since with multiple managers it matters who's actually showing up to that one. This is separate from club-level management rights, which all managers share equally.

### 3.2 ClubSession

**Naming note (post-audit):** `Session` is already taken by the scraped Reclub session entity (`sessions` table, fields like `eventUrl`, `scrapedDate`). `AuthSession` also exists as a separate NextAuth model. The app-managed session in this spec is named **`ClubSession`** to avoid a three-way collision. (`/api/sessions` is taken by the scraper, the app endpoint will be `/api/club-sessions`.)

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(uuid()) | |
| `appClubId` | String → `AppClub.id` | every ClubSession belongs to exactly one AppClub |
| `hostId` | String → `PlayerProfile.id` | |
| `sportId` | Int? | inherited from club but editable per-session |
| `format` | String | `"social"` / `"round_robin"` / `"singles"` — plain string, matches schema-wide convention |
| `name` | String | auto-suggested, editable |
| `startTime`, `endTime` | DateTime | **stored as real `DateTime`, not raw strings** — the scraped `Session` model stores these as `String`, which the audit flagged as a known limitation there. The app-managed model should not repeat that pattern. |
| `durationMin` | Int | matches naming used on the existing scraped `Session.durationMin` for consistency |
| `venueId` | Int? → `Venue.id` | reuses the existing `Venue` table (already fully built, no collision) |
| `venuePending` | Boolean @default(false) | supports "To be determined" when no venue is set yet |
| `maxPlayers` | Int | **soft target, not a hard cap** — host may confirm players past this number. Field name matches the existing scraped `Session.maxPlayers` for consistency. |
| `requiresApproval` | Boolean @default(false) | When false, booking is instant (Confirmed). When true, booking creates a Requested state |
| `privacy` | String @default("public") | matches existing convention used on scraped `Session.privacy` |
| `feeAmount`, `feeCurrency` | Decimal?, String? | manual tracking only, no payment processing. Field names match existing scraped `Session.feeAmount` / `feeCurrency` for consistency |
| `skillLevelMin`, `skillLevelMax` | Decimal? | field names match existing scraped `Session.skillLevelMin` / `skillLevelMax` |
| `hostRole` | String @default("host_and_play") | `"host_and_play"` / `"host_only"` |
| `notes` | String? | free text |
| `lifecycleState` | String @default("draft") | `"draft"` / `"published"` / `"cancelled"` |
| `createdAt`, `updatedAt` | DateTime | |

### 3.3 ClubSessionBooking (player ↔ ClubSession)

**Naming note (post-audit):** no booking/RSVP/participant table exists today, so there's no collision risk here, but naming it `ClubSessionBooking` (rather than just `Booking`) keeps it unambiguous next to `SessionRoster` (the existing read-only scraped-roster table, which is unrelated and should not be reused or confused with this).

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(uuid()) | |
| `playerProfileId` | String → `PlayerProfile.id` | **same table Squadd uses** — not a new identity record, not `Player.userId` (which is the scraper's BigInt key). See §7 integration note. |
| `clubSessionId` | String → `ClubSession.id` | |
| `status` | String @default("requested") | `"requested"` / `"confirmed"` / `"waiting_list"` / `"declined"` — plain string per schema-wide convention, no enum |
| `paidStatus` | Boolean @default(false) | host-controlled manual toggle, confirmed bookings only |
| `attendanceStatus` | String @default("unmarked") | `"unmarked"` / `"checked_in"` / `"no_show"`, host-controlled manual toggle, day-of, confirmed bookings only. **Note:** the existing `SquadChest.source = "checkin"` uses a different string (`"checkin"`, no underscore) for an unrelated gamification concept — using `"checked_in"` here avoids string collision in any shared query/filter logic. |
| `requestedAt`, `decidedAt` | DateTime? | |
| `createdAt`, `updatedAt` | DateTime | |

**State transition rules:**
- If `requires_approval = false`: booking action → `Confirmed` directly, no host action.
- If `requires_approval = true`: booking action → `Requested`. Host manually moves to `Confirmed`, `Waiting list`, or `Declined`.
- `Waiting list` is used for two distinct host reasons: (a) session is at or past target capacity and host doesn't want to over-confirm further, or (b) player doesn't meet the level range but host wants to hold them in reserve rather than reject outright.
- Capacity is **never a hard gate**. A host may continue confirming players past the stated target to absorb expected no-show churn (typically 10–20%, per host experience, especially in adverse weather or multi-venue booking behavior).
- Any state is host-reversible at any time (e.g. Waiting list → Confirmed, Confirmed → Declined).
- **Waitlist auto-backfill (v1, implemented):** when a Confirmed player cancels their own spot (or is moved off Confirmed by the host), the system automatically promotes the longest-waiting player on the Waiting list to Confirmed, and fires the standard confirmation notification. No host action required. If the Waiting list is empty, the spot simply opens with no action.

---

## 4. Notifications

Every status transition fires a push notification. No silent transitions.

| Trigger | Recipient | Notification |
|---|---|---|
| Requested → Confirmed | Player | "You're confirmed for [session]" |
| Requested → Waiting list | Player | "You're on the waiting list for [session]" |
| Requested → Declined | Player | "Your request for [session] wasn't approved" |
| Waiting list → Confirmed | Player | Same as fresh confirmation |
| **Auto-backfill: Waiting list → Confirmed** (triggered by another player cancelling) | Promoted player | "A spot opened up — you're confirmed for [session]" |
| Host cancels session | All Confirmed + Waiting list players | "[Session] has been cancelled by the host" |
| Confirmed player cancels their own spot | Host | "[Player] cancelled their spot for [session]" — operational signal for the host re: churn, not shown to other players |

---

## 5. Screens — consolidated count

Renumbered into one master list, since several screens are shared between host and player (same screen, role-adaptive content) rather than duplicated. Shared screens are marked **(shared)**; everything else is role-specific.

| # | Screen | Role | Notes |
|---|---|---|---|
| 1 | Club Sessions home (tab landing) | **(shared)** | Search bar, "Mine" section (clubs/sessions you host or booked), browsable public clubs/sessions. FAB always points to session creation, never club creation — see #18 below |
| 2 | Club detail | **(shared)** | Identity header, session list under that club **split into Upcoming / Past**. Host sees edit pencil + manage entry points. Player sees "Join club" if not a member. Same screen, role-conditional controls — replaces the two separate "Club home" / "Club detail" drafts from earlier iterations |
| 3 | Quick-create club (new) | Host | One field only: club name, plus "Details can be updated later." Shown only when a host with zero clubs taps "Create session." Submitting lands directly in #6, skipping #2/#4 entirely on first use |
| 4 | Create club (full) | Host | Name, icon, sport, privacy, level, auto-approve toggle. Reached only from Profile (#18), **not from Home** — see correction below |
| 5 | Edit club | Host | Same fields as create, editable anytime |
| 6 | Create session | Host | Basics, date/time, venue, capacity, advanced section |
| 7 | Preview / Draft | Host | Exact player-facing render before publish, host-only visibility |
| 8 | Published session, host management view | Host | Hero, fill status, links to Roster, Approval queue, Edit, Share, Cancel. Footer includes an explicit "Done" exit, not just an implicit back chevron |
| 9 | Edit session | Host | Warning banner if bookings already exist |
| 10 | Cancel session confirmation sheet | Host | Bottom sheet, consequence statement, destructive action, leads to #19 |
| 11 | Approval queue | Host | Only shown if `requiresApproval` is true on that session |
| 12 | Roster & check-in | Host | Grouped by status, paid toggle, three-way attendance control |
| 13 | Search / Calendar | **(shared)** | Browse public sessions and clubs, **split into Upcoming / Past** |
| 14 | Session detail | **(shared)** | Player sees adaptive CTA (Book / Request to join / your current status). If the viewer is the host, this should redirect to #8 instead of showing the player view — see UX review below |
| 15 | Booking confirmation | Player | Success state after booking or requesting |
| 16 | My booking detail / cancel | Player | Same render as #14 plus a cancel action and confirmation sheet, leads to #20 |
| 17 | Empty state | **(shared)** | First-time Club Sessions home, two content variants (host prompt vs player prompt), each routes to Profile (#18) for club creation, not directly to #3/#4 |
| 18 | Profile (new) | **(shared)** | **Club creation lives here, not on Home.** Two variants: has-a-club (shows club card, links to #2) and no-club-yet (prompts #4). Reached from an avatar icon on Home, not the FAB |
| 19 | Session cancelled (new) | Host | Terminal confirmation after #10's destructive action, exits to Club Detail or Home |
| 20 | Booking cancelled (new) | Player | Terminal confirmation after My Booking's cancel sheet, exits to Home |

**Total: 20 screens** (5 fully shared, 8 host-only, 5 player-only, plus the two newly-added terminal confirmation screens that close out the cancel flows). Quick-create (#3) is intentionally tiny, one field, so it barely counts as "a screen" in terms of build effort despite adding to the count. Upcoming/Past split applies to #2 and #13, no new screen needed for that, just a view-state toggle within each.

**Correction folded in after prototype review:** club creation was originally reachable from Home's FAB, which conflated "I want to book a court" with "I want to set up my club," the wrong pairing for something as identity-level as creating a club. Club creation now lives exclusively behind Profile (#18). Home's FAB only ever leads to session creation. See §14 for the full navigation correction this prompted.

---

## 6. User stories

### Host

- As a host, I want to create a club once with just a name, icon, and sport, so I have a home for all the sessions I run without Reclub's club-setup overhead.
- As a host, I want to edit my club's name, icon, privacy, or level at any time, so I can fix mistakes or rebrand without starting over.
- As a host, I want to create a session with just a date, venue, and number of spots, so I can post a game in under a minute the way I would on Reclub.
- As a host, I want to preview exactly what players will see before it goes live, so I can catch mistakes without anyone seeing a half-finished session.
- As a host, I want to keep confirming players past my stated capacity, so empty courts don't happen when 10–20% of bookings no-show.
- As a host, I want to turn on approval requirement for a specific session, so I can control who joins when level mix matters.
- As a host, I want to move a player to the waiting list instead of declining them outright, so I can hold them in reserve without burning the relationship.
- As a host, I want to mark players as paid, checked-in, or no-show on the day of the session, so I can track attendance and payment manually without a payment processor, and have an accurate record of who actually showed up.
- As a host, I want to be notified immediately when a confirmed player cancels, so I can decide whether to backfill the spot.
- As a host, I want to cancel a session and have every confirmed and waiting-list player notified automatically, so I don't have to message each one manually.
- As a host, I want to edit a published session and be warned if people have already booked, so I don't accidentally strand players with a changed time.

### Player

- As a player, I want to join a club with one tap, so I can see and book its sessions without any approval friction.
- As a player, I want to search or browse a calendar of upcoming sessions, so I can find one that fits my schedule without leaving the app.
- As a player, I want to see exactly who's confirmed before I book, so I'm not booking blind into an empty session.
- As a player, I want to book a spot in one tap when a session doesn't require approval, so the flow is as fast as checking a box.
- As a player, I want to know clearly if my request is pending, waiting-listed, or confirmed, so I'm never left guessing about my status.
- As a player, I want to be notified the moment my status changes, confirmed, waiting list, or declined, so I can make other plans if needed.
- As a player, I want to cancel my own booking if my plans change, so the host can free up my spot for someone else.
- As a player, I want to be notified if the host cancels the session entirely, so I'm not left showing up to an empty court.

---

## 7. Open items / explicitly deferred

- Club membership is binary (member or not) in v1, no approval queue, no roles beyond host vs member, no membership fee or paid tiers. This may need revisiting if multi-host clubs become a real request.
- **No hierarchy between club creator and managers (open question, not yet resolved):** with the multi-manager model now in place (§3.1b), there's no logic yet for whether the creator can remove a manager but a manager can't remove the creator, or whether all managers are fully interchangeable forever. v1 treats them as equal, this should be revisited once a real club actually has a falling-out between co-organizers.
- In-app payment processing is **out of scope**. Fee tracking is a manual host-controlled toggle only.
- **Squadd onboarding unification is explicitly out of scope here (see §13).** This spec only defines the Club Sessions entry flow (auth → nickname → DUPR → gender → done). Whether and how that connects to the existing Squadd-flavored onboarding sequence — for a player who later opens Squadd, or for unifying the two into one first-open experience app-wide — is a separate spec, not part of this one.
- Calendar view is promised in the UI (toggle exists in the search screen) but needs to be either fully built or removed before ship, currently a placeholder.
- Relationship between Club Sessions and the existing Play tab (Reclub-fed discovery) is intentionally kept separate for now per the "don't touch Play/Circle" decision. A future merge or rename is a later decision, not part of this spec.
- Squad Chest / XP integration with Club Sessions check-ins is a future hook, not built in v1, but explicitly anticipated in the data model so no migration is needed later:
  - `ClubSessionBooking.playerProfileId` references the same `PlayerProfile` table Squadd already uses, not a Club-Sessions-local user record. A player's Club Sessions identity and Squadd identity are the same row from day one.
  - `attendanceStatus = "checked_in"` is the natural future trigger point for chest creation, mirroring how a Reclub-scraped confirmed session currently triggers a chest via `SquadChest.source = "checkin"`. Deliberately using a different string value (`checked_in` vs `checkin`) so the two concepts stay distinguishable in any shared query later. The check-in event just needs a listener added later, no schema change.
  - `ClubSession.appClubId` and `AppClub.creatorId` are both real foreign keys (not denormalized strings) so a future "squad plays at this club" or "club rivalry" feature can join cleanly against existing `Squad` tables.
  - No new identity, auth, or profile table is introduced by Club Sessions. Everything keys off `PlayerProfile`, consistent with Squadd.

---

## 8. Explicitly locked decisions (for reference)

- **Model names changed after schema audit to avoid collisions:** the feature uses `AppClub`, `ClubSession`, and `ClubSessionBooking` — not `Club`, `Session`, or `Booking`, because `Club` and `Session` already exist as scraped Reclub entities, and `AuthSession` already exists as a NextAuth model. See §9 for the full naming map.
- Waitlist auto-backfill is **implemented in v1**: a cancelled or freed Confirmed spot automatically promotes the longest-waiting player and notifies them, no host action required.
- All Club Sessions bookings key off the same `PlayerProfile` table Squadd uses — no separate identity system, so future Squad Chest/XP hooks need no migration.
- **One club per creator, enforced as a unique constraint on `AppClub.creatorId`.** Deliberate, not a v1-only limitation, this is the long-term product stance: focus over sprawl, and a structural defense against ghost clubs and low-effort duplicate listings. This is distinct from management capacity — see next point.
- **A club can have multiple managers (typically 2–3), via the new `AppClubManager` table.** Real clubs are usually run by a small team, not one person. All managers share equal rights to edit the club and create/edit/cancel sessions under it in v1, no creator-vs-manager hierarchy yet.
- Every `ClubSession` belongs to an `AppClub`. A host creates an AppClub first, then any number of ClubSessions under it. There is no such thing as a club-less session.
- AppClub creation/edit is intentionally minimal, no fee tiers, no club-level approval queue beyond the single `autoApproveNewMembers` toggle, no chat/activities/library tabs, unlike Reclub's club layer.
- Draft sessions are visible **only to the host**, regardless of public/private setting, until published.
- Same fields as Reclub's create-a-meet flow are preserved, to ease host switching.
- "Matches will be submitted" toggle (DUPR-specific) is excluded.
- Buttons in this feature use a **flat style**, no 3D gradient/border-bottom treatment, to visually separate this utility layer from the game layer.
- Approval requirement defaults to **off** for all new ClubSessions.
- All status/privacy/role fields are plain `String` columns with defaults, not Postgres enums, matching the fact that **zero enum types exist anywhere else in this schema**. Introducing an enum here would be the first and only one, so the new feature follows existing convention instead.

---

## 9. Schema audit reference (2026-06-28)

A read-only audit of the live Prisma schema was run before finalizing model names. Key findings folded into this spec:

| Concept in this spec | Originally assumed name | Actual safe name | Why |
|---|---|---|---|
| Club entity | `Club` | **`AppClub`** | `Club` already exists (`clubs` table) as a scraped Reclub club with `reclubId`, `slug`, `zaloUrl` — no icon/privacy/approval fields, wrong shape to reuse |
| Session entity | `Session` | **`ClubSession`** | `Session` already exists (`sessions` table) as a scraped Reclub session with `eventUrl`, `scrapedDate`, string-based dates. `AuthSession` (NextAuth) also already exists, so a third "session" name needed to be unambiguous |
| Booking entity | `Booking` | **`ClubSessionBooking`** | No collision, but named explicitly to avoid confusion with `SessionRoster`, the existing read-only scraped-roster table, which is a different and unrelated concept |
| Identity FK | assumed `PlayerProfile` | **confirmed correct** | `PlayerProfile` (`player_profiles`, uuid PK) is the single identity table used everywhere, mobile and web. Confirmed safe to FK against directly |
| API routes | assumed `/api/clubs`, `/api/sessions` | **`/api/app-clubs`, `/api/club-sessions`, `/api/bookings`, `/api/memberships`** | `/api/clubs` and `/api/sessions` are taken by the Reclub scraper endpoints |
| Status/privacy fields | assumed enums | **plain `String` with defaults** | Zero Postgres enum types exist anywhere in this schema; new fields follow that convention rather than introducing the first one |
| Field naming convention | — | **camelCase in Prisma, snake_case via `@map()` in SQL, FKs named `xId`** | Matches every existing model |
| Check-in string value | assumed `"checkin"` | **`"checked_in"`** | `SquadChest.source` already uses the literal string `"checkin"` for a different, gamification-only concept. Using a distinct string avoids ambiguity in any future shared query |

Full audit detail is preserved separately; this table is the condensed version relevant to implementation.

---

## 10. UI/UX pre-build review

Run against the `squadd-mobile-ux` engagement-loop checklist and anti-pattern list before any screen gets built, since the goal is to get v1 right rather than refactor after launch. Issues found, with a fix folded into the screen list above where it changes the count.

### Merges made to avoid bloat (already reflected in §5)
- **Club home (host) and Club detail (player) merged into one screen.** They showed the same information with different CTAs, no reason to maintain two screens that drift out of sync over time.
- **Separate "Waiting list / Requested status" screen removed.** A player's status is a *state* of the Session detail screen (#14), not a destination of its own. Splitting it out would have created a dead-end screen with no further action available, exactly the anti-pattern called out earlier in this process. Status now renders as a banner at the top of #14: "You're on the waiting list" / "Your request is pending", with the CTA area swapping to "Cancel request" instead of "Book."

### Issues to resolve before build

**1. Host viewing their own session must not see the player view.**
Screen #14 (Session detail) is shared, but if the host taps into their own session from search results or a notification, they should land on #8 (the management view), not the player-facing booking screen. This needs to be an explicit routing rule, not an afterthought, otherwise the host sees a "Book my spot" button on their own session, which is confusing and would need a patch later.

**2. Soft-capacity display risks looking like a bug.**
"14 / 12 confirmed" is correct per the spec, but on first glance it reads as a broken progress bar, not an intentional overbook. Recommend: once confirmed count exceeds target, swap the numeric fill bar for a clear label state, e.g. a pill reading "OVERBOOKED · 2 over target" in the gold/info color, rather than letting the lime fill bar overflow past 100% width, which has no defined visual behavior in the existing design system.

**3. Roster screen needs the chest-card member-grid treatment, not a flat list.**
The existing `squadd-mobile-ux` pattern for showing many people across multiple states (open chest member grid: opened / timer / faded) is the right visual language for the four-status roster, not a plain list with text labels. Apply that same visual grammar: Confirmed players get a solid avatar, Waiting list a faded one, Requested a dashed-outline placeholder. This also makes the auto-backfill moment (waiting list → confirmed) visually satisfying instead of just a label change, consistent with "reward visible before the action" from the engagement checklist.

**4. Approval queue and Roster screen overlap heavily.**
Both show players against the same session with status controls. Recommend collapsing the Approval queue into a **status filter** at the top of the Roster screen (pills: All / Requested / Confirmed / Waiting list / Declined) rather than a fully separate screen. Reduces the screen count by one in practice, and means a host never has to mentally context-switch between "the people I'm reviewing" and "the people who are in," which are really the same list.

**5. "To be determined" venue needs a visible resolution path, not just a text state.**
Right now it's a label. A published session sitting at "Venue: TBD" for days with no nudge is a likely real scenario (host posts early, locks the court later). Add a host-facing reminder treatment, e.g. the Published view (#8) shows a gold "Set venue" pill until resolved, consistent with how chest expiry warnings are never hidden per the design system rule.

**6. Empty states must pair with a visual, not just copy.**
Per the explicit anti-pattern "text-only empty states," the Club Sessions home empty state (#17) needs more than "No sessions yet." Recommend reusing the same illustrative pattern as the no-squad discovery state, a simple graphic plus real or skeleton cards underneath rather than a blank screen, even before any sessions exist.

**7. Notification deep-links must resolve to a useful state, every time.**
Every row in the §4 notification matrix needs to be checked against where it actually lands the player. "You're on the waiting list" should deep-link into #14 with that banner already rendered, not into the generic search screen. This is worth a one-line acceptance check per notification type before build, not discovered after ship.

**8. "Mine" section on the home screen will get visually noisy at scale.**
Once someone hosts three clubs and has booked five sessions, a flat mixed list under "Mine" will be hard to scan. Recommend a pill toggle (Hosting / Booked), matching the existing Top 5 / Friends pill pattern already used on the Play tab, rather than tags on a single merged list. Cheap to build correctly now, expensive to retrofit once real usage data exists.

**9. Destructive action consistency.**
Cancel session (#10) and cancel booking (within #16) both need the same bottom-sheet pattern already specified, consequence statement, "Stay" as the safe default below the red action. Calling this out explicitly so both get built from one shared component rather than two slightly different ones.

None of these change the data model in §3. They're presentation-layer decisions worth locking before any screen gets built in code, since visual and navigation patterns are far more expensive to retrofit across 16 screens than to decide once up front.

---

## 11. Second-pass self-rating

**Current state: ~6.5–7/10, not 8+.** The data model and state machine (§3, §4) are solid and the §10 fixes were real, but rating honestly against "simplicity first" surfaces two different kinds of problems: flow gaps that are genuinely missing, and a few things already in the spec that are over-built for v1 and should be cut, not polished. Visual styling is excluded from this rating on purpose, per your note it's cheap to fix later — everything below is structural.

### Must-fix flow gaps (expensive to retrofit later, cheap to fix now)

**1. One club per creator, enforced — not a gap, a deliberate constraint. Management is now separately multi-person.**
A player can only ever *found* one `AppClub` (`creatorId` is unique). This is intentional: multiple clubs per creator would dilute focus and create an opening for ghost clubs and low-effort duplicate listings. But running a club is a team job in practice, so `AppClub` now supports multiple managers via `AppClubManager` (§3.1b), typically 2–3 people, all with equal rights to create and edit sessions. Because of this, Create session (#6) still never needs a club selector, there is only ever one club a given manager is attached to in the common case, but the create/edit/cancel permission check needs to verify "is this player a manager of this club," not "is this player the club's single host."

**2. No quick-create path — resolved as a single lightweight screen, not a silent auto-create.**
Original proposal was to auto-create a default club entirely behind the scenes. Revised: when a host has zero clubs and taps "Create session," show one minimal screen first, just a club name field, copy along the lines of "Looks like you don't have a club yet — what's your club name?" with "Details can be updated later" underneath so it's clear this isn't a commitment to fill out. One tap past that lands straight into session creation. Still only one screen of friction instead of three, but the host explicitly names their own club rather than discovering a system-generated name later, which avoids the slightly unsettling "wait, when did I create this?" moment a fully silent auto-create would have caused.

**3. No way for a player to see their own level against a session's stated range. Was blocked, now unblocked — see §13.**
`skillLevelMin`/`Max` are in the data model and shown on session detail, but nothing tells the player how their own level compares. This isn't a cosmetic add, it changes whether "Book my spot" or "Request to join" feels like an informed decision. This surfaced a real dependency: a level can't be shown if it was never captured at signup, which led to the entry-flow decision in §13. With DUPR/level now part of the Club Sessions entry flow, this can move to "buildable": a one-line indicator under the level range ("Your level: 3.2 · within range" or "below range — host may waitlist you"), not a redesign.

**4. Past sessions and upcoming sessions aren't separated anywhere — resolved, add the split.**
Confirmed as a real gap. Club detail (#2) and Club Sessions home (#1) need a simple upcoming/past split for session lists, most recent or soonest first, past sessions collapsed under a secondary heading or tab rather than mixed into the same scroll. No need for filtering or sorting controls beyond this, just the binary split.

### Things to explicitly cut, not polish, to stay simple

**5. Approval queue + Roster merge (already decided in §10) — confirmed correct, don't second-guess this in build.**

**6. Superseded: multi-manager clubs were reclassified as a must-have, not cut.**
The original self-review treated single-host clubs as an acceptable simplicity tradeoff. That was wrong — real clubs are run by small teams, and §3.1b now adds `AppClubManager` to support 2–3 managers per club. Leaving this here as a record of the correction, not as a current action item.

**7. In-app messaging beyond the host's notes field: not built in v1, but now an architecture decision, not a "leave it alone."**
The original review said to leave this alone entirely, matching Zalo/Facebook handling club communication today. That stands for v1, no chat is being built. But club organizers do want to *post* updates (not chat) to their members, currently done manually via Zalo groups or Facebook posts. See §12 below for how this is anticipated in the architecture without building it now.

### Revised target

Item 1 (one club per creator, with multi-manager support) is resolved as a deliberate, corrected constraint, not an open build task. Fixing items 2–4 above (all flow, no visual work) is what would move this from ~7 to a genuine 8+, because they're the kind of gap that surfaces in the first week of real usage and is awkward to patch once sessions and clubs already exist in production. Item 5 is a reminder to resist scope creep on the approval/roster merge; items 6–7 are corrections folded back into §3 and §12.

---

## 12. Future club content feed — anticipated architecture (not built in v1)

Club organizers currently post updates to members manually via Zalo groups or Facebook, "court's closed Saturday," "new time slot added," that kind of one-to-many announcement. This is **not chat** (no back-and-forth), it's a posting feed scoped to a club's members. Not building this in v1, but the schema audit already surfaced two existing models worth reusing instead of inventing a parallel system later:

- **`ContentPost`** (`content_posts`) already exists in the schema. Its current usage should be checked before assuming it's free to repurpose, but a club-scoped post likely extends this model (or a similar shape) rather than introducing a brand-new `ClubPost` table from scratch.
- **`FeedItem`** (`feed_items`) already powers the Circle tab's activity feed. A future "Club posted an update" item is structurally the same shape as existing feed item types (session played, DUPR updated, streak milestone), just a new `type` value scoped by `appClubId` instead of by player or squad.

**What this means for the current build, concretely:**
- `AppClub.id` and `AppClubManager` (§3.1b) are real, stable foreign keys today. A future `ClubPost`-equivalent model can reference `appClubId` and `authorId → PlayerProfile.id` (via the posting manager) without any migration to the Club or Manager tables themselves.
- No messaging, posting, or feed UI is being designed or built as part of this spec. This section exists purely so the next person who picks this up checks `ContentPost` and `FeedItem` before reinventing either, and so `AppClub`/`AppClubManager` aren't accidentally shaped in a way that would block this later (they aren't, as currently specced).
- Recommend a one-line audit-style check, same pattern as §9, before that future work begins: confirm `ContentPost`'s current fields and usage, confirm whether `FeedItem.type` is a free-text string or constrained, before assuming either is reusable as-is.

---

## 13. Entry signup flow for Club Sessions (tracked here, owned by a separate spec)

**Correction after checking the existing product docs:** the first version of this section mischaracterized today's onboarding as "entirely Squadd-flavored." That's not accurate. The existing 4-step onboarding (auth → DUPR → time preferences → gender, plus Reclub player linking) is the **generic app onboarding**, already neutral, already shared, already writing to `PlayerProfile`. The actually squad-flavored thing is a separate, later screen (`OB-N`, the `@nickname` capture plus "Build your crew" carousel), which only fires the first time someone opens the **Squadd tab specifically**, not at initial signup. So the real gap was never "today's signup is too game-flavored," it was narrower: **the existing generic onboarding includes one Play-tab-specific field (time preferences) that Club Sessions doesn't need**, and nothing in the existing flow currently knows to land someone on Club Sessions home if that's where they started.

**Why this surfaced here:** §10 issue 3 (level self-check on session detail) exposed that a player's level needs to be known before they can usefully read a session's skill range. That data already exists, captured by the existing onboarding's DUPR step, the only real work is making sure Club Sessions reads it correctly and doesn't duplicate the capture.

**Scope decision:** `PlayerProfile` is the single shared identity table across the whole app (confirmed in the schema audit, §9), and the existing auth and onboarding step components/endpoints already write to it. There is no new signup system to build here, this section is about **reuse and routing**, not new screens with new logic.

**Further correction, nickname:** there is no separate "display name" field to reuse or invent. Google/Apple sign-in already provides the real name. The existing `@nickname` step (`OB-N`) is the one nickname the whole app needs, it was never meant to be Squadd-exclusive, it's simply the only place nickname capture currently lives. Club Sessions reuses that exact same step and field, the same way it reuses auth, DUPR, and gender. There's no second nickname concept here.

**Club Sessions entry flow, using what already exists:**

1. **Auth** — reuse the existing Google Sign-In / Apple Authentication / JWT flow exactly as implemented today. This already provides the person's real name, nothing new needed here.
2. **Nickname** — reuse the existing `@nickname` step (`OB-N`) and its existing field/endpoint on `PlayerProfile`. Same single nickname used everywhere in the app, not a second one.
3. **DUPR / level** — reuse the existing DUPR capture step and endpoint as-is.
4. **Gender** — reuse the existing gender capture step and endpoint as-is.
5. **Done** → lands on Club Sessions home (#1) instead of Circle's "People you may know," since that's where this entry sequence started.

**Deliberately excluded, and why:** the existing onboarding's **time-of-day preference** step (morning/afternoon/evening) is Play-tab-specific and isn't needed to book or host a Club Session. The existing **Reclub player-linking** step is also excluded, Club Sessions is explicitly independent of Reclub per the locked decisions in this spec, linking a Reclub account has no purpose here. The **"Build your crew" carousel** that currently follows nickname capture when entered via Squadd is also excluded here, that part stays Squadd-specific, only the nickname field itself is shared, not the marketing screens around it. All three should be skipped for someone entering via Club Sessions, not shown and then ignored.

**The one piece of real new logic needed:** a routing check, not a new flow. If a person has already set a nickname, DUPR, and gender on `PlayerProfile` (entered via Play, Circle, or Squadd first, or has done this before), Club Sessions must detect that and skip straight to Club Sessions home with zero onboarding screens shown again. The only person who should ever see steps 1–4 above is someone whose `PlayerProfile` doesn't have these fields populated yet, regardless of which tab they happened to enter through.

**What this resolves:** the level self-check indicator from §10 issue 3 now has a real data source, captured by the existing DUPR step, already present on `PlayerProfile` for any returning user, captured for new users via the reused (not rebuilt) step above.

**What this does not resolve, and is explicitly out of scope for this spec:**
- Whether the "Build your crew" carousel that currently follows nickname capture when entered via Squadd should also fire for someone who set their nickname via Club Sessions and later opens Squadd for the first time. The nickname field itself is now shared, but the carousel is a separate Squadd-specific screen and this spec doesn't decide when it triggers.
- Any broader unification of onboarding flows across tabs beyond what's described above. This section only covers what Club Sessions needs: reuse the existing steps, skip the ones that don't apply, route correctly based on whether `PlayerProfile` is already populated.

---

## 14. Navigation architecture — corrected after prototype audit

**What was wrong:** the prototype initially gave several screens a back chevron that pointed to one hardcoded destination. That works only if the screen has exactly one possible entry point. Several screens in this spec don't, `club-detail` is reached from both the Home "Mine" list and from Profile, `session-create` is reached from both Home's FAB and Club Detail's FAB. A hardcoded back target is wrong for at least one of those paths every time, which is exactly the kind of thing that reads as "terrible UX" even when every screen technically has a back button, because the button takes you somewhere you never actually visited.

**The fix:** real navigation stack instead of fixed per-screen targets. Three behaviors, not one:

- **Push** — drilling into something you'd reasonably want to return *from* (tapping a card, a FAB, a list row). The back chevron on the destination pops the stack, returning to wherever you actually came from.
- **Replace** — completing something (Save, Publish, Create, a destructive confirmation, an explicit "Done" or "Back to X" exit action). These move forward *without* adding the just-completed form or sheet to history, so back from the destination skips it entirely rather than re-showing a finished form or a sheet that already executed.
- **Back** — pops the stack. Defaults to the Club Sessions home if the stack is ever empty, which shouldn't happen in practice since tab-root screens never carry a back chevron.

This isn't a visual change, it's the actual navigation model and should be implemented as a real stack (or the platform's native navigation stack, e.g. React Navigation) rather than per-screen hardcoded routes, in the eventual build.

**Worth flagging as a known limitation of a static HTML prototype, not a navigation bug:** screens don't re-render with updated state after an action. For example, going Home → Profile (no club) → create club → land on the new Club Detail → tap back correctly returns to the Profile screen, but that Profile screen still displays "you haven't created a club yet," since it's a fixed mock rather than live data. A real implementation re-renders Profile from actual state and this resolves itself; it's only an artifact of the prototype being static screens rather than a working app.

**Traced against the user stories in §6 to confirm the fix actually holds**, not just that buttons exist:
- *Host, create club via Profile → create session → publish → cancel → Stay*: confirmed each step lands correctly and "Stay" dismisses back to the management screen rather than advancing.
- *Host, Published session → Roster → back*: confirmed returns to Published, not to Club Detail or Home.
- *Player, full session → request to join waiting list*: confirmed this is a forward action with no implied "back into the request," consistent with how the booking-confirmation screens are designed (see §10).

---

## 15. Persistent bottom navigation bar — was missing from the prototype entirely

**What was wrong:** the prototype showed no bottom tab bar on any screen, which made Club Sessions look like it floated outside the app's actual navigation structure. The real app has a persistent four-tab bar (Circle, Squadd, Play, and now Club Sessions), and the existing tabs already keep it visible on their content screens, confirmed against an actual screenshot of the Play tab. Club Sessions needs to behave the same way, not as an exception.

**The fix:** the tab bar is visible on every screen that's part of the normal Club Sessions browsing/management flow, and hidden only on full-screen modal-style flows, matching the pattern the rest of the app already uses for equivalent moments (e.g. the existing Squadd onboarding carousel and squad-creation flows are also full-screen takeovers without the tab bar visible).

**Show the tab bar on:** Club Sessions home (both empty-state variants count as this screen), Club detail, Search/Calendar, Session detail, Roster & approvals, Profile (both variants), My booking, and the Published session management view. These are the screens someone moves between while just using the tab normally.

**Hide the tab bar on:** the four signup/entry steps (§13, since these happen before any tab context exists), every create/edit form (Quick-create club, Create club, Edit club, Create session, Preview/Draft, Edit session), both bottom sheets (Cancel session, Cancel booking), and the two terminal confirmation screens (Session cancelled, Booking cancelled, plus Booking confirmation). These are all full-screen or overlay moments where hiding the tab bar is the same convention the rest of the app already follows for modal-style flows.

**Implementation note:** on the three screens that have both the tab bar and a footer action (Published session's "Done" button, Session detail's "Book"/"Request" buttons, My booking's "Cancel my spot" button), the footer must sit above the tab bar, not underneath or overlapping it. This is a layout detail worth testing explicitly once real screens are built, it's an easy thing to get subtly wrong (footer rendering behind the tab bar, or scroll content getting clipped by it) that wouldn't show up in a quick glance but would look broken on a real device.
