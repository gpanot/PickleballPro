-- Migration: Create coach_assessments table
-- This table stores skill assessments performed by coaches on their students

CREATE TABLE IF NOT EXISTS coach_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Assessment scores
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  
  -- Skill breakdown (stored as JSONB for flexibility)
  skills_data JSONB DEFAULT '{}',
  -- Example structure:
  -- {
  --   "serves": { "score": 42, "maxScore": 50, "notes": "..." },
  --   "dinks": { "score": 36, "maxScore": 40, "notes": "..." },
  --   ...
  -- }
  
  -- Overall notes and feedback
  notes TEXT,
  ai_feedback TEXT,
  
  -- Assessment metadata
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_assessments_coach ON coach_assessments(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_assessments_student ON coach_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_assessments_date ON coach_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_coach_assessments_created ON coach_assessments(created_at);

-- Add comments for documentation
COMMENT ON TABLE coach_assessments IS 'Stores detailed skill assessments performed by coaches';
COMMENT ON COLUMN coach_assessments.skills_data IS 'JSONB object containing detailed scores for each skill category';
COMMENT ON COLUMN coach_assessments.ai_feedback IS 'AI-generated feedback based on assessment scores';

-- Verification query
SELECT 
  table_name, 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'coach_assessments'
ORDER BY ordinal_position;

