-- Sample Data Generator for Virtual Event Organizer
-- This script generates sample data with proper UUIDs
-- Run this AFTER users have been created through Supabase Auth

-- First, get actual user IDs from auth.users table
-- Run this query to see available users:
-- SELECT id, email FROM auth.users;

-- Then replace the UUIDs below with actual user IDs

-- Example: If you have a user with ID '550e8400-e29b-41d4-a716-446655440000'
-- Replace 'REPLACE_WITH_ACTUAL_USER_ID' with that UUID

-- Sample Events
INSERT INTO public.events (id, organizer_id, title, description, start_date, end_date, capacity, status, is_public) VALUES
    (uuid_generate_v4(), 'REPLACE_WITH_ACTUAL_USER_ID', 'AI Conference 2024', 'Annual AI and Machine Learning Conference featuring cutting-edge research and industry insights', '2024-12-01 09:00:00+00', '2024-12-01 18:00:00+00', 500, 'published', true),
    (uuid_generate_v4(), 'REPLACE_WITH_ACTUAL_USER_ID', 'Dev Meetup December', 'Monthly Developer Meetup with networking and tech talks', '2024-12-15 19:00:00+00', '2024-12-15 21:00:00+00', 100, 'published', true),
    (uuid_generate_v4(), 'REPLACE_WITH_ACTUAL_USER_ID', 'Web Development Webinar Series', 'Weekly webinars covering modern web development practices', '2024-12-10 14:00:00+00', '2024-12-10 15:30:00+00', 200, 'published', true);

-- Get the event IDs we just created
-- Run this query to get the event IDs:
-- SELECT id, title FROM public.events ORDER BY created_at DESC LIMIT 3;

-- Sample Sessions (replace event_id with actual event IDs from the query above)
INSERT INTO public.sessions (id, event_id, title, description, speaker, speaker_bio, speaker_email, start_time, end_time, status) VALUES
    (uuid_generate_v4(), 'REPLACE_WITH_EVENT_ID_1', 'Advanced Machine Learning', 'Deep dive into advanced ML techniques including deep learning, reinforcement learning, and neural architecture search', 'Dr. Sarah Johnson', 'Senior ML Engineer at TechCorp with 10+ years experience in AI research', 'sarah@techcorp.com', '2024-12-01 10:00:00+00', '2024-12-01 11:00:00+00', 'scheduled'),
    (uuid_generate_v4(), 'REPLACE_WITH_EVENT_ID_1', 'AI Ethics Panel', 'Discussion on ethical AI development, bias mitigation, and responsible AI practices', 'Panel of Experts', 'Leading AI ethicists and researchers', 'ethics@aiconf.com', '2024-12-01 14:00:00+00', '2024-12-01 15:00:00+00', 'scheduled'),
    (uuid_generate_v4(), 'REPLACE_WITH_EVENT_ID_2', 'React 2024: What''s New', 'Overview of the latest React features and best practices for 2024', 'Alex Chen', 'Frontend Developer and React contributor', 'alex@devmeetup.com', '2024-12-15 19:30:00+00', '2024-12-15 20:30:00+00', 'scheduled'),
    (uuid_generate_v4(), 'REPLACE_WITH_EVENT_ID_3', 'Next.js Performance Tips', 'Optimizing Next.js applications for better performance and user experience', 'Maria Rodriguez', 'Full-stack developer specializing in React and Next.js', 'maria@webdev.com', '2024-12-10 14:15:00+00', '2024-12-10 15:15:00+00', 'scheduled');

-- Instructions:
-- 1. First run: SELECT id, email FROM auth.users; to get user IDs
-- 2. Replace 'REPLACE_WITH_ACTUAL_USER_ID' with actual user UUIDs
-- 3. Run the events INSERT
-- 4. Then run: SELECT id, title FROM public.events ORDER BY created_at DESC LIMIT 3; to get event IDs
-- 5. Replace 'REPLACE_WITH_EVENT_ID_1', 'REPLACE_WITH_EVENT_ID_2', etc. with actual event UUIDs
-- 6. Run the sessions INSERT

-- Alternative: Skip sample data for now and test with empty database
-- The application will work fine without sample data
