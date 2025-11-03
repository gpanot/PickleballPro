-- Fix user_programs RLS policy to allow coaches to assign programs to students

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own programs" ON user_programs;

-- Create new policy that allows:
-- 1. Users to manage their own programs
-- 2. Coaches to assign programs to their students
CREATE POLICY "Users and coaches can manage programs" ON user_programs
FOR ALL
TO authenticated
USING (
  -- User can access their own programs
  user_id = auth.uid()
  OR
  -- Coach can access their student's programs
  EXISTS (
    SELECT 1 FROM coach_students
    WHERE coach_students.student_id = user_programs.user_id
    AND coach_students.coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
    AND coach_students.is_active = true
  )
)
WITH CHECK (
  -- User can insert/update their own programs
  user_id = auth.uid()
  OR
  -- Coach can insert/update their student's programs
  EXISTS (
    SELECT 1 FROM coach_students
    WHERE coach_students.student_id = user_programs.user_id
    AND coach_students.coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
    AND coach_students.is_active = true
  )
);

-- Verify the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_programs';

