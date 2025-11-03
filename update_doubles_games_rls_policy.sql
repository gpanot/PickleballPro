-- Update RLS policy to allow players to view games they participated in
-- This should be run after the initial doubles_games table migration

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their own games" ON doubles_games;

-- Create a new policy that allows users to see:
-- 1. Games they created, OR
-- 2. Games where they are a player in team_a_players or team_b_players (JSONB)
CREATE POLICY "Users can view games they participated in"
  ON doubles_games
  FOR SELECT
  USING (
    auth.uid() = created_by 
    OR 
    (
      (team_a_players->>'A1' IS NOT NULL AND (team_a_players->'A1'->>'id')::uuid = auth.uid())
      OR
      (team_a_players->>'A2' IS NOT NULL AND (team_a_players->'A2'->>'id')::uuid = auth.uid())
      OR
      (team_b_players->>'B1' IS NOT NULL AND (team_b_players->'B1'->>'id')::uuid = auth.uid())
      OR
      (team_b_players->>'B2' IS NOT NULL AND (team_b_players->'B2'->>'id')::uuid = auth.uid())
    )
  );

COMMENT ON POLICY "Users can view games they participated in" ON doubles_games IS 
'Allows users to view games they created or participated in as a player';

