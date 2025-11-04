-- Migration: Add exercise_details JSONB column to logbook_entries table
-- This allows storing detailed exercise information for each logbook entry
-- including exercise name, target, result, routine name, and program name

-- Add the exercise_details column as JSONB to allow flexible storage
ALTER TABLE logbook_entries 
ADD COLUMN IF NOT EXISTS exercise_details JSONB DEFAULT NULL;

-- Add an index for faster queries on exercise_details
CREATE INDEX IF NOT EXISTS idx_logbook_entries_exercise_details 
ON logbook_entries USING gin (exercise_details);

-- Add a comment to document the column
COMMENT ON COLUMN logbook_entries.exercise_details IS 
'JSONB field storing exercise-specific details: {exerciseName, target, result, routineName, programName, notes}';

