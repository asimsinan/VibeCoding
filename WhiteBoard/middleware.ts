/**
 * Next.js Middleware
 * 
 * Platform-specific middleware for authentication, security, and performance.
 * Handles authentication, CORS, security headers, and API versioning.
 * 
 * @fileoverview Next.js middleware with security and performance optimizations
 * @version 1.0.0
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Security Headers Configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
    // Removed "upgrade-insecure-requests" to allow HTTP in development
  ].join('; ')
}

// API Routes that require authentication
const protectedApiRoutes = [
  '/api/v1/whiteboards',
  '/api/v1/whiteboards/[id]/drawings',
  '/api/v1/whiteboards/[id]/sticky-notes',
  '/api/v1/whiteboards/[id]/users',
  '/api/v1/whiteboards/[id]/clear'
]

// Public API routes that don't require authentication
const publicApiRoutes = [
  '/api/v1/health',
  '/api/v1/version'
]

// Routes that require authentication
const protectedRoutes = [
  '/whiteboard',
  '/dashboard'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/callback'
]

/**
 * Check if a path matches any of the given patterns
 */
function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert Next.js dynamic route pattern to regex
    let regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, '([^/]+)')  // Replace [param] with ([^/]+)
      .replace(/\//g, '\\/')                // Escape forward slashes
    
    // Add start and end anchors
    regexPattern = '^' + regexPattern + '$'
    
    const regex = new RegExp(regexPattern)
    return regex.test(pathname)
  })
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnugtlgygqbvtbklnmhn.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TkyJdjZ2UppYRodIEvNioA_Y4qcekX4'
    
    if (!supabaseUrl) {
      console.error('Supabase URL is not configured')
      return false
    }
    
    // Create Supabase client with proper session handling
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // If there's an auth header, try to get user with it
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      return !!user
    }
    
    // Fallback: try to get user without token (for cases where session is in cookies)
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    console.error('Authentication check failed:', error)
    return false
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Handle CORS for API routes
 */
function handleCORS(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'https://whiteboard.app',
    'https://www.whiteboard.app'
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  return response
}

/**
 * Handle API versioning
 */
function handleApiVersioning(request: NextRequest, response: NextResponse): NextResponse {
  const pathname = request.nextUrl.pathname
  
  if (pathname.startsWith('/api/')) {
    // Add API version header
    response.headers.set('X-API-Version', '1.0.0')
    
    // Add deprecation warning for old API versions
    if (pathname.startsWith('/api/v0/')) {
      response.headers.set('X-API-Deprecation', 'v0 is deprecated, please use v1')
    }
  }

  return response
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers to all responses
  addSecurityHeaders(response)

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    handleCORS(request, response)
    handleApiVersioning(request, response)

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
  }

  // Check authentication for protected routes
  // TEMPORARILY DISABLED - Authentication is handled client-side
  // TODO: Implement proper session handling in middleware
  /*
  if (matchesPattern(pathname, protectedRoutes) || matchesPattern(pathname, protectedApiRoutes)) {
    const isAuth = await isAuthenticated(request)
    
    if (!isAuth) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401, headers: response.headers }
        )
      } else {
        // Redirect to login page
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }
  */

  // Redirect authenticated users away from auth pages
  // Temporarily disabled to avoid redirect loops
  // if (matchesPattern(pathname, ['/auth/login', '/auth/register']) && await isAuthenticated(request)) {
  //   return NextResponse.redirect(new URL('/whiteboard', request.url))
  // }

  // Add performance headers
  response.headers.set('X-Response-Time', Date.now().toString())

  // Add cache headers for static assets
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/images/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Add cache headers for API responses
  if (pathname.startsWith('/api/v1/whiteboards') && request.method === 'GET') {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  }

  return response
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
