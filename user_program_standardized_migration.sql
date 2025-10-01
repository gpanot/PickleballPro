-- =====================================================
-- USER PROGRAM STANDARDIZED MIGRATION
-- Extends existing admin structure with identical patterns for users
-- Same tables, same function signatures, distinguished by created_by
-- =====================================================

-- =====================================================
-- SCHEMA ENHANCEMENTS (Minimal changes to existing structure)
-- =====================================================

-- Enhance programs table to support user-created programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type TEXT CHECK (program_type IN ('admin', 'user')) DEFAULT 'admin';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS shared_count INTEGER DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('private', 'public', 'shared')) DEFAULT 'public';

-- Update existing admin programs to have correct type
UPDATE programs SET program_type = 'admin' WHERE program_type IS NULL;

-- =====================================================
-- USER PROGRAM TABLES (Supporting user workflows)
-- =====================================================

-- Table to track user's program collection (added from Explore + created programs)
CREATE TABLE IF NOT EXISTS user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  
  -- How user got this program
  access_type TEXT CHECK (access_type IN ('created', 'added', 'shared')) DEFAULT 'added',
  
  -- Progress tracking (identical to admin backend structure)
  current_routine_id UUID REFERENCES routines(id),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  
  -- User customization
  custom_name TEXT,
  custom_schedule JSONB,
  personal_notes TEXT,
  
  -- Timestamps (consistent with admin pattern)
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, program_id)
);

-- Program sharing table
CREATE TABLE IF NOT EXISTS program_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share metadata
  share_message TEXT,
  is_accepted BOOLEAN DEFAULT FALSE,
  
  -- Timestamps (consistent pattern)
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(program_id, shared_with_user_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_shares ENABLE ROW LEVEL SECURITY;

-- User can manage their own program collection
DROP POLICY IF EXISTS "Users can manage their own programs" ON user_programs;
CREATE POLICY "Users can manage their own programs" ON user_programs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can manage shares they're involved in
DROP POLICY IF EXISTS "Users can manage their shares" ON program_shares;
CREATE POLICY "Users can manage their shares" ON program_shares
FOR ALL
TO authenticated
USING (shared_by_user_id = auth.uid() OR shared_with_user_id = auth.uid())
WITH CHECK (shared_by_user_id = auth.uid() OR shared_with_user_id = auth.uid());

-- Update programs RLS to allow user-created programs
DROP POLICY IF EXISTS "Users can view accessible programs" ON programs;
CREATE POLICY "Users can view accessible programs" ON programs
FOR SELECT
TO authenticated
USING (
  (is_published = true) OR  -- Published programs (admin or user)
  (created_by = auth.uid()) OR  -- User's own programs
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  ) OR  -- Admin can see all
  EXISTS (
    SELECT 1 FROM user_programs 
    WHERE user_programs.program_id = programs.id 
    AND user_programs.user_id = auth.uid()
  )  -- Programs in user's collection
);

-- Users can update their own created programs
DROP POLICY IF EXISTS "Users can update their created programs" ON programs;
CREATE POLICY "Users can update their created programs" ON programs
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Users can delete their own created programs
DROP POLICY IF EXISTS "Users can delete their created programs" ON programs;
CREATE POLICY "Users can delete their created programs" ON programs
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Users can create programs
DROP POLICY IF EXISTS "Users can create programs" ON programs;
CREATE POLICY "Users can create programs" ON programs
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- =====================================================
-- USER PROGRAM FUNCTIONS (IDENTICAL STRUCTURE TO ADMIN)
-- =====================================================

