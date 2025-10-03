-- Add event_messages table for event chat
CREATE TABLE IF NOT EXISTS public.event_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    user_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_user_id ON public.event_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON public.event_messages(created_at);

-- Enable RLS
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_messages
-- Allow authenticated users to read messages for events they have access to
CREATE POLICY "Allow authenticated users to read event messages" ON public.event_messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_messages.event_id 
            AND (events.is_public = true OR events.organizer_id = auth.uid())
        )
    );

-- Allow authenticated users to insert messages for events they have access to
CREATE POLICY "Allow authenticated users to insert event messages" ON public.event_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_messages.event_id 
            AND (events.is_public = true OR events.organizer_id = auth.uid())
        )
    );

-- Allow users to update their own messages
CREATE POLICY "Allow users to update their own messages" ON public.event_messages
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        user_id = auth.uid()
    );

-- Allow users to delete their own messages
CREATE POLICY "Allow users to delete their own messages" ON public.event_messages
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        user_id = auth.uid()
    );
