-- =====================================================
-- ADD COACH PROGRAM ONLY FLAG MIGRATION
-- Adds a flag to differentiate coach-only programs from student programs
-- =====================================================

-- Add is_coach_program column to programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_coach_program BOOLEAN DEFAULT FALSE;

-- Add comment to document the field
COMMENT ON COLUMN programs.is_coach_program IS 'When true, this program is only visible/usable by coaches. Used to separate coach content from student content.';

-- Create index for filtering coach programs
CREATE INDEX IF NOT EXISTS idx_programs_is_coach_program ON programs(is_coach_program);

