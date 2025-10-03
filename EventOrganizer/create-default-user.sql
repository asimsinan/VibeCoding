-- Create default user for event creation
-- Run this in your Supabase SQL Editor

INSERT INTO users (
  id,
  email,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@demo.com',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
