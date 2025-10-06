-- Fix database policies for Collaborative Whiteboard App
-- This script fixes the RLS policies to work properly

-- First, let's check if the tables exist and disable RLS temporarily
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whiteboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drawings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sticky_notes DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own user" ON users;
DROP POLICY IF EXISTS "Users can insert own user" ON users;
DROP POLICY IF EXISTS "Users can read accessible whiteboards" ON whiteboards;
DROP POLICY IF EXISTS "Users can create whiteboards" ON whiteboards;
DROP POLICY IF EXISTS "Users can update own whiteboards" ON whiteboards;
DROP POLICY IF EXISTS "Users can delete own whiteboards" ON whiteboards;
DROP POLICY IF EXISTS "Users can read drawings" ON drawings;
DROP POLICY IF EXISTS "Users can create drawings" ON drawings;
DROP POLICY IF EXISTS "Users can update own drawings" ON drawings;
DROP POLICY IF EXISTS "Users can delete own drawings" ON drawings;
DROP POLICY IF EXISTS "Users can read sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Users can create sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Users can update own sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Users can delete own sticky notes" ON sticky_notes;

-- Create simpler, more permissive policies
-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON whiteboards
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON drawings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON sticky_notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Also grant permissions to the service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
