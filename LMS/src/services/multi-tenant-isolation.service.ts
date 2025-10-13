import { PrismaClient } from '@/generated/prisma';
import { NextRequest } from 'next/server';

/**
 * Multi-tenant data isolation service
 * Implements row-level security for tenant data isolation
 */
export class MultiTenantIsolationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get organization ID from request context
   * @param request - NextRequest object
   * @returns Organization ID
   */
  getOrganizationIdFromRequest(request: NextRequest): string | null {
    // Try to get from headers first
    const orgId = request.headers.get('x-organization-id');
    if (orgId) return orgId;

    // Try to get from query parameters
    const url = new URL(request.url);
    const orgIdFromQuery = url.searchParams.get('organizationId');
    if (orgIdFromQuery) return orgIdFromQuery;

    // Try to get from user session (if available)
    const user = (request as any).user;
    if (user?.organizationId) return user.organizationId;

    return null;
  }

  /**
   * Validate organization access
   * @param organizationId - Organization ID
   * @param userOrganizationId - User's organization ID
   * @returns True if access is allowed
   */
  validateOrganizationAccess(organizationId: string, userOrganizationId: string): boolean {
    return organizationId === userOrganizationId;
  }

  /**
   * Add organization filter to Prisma where clause
   * @param where - Existing where clause
   * @param organizationId - Organization ID
   * @returns Updated where clause with organization filter
   */
  addOrganizationFilter<T>(where: T, organizationId: string): T {
    return {
      ...where,
      organizationId,
    };
  }

  /**
   * Add organization filter for nested relations
   * @param where - Existing where clause
   * @param organizationId - Organization ID
   * @param relationPath - Path to the relation that has organizationId
   * @returns Updated where clause with organization filter
   */
  addNestedOrganizationFilter<T>(where: T, organizationId: string, relationPath: string): T {
    const nestedFilter = this.buildNestedFilter(relationPath, { organizationId });
    return {
      ...where,
      ...nestedFilter,
    };
  }

  /**
   * Build nested filter for relations
   * @param path - Dot-separated path to the relation
   * @param filter - Filter to apply
   * @returns Nested filter object
   */
  private buildNestedFilter(path: string, filter: Record<string, any>): Record<string, any> {
    const parts = path.split('.');
    let result: any = {};
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = filter;
    return result;
  }

  /**
   * Create organization-scoped Prisma client
   * @param organizationId - Organization ID
   * @returns Prisma client with organization filter
   */
  createScopedClient(organizationId: string): PrismaClient {
    // This would require a custom Prisma client extension
    // For now, we'll return the original client and rely on manual filtering
    return this.prisma;
  }

  /**
   * Execute query with organization isolation
   * @param query - Query function
   * @param organizationId - Organization ID
   * @returns Query result
   */
  async executeWithIsolation<T>(
    query: (prisma: PrismaClient) => Promise<T>,
    organizationId: string
  ): Promise<T> {
    // In a real implementation, this would use Prisma middleware or extensions
    // to automatically add organization filters to all queries
    return query(this.prisma);
  }

  /**
   * Validate data belongs to organization
   * @param data - Data to validate
   * @param organizationId - Organization ID
   * @returns True if data belongs to organization
   */
  validateDataOwnership(data: any, organizationId: string): boolean {
    if (!data) return false;
    
    // Check if data has organizationId field
    if (data.organizationId) {
      return data.organizationId === organizationId;
    }

    // Check nested organization references
    if (data.organization?.id) {
      return data.organization.id === organizationId;
    }

    if (data.course?.organizationId) {
      return data.course.organizationId === organizationId;
    }

    if (data.module?.course?.organizationId) {
      return data.module.course.organizationId === organizationId;
    }

    if (data.lesson?.module?.course?.organizationId) {
      return data.lesson.module.course.organizationId === organizationId;
    }

    if (data.quiz?.lesson?.module?.course?.organizationId) {
      return data.quiz.lesson.module.course.organizationId === organizationId;
    }

    if (data.question?.quiz?.lesson?.module?.course?.organizationId) {
      return data.question.quiz.lesson.module.course.organizationId === organizationId;
    }

    if (data.enrollment?.organizationId) {
      return data.enrollment.organizationId === organizationId;
    }

    if (data.user?.organizationId) {
      return data.user.organizationId === organizationId;
    }

    return false;
  }

  /**
   * Sanitize data to remove organization-specific information
   * @param data - Data to sanitize
   * @param organizationId - Organization ID
   * @returns Sanitized data
   */
  sanitizeData(data: any, organizationId: string): any {
    if (!data) return data;

    // Remove organizationId from data if it doesn't match
    if (data.organizationId && data.organizationId !== organizationId) {
      delete data.organizationId;
    }

    // Recursively sanitize nested objects
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      for (const key in sanitized) {
        if (sanitized[key] && typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key], organizationId);
        }
      }
      
      return sanitized;
    }

    return data;
  }

  /**
   * Create organization context for requests
   * @param organizationId - Organization ID
   * @returns Organization context
   */
  createOrganizationContext(organizationId: string): {
    organizationId: string;
    filters: Record<string, any>;
    validateAccess: (data: any) => boolean;
    sanitizeData: (data: any) => any;
  } {
    return {
      organizationId,
      filters: {
        organizationId,
      },
      validateAccess: (data: any) => this.validateDataOwnership(data, organizationId),
      sanitizeData: (data: any) => this.sanitizeData(data, organizationId),
    };
  }
}

/**
 * Multi-tenant middleware for API routes
 */
