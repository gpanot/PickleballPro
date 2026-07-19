-- Solo coaches (in coaches table but no academy_members row) can write
-- assessment templates with academy_id IS NULL and is_default = FALSE.
-- This covers coaches who haven't joined an academy yet.

DROP POLICY IF EXISTS assessment_templates_solo_coach_write ON public.assessment_templates;

CREATE POLICY assessment_templates_solo_coach_write
  ON public.assessment_templates
  FOR ALL
  USING (
    is_default = false
    AND academy_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.coaches
      WHERE user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    is_default = false
    AND academy_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.coaches
      WHERE user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );
