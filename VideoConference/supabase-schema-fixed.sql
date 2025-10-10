-- Video Conferencing Database Schema for Supabase (Fixed Version)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- User table (singular to avoid conflicts)
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES "user"(id) ON DELETE CASCADE,
    max_participants INTEGER DEFAULT 10,
    settings JSONB DEFAULT '{"allowChat": true, "allowScreenShare": true, "allowRecording": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    media_permissions JSONB DEFAULT '{"camera": true, "microphone": true, "screen_share": false}',
    is_connected BOOLEAN DEFAULT true,
    connection_state VARCHAR(20) DEFAULT 'connected',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
CREATE INDEX idx_rooms_active ON rooms(is_active);
CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_connected ON participants(is_connected);
CREATE INDEX idx_participants_room_user ON participants(room_id, user_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_participant_id ON messages(participant_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Unique constraint to prevent duplicate connections
CREATE UNIQUE INDEX idx_participants_room_user_connected 
ON participants(room_id, user_id) 
WHERE is_connected = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_seen timestamp for participants
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update last_seen on participant updates
CREATE TRIGGER update_participant_last_seen_trigger 
BEFORE UPDATE ON participants
FOR EACH ROW EXECUTE FUNCTION update_participant_last_seen();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."user" (id, email, name, password_hash)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'password_hash');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Row Level Security (RLS) Policies
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- User can read their own data
CREATE POLICY "User can read own data" ON "user"
    FOR SELECT USING (auth.uid() = id);

-- User can update their own data
CREATE POLICY "User can update own data" ON "user"
    FOR UPDATE USING (auth.uid() = id);

-- Users can read rooms they created or are participants in
CREATE POLICY "Users can read accessible rooms" ON rooms
    FOR SELECT USING (
        created_by = auth.uid() OR 
        id IN (
            SELECT room_id FROM participants 
            WHERE user_id = auth.uid() AND is_connected = true
        )
    );

-- Users can create rooms
CREATE POLICY "Users can create rooms" ON rooms
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update rooms they created
CREATE POLICY "Users can update own rooms" ON rooms
    FOR UPDATE USING (created_by = auth.uid());

-- Users can read participants in rooms they have access to
CREATE POLICY "Users can read room participants" ON participants
    FOR SELECT USING (
        room_id IN (
            SELECT id FROM rooms 
            WHERE created_by = auth.uid() OR 
            id IN (
                SELECT room_id FROM participants 
                WHERE user_id = auth.uid() AND is_connected = true
            )
        )
    );

-- Users can insert themselves as participants
CREATE POLICY "Users can join rooms" ON participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participant data
CREATE POLICY "Users can update own participant data" ON participants
    FOR UPDATE USING (user_id = auth.uid());

-- Users can read messages in rooms they have access to
CREATE POLICY "Users can read room messages" ON messages
    FOR SELECT USING (
        room_id IN (
            SELECT id FROM rooms 
            WHERE created_by = auth.uid() OR 
            id IN (
                SELECT room_id FROM participants 
                WHERE user_id = auth.uid() AND is_connected = true
            )
        )
    );

-- Users can send messages in rooms they are participants in
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        participant_id IN (
            SELECT id FROM participants 
            WHERE user_id = auth.uid() AND is_connected = true
        )
    );

-- Create a view for active rooms with participant count
CREATE OR REPLACE VIEW active_rooms AS
SELECT 
    r.*,
    COUNT(p.id) as participant_count
FROM rooms r
LEFT JOIN participants p ON r.id = p.room_id AND p.is_connected = true
WHERE r.is_active = true
GROUP BY r.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
