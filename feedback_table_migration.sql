-- Create feedback table to store user feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rating (1-5 stars)
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  
  -- Multiple choice selections
  selected_options JSONB DEFAULT '[]', -- Array of selected options like ["Fun drills", "Challenging enough"]
  
  -- Text feedback
  what_you_like TEXT, -- "What do you like the most?"
  what_to_add TEXT,   -- "What shall we add to make it better for you?"
  
  -- Metadata
  app_version TEXT, -- Could be useful for tracking feedback across versions
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Create index for performance
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_rating ON feedback(rating);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
BEFORE UPDATE ON feedback 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
