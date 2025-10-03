-- Migration: Initial Database Schema
-- Version: 001
-- Created: 2025-01-02
-- Description: Create initial database schema for Virtual Event Organizer

-- UP Migration
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'ended');
CREATE TYPE attendee_status AS ENUM ('registered', 'checked-in');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE notification_type AS ENUM ('event_update', 'session_reminder', 'networking_request', 'announcement', 'system');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    company VARCHAR(255),
    job_title VARCHAR(255),
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "networking_enabled": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 10000),
    attendee_count INTEGER DEFAULT 0 CHECK (attendee_count >= 0),
    status event_status DEFAULT 'draft',
    is_public BOOLEAN DEFAULT true,
    registration_open BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    event_url TEXT UNIQUE,
    meeting_link TEXT,
    meeting_password TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_event_dates CHECK (end_date > start_date),
    CONSTRAINT valid_capacity CHECK (attendee_count <= capacity)
);

-- Sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    speaker VARCHAR(255) NOT NULL,
    speaker_bio TEXT,
    speaker_email VARCHAR(255),
    speaker_linkedin TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_type VARCHAR(50) DEFAULT 'presentation',
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    meeting_link TEXT,
    meeting_password TEXT,
    materials_url TEXT,
    recording_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_session_times CHECK (end_time > start_time),
    CONSTRAINT valid_session_capacity CHECK (current_attendees <= COALESCE(max_attendees, 999999))
);

-- Event attendees (many-to-many relationship)
CREATE TABLE public.event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status attendee_status DEFAULT 'registered',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- Session attendees (many-to-many relationship)
CREATE TABLE public.session_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    attendance_duration INTEGER DEFAULT 0, -- in minutes
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(session_id, user_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    delivery_method VARCHAR(50) DEFAULT 'push', -- push, email, sms
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Networking connections table
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    message TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(requester_id, target_id),
    CONSTRAINT no_self_connection CHECK (requester_id != target_id)
);

-- Messages table (for private messaging between connected users)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, link
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    attachment_size INTEGER,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event analytics table
CREATE TABLE public.event_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(event_id, metric_name, recorded_at)
);

-- Create indexes for performance
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_is_public ON public.events(is_public);
CREATE INDEX idx_events_capacity ON public.events(capacity);
CREATE INDEX idx_events_attendee_count ON public.events(attendee_count);

CREATE INDEX idx_sessions_event_id ON public.sessions(event_id);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX idx_sessions_speaker ON public.sessions(speaker);

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON public.event_attendees(user_id);
CREATE INDEX idx_event_attendees_status ON public.event_attendees(status);

CREATE INDEX idx_session_attendees_session_id ON public.session_attendees(session_id);
CREATE INDEX idx_session_attendees_user_id ON public.session_attendees(user_id);

CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);

CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_target_id ON public.connections(target_id);
CREATE INDEX idx_connections_status ON public.connections(status);

CREATE INDEX idx_messages_connection_id ON public.messages(connection_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

CREATE INDEX idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX idx_event_analytics_metric_name ON public.event_analytics(metric_name);
CREATE INDEX idx_event_analytics_recorded_at ON public.event_analytics(recorded_at);

-- Create full-text search indexes
CREATE INDEX idx_events_search ON public.events USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_sessions_search ON public.sessions USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_users_search ON public.users USING gin(to_tsvector('english', full_name || ' ' || COALESCE(bio, '')));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_attendees_updated_at BEFORE UPDATE ON public.event_attendees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.events 
        SET attendee_count = attendee_count + 1 
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.events 
        SET attendee_count = attendee_count - 1 
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for attendee count
CREATE TRIGGER update_event_attendee_count_trigger
    AFTER INSERT OR DELETE ON public.event_attendees
    FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Create function to update session attendee count
CREATE OR REPLACE FUNCTION update_session_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.sessions 
        SET current_attendees = current_attendees + 1 
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.sessions 
        SET current_attendees = current_attendees - 1 
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for session attendee count
CREATE TRIGGER update_session_attendee_count_trigger
    AFTER INSERT OR DELETE ON public.session_attendees
    FOR EACH ROW EXECUTE FUNCTION update_session_attendee_count();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile and public profiles
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON public.users
    FOR SELECT USING (privacy_settings->>'profile_visible' = 'true');

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view public events" ON public.events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Organizers can view own events" ON public.events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events" ON public.events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Sessions policies
CREATE POLICY "Anyone can view sessions of public events" ON public.sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = sessions.event_id 
            AND events.is_public = true
        )
    );

