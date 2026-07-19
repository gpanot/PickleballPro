-- M4: Backfill academy_id on existing coach_students rows
-- Required so the academy manager roster (AO-1) is not empty for data added before C-1 fix.
-- Safe to run multiple times (only updates rows where academy_id IS NULL).
--
-- NOTE: coach_students.coach_id references coaches.id (not users.id).
-- We must join through the coaches table to reach academy_members.user_id.
update public.coach_students cs
set academy_id = am.academy_id
from public.coaches c
join public.academy_members am on am.user_id = c.user_id
where c.id = cs.coach_id
  and am.role in ('coach', 'manager')
  and cs.academy_id is null;
