-- ============================================================
-- Fix sports table: grant SELECT to authenticated/anon
-- and add INSERT/UPDATE/DELETE policies for superadmins
-- ============================================================

-- 1. Grant table-level SELECT so authenticated users can read sports
GRANT SELECT ON public.sports TO authenticated;
GRANT SELECT ON public.sports TO anon;

-- 2. Grant INSERT/UPDATE/DELETE to authenticated (row-level policies below
--    restrict this to superadmins only)
GRANT INSERT, UPDATE, DELETE ON public.sports TO authenticated;

-- 3. Superadmin INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sports' AND policyname = 'sports_insert_superadmin'
  ) THEN
    CREATE POLICY sports_insert_superadmin ON public.sports
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- 4. Superadmin UPDATE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sports' AND policyname = 'sports_update_superadmin'
  ) THEN
    CREATE POLICY sports_update_superadmin ON public.sports
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND is_admin = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- 5. Superadmin DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sports' AND policyname = 'sports_delete_superadmin'
  ) THEN
    CREATE POLICY sports_delete_superadmin ON public.sports
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;
