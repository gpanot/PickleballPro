-- Migration: Add city column to users table
-- This allows users to display their city in leaderboard and profile

-- Add city column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add index for city-based queries
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

-- Add comment for documentation
COMMENT ON COLUMN users.city IS 'City name derived from user location (reverse geocoding)';

-- Verification query to check if column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'city'
ORDER BY column_name;

