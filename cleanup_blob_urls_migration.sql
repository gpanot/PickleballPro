-- =====================================================
-- CLEANUP BLOB URLs MIGRATION
-- Removes all blob: URLs from program thumbnail_url fields
-- =====================================================

-- This migration cleans up any blob: URLs that may have been 
-- accidentally saved to the database. Blob URLs are temporary
-- browser-generated URLs that should never be persisted.

-- Step 1: Identify programs with blob URLs
SELECT 
  id, 
  name, 
  thumbnail_url,
  created_at,
  created_by
FROM programs 
WHERE thumbnail_url LIKE 'blob:%'
ORDER BY created_at DESC;

-- Step 2: Clean up blob URLs by setting them to NULL
-- This is safer than trying to fix them since blob URLs are invalid anyway
UPDATE programs 
SET thumbnail_url = NULL 
WHERE thumbnail_url LIKE 'blob:%';

-- Step 3: Report on the cleanup
SELECT 
  COUNT(*) as programs_cleaned,
  'Blob URLs removed from thumbnail_url field' as action
FROM programs 
WHERE thumbnail_url IS NULL 
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Step 4: Add a constraint to prevent future blob URLs (optional safety measure)
-- Note: This constraint will prevent any URL starting with 'blob:' from being saved
ALTER TABLE programs 
ADD CONSTRAINT check_no_blob_urls 
CHECK (thumbnail_url IS NULL OR NOT thumbnail_url LIKE 'blob:%');

-- Step 5: Verify the constraint works
-- This should fail if the constraint is working:
-- INSERT INTO programs (name, thumbnail_url) VALUES ('Test', 'blob:test-url');

-- Step 6: Check for any remaining blob URLs (should return 0 rows)
SELECT 
  COUNT(*) as remaining_blob_urls
FROM programs 
WHERE thumbnail_url LIKE 'blob:%';

-- =====================================================
-- SUMMARY
-- =====================================================
-- This migration:
-- 1. Identifies all programs with blob: URLs
-- 2. Sets their thumbnail_url to NULL (safe cleanup)
-- 3. Adds a database constraint to prevent future blob URLs
-- 4. Verifies the cleanup was successful
-- 
-- After running this migration, the application code should
-- handle NULL thumbnail_url values gracefully (which it already does).
-- =====================================================
