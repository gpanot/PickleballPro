-- Add is_admin column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable RLS on programs table if not already enabled
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Create or update policy to allow admins to insert programs
DROP POLICY IF EXISTS "Admin users can insert programs" ON programs;
CREATE POLICY "Admin users can insert programs" ON programs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow admins to update programs
DROP POLICY IF EXISTS "Admin users can update programs" ON programs;
CREATE POLICY "Admin users can update programs" ON programs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow everyone to read published programs
DROP POLICY IF EXISTS "Anyone can view published programs" ON programs;
CREATE POLICY "Anyone can view published programs" ON programs
FOR SELECT
TO authenticated
USING (is_published = true);

-- Create or update policy to allow admins to view all programs
DROP POLICY IF EXISTS "Admin users can view all programs" ON programs;
CREATE POLICY "Admin users can view all programs" ON programs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow admins to delete programs
DROP POLICY IF EXISTS "Admin users can delete programs" ON programs;
CREATE POLICY "Admin users can delete programs" ON programs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Function to create programs as admin (alternative approach)
CREATE OR REPLACE FUNCTION create_program_as_admin(
  program_name TEXT,
  program_description TEXT DEFAULT NULL,
  program_category TEXT DEFAULT 'Fundamentals',
  program_tier TEXT DEFAULT 'Beginner',
  program_rating DECIMAL DEFAULT 4.0,
  program_added_count INTEGER DEFAULT 0,
  program_is_published BOOLEAN DEFAULT FALSE,
  program_thumbnail_url TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
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
    auth.uid()
  )
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Function to update programs as admin
CREATE OR REPLACE FUNCTION update_program_as_admin(
  program_id UUID,
  program_name TEXT DEFAULT NULL,
  program_description TEXT DEFAULT NULL,
  program_category TEXT DEFAULT NULL,
  program_tier TEXT DEFAULT NULL,
  program_rating DECIMAL DEFAULT NULL,
  program_added_count INTEGER DEFAULT NULL,
  program_is_published BOOLEAN DEFAULT NULL,
  program_thumbnail_url TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, description TEXT, category TEXT, tier TEXT, rating DECIMAL, added_count INTEGER, is_published BOOLEAN, thumbnail_url TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
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
    updated_at = NOW()
  WHERE programs.id = program_id
  RETURNING programs.id, programs.name, programs.description, programs.category, programs.tier, programs.rating, programs.added_count, programs.is_published, programs.thumbnail_url, programs.created_at, programs.updated_at, programs.created_by;
END;
$$;

-- Function to delete programs as admin
CREATE OR REPLACE FUNCTION delete_program_as_admin(
  program_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  program_exists BOOLEAN := FALSE;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admin users can delete programs';
  END IF;

  -- Check if program exists
  SELECT EXISTS(SELECT 1 FROM programs WHERE id = program_id) INTO program_exists;
  
  IF NOT program_exists THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  -- Delete the program (cascading will handle related records)
  DELETE FROM programs WHERE id = program_id;
  
  RETURN TRUE;
END;
$$;

-- Enable RLS on routines table if not already enabled
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Create or update policy to allow admins to delete routines
DROP POLICY IF EXISTS "Admin users can delete routines" ON routines;
CREATE POLICY "Admin users can delete routines" ON routines
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow admins to insert routines
DROP POLICY IF EXISTS "Admin users can insert routines" ON routines;
CREATE POLICY "Admin users can insert routines" ON routines
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow admins to update routines
DROP POLICY IF EXISTS "Admin users can update routines" ON routines;
CREATE POLICY "Admin users can update routines" ON routines
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Function to delete routines as admin
CREATE OR REPLACE FUNCTION delete_routine_as_admin(
  routine_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  routine_exists BOOLEAN := FALSE;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admin users can delete routines';
  END IF;

  -- Check if routine exists
  SELECT EXISTS(SELECT 1 FROM routines WHERE id = routine_id) INTO routine_exists;
  
  IF NOT routine_exists THEN
    RAISE EXCEPTION 'Routine not found';
  END IF;

  -- Delete the routine (cascading will handle related records)
  DELETE FROM routines WHERE id = routine_id;
  
  RETURN TRUE;
END;
$$;

-- Enable RLS on exercises table if not already enabled
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create or update policy to allow admins to delete exercises
DROP POLICY IF EXISTS "Admin users can delete exercises" ON exercises;
CREATE POLICY "Admin users can delete exercises" ON exercises
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow admins to insert exercises
DROP POLICY IF EXISTS "Admin users can insert exercises" ON exercises;
CREATE POLICY "Admin users can insert exercises" ON exercises
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow admins to update exercises
DROP POLICY IF EXISTS "Admin users can update exercises" ON exercises;
CREATE POLICY "Admin users can update exercises" ON exercises
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create or update policy to allow everyone to view published exercises
DROP POLICY IF EXISTS "Anyone can view published exercises" ON exercises;
CREATE POLICY "Anyone can view published exercises" ON exercises
FOR SELECT
TO authenticated
USING (is_published = true);

-- Create or update policy to allow admins to view all exercises
DROP POLICY IF EXISTS "Admin users can view all exercises" ON exercises;
CREATE POLICY "Admin users can view all exercises" ON exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Function to delete exercises as admin
CREATE OR REPLACE FUNCTION delete_exercise_as_admin(
  exercise_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exercise_exists BOOLEAN := FALSE;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admin users can delete exercises';
  END IF;

  -- Check if exercise exists (exercises use code as primary key, which is TEXT)
  SELECT EXISTS(SELECT 1 FROM exercises WHERE code = exercise_id) INTO exercise_exists;
  
  IF NOT exercise_exists THEN
    RAISE EXCEPTION 'Exercise not found';
  END IF;

  -- Delete the exercise (cascading will handle related records)
  DELETE FROM exercises WHERE code = exercise_id;
  
  RETURN TRUE;
END;
$$;

-- Function to create exercises as admin
CREATE OR REPLACE FUNCTION create_exercise_as_admin(
  exercise_code TEXT,
  exercise_title TEXT,
  exercise_description TEXT DEFAULT NULL,
  exercise_instructions TEXT DEFAULT NULL,
  exercise_goal TEXT DEFAULT NULL,
  exercise_difficulty INTEGER DEFAULT 1,
  exercise_target_value INTEGER DEFAULT NULL,
  exercise_target_unit TEXT DEFAULT NULL,
  exercise_estimated_minutes INTEGER DEFAULT NULL,
  exercise_skill_category TEXT DEFAULT NULL,
  exercise_skill_categories_json JSONB DEFAULT NULL,
  exercise_is_published BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(code TEXT, title TEXT, description TEXT, instructions TEXT, goal TEXT, difficulty INTEGER, target_value INTEGER, target_unit TEXT, estimated_minutes INTEGER, skill_category TEXT, skill_categories_json JSONB, is_published BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
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
    RAISE EXCEPTION 'Only admin users can create exercises';
  END IF;

  -- Insert the exercise
  RETURN QUERY
  INSERT INTO exercises (
    code,
    title,
    description,
    instructions,
    goal,
    difficulty,
    target_value,
    target_unit,
    estimated_minutes,
    skill_category,
    skill_categories_json,
    is_published,
    created_by
  ) VALUES (
    exercise_code,
    exercise_title,
    exercise_description,
    exercise_instructions,
    exercise_goal,
    exercise_difficulty,
    exercise_target_value,
    exercise_target_unit,
    exercise_estimated_minutes,
    exercise_skill_category,
    exercise_skill_categories_json,
    exercise_is_published,
    auth.uid()
  )
  RETURNING exercises.code, exercises.title, exercises.description, exercises.instructions, exercises.goal, exercises.difficulty, exercises.target_value, exercises.target_unit, exercises.estimated_minutes, exercises.skill_category, exercises.skill_categories_json, exercises.is_published, exercises.created_at, exercises.updated_at, exercises.created_by;
END;
$$;

-- Function to update exercises as admin
CREATE OR REPLACE FUNCTION update_exercise_as_admin(
  exercise_code TEXT,
  exercise_title TEXT DEFAULT NULL,
  exercise_description TEXT DEFAULT NULL,
  exercise_instructions TEXT DEFAULT NULL,
  exercise_goal TEXT DEFAULT NULL,
  exercise_difficulty INTEGER DEFAULT NULL,
  exercise_target_value INTEGER DEFAULT NULL,
  exercise_target_unit TEXT DEFAULT NULL,
  exercise_estimated_minutes INTEGER DEFAULT NULL,
  exercise_skill_category TEXT DEFAULT NULL,
  exercise_skill_categories_json JSONB DEFAULT NULL,
  exercise_is_published BOOLEAN DEFAULT NULL
)
RETURNS TABLE(code TEXT, title TEXT, description TEXT, instructions TEXT, goal TEXT, difficulty INTEGER, target_value INTEGER, target_unit TEXT, estimated_minutes INTEGER, skill_category TEXT, skill_categories_json JSONB, is_published BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
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
    RAISE EXCEPTION 'Only admin users can update exercises';
  END IF;

  -- Update the exercise
  RETURN QUERY
  UPDATE exercises SET
    title = COALESCE(exercise_title, exercises.title),
    description = COALESCE(exercise_description, exercises.description),
    instructions = COALESCE(exercise_instructions, exercises.instructions),
    goal = COALESCE(exercise_goal, exercises.goal),
    difficulty = COALESCE(exercise_difficulty, exercises.difficulty),
    target_value = COALESCE(exercise_target_value, exercises.target_value),
    target_unit = COALESCE(exercise_target_unit, exercises.target_unit),
    estimated_minutes = COALESCE(exercise_estimated_minutes, exercises.estimated_minutes),
    skill_category = COALESCE(exercise_skill_category, exercises.skill_category),
    skill_categories_json = COALESCE(exercise_skill_categories_json, exercises.skill_categories_json),
    is_published = COALESCE(exercise_is_published, exercises.is_published),
    updated_at = NOW()
  WHERE exercises.code = exercise_code
  RETURNING exercises.code, exercises.title, exercises.description, exercises.instructions, exercises.goal, exercises.difficulty, exercises.target_value, exercises.target_unit, exercises.estimated_minutes, exercises.skill_category, exercises.skill_categories_json, exercises.is_published, exercises.created_at, exercises.updated_at, exercises.created_by;
END;
$$;
