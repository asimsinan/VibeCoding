/**
 * Dredd hooks for API contract testing
 * Handles authentication and test setup/teardown
 */

const hooks = require('dredd-hooks')

// Test data
const testWhiteboardId = '123e4567-e89b-12d3-a456-426614174000'
const testUserId = '123e4567-e89b-12d3-a456-426614174001'

// Authentication token (mock for testing)
const authToken = 'Bearer test-token-12345'

hooks.beforeAll((transactions) => {
  console.log('Starting API contract tests...')
  
  // Add authentication headers to all requests
  transactions.forEach((transaction) => {
    if (transaction.request && transaction.request.headers) {
      transaction.request.headers.Authorization = authToken
    }
  })
})

hooks.beforeEach((transaction) => {
  // Add test data to request bodies where needed
  if (transaction.request && transaction.request.body) {
    try {
      const body = JSON.parse(transaction.request.body)
      
      // Add test whiteboard ID to path parameters
      if (transaction.request.uri.includes('{id}')) {
        transaction.request.uri = transaction.request.uri.replace('{id}', testWhiteboardId)
      }
      
      // Add test drawing ID to path parameters
      if (transaction.request.uri.includes('{drawingId}')) {
        transaction.request.uri = transaction.request.uri.replace('{drawingId}', '123e4567-e89b-12d3-a456-426614174002')
      }
      
      // Add test sticky note ID to path parameters
      if (transaction.request.uri.includes('{noteId}')) {
        transaction.request.uri = transaction.request.uri.replace('{noteId}', '123e4567-e89b-12d3-a456-426614174003')
      }
      
      // Add test data to request bodies
      if (transaction.request.uri.includes('/whiteboards') && transaction.request.method === 'POST') {
        if (!body.name) {
          body.name = 'Test Whiteboard'
        }
        if (!body.settings) {
          body.settings = {
            width: 1920,
            height: 1080,
            backgroundColor: '#FFFFFF'
          }
        }
        transaction.request.body = JSON.stringify(body)
      }
      
      if (transaction.request.uri.includes('/drawings') && transaction.request.method === 'POST') {
        if (!body.tool) {
          body.tool = 'pen'
        }
        if (!body.color) {
          body.color = '#000000'
        }
        if (!body.size) {
          body.size = 2
        }
        if (!body.points) {
          body.points = [
            { x: 100, y: 200 },
            { x: 150, y: 250 }
          ]
        }
        transaction.request.body = JSON.stringify(body)
      }
      
      if (transaction.request.uri.includes('/sticky-notes') && transaction.request.method === 'POST') {
        if (!body.content) {
          body.content = 'Test sticky note'
        }
        if (!body.position) {
          body.position = { x: 100, y: 200 }
        }
        if (!body.color) {
          body.color = '#FFFF00'
        }
        transaction.request.body = JSON.stringify(body)
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }
  }
})

hooks.afterEach((transaction) => {
  // Log test results
  if (transaction.test && transaction.test.status === 'fail') {
    console.log(`❌ FAILED: ${transaction.request.method} ${transaction.request.uri}`)
    console.log(`   Expected: ${transaction.expected.statusCode}`)
    console.log(`   Actual: ${transaction.real.statusCode}`)
  } else if (transaction.test && transaction.test.status === 'pass') {
    console.log(`✅ PASSED: ${transaction.request.method} ${transaction.request.uri}`)
  }
})

hooks.afterAll((transactions) => {
  console.log('API contract tests completed!')
  
  // Count results
  const passed = transactions.filter(t => t.test && t.test.status === 'pass').length
  const failed = transactions.filter(t => t.test && t.test.status === 'fail').length
  const skipped = transactions.filter(t => t.test && t.test.status === 'skip').length
  
  console.log(`\nTest Results:`)
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  console.log(`  📊 Total: ${transactions.length}`)
})
