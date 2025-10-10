-- Video Conference Database Schema
-- PostgreSQL schema with proper relationships, indexes, and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text extension
CREATE EXTENSION IF NOT EXISTS "citext";

-- User table for authentication
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT user_email_valid CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT user_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT user_password_hash_length CHECK (char_length(password_hash) >= 60)
);

-- Create custom types
CREATE TYPE participant_connection_state AS ENUM (
    'connecting',
    'connected', 
    'disconnected',
    'reconnecting'
);

CREATE TYPE message_type AS ENUM (
    'text',
    'system',
    'notification'
);

CREATE TYPE media_permission AS ENUM (
    'camera',
    'microphone', 
    'screen_share'
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_participants INTEGER NOT NULL DEFAULT 50,
    settings JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT rooms_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT rooms_max_participants_positive CHECK (max_participants > 0 AND max_participants <= 1000)
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    is_connected BOOLEAN NOT NULL DEFAULT false,
    connection_state participant_connection_state NOT NULL DEFAULT 'connecting',
    media_permissions JSONB NOT NULL DEFAULT '{"camera": true, "microphone": true, "screen_share": false}',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    webrtc_peer_id VARCHAR(100),
    client_info JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT participants_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
    CONSTRAINT participants_name_format CHECK (name ~ '^[a-zA-Z0-9\s\-_\u00C0-\u017F]+$'),
    CONSTRAINT participants_media_permissions_valid CHECK (
        jsonb_typeof(media_permissions) = 'object' AND
        media_permissions ? 'camera' AND
        media_permissions ? 'microphone' AND
        media_permissions ? 'screen_share' AND
        jsonb_typeof(media_permissions->'camera') = 'boolean' AND
        jsonb_typeof(media_permissions->'microphone') = 'boolean' AND
        jsonb_typeof(media_permissions->'screen_share') = 'boolean'
    )
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    participant_name VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type message_type NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_edited BOOLEAN NOT NULL DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT messages_message_length CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
    CONSTRAINT messages_participant_name_length CHECK (char_length(participant_name) >= 1 AND char_length(participant_name) <= 50),
    CONSTRAINT messages_edited_at_consistency CHECK (
        (is_edited = false AND edited_at IS NULL) OR
        (is_edited = true AND edited_at IS NOT NULL AND edited_at >= created_at)
    )
);

-- Room sessions table (for tracking room activity)
CREATE TABLE room_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    participant_count INTEGER NOT NULL DEFAULT 0,
    total_messages INTEGER NOT NULL DEFAULT 0,
    session_data JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT room_sessions_ended_after_started CHECK (
        ended_at IS NULL OR ended_at >= started_at
    ),
    CONSTRAINT room_sessions_participant_count_non_negative CHECK (participant_count >= 0),
    CONSTRAINT room_sessions_total_messages_non_negative CHECK (total_messages >= 0)
);

-- Media state changes table (for tracking media permission changes)
CREATE TABLE media_state_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    permission_type media_permission NOT NULL,
    old_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reason VARCHAR(100),
    
    -- Constraints
    CONSTRAINT media_state_changes_value_changed CHECK (old_value != new_value)
);

-- WebRTC connections table (for tracking peer connections)
CREATE TABLE webrtc_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    from_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    to_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    connection_state VARCHAR(20) NOT NULL DEFAULT 'connecting',
    established_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    connection_data JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT webrtc_connections_different_participants CHECK (from_participant_id != to_participant_id),
    CONSTRAINT webrtc_connections_closed_after_established CHECK (
        closed_at IS NULL OR established_at IS NULL OR closed_at >= established_at
    ),
    CONSTRAINT webrtc_connections_state_valid CHECK (
        connection_state IN ('connecting', 'connected', 'failed', 'closed')
    )
);

-- Create indexes for performance

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON users(last_login);

-- Rooms indexes
CREATE INDEX idx_rooms_created_at ON rooms(created_at);
CREATE INDEX idx_rooms_is_active ON rooms(is_active) WHERE is_active = true;
CREATE INDEX idx_rooms_updated_at ON rooms(updated_at);

-- Participants indexes
CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_participants_is_connected ON participants(is_connected);
CREATE INDEX idx_participants_connection_state ON participants(connection_state);
CREATE INDEX idx_participants_joined_at ON participants(joined_at);
CREATE INDEX idx_participants_last_seen ON participants(last_seen);
CREATE INDEX idx_participants_room_connected ON participants(room_id, is_connected) WHERE is_connected = true;

