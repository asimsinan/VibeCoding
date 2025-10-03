-- User Presence and Activity Tables for Virtual Event Organizer
-- Run these commands in your Supabase SQL Editor

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('active', 'idle', 'away', 'offline')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('join', 'leave', 'message', 'update', 'view', 'interact')),
  message TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_presence_event_id ON user_presence(event_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

CREATE INDEX IF NOT EXISTS idx_user_activities_event_id ON user_activities(event_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(type);

-- Enable Row Level Security
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
DROP POLICY IF EXISTS "Anyone can view online presence" ON user_presence;

DROP POLICY IF EXISTS "Users can view activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;

-- User Presence Policies
CREATE POLICY "Users can view their own presence" ON user_presence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view online presence" ON user_presence
  FOR SELECT USING (is_online = true);

-- User Activities Policies
CREATE POLICY "Users can view activities" ON user_activities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for user_presence
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence;
CREATE TRIGGER update_user_presence_updated_at
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO user_presence (user_id, event_id, is_online, status, last_seen) VALUES
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM events LIMIT 1), true, 'active', NOW()),
  ('00000000-0000-0000-0000-000000000002', (SELECT id FROM events LIMIT 1), true, 'idle', NOW() - INTERVAL '2 minutes'),
  ('00000000-0000-0000-0000-000000000003', (SELECT id FROM events LIMIT 1), false, 'offline', NOW() - INTERVAL '10 minutes')
ON CONFLICT (user_id, event_id) DO NOTHING;

INSERT INTO user_activities (user_id, event_id, type, message, timestamp) VALUES
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM events LIMIT 1), 'join', 'User joined the event', NOW() - INTERVAL '5 minutes'),
  ('00000000-0000-0000-0000-000000000002', (SELECT id FROM events LIMIT 1), 'join', 'User joined the event', NOW() - INTERVAL '3 minutes'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM events LIMIT 1), 'message', 'Hello everyone!', NOW() - INTERVAL '2 minutes'),
  ('00000000-0000-0000-0000-000000000002', (SELECT id FROM events LIMIT 1), 'update', 'User status changed to idle', NOW() - INTERVAL '1 minute')
ON CONFLICT DO NOTHING;
