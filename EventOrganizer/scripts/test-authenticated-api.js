#!/usr/bin/env node
/**
 * Test script for authenticated API routes
 * Tests JWT authentication and API functionality
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthenticatedAPI() {
  console.log('🧪 Testing Authenticated API Routes...\n')

  try {
    // Step 1: Sign up a test user
    console.log('1️⃣ Creating test user...')
          const testEmail = `testuser${Date.now()}@gmail.com`
    const testPassword = 'testpassword123'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message)
      return
    }

    console.log('✅ Test user created:', testEmail)

    // Step 2: Sign in to get JWT token
    console.log('\n2️⃣ Signing in to get JWT token...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError || !signInData.session) {
      console.error('❌ Sign in failed:', signInError?.message)
      return
    }

    const jwtToken = signInData.session.access_token
    console.log('✅ JWT token obtained')

    // Step 3: Test authenticated API routes
    console.log('\n3️⃣ Testing authenticated API routes...')
    
    const baseUrl = 'http://localhost:3000'
    const headers = {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }

    // Test GET /api/v1/events
    console.log('\n📋 Testing GET /api/v1/events...')
    const eventsResponse = await fetch(`${baseUrl}/api/v1/events`, {
      method: 'GET',
      headers
    })
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json()
      console.log('✅ GET /api/v1/events successful:', eventsData)
    } else {
      const errorData = await eventsResponse.text()
      console.log('❌ GET /api/v1/events failed:', eventsResponse.status, errorData)
    }

    // Test POST /api/v1/events (create event)
    console.log('\n📝 Testing POST /api/v1/events...')
    const createEventData = {
      title: 'Test Event',
      description: 'This is a test event created via API',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
      capacity: 100,
      isPublic: true
    }

    const createResponse = await fetch(`${baseUrl}/api/v1/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createEventData)
    })

    if (createResponse.ok) {
      const createData = await createResponse.json()
      console.log('✅ POST /api/v1/events successful:', createData)
      
      // Test GET /api/v1/events again to see the created event
      console.log('\n📋 Testing GET /api/v1/events after creation...')
      const eventsResponse2 = await fetch(`${baseUrl}/api/v1/events`, {
        method: 'GET',
        headers
      })
      
      if (eventsResponse2.ok) {
        const eventsData2 = await eventsResponse2.json()
        console.log('✅ GET /api/v1/events after creation:', eventsData2)
      }
    } else {
      const errorData = await createResponse.text()
      console.log('❌ POST /api/v1/events failed:', createResponse.status, errorData)
    }

    // Test other API routes
    console.log('\n🔔 Testing GET /api/v1/notifications...')
    const notificationsResponse = await fetch(`${baseUrl}/api/v1/notifications`, {
      method: 'GET',
      headers
    })
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json()
      console.log('✅ GET /api/v1/notifications successful:', notificationsData)
    } else {
      const errorData = await notificationsResponse.text()
      console.log('❌ GET /api/v1/notifications failed:', notificationsResponse.status, errorData)
    }

    console.log('\n🎉 Authenticated API testing completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAuthenticatedAPI()
