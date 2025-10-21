import { SessionModel } from '../../../lib/resume-reviewer/models/session-model';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    }
  }))
}));

describe('SessionModel', () => {
  let sessionModel: SessionModel;
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
    
    // Mock the count method
    mockPrismaClient.session.count = jest.fn();
    
    sessionModel = new SessionModel(mockPrismaClient);
  });

  describe('Session Creation', () => {
    it('should create a new session successfully', async () => {
      const sessionData = {
        userId: 'user-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const mockSession = {
        id: 'session-123',
        ...sessionData,
        createdAt: new Date()
      };

      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      const result = await sessionModel.create(sessionData);

      expect(result).toEqual(mockSession);
      expect(mockPrismaClient.session.create).toHaveBeenCalledWith({
        data: sessionData
      });
    });

    it('should handle session creation errors', async () => {
      const sessionData = {
        userId: 'user-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      mockPrismaClient.session.create.mockRejectedValue(new Error('Database error'));

      await expect(sessionModel.create(sessionData)).rejects.toThrow('Database error');
    });

    it('should validate required fields', async () => {
      const sessionData = {
        userId: '',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      await expect(sessionModel.create(sessionData)).rejects.toThrow('User ID is required');
    });
  });

  describe('Session Retrieval', () => {
    it('should find session by token', async () => {
      const token = 'jwt-token';
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      };

      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await sessionModel.findByToken(token);

      expect(result).toEqual(mockSession);
      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { token: token }
      });
    });

    it('should find sessions by user ID', async () => {
      const userId = 'user-123';
      const mockSessions = [
        {
          id: 'session-1',
          userId: userId,
          token: 'token-1',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          createdAt: new Date()
        },
        {
          id: 'session-2',
          userId: userId,
          token: 'token-2',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          createdAt: new Date()
        }
      ];

      mockPrismaClient.session.findMany.mockResolvedValue(mockSessions);

      const result = await sessionModel.findByUserId(userId);

      expect(result).toEqual(mockSessions);
      expect(mockPrismaClient.session.findMany).toHaveBeenCalledWith({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should return null for non-existent session', async () => {
      const token = 'non-existent-token';

      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await sessionModel.findByToken(token);

      expect(result).toBeNull();
    });

    it('should find active sessions only', async () => {
      const userId = 'user-123';
      const mockActiveSessions = [
        {
          id: 'session-1',
          userId: userId,
          token: 'token-1',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          createdAt: new Date()
        }
      ];

      mockPrismaClient.session.findMany.mockResolvedValue(mockActiveSessions);

      const result = await sessionModel.findActiveByUserId(userId);

      expect(result).toEqual(mockActiveSessions);
      expect(mockPrismaClient.session.findMany).toHaveBeenCalledWith({
        where: { 
          userId: userId,
          expiresAt: { gt: expect.any(Date) }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });
  });

  describe('Session Updates', () => {
    it('should update session successfully', async () => {
      const sessionId = 'session-123';
      const updateData = {
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };

      const mockUpdatedSession = {
        id: sessionId,
        userId: 'user-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        ...updateData,
        createdAt: new Date()
      };

      mockPrismaClient.session.update.mockResolvedValue(mockUpdatedSession);

      const result = await sessionModel.update(sessionId, updateData);

      expect(result).toEqual(mockUpdatedSession);
      expect(mockPrismaClient.session.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: updateData
      });
    });

    it('should extend session expiration', async () => {
      const sessionId = 'session-123';
      const newExpirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const mockUpdatedSession = {
        id: sessionId,
        userId: 'user-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        expiresAt: newExpirationDate,
        createdAt: new Date()
      };

      mockPrismaClient.session.update.mockResolvedValue(mockUpdatedSession);

      const result = await sessionModel.extendExpiration(sessionId, newExpirationDate);

      expect(result).toEqual(mockUpdatedSession);
      expect(mockPrismaClient.session.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { expiresAt: newExpirationDate }
      });
    });

    it('should handle update errors', async () => {
      const sessionId = 'session-123';
      const updateData = {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      mockPrismaClient.session.update.mockRejectedValue(new Error('Update failed'));

      await expect(sessionModel.update(sessionId, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('Session Deletion', () => {
    it('should delete session by ID successfully', async () => {
      const sessionId = 'session-123';

      const mockDeletedSession = {
        id: sessionId,
        userId: 'user-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      };

      mockPrismaClient.session.delete.mockResolvedValue(mockDeletedSession);

      const result = await sessionModel.delete(sessionId);

      expect(result).toEqual(mockDeletedSession);
      expect(mockPrismaClient.session.delete).toHaveBeenCalledWith({
        where: { id: sessionId }
      });
    });

    it('should delete session by token successfully', async () => {
      const token = 'jwt-token';

      const mockDeletedSession = {
        id: 'session-123',
        userId: 'user-123',
        token: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      };

      mockPrismaClient.session.delete.mockResolvedValue(mockDeletedSession);

      const result = await sessionModel.deleteByToken(token);

      expect(result).toEqual(mockDeletedSession);
      expect(mockPrismaClient.session.delete).toHaveBeenCalledWith({
        where: { token: token }
      });
    });

    it('should delete all sessions for a user', async () => {
      const userId = 'user-123';

      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 3 });

      const result = await sessionModel.deleteByUserId(userId);

      expect(result).toBe(3);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId }
      });
    });

    it('should handle deletion errors', async () => {
      const sessionId = 'session-123';

      mockPrismaClient.session.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(sessionModel.delete(sessionId)).rejects.toThrow('Delete failed');
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up expired sessions', async () => {
      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 5 });

      const result = await sessionModel.cleanupExpired();

      expect(result).toBe(5);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } }
      });
    });

    it('should clean up sessions older than specified date', async () => {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      mockPrismaClient.session.deleteMany.mockResolvedValue({ count: 2 });

      const result = await sessionModel.cleanupOlderThan(cutoffDate);

      expect(result).toBe(2);
      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: cutoffDate } }
      });
    });
  });

  describe('Session Validation', () => {
    it('should validate session expiration', async () => {
      const token = 'valid-token';
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        createdAt: new Date()
      };

      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await sessionModel.isValid(token);

      expect(result).toBe(true);
    });

    it('should detect expired session', async () => {
      const token = 'expired-token';
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: token,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date()
      };

      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await sessionModel.isValid(token);

      expect(result).toBe(false);
    });

    it('should detect non-existent session', async () => {
      const token = 'non-existent-token';

      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await sessionModel.isValid(token);

      expect(result).toBe(false);
    });
  });

  describe('Session Security', () => {
    it('should generate secure session tokens', async () => {
      const sessionData = {
        userId: 'user-123',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.signature',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const mockSession = {
        id: 'session-123',
        ...sessionData,
        createdAt: new Date()
      };

      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      const result = await sessionModel.create(sessionData);

      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // JWT format
    });

    it('should limit concurrent sessions per user', async () => {
      const userId = 'user-123';
      const maxSessions = 5;

      const mockSessions = Array.from({ length: maxSessions }, (_, i) => ({
        id: `session-${i}`,
        userId: userId,
        token: `token-${i}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      }));

      mockPrismaClient.session.count.mockResolvedValue(maxSessions);

      const result = await sessionModel.getSessionCount(userId);

      expect(result).toBe(maxSessions);
    });

    it('should enforce session limits', async () => {
      const userId = 'user-123';
      const maxSessions = 5;

      const mockSessions = Array.from({ length: maxSessions }, (_, i) => ({
        id: `session-${i}`,
        userId: userId,
        token: `token-${i}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date()
      }));

      mockPrismaClient.session.count.mockResolvedValue(maxSessions);

      const result = await sessionModel.canCreateNewSession(userId, maxSessions);

      expect(result).toBe(false);
    });
  });
});
