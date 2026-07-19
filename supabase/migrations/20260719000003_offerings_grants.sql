-- Grants for Offerings feature tables and RPCs.
-- Without explicit GRANT, PostgREST returns 403 "permission denied for table X"
-- even when RLS policies are correctly defined.
--
-- Supabase creates tables as owner=postgres but does NOT auto-grant
-- SELECT/INSERT/UPDATE/DELETE to anon/authenticated on tables created
-- outside the default dashboard flow.

-- ─── Table grants ────────────────────────────────────────────────────────────

-- anon can read public offerings (RLS further restricts to is_public=true rows)
GRANT SELECT ON public.offerings       TO anon, authenticated;
GRANT SELECT ON public.offering_runs   TO anon, authenticated;
GRANT SELECT ON public.enrollments     TO anon, authenticated;
GRANT SELECT ON public.notifications   TO anon, authenticated;
GRANT SELECT ON public.push_tokens     TO anon, authenticated;
GRANT SELECT ON public.attendance      TO anon, authenticated;

-- authenticated users can write (RLS policies still gate row-level access)
GRANT INSERT, UPDATE, DELETE ON public.offerings       TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offering_runs   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.enrollments     TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.push_tokens     TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.attendance      TO authenticated;

-- ─── users table: grant SELECT to anon ───────────────────────────────────────
-- The admin_read_all_offerings RLS policy on offerings does:
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
-- Postgres evaluates ALL applicable policies when building the query plan,
-- including ones for roles other than the current session role.
-- Without SELECT on users, even anon queries on offerings fail with
-- "permission denied for table users".
-- This is safe: users table has its own RLS that limits rows to auth.uid().
GRANT SELECT ON public.users TO anon;

-- admin_users is referenced by other policies evaluated at query-plan time
GRANT SELECT ON public.admin_users TO anon;

-- ─── RPC (function) grants ───────────────────────────────────────────────────

-- Public browse — available to anon too
GRANT EXECUTE ON FUNCTION public.get_offering_with_runs(uuid) TO anon, authenticated;

-- Authenticated-only RPCs
GRANT EXECUTE ON FUNCTION public.create_offering(uuid,text,text,text,text,integer,numeric,numeric,text,text,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_offering_run(uuid,date,date,text,jsonb,integer,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_offering_run(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_enrollment(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(uuid,text,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_run_roster(uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_offering(uuid,text,text,text,text,integer,numeric,numeric,text,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_offering_run(uuid,date,date,text,jsonb,integer,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_offering_run(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_offering(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_payment_reminder(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_push_token(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid[])  TO authenticated;
