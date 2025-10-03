#!/usr/bin/env node
/**
 * Database Setup Helper
 * 
 * This script helps you set up the database step by step
 */

console.log(`
🗄️  DATABASE SETUP INSTRUCTIONS
================================

The database schema has been fixed to avoid foreign key constraint errors.

📋 STEP-BY-STEP SETUP:

1️⃣  EXECUTE MAIN SCHEMA
   - Go to Supabase Dashboard → SQL Editor
   - Copy the contents of: database/schema.sql
   - Paste and run the SQL
   - This creates all tables, indexes, and RLS policies

2️⃣  REGISTER TEST USERS (Optional)
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" and create test users:
     * organizer@techconf.com (role: organizer)
     * attendee1@example.com (role: attendee)
     * attendee2@example.com (role: attendee)

3️⃣  INSERT SAMPLE DATA (Optional)
   - Get user IDs from auth.users table
   - Update database/sample-data.sql with actual user IDs
   - Run the sample data SQL in Supabase

4️⃣  TEST THE CONNECTION
   - Run: npm run dev
   - The application should now work with the database

🔧 ALTERNATIVE: QUICK TEST
   - Skip sample data for now
   - Just run the main schema
   - Test with the development server

📁 FILES CREATED:
   ✅ database/schema.sql (main schema - run this first)
   ✅ database/sample-data.sql (sample data - optional)
   ✅ DATABASE_SETUP.md (detailed instructions)

🚀 NEXT STEPS AFTER DATABASE SETUP:
   1. npm run dev (start development server)
   2. npm test (run integration tests)
   3. Test API endpoints
   4. Verify full application functionality

Need help? Check DATABASE_SETUP.md for detailed instructions.
`);

// Test if we can connect to Supabase
try {
  require('dotenv').config({ path: '.env.local' });
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔍 Testing Supabase connection...');
  
  supabase.from('users').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Database not ready:', error.message);
        console.log('💡 Run the schema.sql file in Supabase SQL Editor first');
      } else {
        console.log('✅ Database connection successful!');
        console.log('🎉 Ready to start the application!');
      }
    })
    .catch(err => {
      console.log('❌ Connection error:', err.message);
    });
    
} catch (error) {
  console.log('❌ Environment setup error:', error.message);
}
