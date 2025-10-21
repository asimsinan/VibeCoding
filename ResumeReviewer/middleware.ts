import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  uploadMaxRequests: 10, // 10 uploads per window
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rate limiting middleware
function rateLimit(ip: string, endpoint: string): { allowed: boolean; remaining: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  // Clean up old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };
  
  // Reset if window expired
  if (current.resetTime < now) {
    current.count = 0;
    current.resetTime = now + RATE_LIMIT.windowMs;
  }
  
  // Check limits
  const maxRequests = endpoint.includes('upload') ? RATE_LIMIT.uploadMaxRequests : RATE_LIMIT.maxRequests;
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return { allowed: true, remaining: maxRequests - current.count };
}

// Security headers middleware
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Main middleware function
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  // Get client IP
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Apply rate limiting
  const rateLimitResult = rateLimit(ip, pathname);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'RateLimitError',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': pathname.includes('upload') ? RATE_LIMIT.uploadMaxRequests.toString() : RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT.windowMs).toISOString(),
        },
      }
    );
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', pathname.includes('upload') ? RATE_LIMIT.uploadMaxRequests.toString() : RATE_LIMIT.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  
  // Add security headers
  return addSecurityHeaders(response);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
