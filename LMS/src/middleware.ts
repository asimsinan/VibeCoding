import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { securityMiddleware } from './lib/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply security headers first
  const response = securityMiddleware(request);

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signout', '/auth/error', '/auth/register'];
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // Get the JWT token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect to signin if not authenticated
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based route protection
  const userRole = token.role as string;
  const organizationId = token.organizationId as string;

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Instructor routes
  if (pathname.startsWith('/instructor')) {
    if (!['ADMIN', 'INSTRUCTOR'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Student routes
  if (pathname.startsWith('/student')) {
    if (!['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }


  // Add organization context to headers
  response.headers.set('x-organization-id', organizationId);
  response.headers.set('x-user-role', userRole);
  response.headers.set('x-user-id', token.sub || '');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
