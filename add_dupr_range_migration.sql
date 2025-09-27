-- ===================================================================
-- ADD DUPR RANGE FIELDS TO EXERCISES TABLE
-- ===================================================================
-- This migration adds DUPR range fields to the exercises table
-- to support specifying skill level ranges like 2.0-3.0, 3.5-4.5, etc.
-- 
-- Run this in your Supabase SQL Editor
-- ===================================================================

-- Add DUPR range columns to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS dupr_range_min DECIMAL(2,1) CHECK (dupr_range_min >= 2.0 AND dupr_range_min <= 8.0),
ADD COLUMN IF NOT EXISTS dupr_range_max DECIMAL(2,1) CHECK (dupr_range_max >= 2.0 AND dupr_range_max <= 8.0),
ADD CONSTRAINT check_dupr_range CHECK (dupr_range_max >= dupr_range_min);

-- Add indexes for performance when filtering by DUPR range
CREATE INDEX IF NOT EXISTS idx_exercises_dupr_range_min ON exercises(dupr_range_min);
CREATE INDEX IF NOT EXISTS idx_exercises_dupr_range_max ON exercises(dupr_range_max);

-- Add a computed column for the range display (optional)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS dupr_range_display TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN dupr_range_min IS NOT NULL AND dupr_range_max IS NOT NULL THEN
      dupr_range_min::text || '–' || dupr_range_max::text
    ELSE NULL
  END
) STORED;

-- Update RLS policy comments to include new fields
COMMENT ON COLUMN exercises.dupr_range_min IS 'Minimum DUPR skill level for this exercise (2.0 to 8.0)';
COMMENT ON COLUMN exercises.dupr_range_max IS 'Maximum DUPR skill level for this exercise (2.0 to 8.0)';
COMMENT ON COLUMN exercises.dupr_range_display IS 'Auto-generated display format for DUPR range (e.g., "2.0–3.0")';

-- Example usage after migration:
-- UPDATE exercises SET dupr_range_min = 2.0, dupr_range_max = 3.0 WHERE id = 'some-exercise-id';
-- SELECT * FROM exercises WHERE dupr_range_min <= 3.5 AND dupr_range_max >= 3.0; -- Find exercises suitable for 3.0-3.5 range
