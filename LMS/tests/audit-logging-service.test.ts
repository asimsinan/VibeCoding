import { AuditLoggingService } from '../services/audit-logging.service';
import { PrismaClient, AuditLogAction, AuditLogResource } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
  AuditLogAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    PASSWORD_RESET: 'PASSWORD_RESET',
    PUBLISH: 'PUBLISH',
    ARCHIVE: 'ARCHIVE',
    ROLE_CHANGE: 'ROLE_CHANGE',
    UPLOAD: 'UPLOAD',
    DOWNLOAD: 'DOWNLOAD',
    SUBMIT: 'SUBMIT',
    GRADE: 'GRADE',
    COMPLETE: 'COMPLETE',
  },
  AuditLogResource: {
    USER: 'USER',
    ORGANIZATION: 'ORGANIZATION',
    COURSE: 'COURSE',
    MODULE: 'MODULE',
    LESSON: 'LESSON',
    QUIZ: 'QUIZ',
    QUESTION: 'QUESTION',
    ENROLLMENT: 'ENROLLMENT',
    PROGRESS: 'PROGRESS',
    QUIZ_ATTEMPT: 'QUIZ_ATTEMPT',
    FILE: 'FILE',
    SYSTEM: 'SYSTEM',
  },
}));

describe('AuditLoggingService', () => {
  let auditService: AuditLoggingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    auditService = new AuditLoggingService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logUserAction', () => {
    it('should log a user action successfully', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn()
            .mockReturnValueOnce('192.168.1.1') // x-forwarded-for
            .mockReturnValueOnce('Mozilla/5.0') // user-agent
        }
      } as any;

      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logUserAction(
        'user-123',
        AuditLogAction.CREATE,
        AuditLogResource.COURSE,
        'course-123',
        'org-123',
        { title: 'Test Course' },
        mockRequest
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: AuditLogAction.CREATE,
          resource: AuditLogResource.COURSE,
          resourceId: 'course-123',
          organizationId: 'org-123',
          details: { title: 'Test Course' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: expect.any(Date),
        },
      });
    });

    it('should handle missing request gracefully', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logUserAction(
        'user-123',
        AuditLogAction.CREATE,
        AuditLogResource.COURSE,
        'course-123',
        'org-123'
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: AuditLogAction.CREATE,
          resource: AuditLogResource.COURSE,
          resourceId: 'course-123',
          organizationId: 'org-123',
          details: {},
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(auditService.logUserAction(
        'user-123',
        AuditLogAction.CREATE,
        AuditLogResource.COURSE,
        'course-123',
        'org-123'
      )).resolves.toBeUndefined();
    });
  });

  describe('logAuthentication', () => {
    it('should log authentication events', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logAuthentication(
        'user-123',
        'LOGIN',
        'org-123',
        { method: 'credentials' }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-123',
          organizationId: 'org-123',
          details: { method: 'credentials' },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logOrganizationOperation', () => {
    it('should log organization operations', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logOrganizationOperation(
        'user-123',
        'CREATE',
        'org-123',
        { name: 'New Organization' }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'CREATE',
          resource: 'ORGANIZATION',
          resourceId: 'org-123',
          organizationId: 'org-123',
          details: { name: 'New Organization' },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logUserManagement', () => {
    it('should log user management operations', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logUserManagement(
        'admin-123',
        'ROLE_CHANGE',
        'user-123',
        'org-123',
        { oldRole: 'STUDENT', newRole: 'INSTRUCTOR' }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-123',
          action: 'ROLE_CHANGE',
          resource: 'USER',
          resourceId: 'user-123',
          organizationId: 'org-123',
          details: { oldRole: 'STUDENT', newRole: 'INSTRUCTOR' },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logCourseOperation', () => {
    it('should log course operations', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logCourseOperation(
        'instructor-123',
        'PUBLISH',
        'course-123',
        'org-123',
        { status: 'PUBLISHED' }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'instructor-123',
          action: 'PUBLISH',
          resource: 'COURSE',
          resourceId: 'course-123',
          organizationId: 'org-123',
          details: { status: 'PUBLISHED' },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logEnrollmentOperation', () => {
    it('should log enrollment operations', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logEnrollmentOperation(
        'student-123',
        'COMPLETE',
        'enrollment-123',
        'org-123',
        { courseId: 'course-123', completedAt: new Date() }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'student-123',
          action: 'COMPLETE',
          resource: 'ENROLLMENT',
          resourceId: 'enrollment-123',
          organizationId: 'org-123',
          details: { courseId: 'course-123', completedAt: expect.any(Date) },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logQuizOperation', () => {
    it('should log quiz operations', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logQuizOperation(
        'student-123',
        'SUBMIT',
        'quiz-123',
        'org-123',
        { score: 85, timeSpent: 1200 }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'student-123',
          action: 'SUBMIT',
          resource: 'QUIZ',
          resourceId: 'quiz-123',
          organizationId: 'org-123',
          details: { score: 85, timeSpent: 1200 },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logFileOperation', () => {
    it('should log file operations', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logFileOperation(
        'user-123',
        'UPLOAD',
        'file-123',
        'org-123',
        { filename: 'document.pdf', size: 1024 }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'UPLOAD',
          resource: 'FILE',
          resourceId: 'file-123',
          organizationId: 'org-123',
          details: { filename: 'document.pdf', size: 1024 },
          ipAddress: 'unknown',
          userAgent: 'unknown',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('logSystemEvent', () => {
    it('should log system events', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

      await auditService.logSystemEvent(
        AuditLogAction.CREATE,
        AuditLogResource.SYSTEM,
        'system-123',
        'org-123',
        { event: 'database_backup' }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'SYSTEM',
          action: AuditLogAction.CREATE,
          resource: AuditLogResource.SYSTEM,
          resourceId: 'system-123',
          organizationId: 'org-123',
          details: { event: 'database_backup' },
          ipAddress: 'SYSTEM',
          userAgent: 'SYSTEM',
          timestamp: expect.any(Date),
        },
      });
    });
  });

  describe('getUserAuditLogs', () => {
    it('should get user audit logs with pagination', async () => {
      const mockLogs = [
        { id: 'log-1', userId: 'user-123', action: 'CREATE', resource: 'COURSE' },
        { id: 'log-2', userId: 'user-123', action: 'UPDATE', resource: 'COURSE' },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const result = await auditService.getUserAuditLogs(
        'user-123',
        'org-123',
        1,
        10
      );

      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          organizationId: 'org-123',
        },
        skip: 0,
        take: 10,
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should apply filters correctly', async () => {
      const mockLogs = [{ id: 'log-1', userId: 'user-123', action: 'CREATE' }];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await auditService.getUserAuditLogs(
        'user-123',
        'org-123',
        1,
        10,
        {
          action: AuditLogAction.CREATE,
          resource: AuditLogResource.COURSE,
          startDate,
          endDate,
        }
      );

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          organizationId: 'org-123',
          action: AuditLogAction.CREATE,
          resource: AuditLogResource.COURSE,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        skip: 0,
        take: 10,
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('getResourceAuditLogs', () => {
    it('should get resource audit logs', async () => {
      const mockLogs = [
        { id: 'log-1', resource: 'COURSE', resourceId: 'course-123' },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await auditService.getResourceAuditLogs(
        AuditLogResource.COURSE,
        'course-123',
        'org-123',
        1,
        10
      );

      expect(result).toEqual({
        logs: mockLogs,
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });
  });

  describe('getOrganizationAuditLogs', () => {
    it('should get organization audit logs', async () => {
      const mockLogs = [
        { id: 'log-1', organizationId: 'org-123' },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await auditService.getOrganizationAuditLogs(
        'org-123',
        1,
        10
      );

      expect(result).toEqual({
        logs: mockLogs,
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });
  });

  describe('getAuditLogStatistics', () => {
    it('should get audit log statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        actionStats: [{ action: 'CREATE', count: 50 }],
        resourceStats: [{ resource: 'COURSE', count: 30 }],
        userStats: [{ userId: 'user-123', count: 20 }],
        dailyStats: [{ date: new Date(), count: 5 }],
      };

      mockPrisma.auditLog.count.mockResolvedValue(100);
      mockPrisma.auditLog.groupBy
        .mockResolvedValueOnce([{ action: 'CREATE', _count: { action: 50 } }])
        .mockResolvedValueOnce([{ resource: 'COURSE', _count: { resource: 30 } }])
        .mockResolvedValueOnce([{ userId: 'user-123', _count: { userId: 20 } }])
        .mockResolvedValueOnce([{ timestamp: new Date(), _count: { timestamp: 5 } }]);

      const result = await auditService.getAuditLogStatistics('org-123');

      expect(result.totalLogs).toBe(100);
      expect(result.actionStats).toEqual([{ action: 'CREATE', count: 50 }]);
      expect(result.resourceStats).toEqual([{ resource: 'COURSE', count: 30 }]);
      expect(result.userStats).toEqual([{ userId: 'user-123', count: 20 }]);
      expect(result.dailyStats).toEqual([{ date: expect.any(Date), count: 5 }]);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should clean up old audit logs', async () => {
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 50 });

      const result = await auditService.cleanupOldLogs('org-123', 365);

      expect(result).toBe(50);
      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs to CSV', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          timestamp: new Date('2024-01-01'),
          userId: 'user-123',
          action: 'CREATE',
          resource: 'COURSE',
          resourceId: 'course-123',
          organizationId: 'org-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: { title: 'Test Course' },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await auditService.exportAuditLogs('org-123');

      expect(result).toContain('Timestamp,User ID,Action,Resource,Resource ID,Organization ID,IP Address,User Agent,Details');
      expect(result).toContain('"2024-01-01T00:00:00.000Z","user-123","CREATE","COURSE","course-123","org-123","192.168.1.1","Mozilla/5.0","{\\"title\\":\\"Test Course\\"}"');
    });
  });
});