CREATE POLICY "Event organizers can manage sessions" ON public.sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = sessions.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Event attendees policies
CREATE POLICY "Users can view attendees of public events" ON public.event_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_attendees.event_id 
            AND events.is_public = true
        )
    );

CREATE POLICY "Users can register for public events" ON public.event_attendees
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_attendees.event_id 
            AND events.is_public = true
            AND events.registration_open = true
        )
    );

CREATE POLICY "Users can view own registrations" ON public.event_attendees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view attendees" ON public.event_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_attendees.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Connections policies
CREATE POLICY "Users can view own connections" ON public.connections
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create connection requests" ON public.connections
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own connections" ON public.connections
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Messages policies
CREATE POLICY "Connected users can view messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Connected users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.connections 
            WHERE connections.id = messages.connection_id 
            AND connections.status = 'accepted'
            AND (connections.requester_id = auth.uid() OR connections.target_id = auth.uid())
        )
    );

-- Event analytics policies
CREATE POLICY "Event organizers can view analytics" ON public.event_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_analytics.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "System can create analytics" ON public.event_analytics
    FOR INSERT WITH CHECK (true); -- Allow system to create analytics

-- DOWN Migration
-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
DROP POLICY IF EXISTS "Organizers can view own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view sessions of public events" ON public.sessions;
DROP POLICY IF EXISTS "Event organizers can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view attendees of public events" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can register for public events" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_attendees;
DROP POLICY IF EXISTS "Event organizers can view attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;
DROP POLICY IF EXISTS "Connected users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Connected users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Event organizers can view analytics" ON public.event_analytics;
DROP POLICY IF EXISTS "System can create analytics" ON public.event_analytics;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
DROP TRIGGER IF EXISTS update_event_attendees_updated_at ON public.event_attendees;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
DROP TRIGGER IF EXISTS update_connections_updated_at ON public.connections;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON public.event_attendees;
DROP TRIGGER IF EXISTS update_session_attendee_count_trigger ON public.session_attendees;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_event_attendee_count();
DROP FUNCTION IF EXISTS update_session_attendee_count();

-- Drop indexes
DROP INDEX IF EXISTS idx_events_organizer_id;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_is_public;
DROP INDEX IF EXISTS idx_events_capacity;
DROP INDEX IF EXISTS idx_events_attendee_count;
DROP INDEX IF EXISTS idx_sessions_event_id;
DROP INDEX IF EXISTS idx_sessions_start_time;
DROP INDEX IF EXISTS idx_sessions_speaker;
DROP INDEX IF EXISTS idx_event_attendees_event_id;
DROP INDEX IF EXISTS idx_event_attendees_user_id;
DROP INDEX IF EXISTS idx_event_attendees_status;
DROP INDEX IF EXISTS idx_session_attendees_session_id;
DROP INDEX IF EXISTS idx_session_attendees_user_id;
DROP INDEX IF EXISTS idx_notifications_recipient_id;
DROP INDEX IF EXISTS idx_notifications_event_id;
DROP INDEX IF EXISTS idx_notifications_status;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_scheduled_for;
DROP INDEX IF EXISTS idx_connections_requester_id;
DROP INDEX IF EXISTS idx_connections_target_id;
DROP INDEX IF EXISTS idx_connections_status;
DROP INDEX IF EXISTS idx_messages_connection_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_recipient_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_event_analytics_event_id;
DROP INDEX IF EXISTS idx_event_analytics_metric_name;
DROP INDEX IF EXISTS idx_event_analytics_recorded_at;
DROP INDEX IF EXISTS idx_events_search;
DROP INDEX IF EXISTS idx_sessions_search;
DROP INDEX IF EXISTS idx_users_search;

-- Drop tables
DROP TABLE IF EXISTS public.event_analytics;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.connections;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.session_attendees;
DROP TABLE IF EXISTS public.event_attendees;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.users;

-- Drop custom types
DROP TYPE IF EXISTS notification_status;
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS connection_status;
DROP TYPE IF EXISTS attendee_status;
DROP TYPE IF EXISTS event_status;
