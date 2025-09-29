-- Migration: Add coaching_radius column to coaches table
-- This allows coaches to specify how far they're willing to travel for coaching sessions
-- Range: 0.5km (500m) to 30km

-- Add coaching_radius column if it doesn't exist
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS coaching_radius DECIMAL(4, 1) DEFAULT 5.0;

-- Add constraint to ensure radius is within valid range (0.5km to 30km)
-- Using DO block to check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_coaching_radius_range' 
        AND table_name = 'coaches'
    ) THEN
        ALTER TABLE coaches 
        ADD CONSTRAINT check_coaching_radius_range 
        CHECK (coaching_radius >= 0.5 AND coaching_radius <= 30.0);
    END IF;
END $$;

-- Add index for efficient filtering by coaching radius
CREATE INDEX IF NOT EXISTS idx_coaches_coaching_radius ON coaches(coaching_radius);

-- Add comment for documentation
COMMENT ON COLUMN coaches.coaching_radius IS 'Maximum distance in kilometers the coach is willing to travel for sessions (0.5-30km)';

-- Verification query to check if column exists and has correct constraints
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'coaching_radius';

-- Check constraint
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_coaching_radius_range';
