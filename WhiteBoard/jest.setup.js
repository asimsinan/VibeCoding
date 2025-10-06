/**
 * Jest Setup
 * Global test configuration and mocks
 * 
 * @fileoverview Jest setup for testing environment
 * @version 1.0.0
 */

// Mock Next.js server components
class MockRequest {
  constructor(input, init) {
    this._url = input
    this._method = init?.method || 'GET'
    this._headers = new Map(Object.entries(init?.headers || {}))
    this._body = init?.body
  }

  get url() {
    return this._url
  }

  get method() {
    return this._method
  }

  get headers() {
    return this._headers
  }

  get body() {
    return this._body
  }

  json() {
    return Promise.resolve(JSON.parse(this._body || '{}'))
  }

  text() {
    return Promise.resolve(this._body || '')
  }
}

class MockResponse {
  constructor(body, init) {
    this._body = body
    this._status = init?.status || 200
    this._statusText = init?.statusText || 'OK'
    this._headers = new Map(Object.entries(init?.headers || {}))
  }

  get status() {
    return this._status
  }

  get statusText() {
    return this._statusText
  }

  get headers() {
    return this._headers
  }

  json() {
    return Promise.resolve(JSON.parse(this._body))
  }

  text() {
    return Promise.resolve(this._body)
  }
}

global.Request = global.Request || MockRequest
global.Response = global.Response || MockResponse

// Mock NextResponse
const NextResponse = {
  json: (data, init) => {
    const response = new MockResponse(JSON.stringify(data), init)
    response.json = () => Promise.resolve(data)
    return response
  },
  text: (data, init) => {
    const response = new MockResponse(data, init)
    response.text = () => Promise.resolve(data)
    return response
  },
  redirect: (url, init) => new MockResponse(null, { ...init, status: 302, headers: { ...init?.headers, Location: url } })
}

global.NextResponse = NextResponse

// Mock NextRequest
global.NextRequest = MockRequest

// Mock NextResponse module
jest.mock('next/server', () => ({
  NextResponse: NextResponse,
  NextRequest: MockRequest
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      gte: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn(() => Promise.resolve({}))
        })),
        subscribe: jest.fn(() => Promise.resolve({}))
      })),
      send: jest.fn(() => Promise.resolve({}))
    })),
    removeChannel: jest.fn(() => Promise.resolve({})),
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
  }
}))

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
  }
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

// Mock fetch for API client tests
global.fetch = jest.fn((url, options) => {
  const method = options?.method || 'GET'
  const urlPath = new URL(url).pathname
  
  // Return different responses based on URL and method
  let responseData = {
    success: true,
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Whiteboard',
      settings: {
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  }

  // Handle different endpoints
  if (urlPath.includes('/drawings/') && method === 'PUT') {
    responseData.data = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
      tool: 'brush',
      color: '#ff0000',
      size: 4,
      points: [{ x: 200, y: 200 }],
      userId: '123e4567-e89b-12d3-a456-426614174002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  } else if (urlPath.includes('/drawings') && method === 'POST') {
    responseData.data = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
      tool: 'pen',
      color: '#000000',
      size: 2,
      points: [{ x: 100, y: 100 }],
      userId: '123e4567-e89b-12d3-a456-426614174002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  } else if (urlPath.includes('/sticky-notes') && method === 'POST') {
    responseData.data = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Test sticky note',
      position: { x: 200, y: 200 },
      color: '#FFE066',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  } else if (urlPath.includes('/sticky-notes/') && method === 'PUT') {
    responseData.data = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Updated sticky note',
      position: { x: 300, y: 300 },
      color: '#FF6B6B',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  } else if (urlPath.includes('/users') && method === 'GET') {
    responseData.data = [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        displayName: 'User 1',
        lastSeen: new Date().toISOString(),
        cursorPosition: { x: 100, y: 100 },
        whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  } else if (urlPath.includes('/whiteboards/') && method === 'PUT') {
    responseData.data.name = 'Updated Whiteboard'
  } else if (urlPath.includes('/drawings') && urlPath.includes('large')) {
    // For large payload test
    responseData.data = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      whiteboardId: '123e4567-e89b-12d3-a456-426614174000',
      tool: 'pen',
      color: '#000000',
      size: 2,
      points: Array.from({ length: 1000 }, (_, i) => ({
        x: Math.random() * 1920,
        y: Math.random() * 1080
      })),
      userId: '123e4567-e89b-12d3-a456-426614174002',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(responseData),
    text: () => Promise.resolve('OK'),
    headers: new Map(Object.entries({
      'Content-Type': 'application/json'
    }))
  })
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}