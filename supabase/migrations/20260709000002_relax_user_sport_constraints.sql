-- ============================================================
-- Multi-Sport: Relax pickleball-specific user constraints
-- ============================================================

-- Drop the goal check constraint — goal IDs are sport-specific
-- and must not be constrained to the pickleball set.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_goal_check;

-- Widen rating_type to support non-DUPR rating systems.
-- Add new sport-specific rating type identifiers here as new sports launch.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_rating_type_check;
ALTER TABLE public.users ADD CONSTRAINT users_rating_type_check
  CHECK (rating_type = ANY (ARRAY[
    'dupr'::text,
    'self'::text,
    'none'::text,
    'padel_level'::text
  ]));
