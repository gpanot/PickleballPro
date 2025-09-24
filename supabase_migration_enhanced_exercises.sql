-- ===================================================================
-- SUPABASE ENHANCED EXERCISES TABLE MIGRATION
-- ===================================================================
-- This migration updates the exercises table to use the enhanced schema
-- with better data types and performance optimizations
-- 
-- Run this in your Supabase SQL Editor
-- ===================================================================

-- Step 1: Create backup of existing data (optional but recommended)
-- CREATE TABLE exercises_backup AS SELECT * FROM exercises;

-- Step 2: Add new columns with enhanced data types
-- Note: We'll add new columns first, then migrate data, then drop old columns

-- Add enhanced columns
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS tips_json JSONB,
ADD COLUMN IF NOT EXISTS skill_categories_json JSONB,
ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;

-- Step 3: Migrate existing data to new columns

-- Migrate tips from TEXT to JSONB array
UPDATE exercises 
SET tips_json = CASE 
  WHEN tips IS NOT NULL AND tips != '' THEN 
    to_jsonb(string_to_array(tips, E'\n'))
  ELSE 
    '[]'::jsonb
END
WHERE tips_json IS NULL;

-- Migrate skill_category from comma-separated TEXT to JSONB array
UPDATE exercises 
SET skill_categories_json = CASE 
  WHEN skill_category IS NOT NULL AND skill_category != '' THEN 
    to_jsonb(string_to_array(skill_category, ','))
  ELSE 
    '[]'::jsonb
END
WHERE skill_categories_json IS NULL;

-- Migrate estimated_time from TEXT to INTEGER minutes
UPDATE exercises 
SET estimated_minutes = CASE 
  WHEN estimated_time ~ '^\d+\s*min$' THEN 
    CAST(REGEXP_REPLACE(estimated_time, '\s*min$', '') AS INTEGER)
  WHEN estimated_time ~ '^\d+-\d+\s*min$' THEN 
    -- For ranges like "10-15 min", take the average
    CAST((
      CAST(SPLIT_PART(REGEXP_REPLACE(estimated_time, '\s*min$', ''), '-', 1) AS INTEGER) +
      CAST(SPLIT_PART(REGEXP_REPLACE(estimated_time, '\s*min$', ''), '-', 2) AS INTEGER)
    ) / 2 AS INTEGER)
  WHEN estimated_time = '5 min' THEN 5
  WHEN estimated_time = '10 min' THEN 10
  WHEN estimated_time = '20 min' THEN 20
  WHEN estimated_time = '30 min' THEN 30
  ELSE 15  -- Default fallback
END
WHERE estimated_minutes IS NULL;

-- Step 4: Add constraints and indexes

-- Add difficulty constraint (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_difficulty' 
               AND table_name = 'exercises') THEN
        ALTER TABLE exercises DROP CONSTRAINT check_difficulty;
    END IF;
END $$;

ALTER TABLE exercises 
ADD CONSTRAINT check_difficulty 
CHECK (difficulty BETWEEN 1 AND 5);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_skill_categories 
ON exercises USING GIN (skill_categories_json);

CREATE INDEX IF NOT EXISTS idx_exercises_difficulty 
ON exercises (difficulty);

CREATE INDEX IF NOT EXISTS idx_exercises_published 
ON exercises (is_published);

CREATE INDEX IF NOT EXISTS idx_exercises_created_by 
ON exercises (created_by);

CREATE INDEX IF NOT EXISTS idx_exercises_estimated_minutes 
ON exercises (estimated_minutes);

-- Step 5: Add default values for new records
ALTER TABLE exercises 
ALTER COLUMN tips_json SET DEFAULT '[]'::jsonb,
ALTER COLUMN skill_categories_json SET DEFAULT '[]'::jsonb,
ALTER COLUMN estimated_minutes SET DEFAULT 10;

-- Step 6: Update RLS policies 
-- (Adjust these based on your existing RLS setup)

-- Enable RLS (this is safe to run multiple times)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can view published exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can view all exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can create exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;

-- Create new policies
-- Policy: Anyone can read published exercises
CREATE POLICY "Public can view published exercises" 
ON exercises FOR SELECT 
USING (is_published = true);

-- Policy: Authenticated users can view all exercises
CREATE POLICY "Authenticated users can view all exercises" 
ON exercises FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Users can insert exercises
CREATE POLICY "Authenticated users can create exercises" 
ON exercises FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own exercises
CREATE POLICY "Users can update own exercises" 
ON exercises FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own exercises
CREATE POLICY "Users can delete own exercises" 
ON exercises FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Step 7: Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW exercises_legacy AS
SELECT 
  id,
  title,
  code,
  description,
  goal,
  instructions,
  CASE 
    WHEN tips_json IS NOT NULL THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(tips_json)), E'\n')
    ELSE tips
  END as tips,
  youtube_url,
  target_value,
  CASE 
    WHEN estimated_minutes IS NOT NULL THEN estimated_minutes::text || ' min'
    ELSE estimated_time
  END as estimated_time,
  difficulty,
  CASE 
    WHEN skill_categories_json IS NOT NULL THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(skill_categories_json)), ',')
    ELSE skill_category
  END as skill_category,
  is_published,
  created_by,
  created_at,
  updated_at,
  -- New enhanced fields
  tips_json,
  skill_categories_json,
  estimated_minutes
FROM exercises;

-- Step 8: Verification queries
-- Run these to verify the migration worked correctly

-- Check data migration
-- SELECT 
--   title,
--   tips,
--   tips_json,
--   skill_category,
--   skill_categories_json,
--   estimated_time,
--   estimated_minutes
-- FROM exercises
-- LIMIT 5;

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'exercises';

-- ===================================================================
-- MIGRATION COMPLETE
-- ===================================================================
-- 
-- After running this migration:
-- 1. Test that existing exercises still display correctly
-- 2. Test creating new exercises with the updated code
-- 3. If everything works, you can optionally drop old columns:
--    ALTER TABLE exercises DROP COLUMN tips;
--    ALTER TABLE exercises DROP COLUMN skill_category;
--    ALTER TABLE exercises DROP COLUMN estimated_time;
-- 4. Update your application code to use the new JSONB fields
-- 
-- ===================================================================
