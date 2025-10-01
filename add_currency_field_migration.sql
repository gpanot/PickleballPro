-- Migration: Add currency field to coaches table
-- This allows coaches to specify their pricing currency (USD or VND)

-- Add currency column if it doesn't exist
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add constraint to ensure currency is either USD or VND
-- Using DO block to check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_currency_valid' 
        AND table_name = 'coaches'
    ) THEN
        ALTER TABLE coaches 
        ADD CONSTRAINT check_currency_valid 
        CHECK (currency IN ('USD', 'VND'));
    END IF;
END $$;

-- Add index for efficient filtering by currency
CREATE INDEX IF NOT EXISTS idx_coaches_currency ON coaches(currency);

-- Add comment for documentation
COMMENT ON COLUMN coaches.currency IS 'Currency code for hourly_rate (USD or VND)';

-- Update existing coaches to set appropriate currency based on location or default to USD
UPDATE coaches 
SET currency = 'VND' 
WHERE currency = 'USD' 
  AND (location ILIKE '%vietnam%' OR location ILIKE '%ho chi minh%' OR location ILIKE '%hanoi%' OR location ILIKE '%saigon%');

-- Verification query to check if column exists and has correct constraints
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'currency';

-- Check constraint
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_currency_valid';
