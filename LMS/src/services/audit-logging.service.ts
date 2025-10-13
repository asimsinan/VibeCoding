import { PrismaClient } from '@/generated/prisma';
import { NextRequest } from 'next/server';

// Define the enums locally since they're not exported from Prisma
enum AuditLogAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ENROLL = 'ENROLL',
  UNENROLL = 'UNENROLL',
  COMPLETE = 'COMPLETE',
  SUBMIT = 'SUBMIT',
  GRADE = 'GRADE',
  PUBLISH = 'PUBLISH',
  ARCHIVE = 'ARCHIVE',
  RESTORE = 'RESTORE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BACKUP = 'BACKUP',
  RESTORE_DB = 'RESTORE_DB',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  SECURITY_EVENT = 'SECURITY_EVENT',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  USER_ACTIVITY = 'USER_ACTIVITY',
  COURSE_ACTIVITY = 'COURSE_ACTIVITY',
  QUIZ_ACTIVITY = 'QUIZ_ACTIVITY',
  PROGRESS_ACTIVITY = 'PROGRESS_ACTIVITY',
  ENROLLMENT_ACTIVITY = 'ENROLLMENT_ACTIVITY',
  FILE_ACTIVITY = 'FILE_ACTIVITY',
  NOTIFICATION_ACTIVITY = 'NOTIFICATION_ACTIVITY',
  ANALYTICS_ACTIVITY = 'ANALYTICS_ACTIVITY',
  AUDIT_ACTIVITY = 'AUDIT_ACTIVITY',
  CACHE_ACTIVITY = 'CACHE_ACTIVITY',
  SEARCH_ACTIVITY = 'SEARCH_ACTIVITY',
  EMAIL_ACTIVITY = 'EMAIL_ACTIVITY',
  SMS_ACTIVITY = 'SMS_ACTIVITY',
  PUSH_ACTIVITY = 'PUSH_ACTIVITY',
  WEBHOOK_ACTIVITY = 'WEBHOOK_ACTIVITY',
  API_ACTIVITY = 'API_ACTIVITY',
  INTEGRATION_ACTIVITY = 'INTEGRATION_ACTIVITY',
  CUSTOM_ACTIVITY = 'CUSTOM_ACTIVITY',
}

enum AuditLogResource {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  COURSE = 'COURSE',
  MODULE = 'MODULE',
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  QUESTION = 'QUESTION',
  ENROLLMENT = 'ENROLLMENT',
  PROGRESS = 'PROGRESS',
  QUIZ_ATTEMPT = 'QUIZ_ATTEMPT',
  FILE = 'FILE',
  NOTIFICATION = 'NOTIFICATION',
  ANALYTICS = 'ANALYTICS',
  AUDIT_LOG = 'AUDIT_LOG',
  CACHE = 'CACHE',
  SEARCH = 'SEARCH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
  API = 'API',
  INTEGRATION = 'INTEGRATION',
  SYSTEM = 'SYSTEM',
  CONFIG = 'CONFIG',
  SECURITY = 'SECURITY',
  DATA = 'DATA',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  MAINTENANCE = 'MAINTENANCE',
  CUSTOM = 'CUSTOM',
}

/**
 * Audit logging service for tracking all critical operations
 */
