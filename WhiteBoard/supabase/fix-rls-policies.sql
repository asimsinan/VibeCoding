-- Fix RLS policies for development
-- This script temporarily disables RLS for development purposes

-- Disable RLS on all tables for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE drawings DISABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes DISABLE ROW LEVEL SECURITY;

-- Alternative: Create permissive policies for development
-- Uncomment these if you prefer to keep RLS enabled but make it permissive

-- DROP POLICY IF EXISTS "Users can read all users" ON users;
-- DROP POLICY IF EXISTS "Users can update own user" ON users;
-- DROP POLICY IF EXISTS "Users can insert own user" ON users;
-- DROP POLICY IF EXISTS "Users can read accessible whiteboards" ON whiteboards;
-- DROP POLICY IF EXISTS "Users can create whiteboards" ON whiteboards;
-- DROP POLICY IF EXISTS "Users can update own whiteboards" ON whiteboards;
-- DROP POLICY IF EXISTS "Users can delete own whiteboards" ON whiteboards;
-- DROP POLICY IF EXISTS "Users can read drawings" ON drawings;
-- DROP POLICY IF EXISTS "Users can create drawings" ON drawings;
-- DROP POLICY IF EXISTS "Users can update own drawings" ON drawings;
-- DROP POLICY IF EXISTS "Users can delete own drawings" ON drawings;
-- DROP POLICY IF EXISTS "Users can read sticky notes" ON sticky_notes;
-- DROP POLICY IF EXISTS "Users can create sticky notes" ON sticky_notes;
-- DROP POLICY IF EXISTS "Users can update own sticky notes" ON sticky_notes;
-- DROP POLICY IF EXISTS "Users can delete own sticky notes" ON sticky_notes;

-- -- Create permissive policies for development
-- CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on whiteboards" ON whiteboards FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on drawings" ON drawings FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on sticky_notes" ON sticky_notes FOR ALL USING (true);
