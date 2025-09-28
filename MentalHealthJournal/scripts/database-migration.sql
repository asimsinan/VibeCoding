-- Database Migration Script for Mental Health Journal App
-- PostgreSQL Database Schema

-- Create database if it doesn't exist
-- CREATE DATABASE moodtracker_prod;

-- Connect to the database
-- \c moodtracker_prod;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived')),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one mood entry per user per day
    UNIQUE(user_id, date)
);

-- Create mood_trends table
CREATE TABLE IF NOT EXISTS mood_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL CHECK (period IN ('week', 'month', 'quarter', 'year')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    statistics JSONB NOT NULL DEFAULT '{}',
    data_points JSONB NOT NULL DEFAULT '[]',
    insights TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sync_queue table for offline sync
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_mood_entries_status ON mood_entries(status);

CREATE INDEX IF NOT EXISTS idx_mood_trends_user_id ON mood_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_trends_period ON mood_trends(period);
CREATE INDEX IF NOT EXISTS idx_mood_trends_date_range ON mood_trends(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at 
    BEFORE UPDATE ON mood_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate mood statistics
CREATE OR REPLACE FUNCTION calculate_mood_statistics(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_entries INTEGER;
    avg_rating NUMERIC;
    min_rating INTEGER;
    max_rating INTEGER;
    variance NUMERIC;
    completion_rate NUMERIC;
    days_in_period INTEGER;
BEGIN
    -- Calculate basic statistics
    SELECT 
        COUNT(*),
        AVG(rating),
        MIN(rating),
        MAX(rating),
        VARIANCE(rating)
    INTO total_entries, avg_rating, min_rating, max_rating, variance
    FROM mood_entries 
    WHERE user_id = p_user_id 
    AND date BETWEEN p_start_date AND p_end_date
    AND status = 'active';
    
    -- Calculate completion rate
    days_in_period := p_end_date - p_start_date + 1;
    completion_rate := CASE 
        WHEN days_in_period > 0 THEN total_entries::NUMERIC / days_in_period
        ELSE 0 
    END;
    
    -- Build result JSON
    result := jsonb_build_object(
        'totalEntries', COALESCE(total_entries, 0),
        'averageMood', COALESCE(avg_rating, 0),
        'lowestMood', COALESCE(min_rating, 0),
        'highestMood', COALESCE(max_rating, 0),
        'moodVariance', COALESCE(variance, 0),
        'completionRate', COALESCE(completion_rate, 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get mood trend direction
CREATE OR REPLACE FUNCTION get_mood_trend_direction(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS VARCHAR(20) AS $$
DECLARE
    first_half_avg NUMERIC;
    second_half_avg NUMERIC;
    trend_direction VARCHAR(20);
BEGIN
    -- Calculate average for first half of period
    SELECT AVG(rating) INTO first_half_avg
    FROM mood_entries 
    WHERE user_id = p_user_id 
    AND date BETWEEN p_start_date AND p_start_date + (p_end_date - p_start_date) / 2
    AND status = 'active';
    
    -- Calculate average for second half of period
    SELECT AVG(rating) INTO second_half_avg
    FROM mood_entries 
    WHERE user_id = p_user_id 
    AND date BETWEEN p_start_date + (p_end_date - p_start_date) / 2 + 1 AND p_end_date
    AND status = 'active';
    
    -- Determine trend direction
    IF first_half_avg IS NULL OR second_half_avg IS NULL THEN
        trend_direction := 'stable';
    ELSIF second_half_avg > first_half_avg + 0.5 THEN
        trend_direction := 'improving';
    ELSIF second_half_avg < first_half_avg - 0.5 THEN
        trend_direction := 'declining';
    ELSE
        trend_direction := 'stable';
    END IF;
    
    RETURN trend_direction;
END;
$$ LANGUAGE plpgsql;

-- Insert default user for testing
INSERT INTO users (id, email, username, preferences) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'test@moodtracker.app',
    'testuser',
    '{
        "theme": "light",
        "language": "en",
        "timezone": "UTC",
        "dateFormat": "YYYY-MM-DD",
        "weekStartsOn": 1,
        "defaultChartPeriod": "month",
        "enableNotifications": true,
        "notificationTime": "09:00",
        "dataRetentionDays": 365,
        "exportFormat": "json"
    }'
) ON CONFLICT (id) DO NOTHING;

-- Create view for mood statistics
CREATE OR REPLACE VIEW mood_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(me.id) as total_entries,
    AVG(me.rating) as average_rating,
    MIN(me.rating) as lowest_rating,
    MAX(me.rating) as highest_rating,
    VARIANCE(me.rating) as mood_variance,
    COUNT(me.id) FILTER (WHERE me.date >= CURRENT_DATE - INTERVAL '30 days') as entries_last_30_days,
    COUNT(me.id) FILTER (WHERE me.notes IS NOT NULL AND me.notes != '') as entries_with_notes
FROM users u
LEFT JOIN mood_entries me ON u.id = me.user_id AND me.status = 'active'
GROUP BY u.id, u.username;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO moodtracker_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO moodtracker_user;

COMMIT;