-- Function to create programs as user (mirrors create_program_as_admin exactly)
CREATE OR REPLACE FUNCTION create_program_as_user(
  program_name TEXT,
  program_description TEXT DEFAULT NULL,
  program_category TEXT DEFAULT 'Custom',
  program_tier TEXT DEFAULT 'Beginner',
  program_rating DECIMAL DEFAULT 0.0,
  program_added_count INTEGER DEFAULT 0,
  program_is_published BOOLEAN DEFAULT FALSE,
  program_thumbnail_url TEXT DEFAULT NULL,
  program_is_shareable BOOLEAN DEFAULT TRUE,
  program_visibility TEXT DEFAULT 'private'
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, program_type TEXT, is_shareable BOOLEAN, visibility TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check authentication (same pattern as admin functions)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create programs';
  END IF;

  -- Insert the program (identical structure to admin)
  RETURN QUERY
  INSERT INTO programs (
    name, 
    description, 
    category, 
    tier, 
    rating, 
    added_count, 
    is_published, 
    thumbnail_url,
    program_type,
    is_shareable,
    visibility,
    created_by
  ) VALUES (
    program_name,
    program_description,
    program_category,
    program_tier,
    program_rating,
    program_added_count,
    program_is_published,
    program_thumbnail_url,
    'user',  -- Key difference: program_type = 'user'
    program_is_shareable,
    program_visibility,
    auth.uid()  -- Key difference: user ID instead of admin ID
  )
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.program_type, programs.is_shareable, programs.visibility, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Function to update programs as user (identical structure to update_program_as_admin)
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
  program_visibility TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, program_type TEXT, is_shareable BOOLEAN, visibility TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check ownership (mirrors admin permission check)
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = program_id 
    AND programs.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only program owners can update their programs';
  END IF;

  -- Update the program (identical logic to admin function)
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
    updated_at = NOW()
  WHERE programs.id = program_id
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.program_type, programs.is_shareable, programs.visibility, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Function to delete programs as user (identical structure to delete_program_as_admin)
CREATE OR REPLACE FUNCTION delete_program_as_user(
  program_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  program_exists BOOLEAN := FALSE;
BEGIN
  -- Check ownership (mirrors admin permission check)
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = program_id 
    AND programs.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only program owners can delete their programs';
  END IF;

  -- Check if program exists (identical to admin function)
  SELECT EXISTS(SELECT 1 FROM programs WHERE id = program_id) INTO program_exists;
  
  IF NOT program_exists THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  -- Delete the program (identical to admin - cascading handles related records)
  DELETE FROM programs WHERE id = program_id;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- PROGRAM COLLECTION FUNCTIONS (User workflows)
-- =====================================================

-- Function to add program to user's collection (from Explore screen)
CREATE OR REPLACE FUNCTION add_program_to_user_collection(
  program_id UUID
)
RETURNS TABLE(user_program_id UUID, program_name TEXT, access_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  program_name TEXT;
BEGIN
  -- Check if program exists and is published
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE id = program_id 
    AND is_published = true
  ) THEN
    RAISE EXCEPTION 'Program not found or not published';
  END IF;

  -- Get program name
  SELECT name INTO program_name 
  FROM programs 
  WHERE id = program_id;

  -- Update added_count (same as admin analytics)
  UPDATE programs 
  SET added_count = added_count + 1 
  WHERE id = program_id;

  -- Add to user's collection
  RETURN QUERY
  INSERT INTO user_programs (
    user_id,
    program_id,
    access_type
  ) VALUES (
    auth.uid(),
    program_id,
    'added'
  )
  ON CONFLICT (user_id, program_id) DO UPDATE SET
    last_accessed_at = NOW()
  RETURNING user_programs.id, program_name, user_programs.access_type;
END;
$$;

-- Function to get user's programs (unified view: created + added + shared)
CREATE OR REPLACE FUNCTION get_user_programs()
RETURNS TABLE(
  id UUID, 
  name TEXT, 
  description TEXT, 
  category TEXT, 
  tier TEXT, 
  rating DECIMAL, 
  added_count INTEGER, 
  is_published BOOLEAN, 
  thumbnail_url TEXT,
  program_type TEXT,
  is_shareable BOOLEAN,
  visibility TEXT,
  access_type TEXT,
  completion_percentage DECIMAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  creator_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.description, p.category, p.tier, p.rating, 
    p.added_count, p.is_published, p.thumbnail_url, p.program_type,
    p.is_shareable, p.visibility, 
    COALESCE(up.access_type, 'created') as access_type,
    COALESCE(up.completion_percentage, 0.0) as completion_percentage,
    p.created_at, p.updated_at, p.created_by,
    u.name as creator_name
  FROM programs p
  LEFT JOIN user_programs up ON p.id = up.program_id AND up.user_id = auth.uid()
  LEFT JOIN users u ON p.created_by = u.id
  WHERE 
    (p.created_by = auth.uid()) OR  -- User's created programs
    (up.user_id = auth.uid())  -- User's added/shared programs
  ORDER BY 
    CASE 
      WHEN p.created_by = auth.uid() THEN 1  -- Created programs first
      WHEN up.access_type = 'shared' THEN 2  -- Shared programs second
      ELSE 3  -- Added programs last
    END,
    p.updated_at DESC;
END;
$$;

-- =====================================================
-- PROGRAM SHARING FUNCTIONS
-- =====================================================

-- Function to share program with another user
CREATE OR REPLACE FUNCTION share_program_as_user(
  program_id UUID,
  target_user_email TEXT,
  share_message TEXT DEFAULT NULL
)
RETURNS TABLE(share_id UUID, shared_with_user_id UUID, shared_with_name TEXT, program_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  target_user_name TEXT;
  program_name TEXT;
BEGIN
  -- Check if user owns this program and it's shareable
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = program_id 
    AND programs.created_by = auth.uid()
    AND programs.is_shareable = true
  ) THEN
    RAISE EXCEPTION 'Only shareable program owners can share their programs';
  END IF;

  -- Get target user info from email
  SELECT id, name INTO target_user_id, target_user_name
  FROM users 
  WHERE email = target_user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_user_email;
  END IF;

  -- Prevent sharing with self
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot share program with yourself';
  END IF;

  -- Get program name
  SELECT name INTO program_name 
  FROM programs 
  WHERE id = program_id;

  -- Update shared_count in programs table
  UPDATE programs 
  SET shared_count = shared_count + 1 
  WHERE id = program_id;

  -- Create share record
  RETURN QUERY
  INSERT INTO program_shares (
    program_id,
    shared_by_user_id,
    shared_with_user_id,
    share_message
  ) VALUES (
    program_id,
    auth.uid(),
    target_user_id,
    share_message
  )
  ON CONFLICT (program_id, shared_with_user_id) DO UPDATE SET
    share_message = EXCLUDED.share_message,
    shared_at = NOW(),
    is_accepted = false
  RETURNING program_shares.id, target_user_id, target_user_name, program_name;
END;
$$;

-- Function to accept shared program
CREATE OR REPLACE FUNCTION accept_shared_program(
  share_id UUID
)
RETURNS TABLE(program_id UUID, program_name TEXT, shared_by_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  program_id UUID;
  program_name TEXT;
  shared_by_name TEXT;
BEGIN
  -- Check if user is the recipient of this share
  IF NOT EXISTS (
    SELECT 1 FROM program_shares 
    WHERE id = share_id 
    AND shared_with_user_id = auth.uid()
    AND is_accepted = false
  ) THEN
    RAISE EXCEPTION 'Share not found or already accepted';
  END IF;

  -- Get program and sharer info
  SELECT ps.program_id, p.name, u.name
  INTO program_id, program_name, shared_by_name
  FROM program_shares ps
  JOIN programs p ON ps.program_id = p.id
  JOIN users u ON ps.shared_by_user_id = u.id
  WHERE ps.id = share_id;

  -- Mark share as accepted
  UPDATE program_shares 
  SET is_accepted = true, accepted_at = NOW()
  WHERE id = share_id;

  -- Add to user's programs collection
  INSERT INTO user_programs (
    user_id,
    program_id,
    access_type
  ) VALUES (
    auth.uid(),
    program_id,
    'shared'
  )
  ON CONFLICT (user_id, program_id) DO UPDATE SET
    access_type = 'shared',
    last_accessed_at = NOW();

  RETURN QUERY
  SELECT program_id, program_name, shared_by_name;
END;
$$;

-- Function to get pending shares for user
CREATE OR REPLACE FUNCTION get_pending_program_shares()
RETURNS TABLE(
  share_id UUID,
  program_id UUID,
  program_name TEXT,
  program_description TEXT,
  shared_by_name TEXT,
  shared_by_email TEXT,
  share_message TEXT,
  shared_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id as share_id,
    p.id as program_id,
    p.name as program_name,
    p.description as program_description,
    u.name as shared_by_name,
    u.email as shared_by_email,
    ps.share_message,
    ps.shared_at
  FROM program_shares ps
  JOIN programs p ON ps.program_id = p.id
  JOIN users u ON ps.shared_by_user_id = u.id
  WHERE ps.shared_with_user_id = auth.uid()
    AND ps.is_accepted = false
  ORDER BY ps.shared_at DESC;
END;
$$;

-- =====================================================
-- ROUTINE FUNCTIONS FOR USERS (IDENTICAL TO ADMIN)
-- =====================================================

-- Create routine as user (mirrors admin create_routine function)
CREATE OR REPLACE FUNCTION create_routine_as_user(
  routine_program_id UUID,
  routine_name TEXT,
  routine_description TEXT DEFAULT NULL,
  routine_order_index INTEGER DEFAULT 0,
  routine_time_estimate_minutes INTEGER DEFAULT NULL,
  routine_is_published BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(id UUID, program_id UUID, name TEXT, description TEXT, order_index INTEGER, time_estimate_minutes INTEGER, is_published BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the program (mirrors admin permission check)
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = routine_program_id 
    AND programs.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only program owners can create routines';
  END IF;

  -- Insert the routine (identical to admin function)
  RETURN QUERY
  INSERT INTO routines (
    program_id,
    name,
    description,
    order_index,
    time_estimate_minutes,
    is_published
  ) VALUES (
    routine_program_id,
    routine_name,
    routine_description,
    routine_order_index,
    routine_time_estimate_minutes,
    routine_is_published
  )
  RETURNING routines.id, routines.program_id, routines.name, routines.description, routines.order_index, routines.time_estimate_minutes, routines.is_published, routines.created_at, routines.updated_at;
END;
$$;

-- Update routine as user (identical structure to admin)
CREATE OR REPLACE FUNCTION update_routine_as_user(
  routine_id UUID,
  routine_name TEXT DEFAULT NULL,
  routine_description TEXT DEFAULT NULL,
  routine_order_index INTEGER DEFAULT NULL,
  routine_time_estimate_minutes INTEGER DEFAULT NULL,
  routine_is_published BOOLEAN DEFAULT NULL
)
RETURNS TABLE(id UUID, program_id UUID, name TEXT, description TEXT, order_index INTEGER, time_estimate_minutes INTEGER, is_published BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the program containing this routine
  IF NOT EXISTS (
    SELECT 1 FROM routines r
    JOIN programs p ON r.program_id = p.id
    WHERE r.id = routine_id 
    AND p.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only program owners can update routines';
  END IF;

  -- Update the routine (identical logic to admin)
  RETURN QUERY
  UPDATE routines SET
    name = COALESCE(routine_name, routines.name),
    description = COALESCE(routine_description, routines.description),
    order_index = COALESCE(routine_order_index, routines.order_index),
    time_estimate_minutes = COALESCE(routine_time_estimate_minutes, routines.time_estimate_minutes),
    is_published = COALESCE(routine_is_published, routines.is_published),
    updated_at = NOW()
  WHERE routines.id = routine_id
  RETURNING routines.id, routines.program_id, routines.name, routines.description, routines.order_index, routines.time_estimate_minutes, routines.is_published, routines.created_at, routines.updated_at;
END;
$$;

-- Delete routine as user (identical structure to admin)
CREATE OR REPLACE FUNCTION delete_routine_as_user(
  routine_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  routine_exists BOOLEAN := FALSE;
BEGIN
  -- Check if user owns the program containing this routine
  IF NOT EXISTS (
    SELECT 1 FROM routines r
    JOIN programs p ON r.program_id = p.id
    WHERE r.id = routine_id 
    AND p.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only program owners can delete routines';
  END IF;

  -- Check if routine exists (identical to admin)
  SELECT EXISTS(SELECT 1 FROM routines WHERE id = routine_id) INTO routine_exists;
  
  IF NOT routine_exists THEN
    RAISE EXCEPTION 'Routine not found';
  END IF;

  -- Delete the routine (identical to admin)
  DELETE FROM routines WHERE id = routine_id;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- HYBRID STORAGE SUPPORT FUNCTIONS
-- =====================================================

-- Function to sync local programs to database (migration helper)
CREATE OR REPLACE FUNCTION sync_local_program_to_database(
  local_program_data JSONB
)
RETURNS TABLE(id UUID, name TEXT, sync_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  program_id UUID;
  program_name TEXT;
BEGIN
  -- Extract program data
  program_name := local_program_data->>'name';
  
  -- Check if program already exists for this user
  IF EXISTS (
    SELECT 1 FROM programs 
    WHERE name = program_name 
    AND created_by = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT NULL::UUID, program_name, 'already_exists';
    RETURN;
  END IF;

  -- Create program from local data
  INSERT INTO programs (
    name,
    description,
    category,
    tier,
    program_type,
    is_shareable,
    visibility,
    created_by
  ) VALUES (
    program_name,
    COALESCE(local_program_data->>'description', ''),
    COALESCE(local_program_data->>'category', 'Custom'),
    COALESCE(local_program_data->>'tier', 'Beginner'),
    'user',
    true,
    'private',
    auth.uid()
  )
  RETURNING programs.id INTO program_id;

  RETURN QUERY
  SELECT program_id, program_name, 'synced';
END;
$$;

