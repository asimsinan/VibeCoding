-- Initial Database Schema Migration
-- Version: 1
-- Description: Create initial tables for mood tracking application

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encrypted_data TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    UNIQUE(user_id, date)
);

-- Create indexes for mood_entries
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date 
ON mood_entries(user_id, date);

CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at 
ON mood_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_mood_entries_rating 
ON mood_entries(rating);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    encrypted_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Create sync_queue table for data synchronization
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for sync_queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status 
ON sync_queue(user_id, status);

CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at 
ON sync_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_operation 
ON sync_queue(operation);

-- Create schema_migrations table for tracking migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE mood_entries IS 'Stores encrypted mood tracking entries for users';
COMMENT ON TABLE user_settings IS 'Stores encrypted user preferences and settings';
COMMENT ON TABLE sync_queue IS 'Queue for synchronizing data between local and cloud storage';
COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations';

COMMENT ON COLUMN mood_entries.rating IS 'Mood rating on scale of 1-10';
COMMENT ON COLUMN mood_entries.encrypted_data IS 'Encrypted mood entry data including notes';
COMMENT ON COLUMN user_settings.encrypted_data IS 'Encrypted user settings and preferences';
COMMENT ON COLUMN sync_queue.operation IS 'Type of operation: create, update, or delete';
COMMENT ON COLUMN sync_queue.status IS 'Current status of sync operation';
