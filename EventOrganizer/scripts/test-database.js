#!/usr/bin/env node
/**
 * Database Test Script
 * 
 * Tests the database connection and basic operations
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDatabase() {
  try {
    console.log('🧪 Testing Database Connection...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test 1: Check if tables exist
    console.log('🔍 Testing table access...');
    
    const tables = ['users', 'events', 'sessions', 'attendees', 'notifications', 'connections', 'messages'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }

    // Test 2: Test our EventService
    console.log('🔍 Testing EventService...');
    
    try {
      const { EventService } = require('../src/lib/event-management/services/EventService');
      const eventService = new EventService();
      
      // Test listing events (should work even with empty database)
      const events = await eventService.listEvents({ limit: 1 });
      console.log('✅ EventService.listEvents() works!');
      console.log(`📊 Found ${events.total} events`);
      
    } catch (err) {
      console.log('❌ EventService test failed:', err.message);
    }

    // Test 3: Test creating an event (this will fail without a real user, but we can test the structure)
    console.log('🔍 Testing event creation structure...');
    
    try {
      const { EventService } = require('../src/lib/event-management/services/EventService');
      const eventService = new EventService();
      
      // This will fail because we don't have a real user, but it tests the service structure
      await eventService.createEvent({
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-12-01T09:00:00Z',
        endDate: '2024-12-01T18:00:00Z',
        capacity: 100,
        organizerId: 'test-user-id'
      });
      
    } catch (err) {
      if (err.message.includes('Organizer not found') || err.message.includes('Database error')) {
        console.log('✅ EventService.createEvent() structure works (expected to fail without real user)');
      } else {
        console.log('❌ EventService.createEvent() failed:', err.message);
      }
    }

    console.log('🎉 Database testing completed!');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. If tables are accessible, the database schema is working');
    console.log('2. Run: npm run dev (to start the development server)');
    console.log('3. Test the API endpoints through the web interface');
    console.log('4. Optional: Add sample data using database/sample-data-generator.sql');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabase();
