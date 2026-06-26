---
name: Academy Architecture Migration
overview: Add an Academy layer between Admin and Coach, introducing two new tables (`academies`, `academy_members`), two nullable foreign key additions (`programs.academy_id`, `coach_students.academy_id`), full RLS coverage for the new tables, an additive RLS extension for the altered tables, and three new RPCs. Existing solo-coach behavior is completely untouched.
todos:
  - id: migration-1
    content: "Write and apply migration: create_academies_table"
    status: completed
  - id: migration-2
    content: "Write and apply migration: create_academy_members_table (with unique constraint + indexes)"
    status: completed
  - id: migration-3
    content: "Write and apply migration: alter_programs_add_academy_id (nullable FK + index)"
    status: completed
  - id: migration-4
    content: "Write and apply migration: alter_coach_students_add_academy_id (nullable FK + index)"
    status: completed
  - id: migration-5
    content: "Write and apply migration: rls_academies (4 policies)"
    status: completed
  - id: migration-6
    content: "Write and apply migration: rls_academy_members (4 policies)"
    status: completed
  - id: migration-7
    content: "Write and apply migration: rls_programs_academy_addons (3 additive policies: published-member, manager-draft, manager-publish-update)"
    status: completed
  - id: migration-8
    content: "Write and apply migration: rls_coach_students_academy_addons (1 additive SELECT policy)"
    status: completed
  - id: rpc-a
    content: "Write and apply RPC: become_academy_manager (atomic bootstrap)"
    status: completed
  - id: rpc-b
    content: "Write and apply RPC: add_coach_to_academy"
    status: completed
  - id: open-q
    content: "RESOLVED: Q1 default=null, Q2 manager-only visibility, Q3 immediate membership, Q4 block multi-academy"
    status: completed
isProject: false
---

# Academy Architecture Migration Plan

## Current state (confirmed from DB)

- `programs` has `created_by uuid`, `is_published bool`, and 16 other columns — no `academy_id`
- `coach_students` has `coach_id`, `student_id`, `is_active` — no `academy_id`
- `admin_users` has `role text default 'content_editor'` — no `'manager'` value yet
- Existing RPCs: `create_program_as_user`, `update_program_as_user`, `create_program_as_admin`, `update_program_as_admin`
- Existing `programs` RLS: 5 SELECT policies, 2 INSERT, 2 UPDATE, 2 DELETE — all personal/admin, none academy-aware
- Existing `coach_students` RLS: 1 ALL (coach owns the row), 1 SELECT (student sees own)

---

## 1. Migration files (in order)

### Migration 1 — `create_academies_table`
Create the `academies` table:
```sql
create table public.academies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  owner_user_id uuid references auth.users(id) not null,
  created_at    timestamptz default now()
);
alter table public.academies enable row level security;
```

### Migration 2 — `create_academy_members_table`
Create the `academy_members` table with a unique membership constraint:
```sql
create table public.academy_members (
  id         uuid primary key default gen_random_uuid(),
  academy_id uuid references public.academies(id) on delete cascade not null,
  user_id    uuid references auth.users(id) not null,
  role       text not null check (role in ('manager', 'coach', 'staff')),
  joined_at  timestamptz default now(),
  unique (academy_id, user_id)   -- prevents duplicate membership rows
);
alter table public.academy_members enable row level security;
create index academy_members_academy_id_user_id_idx on public.academy_members(academy_id, user_id);
create index academy_members_user_id_idx on public.academy_members(user_id);
```

### Migration 3 — `alter_programs_add_academy_id`
Add nullable `academy_id` to `programs`. Existing rows stay `null` (free-floating), no data touched:
```sql
alter table public.programs
  add column academy_id uuid references public.academies(id);
create index programs_academy_id_idx on public.programs(academy_id);
```

### Migration 4 — `alter_coach_students_add_academy_id`
Add nullable `academy_id` to `coach_students`. Existing rows stay `null`:
```sql
alter table public.coach_students
  add column academy_id uuid references public.academies(id);
create index coach_students_academy_id_idx on public.coach_students(academy_id);
```

### Migration 5 — `rls_academies`
Full RLS policy set for `academies` (see Section 2 below).

### Migration 6 — `rls_academy_members`
Full RLS policy set for `academy_members` (see Section 2 below).

### Migration 7 — `rls_programs_academy_addons`
Additive policies only — new SELECT and UPDATE academy-scoping policies layered on top of the untouched existing ones (see Section 2 below).

### Migration 8 — `rls_coach_students_academy_addons`
Additive policies only — new SELECT policy for academy-scoped student visibility (see Section 2 below).

---

## 2. RLS policy plan

Helper predicate used throughout:
```sql
-- is_academy_manager(aid): true if auth.uid() is a manager of academy `aid`
exists (
  select 1 from academy_members am
  where am.academy_id = aid
    and am.user_id = auth.uid()
    and am.role = 'manager'
)
```

