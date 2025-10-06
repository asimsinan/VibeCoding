-- Initial database schema for Collaborative Whiteboard App
-- Creates all necessary tables, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name VARCHAR(50) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_position JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whiteboards table
CREATE TABLE IF NOT EXISTS whiteboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    settings JSONB DEFAULT '{"width": 1920, "height": 1080, "backgroundColor": "#FFFFFF"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create drawings table
CREATE TABLE IF NOT EXISTS drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whiteboard_id UUID NOT NULL REFERENCES whiteboards(id) ON DELETE CASCADE,
    tool VARCHAR(20) NOT NULL CHECK (tool IN ('pen', 'brush', 'eraser')),
    color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    size INTEGER NOT NULL CHECK (size >= 1 AND size <= 50),
    points JSONB NOT NULL CHECK (jsonb_array_length(points) > 0),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sticky_notes table
CREATE TABLE IF NOT EXISTS sticky_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whiteboard_id UUID NOT NULL REFERENCES whiteboards(id) ON DELETE CASCADE,
    content VARCHAR(500) NOT NULL,
    position JSONB NOT NULL CHECK (position ? 'x' AND position ? 'y'),
    color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whiteboards_created_by ON whiteboards(created_by);
CREATE INDEX IF NOT EXISTS idx_whiteboards_created_at ON whiteboards(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drawings_whiteboard_id ON drawings(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_drawings_user_id ON drawings(user_id);
CREATE INDEX IF NOT EXISTS idx_drawings_created_at ON drawings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sticky_notes_whiteboard_id ON sticky_notes(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user_id ON sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON sticky_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_whiteboards_updated_at 
    BEFORE UPDATE ON whiteboards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sticky_notes_updated_at 
    BEFORE UPDATE ON sticky_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read all users (for presence)
CREATE POLICY "Users can read all users" ON users
    FOR SELECT USING (true);

-- Users can update their own user record
CREATE POLICY "Users can update own user" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own user record
CREATE POLICY "Users can insert own user" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Users can read whiteboards they have access to
CREATE POLICY "Users can read accessible whiteboards" ON whiteboards
    FOR SELECT USING (true);

-- Users can create whiteboards
CREATE POLICY "Users can create whiteboards" ON whiteboards
    FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

-- Users can update whiteboards they created
CREATE POLICY "Users can update own whiteboards" ON whiteboards
    FOR UPDATE USING (auth.uid()::text = created_by::text);

-- Users can delete whiteboards they created
CREATE POLICY "Users can delete own whiteboards" ON whiteboards
    FOR DELETE USING (auth.uid()::text = created_by::text);

-- Users can read drawings for accessible whiteboards
CREATE POLICY "Users can read drawings" ON drawings
    FOR SELECT USING (true);

-- Users can create drawings
CREATE POLICY "Users can create drawings" ON drawings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own drawings
CREATE POLICY "Users can update own drawings" ON drawings
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own drawings
CREATE POLICY "Users can delete own drawings" ON drawings
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Users can read sticky notes for accessible whiteboards
CREATE POLICY "Users can read sticky notes" ON sticky_notes
    FOR SELECT USING (true);

-- Users can create sticky notes
CREATE POLICY "Users can create sticky notes" ON sticky_notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own sticky notes
CREATE POLICY "Users can update own sticky notes" ON sticky_notes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own sticky notes
CREATE POLICY "Users can delete own sticky notes" ON sticky_notes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create function to get active users
CREATE OR REPLACE FUNCTION get_active_users(whiteboard_uuid UUID)
RETURNS TABLE (
    id UUID,
    display_name VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    cursor_position JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.display_name,
        u.last_seen,
        u.cursor_position
    FROM users u
    WHERE u.last_seen > NOW() - INTERVAL '5 minutes'
    ORDER BY u.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clear whiteboard
CREATE OR REPLACE FUNCTION clear_whiteboard(whiteboard_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete all drawings for the whiteboard
    DELETE FROM drawings WHERE whiteboard_id = whiteboard_uuid;
    
    -- Delete all sticky notes for the whiteboard
    DELETE FROM sticky_notes WHERE whiteboard_id = whiteboard_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
