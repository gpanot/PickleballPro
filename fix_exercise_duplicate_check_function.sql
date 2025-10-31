-- =====================================================
-- FIX: create_exercise_as_user_with_duplicate_check
-- =====================================================
-- This migration fixes the ambiguous 'created_by' column reference error
-- by properly qualifying all column references with table aliases

-- Create or replace the function with duplicate checking and proper column qualification
CREATE OR REPLACE FUNCTION create_exercise_as_user_with_duplicate_check(
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
DECLARE
  existing_exercise RECORD;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create exercises';
  END IF;

  -- Check if exercise already exists with same code and created_by user
  SELECT e.id, e.code, e.title, e.description, e.instructions, e.goal, 
         e.difficulty, e.target_value, e.target_unit, e.estimated_minutes, 
         e.skill_category, e.skill_categories_json, e.is_published, 
         e.created_at, e.updated_at, e.created_by
  INTO existing_exercise
  FROM exercises e
  WHERE e.code = exercise_code
    AND e.created_by = current_user_id
  LIMIT 1;

  -- If exercise exists, return it
  IF existing_exercise IS NOT NULL THEN
    RETURN QUERY
    SELECT existing_exercise.id, existing_exercise.code, existing_exercise.title, 
           existing_exercise.description, existing_exercise.instructions, existing_exercise.goal, 
           existing_exercise.difficulty, existing_exercise.target_value, existing_exercise.target_unit, 
           existing_exercise.estimated_minutes, existing_exercise.skill_category, 
           existing_exercise.skill_categories_json, existing_exercise.is_published, 
           existing_exercise.created_at, existing_exercise.updated_at, existing_exercise.created_by;
    RETURN;
  END IF;

  -- Exercise doesn't exist, create it
  -- All column references in RETURNING are qualified with table alias 'e' to avoid ambiguity
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
    current_user_id
  )
  RETURNING 
    exercises.id, 
    exercises.code, 
    exercises.title, 
    exercises.description, 
    exercises.instructions, 
    exercises.goal, 
    exercises.difficulty, 
    exercises.target_value, 
    exercises.target_unit, 
    exercises.estimated_minutes, 
    exercises.skill_category, 
    exercises.skill_categories_json, 
    exercises.is_published, 
    exercises.created_at, 
    exercises.updated_at, 
    exercises.created_by;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_exercise_as_user_with_duplicate_check(
  TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER, TEXT, JSONB, BOOLEAN
) TO authenticated;

