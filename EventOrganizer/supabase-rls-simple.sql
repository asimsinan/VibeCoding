-- Simplified Supabase RLS Policies for Virtual Event Organizer
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on essential tables only
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public events" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Events table policies (most important for the app)
CREATE POLICY "Anyone can view public events" ON events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
