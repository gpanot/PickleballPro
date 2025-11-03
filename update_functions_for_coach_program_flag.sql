-- =====================================================
-- UPDATE FUNCTIONS FOR COACH PROGRAM FLAG
-- Run this after add_coach_program_only_migration.sql
-- Updates all program creation/update functions to support is_coach_program
-- =====================================================

-- Update create_program_as_admin function
CREATE OR REPLACE FUNCTION create_program_as_admin(
  program_name TEXT,
  program_description TEXT DEFAULT NULL,
  program_category TEXT DEFAULT 'Fundamentals',
  program_tier TEXT DEFAULT 'Beginner',
  program_rating DECIMAL DEFAULT 4.0,
  program_added_count INTEGER DEFAULT 0,
  program_is_published BOOLEAN DEFAULT FALSE,
  program_thumbnail_url TEXT DEFAULT NULL,
  program_is_coach_program BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, is_coach_program BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admin users can create programs';
  END IF;

  -- Insert the program
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
    is_coach_program,
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
    program_is_coach_program,
    auth.uid()
  )
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.is_coach_program, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Update update_program_as_admin function
CREATE OR REPLACE FUNCTION update_program_as_admin(
  program_id UUID,
  program_name TEXT DEFAULT NULL,
  program_description TEXT DEFAULT NULL,
  program_category TEXT DEFAULT NULL,
  program_tier TEXT DEFAULT NULL,
  program_rating DECIMAL DEFAULT NULL,
  program_added_count INTEGER DEFAULT NULL,
  program_is_published BOOLEAN DEFAULT NULL,
  program_thumbnail_url TEXT DEFAULT NULL,
  program_is_coach_program BOOLEAN DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, is_coach_program BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admin users can update programs';
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
    is_coach_program = COALESCE(program_is_coach_program, programs.is_coach_program),
    updated_at = NOW()
  WHERE programs.id = program_id
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.is_coach_program, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Update create_program_as_user function
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
  program_visibility TEXT DEFAULT 'private',
  program_is_coach_program BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, program_type TEXT, is_shareable BOOLEAN, visibility TEXT, is_coach_program BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated (no admin check needed)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create programs';
  END IF;

  -- Insert the program (same structure as admin)
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
    is_coach_program,
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
    'user',
    program_is_shareable,
    program_visibility,
    program_is_coach_program,
    auth.uid()
  )
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.program_type, programs.is_shareable, programs.visibility, programs.is_coach_program, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Update update_program_as_user function
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
  program_is_coach_program BOOLEAN DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, program_type TEXT, is_shareable BOOLEAN, visibility TEXT, is_coach_program BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns this program
  IF NOT EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = program_id 
    AND programs.created_by = auth.uid()
    AND programs.program_type = 'user'
  ) THEN
    RAISE EXCEPTION 'Only program owners can update their programs';
  END IF;

  -- Update the program (identical logic to admin)
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
    is_coach_program = COALESCE(program_is_coach_program, programs.is_coach_program),
    updated_at = NOW()
  WHERE programs.id = program_id
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.program_type, programs.is_shareable, programs.visibility, programs.is_coach_program, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

