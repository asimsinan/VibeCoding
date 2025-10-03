-- Supabase RLS Policies for Virtual Event Organizer
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on all tables (only if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendees') THEN
        ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
        ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public events" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Anyone can view sessions of public events" ON sessions;
DROP POLICY IF EXISTS "Event organizers can manage sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view attendees of events they organize" ON attendees;
DROP POLICY IF EXISTS "Users can register for events" ON attendees;
DROP POLICY IF EXISTS "Users can update their own attendance" ON attendees;
DROP POLICY IF EXISTS "Users can view messages in events they're attending" ON messages;
DROP POLICY IF EXISTS "Users can send messages to events they're attending" ON messages;
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON connections;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Users table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE POLICY "Users can view their own profile" ON users
            FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update their own profile" ON users
            FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can insert their own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Events table policies
CREATE POLICY "Anyone can view public events" ON events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Sessions table policies
CREATE POLICY "Anyone can view sessions of public events" ON sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = sessions.event_id 
            AND events.is_public = true
        )
    );

CREATE POLICY "Event organizers can manage sessions" ON sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = sessions.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Attendees table policies
CREATE POLICY "Users can view attendees of events they organize" ON attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = attendees.event_id 
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can register for events" ON attendees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON attendees
    FOR UPDATE USING (auth.uid() = user_id);

-- Messages table policies (assuming messages table has different structure)
-- Check your actual messages table schema and adjust accordingly
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Connections table policies
CREATE POLICY "Users can view their own connections" ON connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections" ON connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON connections
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
