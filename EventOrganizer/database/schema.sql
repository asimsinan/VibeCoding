-- Virtual Event Organizer Database Schema
-- This file contains all the necessary tables, relationships, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('organizer', 'attendee', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE attendee_status AS ENUM ('registered', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE notification_type AS ENUM ('announcement', 'schedule_change', 'networking', 'system');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'attendee',
    company VARCHAR(255),
    job_title VARCHAR(255),
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "contact_visible": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    capacity INTEGER DEFAULT 100,
    current_attendees INTEGER DEFAULT 0,
    status event_status DEFAULT 'draft',
    is_public BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    event_url TEXT,
    meeting_room_url TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    speaker VARCHAR(255) NOT NULL,
    speaker_bio TEXT,
    speaker_email VARCHAR(255),
    speaker_linkedin TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status session_status DEFAULT 'scheduled',
    room_url TEXT,
    recording_url TEXT,
    slides_url TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendees table
CREATE TABLE public.attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
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
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    attendee_id UUID REFERENCES public.attendees(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, attendee_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Networking connections table
CREATE TABLE public.connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, recipient_id, event_id)
);

-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type message_type DEFAULT 'text',
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event analytics table
CREATE TABLE public.event_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_data JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, metric_name, recorded_at)
);

-- Create indexes for better performance
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_is_public ON public.events(is_public);

CREATE INDEX idx_sessions_event_id ON public.sessions(event_id);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX idx_sessions_status ON public.sessions(status);

CREATE INDEX idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX idx_attendees_user_id ON public.attendees(user_id);
CREATE INDEX idx_attendees_status ON public.attendees(status);

CREATE INDEX idx_session_attendees_session_id ON public.session_attendees(session_id);
CREATE INDEX idx_session_attendees_attendee_id ON public.session_attendees(attendee_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_recipient_id ON public.connections(recipient_id);
CREATE INDEX idx_connections_event_id ON public.connections(event_id);
CREATE INDEX idx_connections_status ON public.connections(status);

CREATE INDEX idx_messages_connection_id ON public.messages(connection_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);

CREATE INDEX idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX idx_event_analytics_metric_name ON public.event_analytics(metric_name);
CREATE INDEX idx_event_analytics_recorded_at ON public.event_analytics(recorded_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON public.attendees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are visible to authenticated users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated' AND privacy_settings->>'profile_visible' = 'true');

-- Events policies
CREATE POLICY "Anyone can view public events" ON public.events
    FOR SELECT USING (is_public = true AND status IN ('published', 'live'));

CREATE POLICY "Organizers can view their own events" ON public.events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events" ON public.events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Sessions policies
CREATE POLICY "Anyone can view sessions of public events" ON public.sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = sessions.event_id 
            AND events.is_public = true 
            AND events.status IN ('published', 'live')
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

-- Attendees policies
CREATE POLICY "Users can view attendees of events they're registered for" ON public.attendees
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = attendees.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can register for events" ON public.attendees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON public.attendees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can manage attendees" ON public.attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = attendees.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Session attendees policies
CREATE POLICY "Users can view session attendees for their events" ON public.session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.attendees 
            WHERE attendees.id = session_attendees.attendee_id 
            AND attendees.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.sessions 
            JOIN public.events ON events.id = sessions.event_id
            WHERE sessions.id = session_attendees.session_id 
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can join sessions for their events" ON public.session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendees 
            WHERE attendees.id = session_attendees.attendee_id 
            AND attendees.user_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- This will be restricted by application logic

-- Connections policies
CREATE POLICY "Users can view their own connections" ON public.connections
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON public.connections
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they're involved in" ON public.connections
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Messages policies
CREATE POLICY "Users can view messages in their connections" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.connections 
            WHERE connections.id = messages.connection_id 
            AND (connections.requester_id = auth.uid() OR connections.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their connections" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.connections 
            WHERE connections.id = messages.connection_id 
            AND (connections.requester_id = auth.uid() OR connections.recipient_id = auth.uid())
            AND connections.status = 'accepted'
        )
    );

-- Event analytics policies
CREATE POLICY "Event organizers can view their event analytics" ON public.event_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_analytics.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "System can create analytics data" ON public.event_analytics
    FOR INSERT WITH CHECK (true); -- This will be restricted by application logic

-- Create functions for common operations

-- Function to update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.events 
        SET current_attendees = current_attendees + 1
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.events 
        SET current_attendees = current_attendees - 1
        WHERE id = OLD.event_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes that might affect count
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'registered' AND OLD.status != 'registered' THEN
                UPDATE public.events 
                SET current_attendees = current_attendees + 1
                WHERE id = NEW.event_id;
            ELSIF OLD.status = 'registered' AND NEW.status != 'registered' THEN
                UPDATE public.events 
                SET current_attendees = current_attendees - 1
                WHERE id = NEW.event_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for attendee count
CREATE TRIGGER update_event_attendee_count_trigger
    AFTER INSERT OR DELETE OR UPDATE ON public.attendees
    FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Function to update session attendee count
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

-- Sample data will be inserted through the application after user registration
-- This ensures proper foreign key relationships with auth.users table
