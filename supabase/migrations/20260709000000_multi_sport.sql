-- ============================================================
-- Multi-Sport Architecture Foundation
-- Phase 2: sports table + sport_id FKs + skill_rating + RLS fix
-- ============================================================

-- 1. Create sports table
CREATE TABLE IF NOT EXISTS public.sports (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  rating_system jsonb       NOT NULL DEFAULT '{}',
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- Enable RLS on sports (read-only for all authenticated users)
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sports' AND policyname = 'sports_select_all'
  ) THEN
    CREATE POLICY sports_select_all ON public.sports FOR SELECT USING (true);
  END IF;
END $$;

-- 2. Seed pickleball
INSERT INTO public.sports (slug, name, rating_system)
VALUES (
  'pickleball',
  'Pickleball',
  '{
    "type": "dupr",
    "label": "DUPR",
    "min": 2.0,
    "max": 8.0,
    "tiers": [
      {"label": "Beginner",     "min": 2.0, "max": 3.0},
      {"label": "Intermediate", "min": 3.0, "max": 4.0},
      {"label": "Advanced",     "min": 4.0, "max": 5.0},
      {"label": "Pro",          "min": 5.0, "max": 8.0}
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Add sport_id FK (nullable — no breaking change for existing rows)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sport_id uuid REFERENCES public.sports(id);

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS sport_id uuid REFERENCES public.sports(id);

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS sport_id uuid REFERENCES public.sports(id);

ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS sport_id uuid REFERENCES public.sports(id);

ALTER TABLE public.assessment_templates
  ADD COLUMN IF NOT EXISTS sport_id uuid REFERENCES public.sports(id);

ALTER TABLE public.logbook_entries
  ADD COLUMN IF NOT EXISTS sport_id uuid REFERENCES public.sports(id);

-- 4. Backfill all existing rows to pickleball
DO $$
DECLARE
  pickleball_id uuid;
BEGIN
  SELECT id INTO pickleball_id FROM public.sports WHERE slug = 'pickleball';

  UPDATE public.users             SET sport_id = pickleball_id WHERE sport_id IS NULL;
  UPDATE public.programs          SET sport_id = pickleball_id WHERE sport_id IS NULL;
  UPDATE public.exercises         SET sport_id = pickleball_id WHERE sport_id IS NULL;
  UPDATE public.coaches           SET sport_id = pickleball_id WHERE sport_id IS NULL;
  UPDATE public.assessment_templates SET sport_id = pickleball_id WHERE sport_id IS NULL;
  UPDATE public.logbook_entries   SET sport_id = pickleball_id WHERE sport_id IS NULL;
END $$;

-- 5. Add generalized rating columns to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS skill_rating  numeric,
  ADD COLUMN IF NOT EXISTS rating_system text;

-- 6. Backfill skill_rating + rating_system from existing dupr_rating
UPDATE public.users
  SET skill_rating  = dupr_rating,
      rating_system = COALESCE(rating_type, 'dupr')
  WHERE dupr_rating IS NOT NULL
    AND skill_rating IS NULL;

-- 7. Close GAP-14: fix programs_update_academy_manager_publish policy
-- Original policy had WITH CHECK = null (no insert-time restriction)
DROP POLICY IF EXISTS programs_update_academy_manager_publish ON public.programs;

CREATE POLICY programs_update_academy_manager_publish ON public.programs
  FOR UPDATE
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