### `academies` table

| Policy | Command | Logic |
|---|---|---|
| `academies_select` | SELECT | `owner_user_id = auth.uid()` OR is a member of this academy OR `is_admin()` |
| `academies_insert` | INSERT | Any authenticated user can create their own academy (`owner_user_id = auth.uid()`) — but the "become manager" RPC (SECURITY DEFINER) is the only intended entry point in practice |
| `academies_update` | UPDATE | `owner_user_id = auth.uid()` OR `is_admin()` |
| `academies_delete` | DELETE | `owner_user_id = auth.uid()` OR `is_admin()` |

Pseudocode for `academies_select`:
```
academies.owner_user_id = auth.uid()
OR exists (select 1 from academy_members where academy_id = academies.id and user_id = auth.uid())
OR is_admin()
```

### `academy_members` table

| Policy | Command | Logic |
|---|---|---|
| `academy_members_select` | SELECT | Member sees rows for academies they belong to. Manager sees all members of their academy. Admin sees all. |
| `academy_members_insert` | INSERT | Only a manager of that academy (or admin) can add members. The "become manager" RPC handles the self-insert bootstrap case via SECURITY DEFINER. |
| `academy_members_update` | UPDATE | Only a manager of that academy or admin can change roles. A member cannot change their own role. |
| `academy_members_delete` | DELETE | A manager of that academy can remove members (except themselves). Admin can remove anyone. |

Pseudocode for `academy_members_select`:
```
exists (select 1 from academy_members self
        where self.academy_id = academy_members.academy_id
          and self.user_id = auth.uid())
OR is_admin()
```

Pseudocode for `academy_members_insert` (with_check):
```
is_academy_manager(NEW.academy_id) OR is_admin()
```
Note: the "become manager" RPC bypasses this via SECURITY DEFINER — the RPC itself performs the insert.

### `programs` table — additive policies only

Three new policies added. All 11 existing policies remain untouched.

**New SELECT — `programs_select_academy_published`**
Any academy member (manager, coach, staff) can see published programs belonging to their academy:
```
academy_id IS NOT NULL
AND is_published = true
AND exists (
  select 1 from academy_members am
  where am.academy_id = programs.academy_id
    and am.user_id = auth.uid()
)
```
No `role` filter — any row in `academy_members` for that academy qualifies. This is intentional: all members (manager, coach, staff) have equal read access to published academy content. The manager-only restriction applies only to drafts and to publish/update rights, handled by the two policies below.

Drafts are NOT exposed here — coaches only see their own drafts via the existing `created_by = auth.uid()` policy.

**New SELECT — `programs_select_academy_manager_draft`**
A manager can see ALL programs scoped to their academy, published or not, regardless of `created_by`. This is the fix for the visibility gap: without this policy, a manager could not see a coach's draft in their own academy.
```
academy_id IS NOT NULL
AND is_academy_manager(programs.academy_id)
```

**New UPDATE — `programs_update_academy_manager_publish`**
A manager can update (and therefore publish) programs scoped to their academy:
```
academy_id IS NOT NULL
AND is_academy_manager(programs.academy_id)
```
This is the only path by which `is_published` can be flipped to `true` on an academy-scoped program, since `update_program_as_user` deliberately does not touch `is_published`. An admin can already publish via the existing `is_admin()` UPDATE policy.

### `coach_students` table — additive policy only

One new SELECT policy. The existing ALL (coach owns row) and SELECT (student sees own) policies are untouched.

**New SELECT — `coach_students_select_academy_manager`**
A manager of an academy can see all coach-student relationships scoped to that academy:
```
academy_id IS NOT NULL
AND is_academy_manager(coach_students.academy_id)
```
(Exact shape for this policy is flagged as an open question — see Section 5.)

---

## 3. RPC plan

### RPC A — `become_academy_manager`

**Purpose:** Atomic "bootstrap" — creates the academy, registers the caller as manager, and bulk-claims their existing programs.

**Inputs:**
- `academy_name text`
- `academy_slug text`
- `academy_logo_url text` (nullable)

**What it touches (inside a single transaction):**
1. Inserts one row into `academies` (`owner_user_id = auth.uid()`)
2. Inserts one row into `academy_members` (`role = 'manager'`, `user_id = auth.uid()`)
3. `UPDATE programs SET academy_id = <new_id> WHERE created_by = auth.uid() AND academy_id IS NULL`

**What it must NOT touch:**
- `is_published` on any program
- `created_by` on any program
- Any other user's programs
- `admin_users` table
- `routines`, `exercises`, `coach_students`
- The `create_program_as_user` / `update_program_as_user` RPCs

**Security:** SECURITY DEFINER, `set search_path = 'public'`.

**Pre-checks (in order, before any insert):**
1. Auth: `auth.uid() IS NOT NULL` — raise `'Not authenticated'`
2. Single-academy rule (Q4 — **Block**): fail if `auth.uid()` already has ANY row in `academy_members` — raise `'You already belong to an academy'`. This covers both the "already a manager" case and the "member of someone else's academy" case.
3. Slug collision: query `select 1 from academies where slug = academy_slug`. If found, raise `'An academy with that slug already exists'` — never let the unique constraint surface a raw Postgres error.

**Returns:** `json` — the new `academies` row.

---

### RPC B — `add_coach_to_academy`

**Purpose:** A manager adds an existing coach (by user_id or email) to their academy.

**Inputs:**
- `target_academy_id uuid`
- `target_user_id uuid`
- `member_role text` (default `'coach'`, checked against `('manager','coach','staff')`)

**What it touches:**
1. Inserts one row into `academy_members`

**What it must NOT touch:**
- `coaches` table (coach profile is unchanged)
- `programs` (no auto-claiming of the new member's programs)
- `coach_students`
- Any existing RLS policy

**Security:** SECURITY DEFINER. 

**Pre-checks (in order, before the insert):**
1. Auth: caller must be a manager of `target_academy_id` OR `is_admin()` — raise `'Access denied'` otherwise.
2. Single-academy rule (Q4): fail if `target_user_id` already has ANY row in `academy_members` (not just in this academy) — raise `'This user already belongs to an academy'`. The unique constraint only catches same-`(academy_id, user_id)` duplicates; this check closes the cross-academy gap.
3. Duplicate membership: the unique constraint on `(academy_id, user_id)` handles this as a fallback, but the pre-check above already subsumes it. Catch the unique violation and re-raise with `'This user is already a member of this academy'` as a safety net.

**Returns:** `json` — the new `academy_members` row.

---

### RPC C — `update_program_as_user` (extend existing, not replace)

The existing RPC already handles coach program edits. For academy-scoped programs, a manager needs one additional publish-capable path. Rather than creating a fourth program RPC, the publish path is handled entirely via the new `programs_update_academy_manager_publish` RLS UPDATE policy — a manager can call a direct Supabase `.update()` on `programs` and the policy gate enforces the scope. No new RPC required here, but this should be confirmed during implementation.

---

## 4. Do-not-touch list

The following must not be modified by any migration in this work:

**Existing RLS policies (preserve exactly):**
- `programs`: all 11 current policies — `Anyone can view published programs`, `Users can view accessible programs`, `Users can view shareable programs`, `Admin users can view all programs`, `Users can create programs`, `Admin users can insert programs`, `Users can update their created programs`, `Admin users can update programs`, `Users can delete their created programs`, `Admin users can delete programs`
- `coach_students`: `Coaches can manage their students` (ALL), `Students can view own coach relationships` (SELECT)

**Existing RPCs (no changes):**
- `create_program_as_user` — Track A, ship as-is
- `update_program_as_user` — Track A, ship as-is
- `create_program_as_admin`
- `update_program_as_admin`

**Deferred (out of scope):**
- `routines`, `exercises` RLS beyond what was already applied in Track B
- Any frontend / mobile app changes
- `admin_users` role values — `'manager'` is NOT added to `admin_users`; academy managers are identified exclusively via `academy_members.role = 'manager'`, not via `admin_users`

---

## 5. Resolved questions

**Q1 — Default `academy_id` when an academy coach creates a new program**

**Answer: `null` (personal program).** `create_program_as_user` is not modified. Academy scoping is always an explicit post-creation action (either the coach or the manager sets `academy_id`). If a coach wants to create a program scoped to the academy from the start, the optional `academy_id` parameter can be added to `create_program_as_user` in a later pass — it is out of scope here.

**Q2 — `coach_students.academy_id` RLS shape**

**Answer:** Manager visibility only. The additive `coach_students_select_academy_manager` policy gives a manager SELECT on all rows where `academy_id` matches their academy. Coaches in the same academy do NOT see each other's student rows — each coach still sees only their own via the existing `Coaches can manage their students` ALL policy. Students see only their own row via the existing `Students can view own coach relationships` SELECT policy. The `academy_id` column is visible on rows the student can already read (their own), which is acceptable — it carries no sensitive data.

**Q3 — `academy_members` invite flow vs. immediate membership**

**Answer: Immediate.** No `status` column. Membership is active the moment `add_coach_to_academy` inserts the row. An invite/accept flow can be layered on in a later pass by adding `status` at that time. The unique constraint already prevents duplicate rows.

**Q4 — Can a coach who belongs to Academy A call `become_academy_manager` to start Academy B?**

**Answer: Block.** A user can only hold one academy relationship at a time. `become_academy_manager` checks for ANY existing row in `academy_members` for `auth.uid()` and raises `'You already belong to an academy'` if found. This covers both the already-a-manager case and the already-a-member-of-someone-else's-academy case.
