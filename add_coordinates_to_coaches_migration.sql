-- Migration: Add latitude and longitude columns to coaches table (if they don't exist)
-- This allows coaches to set their location coordinates via map picker

-- Add columns only if they don't exist
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index only if it doesn't exist (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_coaches_location ON coaches(latitude, longitude);

-- Add comments for documentation (these are safe to run multiple times)
COMMENT ON COLUMN coaches.latitude IS 'Latitude coordinate for coach location (from map picker)';
COMMENT ON COLUMN coaches.longitude IS 'Longitude coordinate for coach location (from map picker)';

-- Verification query to check if columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;
