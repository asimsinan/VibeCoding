#!/usr/bin/env node
/**
 * API Test Script
 * 
 * Tests our API routes to verify they work correctly
 */

import { createClient } from '@supabase/supabase-js'

async function testAPI() {
  try {
    console.log('🧪 Testing API routes...')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Check if we can connect to Supabase
    console.log('🔍 Testing Supabase connection...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('⚠️  Auth test failed (expected):', authError.message)
    } else {
      console.log('✅ Supabase connection successful!')
    }

    // Test 2: Check if tables exist
    console.log('🔍 Testing database tables...')
    
    const tables = ['users', 'events', 'sessions', 'attendees', 'notifications', 'connections', 'messages']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table '${table}' not found or not accessible:`, error.message)
        } else {
          console.log(`✅ Table '${table}' is accessible`)
        }
      } catch (err) {
        console.log(`❌ Error testing table '${table}':`, err)
      }
    }

    // Test 3: Test our EventService
    console.log('🔍 Testing EventService...')
    
    try {
      // Import our service
      const { EventService } = await import('../src/lib/event-management/services/EventService.js')
      const eventService = new EventService()
      
      // Test listing events
      const events = await eventService.listEvents({ limit: 1 })
      console.log('✅ EventService.listEvents() works!')
      console.log(`📊 Found ${events.total} events`)
      
    } catch (err) {
      console.log('❌ EventService test failed:', err.message)
    }

    console.log('🎉 API testing completed!')

  } catch (error) {
    console.error('❌ API test failed:', error)
  }
}

// Run the test
testAPI()
