-- Updated Supabase RLS Policies for Virtual Event Organizer
-- Run these commands in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can create user profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public events" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- Users table policies (more permissive for demo)
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Events table policies (more permissive for demo)
CREATE POLICY "Anyone can view public events" ON events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Anyone can create events" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
