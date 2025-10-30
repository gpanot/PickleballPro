-- Migration: Create coach_students table
-- This table links coaches to their students for assessments and tracking

CREATE TABLE IF NOT EXISTS coach_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a student can't be added twice by the same coach
  UNIQUE(coach_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_students_coach ON coach_students(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_students_student ON coach_students(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_students_active ON coach_students(is_active);

-- Add comments for documentation
COMMENT ON TABLE coach_students IS 'Links coaches to their students for assessments and program management';
COMMENT ON COLUMN coach_students.coach_id IS 'Reference to the coach in coaches table';
COMMENT ON COLUMN coach_students.student_id IS 'Reference to the student/player in users table';

-- Verification query
SELECT 
  table_name, 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'coach_students'
ORDER BY ordinal_position;

