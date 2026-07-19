-- Fix assessment_templates RLS so superadmins (users.is_admin = true) can
-- INSERT, UPDATE, and DELETE any row including system defaults.
-- Academy managers can only write rows scoped to their own academy.

-- Drop the broad catch-all write policy
DROP POLICY IF EXISTS assessment_templates_write ON public.assessment_templates;

-- Superadmin: full write access to ALL rows (including is_default ones)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'assessment_templates'
      AND policyname = 'assessment_templates_superadmin_write'
  ) THEN
    CREATE POLICY assessment_templates_superadmin_write
      ON public.assessment_templates
      FOR ALL
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

-- Academy managers and coaches: write access only to rows belonging to their academy
DROP POLICY IF EXISTS assessment_templates_manager_write ON public.assessment_templates;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'assessment_templates'
      AND policyname = 'assessment_templates_member_write'
  ) THEN
    CREATE POLICY assessment_templates_member_write
      ON public.assessment_templates
      FOR ALL
      USING (
        academy_id IN (
          SELECT academy_id FROM public.academy_members
          WHERE user_id = auth.uid() AND role IN ('manager', 'coach')
        )
      )
      WITH CHECK (
        academy_id IN (
          SELECT academy_id FROM public.academy_members
          WHERE user_id = auth.uid() AND role IN ('manager', 'coach')
        )
      );
  END IF;
END $$;