export class AuditLoggingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Log a user action
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param resource - Resource affected
   * @param resourceId - ID of the resource
   * @param organizationId - Organization ID
   * @param details - Additional details about the action
   * @param request - Request object for IP and user agent
   */
  async logUserAction(
    userId: string,
    action: AuditLogAction,
    resource: AuditLogResource,
    resourceId: string,
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    try {
      const ipAddress = request?.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request?.headers.get('user-agent') || 'unknown';

      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          organizationId,
          details: details || {},
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log authentication events
   * @param userId - User ID
   * @param action - Authentication action
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logAuthentication(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'USER' as AuditLogResource,
      userId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log organization operations
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logOrganizationOperation(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'ORGANIZATION' as AuditLogResource,
      organizationId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log user management operations
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param targetUserId - Target user ID
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logUserManagement(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'ROLE_CHANGE',
    targetUserId: string,
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'USER' as AuditLogResource,
      targetUserId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log course operations
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param courseId - Course ID
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logCourseOperation(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'PUBLISH' | 'ARCHIVE',
    courseId: string,
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'COURSE' as AuditLogResource,
      courseId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log enrollment operations
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param enrollmentId - Enrollment ID
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logEnrollmentOperation(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'COMPLETE',
    enrollmentId: string,
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'ENROLLMENT' as AuditLogResource,
      enrollmentId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log quiz operations
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param quizId - Quiz ID
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logQuizOperation(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'SUBMIT' | 'GRADE',
    quizId: string,
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'QUIZ' as AuditLogResource,
      quizId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log file operations
   * @param userId - User ID performing the action
   * @param action - Action performed
   * @param fileId - File ID
   * @param organizationId - Organization ID
   * @param details - Additional details
   * @param request - Request object
   */
  async logFileOperation(
    userId: string,
    action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'VIEW',
    fileId: string,
    organizationId: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action as AuditLogAction,
      'FILE' as AuditLogResource,
      fileId,
      organizationId,
      details,
      request
    );
  }

  /**
   * Log system events
   * @param action - System action
   * @param resource - Resource affected
   * @param resourceId - ID of the resource
   * @param organizationId - Organization ID
   * @param details - Additional details
   */
  async logSystemEvent(
    action: AuditLogAction,
    resource: AuditLogResource,
    resourceId: string,
    organizationId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action,
          resource,
          resourceId,
          organizationId,
          details: details || {},
          ipAddress: 'SYSTEM',
          userAgent: 'SYSTEM',
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  /**
   * Get audit logs for a specific user
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param page - Page number
   * @param pageSize - Page size
   * @param filters - Optional filters
   */
  async getUserAuditLogs(
    userId: string,
    organizationId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      action?: AuditLogAction;
      resource?: AuditLogResource;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {
      userId,
      organizationId,
    };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get audit logs for a specific resource
   * @param resource - Resource type
   * @param resourceId - Resource ID
   * @param organizationId - Organization ID
   * @param page - Page number
   * @param pageSize - Page size
   */
  async getResourceAuditLogs(
    resource: AuditLogResource,
    resourceId: string,
    organizationId: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    const skip = (page - 1) * pageSize;
    const where = {
      resource,
      resourceId,
      organizationId,
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get organization audit logs
   * @param organizationId - Organization ID
   * @param page - Page number
   * @param pageSize - Page size
   * @param filters - Optional filters
   */
  async getOrganizationAuditLogs(
    organizationId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      action?: AuditLogAction;
      resource?: AuditLogResource;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {
      organizationId,
    };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get audit log statistics
   * @param organizationId - Organization ID
   * @param startDate - Start date
   * @param endDate - End date
   */
  async getAuditLogStatistics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { organizationId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const [
      totalLogs,
      actionStats,
      resourceStats,
      userStats,
      dailyStats,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['timestamp'],
        where,
        _count: { timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
    ]);

    return {
      totalLogs,
      actionStats: actionStats.map((stat: any) => ({
        action: stat.action,
        count: stat._count.action,
      })),
      resourceStats: resourceStats.map((stat: any) => ({
        resource: stat.resource,
        count: stat._count.resource,
      })),
      userStats: userStats.map((stat: any) => ({
        userId: stat.userId,
        count: stat._count.userId,
      })),
      dailyStats: dailyStats.map((stat: any) => ({
        date: stat.timestamp,
        count: stat._count.timestamp,
      })),
    };
  }

  /**
   * Clean up old audit logs
   * @param organizationId - Organization ID
   * @param olderThanDays - Delete logs older than this many days
   */
  async cleanupOldLogs(organizationId: string, olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        organizationId,
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Export audit logs to CSV format
   * @param organizationId - Organization ID
   * @param startDate - Start date
   * @param endDate - End date
   */
  async exportAuditLogs(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const where: any = { organizationId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    const csvHeaders = [
      'Timestamp',
      'User ID',
      'Action',
      'Resource',
      'Resource ID',
      'Organization ID',
      'IP Address',
      'User Agent',
      'Details',
    ];

    const csvRows = logs.map((log: any) => [
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.resource,
      log.resourceId,
      log.organizationId,
      log.ipAddress,
      log.userAgent,
      JSON.stringify(log.details),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}

/**
 * Audit logging middleware for API routes
 */
export function withAuditLogging<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  options: {
    action: AuditLogAction;
    resource: AuditLogResource;
    getResourceId?: (...args: T) => string;
    getDetails?: (...args: T) => Record<string, any>;
  }
) {
  return async (...args: T): Promise<Response> => {
    const [request] = args;
    const response = await handler(...args);

    // Extract user information from request if available
    const userId = request?.user?.id || 'ANONYMOUS';
    const organizationId = request?.user?.organizationId || 'UNKNOWN';
    const resourceId = options.getResourceId?.(...args) || 'UNKNOWN';

    // Log the action
    const auditService = new AuditLoggingService(new PrismaClient());
    await auditService.logUserAction(
      userId,
      options.action,
      options.resource,
      resourceId,
      organizationId,
      options.getDetails?.(...args),
      request
    );

    return response;
  };
}

/**
 * Audit logging decorator for service methods
 */
export function auditLog(
  action: AuditLogAction,
  resource: AuditLogResource,
  getResourceId?: (args: any[]) => string,
  getDetails?: (args: any[], result: any) => Record<string, any>
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);

      // Extract user information from context if available
      const userId = (this as any).userId || 'SYSTEM';
      const organizationId = (this as any).organizationId || 'UNKNOWN';
      const resourceId = getResourceId?.(args) || 'UNKNOWN';

      // Log the action
      const auditService = new AuditLoggingService(new PrismaClient());
      await auditService.logUserAction(
        userId,
        action,
        resource,
        resourceId,
        organizationId,
        getDetails?.(args, result)
      );

      return result;
    };

    return descriptor;
  };
}
