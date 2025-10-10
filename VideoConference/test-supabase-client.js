#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function testSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables not set');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
    process.exit(1);
  }

  console.log('🔍 Testing Supabase client connection...');
  console.log('Supabase URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test basic connection
    const { data, error } = await supabase.from('user').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ User table does not exist. Need to create schema.');
        console.log('This explains the 500 error - the database tables are missing!');
        return;
      }
      console.error('❌ Supabase query error:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ User table exists');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

testSupabaseClient();
