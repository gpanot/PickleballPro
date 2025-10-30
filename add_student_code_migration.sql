-- Migration: Add student_code column to users table
-- This allows coaches to add students using a 4-digit code

-- Add student_code column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS student_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_student_code ON users(student_code);

-- Add comment for documentation
COMMENT ON COLUMN users.student_code IS 'Unique 4-digit code for coaches to add students';

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'student_code';

