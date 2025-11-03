-- Fix RLS policy to safely handle invalid UUIDs in player data
-- This prevents errors when games have non-UUID player IDs (like test data with "2", "3", etc.)

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view games they participated in" ON doubles_games;

-- Create a helper function to safely check if a JSONB value is a valid UUID matching auth.uid()
CREATE OR REPLACE FUNCTION is_valid_uuid_match(player_data JSONB, auth_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if player_data exists and has an 'id' field
  IF player_data IS NULL OR player_data->>'id' IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Try to cast to UUID and compare, catch any errors
  BEGIN
    RETURN (player_data->>'id')::uuid = auth_uuid;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (invalid UUID format), return false
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create the updated policy using the safe function
CREATE POLICY "Users can view games they participated in"
  ON doubles_games
  FOR SELECT
  USING (
    auth.uid() = created_by 
    OR 
    (
      is_valid_uuid_match(team_a_players->'A1', auth.uid())
      OR
      is_valid_uuid_match(team_a_players->'A2', auth.uid())
      OR
      is_valid_uuid_match(team_b_players->'B1', auth.uid())
      OR
      is_valid_uuid_match(team_b_players->'B2', auth.uid())
    )
  );

COMMENT ON POLICY "Users can view games they participated in" ON doubles_games IS 
'Allows users to view games they created or participated in as a player. Safely handles invalid UUID formats in player data.';

COMMENT ON FUNCTION is_valid_uuid_match(JSONB, UUID) IS 
'Safely checks if a player JSONB object has a valid UUID id that matches the given UUID, returning false for invalid UUIDs instead of throwing errors.';

