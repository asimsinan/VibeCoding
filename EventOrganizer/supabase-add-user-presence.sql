-- Add user_presence table for real-time presence tracking
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'away', -- active, idle, away
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_event_id ON public.user_presence(event_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON public.user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_presence (drop existing first)
-- Allow authenticated users to read presence for events they have access to
DROP POLICY IF EXISTS "Allow authenticated users to read user presence" ON public.user_presence;
CREATE POLICY "Allow authenticated users to read user presence" ON public.user_presence
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = user_presence.event_id 
            AND (events.is_public = true OR events.organizer_id = auth.uid())
        )
    );

-- Allow authenticated users to insert/update their own presence
DROP POLICY IF EXISTS "Allow users to manage their own presence" ON public.user_presence;
CREATE POLICY "Allow users to manage their own presence" ON public.user_presence
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        user_id = auth.uid()
    );

-- Enable real-time subscriptions for user_presence (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_presence'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
    END IF;
END $$;

-- Create upsert function for user_presence
CREATE OR REPLACE FUNCTION upsert_user_presence(
    p_user_id UUID,
    p_event_id UUID,
    p_is_online BOOLEAN,
    p_status VARCHAR(20),
    p_last_seen TIMESTAMP WITH TIME ZONE,
    p_updated_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_presence (
        user_id, event_id, is_online, status, last_seen, updated_at
    ) VALUES (
        p_user_id, p_event_id, p_is_online, p_status, p_last_seen, p_updated_at
    )
    ON CONFLICT (user_id, event_id)
    DO UPDATE SET
        is_online = EXCLUDED.is_online,
        status = EXCLUDED.status,
        last_seen = EXCLUDED.last_seen,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