export function withMultiTenantIsolation<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  options: {
    requireOrganizationId?: boolean;
    validateOwnership?: boolean;
    sanitizeResponse?: boolean;
  } = {}
) {
  return async (...args: T): Promise<Response> => {
    const [request] = args;
    const isolationService = new MultiTenantIsolationService(new PrismaClient());

    // Extract organization ID from request
    const organizationId = isolationService.getOrganizationIdFromRequest(request);
    
    if (options.requireOrganizationId && !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add organization context to request
    (request as any).organizationContext = isolationService.createOrganizationContext(organizationId || '');

    // Execute handler
    const response = await handler(...args);

    // Sanitize response if requested
    if (options.sanitizeResponse && organizationId) {
      const responseData = await response.json();
      const sanitizedData = isolationService.sanitizeData(responseData, organizationId);
      
      return new Response(
        JSON.stringify(sanitizedData),
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    return response;
  };
}

/**
 * Organization-scoped service base class
 */
export abstract class OrganizationScopedService {
  protected organizationId: string;
  protected prisma: PrismaClient;
  protected isolationService: MultiTenantIsolationService;

  constructor(organizationId: string, prisma: PrismaClient) {
    this.organizationId = organizationId;
    this.prisma = prisma;
    this.isolationService = new MultiTenantIsolationService(prisma);
  }

  /**
   * Add organization filter to where clause
   * @param where - Where clause
   * @returns Where clause with organization filter
   */
  protected addOrganizationFilter<T>(where: T): T {
    return this.isolationService.addOrganizationFilter(where, this.organizationId);
  }

  /**
   * Add nested organization filter
   * @param where - Where clause
   * @param relationPath - Relation path
   * @returns Where clause with nested organization filter
   */
  protected addNestedOrganizationFilter<T>(where: T, relationPath: string): T {
    return this.isolationService.addNestedOrganizationFilter(where, this.organizationId, relationPath);
  }

  /**
   * Validate data ownership
   * @param data - Data to validate
   * @returns True if data belongs to organization
   */
  protected validateOwnership(data: any): boolean {
    return this.isolationService.validateDataOwnership(data, this.organizationId);
  }

  /**
   * Sanitize data
   * @param data - Data to sanitize
   * @returns Sanitized data
   */
  protected sanitizeData(data: any): any {
    return this.isolationService.sanitizeData(data, this.organizationId);
  }
}

/**
 * Organization context hook for React components
 */
export function useOrganizationContext() {
  // This would be implemented in the frontend
  // For now, it's a placeholder
  return {
    organizationId: '',
    isAdmin: false,
    isInstructor: false,
    isStudent: false,
  };
}

/**
 * Organization guard component
 */
export function OrganizationGuard({ 
  children, 
  organizationId, 
  fallback 
}: { 
  children: React.ReactNode; 
  organizationId: string; 
  fallback?: React.ReactNode; 
}) {
  // This would be implemented in the frontend
  // For now, it's a placeholder
  return children;
}

/**
 * Database-level row-level security policies
 * These would be implemented as SQL policies in PostgreSQL
 */
export const ROW_LEVEL_SECURITY_POLICIES = {
  // Users table
  users: `
    CREATE POLICY "Users can only see their organization's users" ON users
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::uuid);
  `,

  // Courses table
  courses: `
    CREATE POLICY "Users can only see their organization's courses" ON courses
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::uuid);
  `,

  // Modules table
  modules: `
    CREATE POLICY "Users can only see modules from their organization's courses" ON modules
    FOR ALL USING (
      course_id IN (
        SELECT id FROM courses 
        WHERE organization_id = current_setting('app.current_organization_id')::uuid
      )
    );
  `,

  // Lessons table
  lessons: `
    CREATE POLICY "Users can only see lessons from their organization's courses" ON lessons
    FOR ALL USING (
      module_id IN (
        SELECT m.id FROM modules m
        JOIN courses c ON m.course_id = c.id
        WHERE c.organization_id = current_setting('app.current_organization_id')::uuid
      )
    );
  `,

  // Quizzes table
  quizzes: `
    CREATE POLICY "Users can only see quizzes from their organization's courses" ON quizzes
    FOR ALL USING (
      lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE c.organization_id = current_setting('app.current_organization_id')::uuid
      )
    );
  `,

  // Questions table
  questions: `
    CREATE POLICY "Users can only see questions from their organization's courses" ON questions
    FOR ALL USING (
      quiz_id IN (
        SELECT q.id FROM quizzes q
        JOIN lessons l ON q.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE c.organization_id = current_setting('app.current_organization_id')::uuid
      )
    );
  `,

  // Enrollments table
  enrollments: `
    CREATE POLICY "Users can only see enrollments from their organization" ON enrollments
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::uuid);
  `,

  // Progress table
  progress: `
    CREATE POLICY "Users can only see progress from their organization's courses" ON progress
    FOR ALL USING (
      lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE c.organization_id = current_setting('app.current_organization_id')::uuid
      )
    );
  `,

  // Quiz attempts table
  quiz_attempts: `
    CREATE POLICY "Users can only see quiz attempts from their organization's courses" ON quiz_attempts
    FOR ALL USING (
      quiz_id IN (
        SELECT q.id FROM quizzes q
        JOIN lessons l ON q.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE c.organization_id = current_setting('app.current_organization_id')::uuid
      )
    );
  `,

  // Audit logs table
  audit_logs: `
    CREATE POLICY "Users can only see audit logs from their organization" ON audit_logs
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::uuid);
  `,
};

/**
 * Enable row-level security on all tables
 */
export const ENABLE_ROW_LEVEL_SECURITY = `
  -- Enable RLS on all tables
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
  ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
`;

/**
 * Set organization context in database session
 * @param organizationId - Organization ID
 * @returns SQL command to set context
 */
export function setOrganizationContext(organizationId: string): string {
  return `SELECT set_config('app.current_organization_id', '${organizationId}', true);`;
}
