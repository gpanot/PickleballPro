-- Migration: Add missing columns to coaches table
-- This adds the is_accepting_students column and ensures all required columns exist

-- Add is_accepting_students column if it doesn't exist
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS is_accepting_students BOOLEAN DEFAULT false;

-- Add is_active column if it doesn't exist (should already exist but just in case)
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_verified column if it doesn't exist (should already exist but just in case)
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_coaches_is_accepting_students ON coaches(is_accepting_students);
CREATE INDEX IF NOT EXISTS idx_coaches_is_active ON coaches(is_active);
CREATE INDEX IF NOT EXISTS idx_coaches_is_verified ON coaches(is_verified);

-- Add comments for documentation
COMMENT ON COLUMN coaches.is_accepting_students IS 'Whether the coach is currently accepting new students and wants to be visible in the directory';
COMMENT ON COLUMN coaches.is_active IS 'Whether the coach is available for new students';
COMMENT ON COLUMN coaches.is_verified IS 'Whether the coach profile has been verified by admin';

-- Verification query to check if columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name IN ('is_accepting_students', 'is_active', 'is_verified')
ORDER BY column_name;
