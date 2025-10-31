-- Migration: Add latitude and longitude columns to users table
-- This allows users to have location coordinates for nearby player filtering in leaderboard

-- Add columns only if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);

-- Add comments for documentation
COMMENT ON COLUMN users.latitude IS 'Latitude coordinate for user location';
COMMENT ON COLUMN users.longitude IS 'Longitude coordinate for user location';

-- Verification query to check if columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;

