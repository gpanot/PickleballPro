-- Migration: Add user_id column to coaches table
-- This links coaches to their user accounts for authentication

-- Add user_id column
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);

-- Add comment for documentation
COMMENT ON COLUMN coaches.user_id IS 'Link to user account - allows coaches to log in and access dashboard';

-- Make user_id unique (one user can only have one coach profile)
ALTER TABLE coaches 
ADD CONSTRAINT coaches_user_id_unique UNIQUE (user_id);

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'user_id';

