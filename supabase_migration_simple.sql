-- ===================================================================
-- CORRECTED SUPABASE ENHANCED EXERCISES TABLE MIGRATION
-- ===================================================================
-- Fixed to match your actual table structure
-- ===================================================================

-- Step 1: Add new columns
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tips_json JSONB;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS skill_categories_json JSONB;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Step 2: Set default values
ALTER TABLE exercises ALTER COLUMN tips_json SET DEFAULT '[]'::jsonb;
ALTER TABLE exercises ALTER COLUMN skill_categories_json SET DEFAULT '[]'::jsonb;
ALTER TABLE exercises ALTER COLUMN estimated_minutes SET DEFAULT 10;

-- Step 3: Migrate existing data

-- Initialize tips_json as empty array (no existing tips column to migrate from)
UPDATE exercises 
SET tips_json = '[]'::jsonb
WHERE tips_json IS NULL;

-- Migrate skill categories from existing skill_category column
UPDATE exercises 
SET skill_categories_json = CASE 
  WHEN skill_category IS NOT NULL AND skill_category != '' THEN 
    to_jsonb(string_to_array(skill_category, ','))
  ELSE 
    '[]'::jsonb
END
WHERE skill_categories_json IS NULL;

-- Set default estimated_minutes (no existing column to migrate from)
UPDATE exercises 
SET estimated_minutes = 10
WHERE estimated_minutes IS NULL;

-- Migrate goal_text to new goal column
UPDATE exercises 
SET goal = goal_text
WHERE goal IS NULL AND goal_text IS NOT NULL;

-- Set youtube_url as demo_video_url if it exists
UPDATE exercises 
SET youtube_url = demo_video_url
WHERE youtube_url IS NULL AND demo_video_url IS NOT NULL;

-- Step 4: Create indexes (these will be skipped if they already exist)
CREATE INDEX IF NOT EXISTS idx_exercises_skill_categories ON exercises USING GIN (skill_categories_json);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises (difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_published ON exercises (is_published);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises (created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_estimated_minutes ON exercises (estimated_minutes);

-- Step 5: Verification query
-- Run this to check if the migration worked:
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_exercises,
  COUNT(tips_json) as exercises_with_tips_json,
  COUNT(skill_categories_json) as exercises_with_categories_json,
  COUNT(estimated_minutes) as exercises_with_minutes
FROM exercises;
