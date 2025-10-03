#!/usr/bin/env node
/**
 * Simple API route testing script
 * Tests API routes without authentication first
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testAPIRoutes() {
  console.log('🧪 Testing API Routes...\n')

  const baseUrl = 'http://localhost:3000'

  try {
    // Test 1: Simple API route
    console.log('1️⃣ Testing simple API route...')
    const helloResponse = await fetch(`${baseUrl}/api/hello`)
    if (helloResponse.ok) {
      const data = await helloResponse.json()
      console.log('✅ /api/hello:', data.message)
    } else {
      console.log('❌ /api/hello failed:', helloResponse.status)
    }

    // Test 2: Public events API
    console.log('\n2️⃣ Testing public events API...')
    const eventsResponse = await fetch(`${baseUrl}/api/v1/events-public`)
    if (eventsResponse.ok) {
      const data = await eventsResponse.json()
      console.log('✅ /api/v1/events-public:', data)
    } else {
      console.log('❌ /api/v1/events-public failed:', eventsResponse.status)
    }

    // Test 3: Authenticated events API (should fail without auth)
    console.log('\n3️⃣ Testing authenticated events API (should fail)...')
    const authEventsResponse = await fetch(`${baseUrl}/api/v1/events`)
    if (authEventsResponse.status === 401) {
      console.log('✅ /api/v1/events correctly requires authentication (401)')
    } else {
      console.log('❌ /api/v1/events should require authentication:', authEventsResponse.status)
    }

    // Test 4: Test all API endpoints systematically
    console.log('\n4️⃣ Testing all API endpoints systematically...')
    
    const endpoints = [
      { path: '/api/test-simple', method: 'GET', auth: false },
      { path: '/api/supabase-test', method: 'GET', auth: false },
      { path: '/api/eventservice-test', method: 'GET', auth: false },
      { path: '/api/v1/events', method: 'GET', auth: true },
      { path: '/api/v1/notifications', method: 'GET', auth: true },
      { path: '/api/v1/sessions', method: 'GET', auth: true },
    ]

    for (const endpoint of endpoints) {
      console.log(`\n📡 Testing ${endpoint.method} ${endpoint.path}...`)
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method
      })
      
      if (endpoint.auth) {
        if (response.status === 401) {
          console.log(`✅ ${endpoint.path} correctly requires authentication (401)`)
        } else if (response.ok) {
          console.log(`⚠️  ${endpoint.path} unexpectedly worked without authentication`)
        } else {
          console.log(`❌ ${endpoint.path} failed with status: ${response.status}`)
        }
      } else {
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ ${endpoint.path} working:`, data.success ? 'success' : 'error')
        } else {
          console.log(`❌ ${endpoint.path} failed with status: ${response.status}`)
        }
      }
    }

    console.log('\n🎉 API route testing completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAPIRoutes()
