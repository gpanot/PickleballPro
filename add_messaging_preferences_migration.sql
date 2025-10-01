-- Migration: Add messaging_preferences column to coaches table
-- This allows coaches to specify their preferred messaging platforms (WhatsApp, iMessage, Zalo)

-- Add messaging_preferences column if it doesn't exist
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS messaging_preferences JSONB DEFAULT '{"whatsapp": false, "imessage": false, "zalo": false}';

-- Add index for efficient filtering by messaging preferences
CREATE INDEX IF NOT EXISTS idx_coaches_messaging_preferences ON coaches USING GIN (messaging_preferences);

-- Add comment for documentation
COMMENT ON COLUMN coaches.messaging_preferences IS 'JSON object storing preferred messaging platforms: {"whatsapp": boolean, "imessage": boolean, "zalo": boolean}';

-- Verification query to check if column exists
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'messaging_preferences';

-- Example data structure:
-- {
--   "whatsapp": true,
--   "imessage": false,
--   "zalo": true
-- }
