import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';

// Role-based access control middleware
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    organizationId: string;
  };
  organizationId: string;
}

// Middleware function to check authentication
export async function requireAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token || !token.sub) {
      return null;
    }

    return {
      user: {
        id: token.sub,
        email: token.email || '',
        name: token.name,
        role: token.role as string,
        organizationId: token.organizationId as string,
      },
      organizationId: token.organizationId as string,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return null;
  }
}

// Middleware function to check role permissions
export function requireRole(allowedRoles: string[]) {
  return (authContext: AuthContext | null): boolean => {
    if (!authContext) {
      return false;
    }

    return allowedRoles.includes(authContext.user.role);
  };
}

// Middleware function to check organization access
export function requireOrganization(organizationId: string) {
  return (authContext: AuthContext | null): boolean => {
    if (!authContext) {
      return false;
    }

    return authContext.user.organizationId === organizationId;
  };
}

// Higher-order function to create API route middleware
export function withAuth(
  handler: (request: NextRequest, authContext: AuthContext) => Promise<NextResponse>,
  options?: {
    requiredRoles?: string[];
    requireOrganizationId?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check authentication
      const authContext = await requireAuth(request);
      if (!authContext) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check role permissions
      if (options?.requiredRoles) {
        const hasRole = requireRole(options.requiredRoles)(authContext);
        if (!hasRole) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Check organization access
      if (options?.requireOrganizationId) {
        const url = new URL(request.url);
        const orgId = url.searchParams.get('organizationId') || 
                     request.headers.get('x-organization-id');
        
        if (orgId) {
          const hasOrgAccess = requireOrganization(orgId)(authContext);
          if (!hasOrgAccess) {
            return NextResponse.json(
              { error: 'Forbidden', message: 'Organization access denied' },
              { status: 403 }
            );
          }
        }
      }

      // Call the original handler with auth context
      return await handler(request, authContext);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

// Alias for withAuth for backward compatibility
export const withAuthorization = withAuth;

// Specific middleware for different role levels
export const requireAdmin = withAuth;
export const requireInstructor = withAuth;
export const requireStudent = withAuth;

// Helper function to check if user can access resource
export function canAccessResource(
  authContext: AuthContext,
  resourceOwnerId?: string,
  resourceOrganizationId?: string
): boolean {
  // Admin can access everything in their organization
  if (authContext.user.role === 'ADMIN') {
    return authContext.user.organizationId === resourceOrganizationId;
  }

  // Instructor can access resources in their organization
  if (authContext.user.role === 'INSTRUCTOR') {
    return authContext.user.organizationId === resourceOrganizationId;
  }

  // Student can only access their own resources
  if (authContext.user.role === 'STUDENT') {
    return authContext.user.id === resourceOwnerId && 
           authContext.user.organizationId === resourceOrganizationId;
  }

  return false;
}

// Helper function to check course access
export function canAccessCourse(
  authContext: AuthContext,
  courseOrganizationId: string,
  enrollmentStatus?: string
): boolean {
  // Admin and instructors can access all courses in their organization
  if (['ADMIN', 'INSTRUCTOR'].includes(authContext.user.role)) {
    return authContext.user.organizationId === courseOrganizationId;
  }

  // Students can only access courses they're enrolled in
  if (authContext.user.role === 'STUDENT') {
    return authContext.user.organizationId === courseOrganizationId && 
           enrollmentStatus === 'ACTIVE';
  }

  return false;
}

// Helper function to check quiz access
export function canAccessQuiz(
  authContext: AuthContext,
  quizOrganizationId: string,
  enrollmentStatus?: string,
  progressStatus?: string
): boolean {
  // Admin and instructors can access all quizzes in their organization
  if (['ADMIN', 'INSTRUCTOR'].includes(authContext.user.role)) {
    return authContext.user.organizationId === quizOrganizationId;
  }

  // Students can access quizzes if they're enrolled and have made progress
  if (authContext.user.role === 'STUDENT') {
    return authContext.user.organizationId === quizOrganizationId && 
           enrollmentStatus === 'ACTIVE' &&
           ['IN_PROGRESS', 'COMPLETED'].includes(progressStatus || '');
  }

  return false;
}

// Helper function to get user permissions
export function getUserPermissions(userRole: string): string[] {
  const permissions: Record<string, string[]> = {
    ADMIN: [
      'create:organization',
      'read:organization',
      'update:organization',
      'delete:organization',
      'create:user',
      'read:user',
      'update:user',
      'delete:user',
      'create:course',
      'read:course',
      'update:course',
      'delete:course',
      'read:dashboard',
      'read:analytics'
    ],
    INSTRUCTOR: [
      'create:course',
      'read:course',
      'update:course',
      'create:module',
      'read:module',
      'update:module',
      'create:lesson',
      'read:lesson',
      'update:lesson',
      'create:quiz',
      'read:quiz',
      'update:quiz',
      'read:enrollment',
      'read:progress',
      'read:dashboard'
    ],
    STUDENT: [
      'read:course',
      'read:module',
      'read:lesson',
      'read:quiz',
      'create:enrollment',
      'read:enrollment',
      'create:progress',
      'read:progress',
      'create:quiz_attempt',
      'read:quiz_attempt'
    ]
  };

  return permissions[userRole] || [];
}

// Helper function to check specific permission
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = getUserPermissions(userRole);
  return permissions.includes(permission);
}

// Middleware for API routes that require specific permissions
export function requirePermission(permission: string) {
  return (authContext: AuthContext | null): boolean => {
    if (!authContext) {
      return false;
    }

    return hasPermission(authContext.user.role, permission);
  };
}

// Error responses for common auth scenarios
export const AuthErrors = {
  UNAUTHORIZED: NextResponse.json(
    { error: 'Unauthorized', message: 'Authentication required' },
    { status: 401 }
  ),
  FORBIDDEN: NextResponse.json(
    { error: 'Forbidden', message: 'Insufficient permissions' },
    { status: 403 }
  ),
  ORGANIZATION_ACCESS_DENIED: NextResponse.json(
    { error: 'Forbidden', message: 'Organization access denied' },
    { status: 403 }
  ),
  RESOURCE_ACCESS_DENIED: NextResponse.json(
    { error: 'Forbidden', message: 'Resource access denied' },
    { status: 403 }
  ),
  INTERNAL_ERROR: NextResponse.json(
    { error: 'Internal Server Error', message: 'Authentication failed' },
    { status: 500 }
  )
};
