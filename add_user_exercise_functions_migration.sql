-- Add user exercise functions that were missing from the database
-- These functions allow users to create, update, and delete their own exercises

-- =====================================================
-- EXERCISE FUNCTIONS FOR USERS (SAME STRUCTURE AS ADMIN)
-- =====================================================

-- Create exercise as user (mirrors create_exercise_as_admin)
CREATE OR REPLACE FUNCTION create_exercise_as_user(
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
RETURNS TABLE(id UUID, code TEXT, title TEXT, description TEXT, instructions TEXT, goal TEXT, difficulty INTEGER, target_value INTEGER, target_unit TEXT, estimated_minutes INTEGER, skill_category TEXT, skill_categories_json JSONB, is_published BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check authentication (same pattern as admin functions)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create exercises';
  END IF;

  -- Insert the exercise (identical structure to admin)
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
  RETURNING exercises.id, exercises.code, exercises.title, exercises.description, exercises.instructions, exercises.goal, exercises.difficulty, exercises.target_value, exercises.target_unit, exercises.estimated_minutes, exercises.skill_category, exercises.skill_categories_json, exercises.is_published, exercises.created_at, exercises.updated_at, exercises.created_by;
END;
$$;

-- Update exercise as user (mirrors update_exercise_as_admin)
CREATE OR REPLACE FUNCTION update_exercise_as_user(
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
RETURNS TABLE(id UUID, code TEXT, title TEXT, description TEXT, instructions TEXT, goal TEXT, difficulty INTEGER, target_value INTEGER, target_unit TEXT, estimated_minutes INTEGER, skill_category TEXT, skill_categories_json JSONB, is_published BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_by UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns this exercise
  IF NOT EXISTS (
    SELECT 1 FROM exercises 
    WHERE exercises.code = exercise_code 
    AND exercises.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only exercise owners can update exercises';
  END IF;

  -- Update the exercise (identical structure to admin)
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
  RETURNING exercises.id, exercises.code, exercises.title, exercises.description, exercises.instructions, exercises.goal, exercises.difficulty, exercises.target_value, exercises.target_unit, exercises.estimated_minutes, exercises.skill_category, exercises.skill_categories_json, exercises.is_published, exercises.created_at, exercises.updated_at, exercises.created_by;
END;
$$;

-- Delete exercise as user (mirrors delete_exercise_as_admin)
CREATE OR REPLACE FUNCTION delete_exercise_as_user(
  exercise_code TEXT
)
RETURNS TABLE(id UUID, code TEXT, title TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns this exercise
  IF NOT EXISTS (
    SELECT 1 FROM exercises 
    WHERE exercises.code = exercise_code 
    AND exercises.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only exercise owners can delete exercises';
  END IF;

  -- Delete the exercise and return confirmation
  RETURN QUERY
  DELETE FROM exercises 
  WHERE exercises.code = exercise_code
  RETURNING exercises.id, exercises.code, exercises.title;
END;
$$;
