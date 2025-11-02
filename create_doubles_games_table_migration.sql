-- Migration: Create doubles_games table for tracking 6-point doubles games
-- Created: 2024

CREATE TABLE IF NOT EXISTS doubles_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Creator
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Game date
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Team A players (JSONB to store player info)
  team_a_players JSONB NOT NULL,
  
  -- Team B players (JSONB to store player info)
  team_b_players JSONB NOT NULL,
  
  -- Scores
  team_a_score INTEGER NOT NULL DEFAULT 0,
  team_b_score INTEGER NOT NULL DEFAULT 0,
  winner TEXT CHECK (winner IN ('A', 'B')) NOT NULL,
  
  -- Points data (array of point objects)
  points JSONB NOT NULL DEFAULT '[]',
  
  -- Game stats
  duration_minutes INTEGER,
  top_player TEXT, -- Slot like 'A1', 'A2', 'B1', 'B2'
  common_mistake TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doubles_games_created_by ON doubles_games(created_by);
CREATE INDEX IF NOT EXISTS idx_doubles_games_date ON doubles_games(date DESC);
CREATE INDEX IF NOT EXISTS idx_doubles_games_created_at ON doubles_games(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE doubles_games ENABLE ROW LEVEL SECURITY;

-- Users can only see their own games
CREATE POLICY "Users can view their own games"
  ON doubles_games
  FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert their own games
CREATE POLICY "Users can insert their own games"
  ON doubles_games
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own games
CREATE POLICY "Users can update their own games"
  ON doubles_games
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own games
CREATE POLICY "Users can delete their own games"
  ON doubles_games
  FOR DELETE
  USING (auth.uid() = created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_doubles_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_doubles_games_updated_at
  BEFORE UPDATE ON doubles_games
  FOR EACH ROW
  EXECUTE FUNCTION update_doubles_games_updated_at();

COMMENT ON TABLE doubles_games IS 'Stores completed 6-point doubles games with detailed point-by-point data';
COMMENT ON COLUMN doubles_games.team_a_players IS 'JSONB object with A1 and A2 player data (name, id, etc.)';
COMMENT ON COLUMN doubles_games.team_b_players IS 'JSONB object with B1 and B2 player data (name, id, etc.)';
COMMENT ON COLUMN doubles_games.points IS 'JSONB array of point objects with winner, pointMaker, errorMaker, shotType, etc.';

