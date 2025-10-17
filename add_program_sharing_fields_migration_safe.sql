-- =====================================================
-- PROGRAM SHARING FIELDS MIGRATION (SAFE VERSION)
-- Adds sharing functionality to programs table
-- Handles existing policies and functions gracefully
-- =====================================================

-- Add sharing fields to programs table (safe - only adds if not exists)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS share_token TEXT,
ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_shared_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint to share_token if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'programs_share_token_key'
  ) THEN
    ALTER TABLE programs ADD CONSTRAINT programs_share_token_key UNIQUE (share_token);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_programs_share_token ON programs(share_token);
CREATE INDEX IF NOT EXISTS idx_programs_shareable ON programs(is_shareable) WHERE is_shareable = true;

-- Update existing programs to be shareable by default (safe)
UPDATE programs SET is_shareable = true WHERE is_shareable IS NULL;

-- =====================================================
-- SHARING UTILITY FUNCTIONS (SAFE - REPLACE IF EXISTS)
-- =====================================================

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_program_share_count(program_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Update share count and last shared timestamp
  UPDATE programs 
  SET 
    share_count = COALESCE(share_count, 0) + 1,
    last_shared_at = NOW()
  WHERE id = program_id
    AND (created_by = auth.uid() OR is_shareable = true);
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found or not shareable';
  END IF;
END;
$$;

-- Function to get program by share token (for recipients)
CREATE OR REPLACE FUNCTION get_program_by_share_token(token TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  tier TEXT,
  thumbnail_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  share_count INTEGER,
  routines_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return program details if share token is valid and program is shareable
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.tier,
    p.thumbnail_url,
    p.created_by,
    p.created_at,
    p.share_count,
    COUNT(r.id) as routines_count
  FROM programs p
  LEFT JOIN routines r ON r.program_id = p.id
  WHERE p.share_token = token
    AND p.is_shareable = true
    AND p.is_published = true
  GROUP BY p.id, p.name, p.description, p.category, p.tier, p.thumbnail_url, p.created_by, p.created_at, p.share_count;
END;
$$;

-- Update the existing update_program_as_user function to handle sharing fields
CREATE OR REPLACE FUNCTION update_program_as_user(
  program_id UUID,
  program_name TEXT DEFAULT NULL,
  program_description TEXT DEFAULT NULL,
  program_category TEXT DEFAULT NULL,
  program_tier TEXT DEFAULT NULL,
  program_rating DECIMAL DEFAULT NULL,
  program_added_count INTEGER DEFAULT NULL,
  program_is_published BOOLEAN DEFAULT NULL,
  program_thumbnail_url TEXT DEFAULT NULL,
  program_is_shareable BOOLEAN DEFAULT NULL,
  program_visibility TEXT DEFAULT NULL,
  program_share_token TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, program_type TEXT, is_shareable BOOLEAN, visibility TEXT, share_token TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and owns the program
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to update programs';
  END IF;

  -- Check if user owns this program
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = program_id 
    AND programs.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Program not found or access denied';
  END IF;

  -- Update the program
  RETURN QUERY
  UPDATE programs SET
    name = COALESCE(program_name, programs.name),
    description = COALESCE(program_description, programs.description),
    category = COALESCE(program_category, programs.category),
    tier = COALESCE(program_tier, programs.tier),
    rating = COALESCE(program_rating, programs.rating),
    added_count = COALESCE(program_added_count, programs.added_count),
    is_published = COALESCE(program_is_published, programs.is_published),
    thumbnail_url = COALESCE(program_thumbnail_url, programs.thumbnail_url),
    is_shareable = COALESCE(program_is_shareable, programs.is_shareable),
    visibility = COALESCE(program_visibility, programs.visibility),
    share_token = COALESCE(program_share_token, programs.share_token),
    updated_at = NOW()
  WHERE programs.id = program_id
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.program_type, programs.is_shareable, programs.visibility, programs.share_token, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Grant necessary permissions (safe - won't fail if already granted)
GRANT EXECUTE ON FUNCTION increment_program_share_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_program_by_share_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_program_as_user(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, INTEGER, BOOLEAN, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;

-- =====================================================
-- RLS POLICIES (SAFE - DROP AND RECREATE)
-- =====================================================

-- Drop existing policy if it exists, then create it
DO $$
BEGIN
  -- Drop the policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'programs' 
    AND policyname = 'Users can view shareable programs'
  ) THEN
    DROP POLICY "Users can view shareable programs" ON programs;
  END IF;
  
  -- Create the policy
  CREATE POLICY "Users can view shareable programs" ON programs
    FOR SELECT USING (is_shareable = true OR created_by = auth.uid());
END $$;

-- =====================================================
-- SHARING MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Program sharing fields migration completed successfully (SAFE VERSION)';
  RAISE NOTICE '📝 Added fields: share_token, is_shareable, share_count, last_shared_at';
  RAISE NOTICE '⚙️  Added functions: increment_program_share_count, get_program_by_share_token';
  RAISE NOTICE '🔄 Updated function: update_program_as_user (now supports sharing fields)';
  RAISE NOTICE '🔒 Updated RLS policy: Users can view shareable programs';
  RAISE NOTICE '🎉 QR code sharing is now ready to use!';
END $$;