-- Messages indexes
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_participant_id ON messages(participant_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_room_created_at ON messages(room_id, created_at);
CREATE INDEX idx_messages_type ON messages(message_type);

-- Room sessions indexes
CREATE INDEX idx_room_sessions_room_id ON room_sessions(room_id);
CREATE INDEX idx_room_sessions_started_at ON room_sessions(started_at);
CREATE INDEX idx_room_sessions_ended_at ON room_sessions(ended_at) WHERE ended_at IS NOT NULL;

-- Media state changes indexes
CREATE INDEX idx_media_state_changes_participant_id ON media_state_changes(participant_id);
CREATE INDEX idx_media_state_changes_changed_at ON media_state_changes(changed_at);
CREATE INDEX idx_media_state_changes_permission_type ON media_state_changes(permission_type);

-- WebRTC connections indexes
CREATE INDEX idx_webrtc_connections_room_id ON webrtc_connections(room_id);
CREATE INDEX idx_webrtc_connections_from_participant ON webrtc_connections(from_participant_id);
CREATE INDEX idx_webrtc_connections_to_participant ON webrtc_connections(to_participant_id);
CREATE INDEX idx_webrtc_connections_state ON webrtc_connections(connection_state);
CREATE INDEX idx_webrtc_connections_established_at ON webrtc_connections(established_at);

-- Create composite indexes for common queries
CREATE INDEX idx_participants_room_connection_state ON participants(room_id, connection_state);
CREATE INDEX idx_messages_room_type_created ON messages(room_id, message_type, created_at);
CREATE INDEX idx_webrtc_connections_room_state ON webrtc_connections(room_id, connection_state);

-- Create partial indexes for active data
CREATE INDEX idx_rooms_active ON rooms(id) WHERE is_active = true;
CREATE INDEX idx_participants_connected ON participants(id, room_id) WHERE is_connected = true;

-- Create functions for common operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_room_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rooms 
        SET updated_at = NOW() 
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.room_id != NEW.room_id THEN
            UPDATE rooms SET updated_at = NOW() WHERE id = OLD.room_id;
            UPDATE rooms SET updated_at = NOW() WHERE id = NEW.room_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE rooms 
        SET updated_at = NOW() 
        WHERE id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old disconnected participants (older than 1 hour)
    DELETE FROM participants 
    WHERE is_connected = false 
    AND last_seen < NOW() - INTERVAL '1 hour';
    
    -- Delete old messages (older than 30 days)
    DELETE FROM messages 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old room sessions (older than 7 days)
    DELETE FROM room_sessions 
    WHERE ended_at IS NOT NULL 
    AND ended_at < NOW() - INTERVAL '7 days';
    
    -- Delete old media state changes (older than 7 days)
    DELETE FROM media_state_changes 
    WHERE changed_at < NOW() - INTERVAL '7 days';
    
    -- Delete old WebRTC connections (older than 1 day)
    DELETE FROM webrtc_connections 
    WHERE closed_at IS NOT NULL 
    AND closed_at < NOW() - INTERVAL '1 day';
END;
$$ language 'plpgsql';

-- Create triggers

-- Update updated_at on rooms
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update participant count and room updated_at
CREATE TRIGGER update_room_on_participant_change
    AFTER INSERT OR UPDATE OR DELETE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_room_participant_count();

-- Update last_seen when participant connects/disconnects
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.is_connected != NEW.is_connected THEN
        NEW.last_seen = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_participant_last_seen_trigger
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_last_seen();

-- Create views for common queries

-- Active rooms with participant count
CREATE VIEW active_rooms AS
SELECT 
    r.id,
    r.name,
    r.created_at,
    r.max_participants,
    COUNT(p.id) as participant_count,
    r.updated_at
FROM rooms r
LEFT JOIN participants p ON r.id = p.room_id AND p.is_connected = true
WHERE r.is_active = true
GROUP BY r.id, r.name, r.created_at, r.max_participants, r.updated_at;

-- Room participants with connection info
CREATE VIEW room_participants AS
SELECT 
    p.id as participant_id,
    p.room_id,
    p.name,
    p.is_connected,
    p.connection_state,
    p.media_permissions,
    p.joined_at,
    p.last_seen,
    r.name as room_name
FROM participants p
JOIN rooms r ON p.room_id = r.id
WHERE r.is_active = true;

-- Recent messages with participant info
CREATE VIEW recent_messages AS
SELECT 
    m.id as message_id,
    m.room_id,
    m.participant_id,
    m.participant_name,
    m.message,
    m.message_type,
    m.created_at,
    m.is_edited,
    m.edited_at,
    p.is_connected as participant_connected
FROM messages m
LEFT JOIN participants p ON m.participant_id = p.id
WHERE m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC;

-- Create materialized view for analytics (refreshed periodically)
CREATE MATERIALIZED VIEW room_analytics AS
SELECT 
    r.id as room_id,
    r.name as room_name,
    r.created_at as room_created_at,
    COUNT(DISTINCT p.id) as total_participants,
    COUNT(DISTINCT CASE WHEN p.is_connected = true THEN p.id END) as active_participants,
    COUNT(m.id) as total_messages,
    MAX(m.created_at) as last_message_at,
    AVG(EXTRACT(EPOCH FROM (p.last_seen - p.joined_at))) as avg_session_duration_seconds
FROM rooms r
LEFT JOIN participants p ON r.id = p.room_id
LEFT JOIN messages m ON r.id = m.room_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.created_at;

-- Create index on materialized view
CREATE INDEX idx_room_analytics_room_id ON room_analytics(room_id);
CREATE INDEX idx_room_analytics_created_at ON room_analytics(room_created_at);

-- Grant permissions (adjust as needed for your security requirements)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO videoconference_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO videoconference_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO videoconference_user;

-- Insert initial data (optional)
-- INSERT INTO rooms (name) VALUES ('Welcome Room');
