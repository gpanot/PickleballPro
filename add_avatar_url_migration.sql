-- Add avatar_url column to users table
-- Run this script in your Supabase SQL editor

-- Add the avatar_url column to the users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture stored in Supabase Storage';

-- Optional: Create an index for faster queries if needed
-- CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url) WHERE avatar_url IS NOT NULL;
