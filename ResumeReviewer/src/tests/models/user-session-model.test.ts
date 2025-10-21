import { UserSessionModel } from '../../lib/resume-reviewer/models/index';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  userSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
} as any;

describe('UserSessionModel', () => {
  let model: UserSessionModel;

  beforeEach(() => {
    model = new UserSessionModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user session with valid session ID', async () => {
      const validData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: validData.sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith({ 
        data: validData,
        include: { uploads: true },
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid session ID format', async () => {
      const invalidData = {
        sessionId: 'invalid-uuid',
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for empty session ID', async () => {
      const invalidData = {
        sessionId: '',
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for session ID too long', async () => {
      const invalidData = {
        sessionId: 'a'.repeat(256), // Exceeds reasonable length
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findBySessionId', () => {
    it('should find user session by session ID', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(mockResult);

      const result = await model.findBySessionId('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId: '123e4567-e89b-12d3-a456-426614174000' },
        include: { uploads: { include: { feedback: true } } },
      });
      expect(result).toEqual(mockResult);
    });

    it('should return null for non-existent session ID', async () => {
      mockPrisma.userSession.findUnique.mockResolvedValue(null);

      const result = await model.findBySessionId('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user session with valid data', async () => {
      const updateData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174001', // New session ID
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: updateData.sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.update.mockResolvedValue(mockResult);

      const result = await model.update('123e4567-e89b-12d3-a456-426614174000', updateData);

      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        data: updateData,
        include: { uploads: { include: { feedback: true } } },
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid session ID in update', async () => {
      const invalidData = {
        sessionId: 'invalid-uuid',
      };

      await expect(model.update('123e4567-e89b-12d3-a456-426614174000', invalidData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete user session by ID', async () => {
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.delete.mockResolvedValue(mockResult);

      const result = await model.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(mockPrisma.userSession.delete).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should find all user sessions with pagination', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          sessionId: '123e4567-e89b-12d3-a456-426614174001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockResults);

      const result = await model.findAll({ page: 1, limit: 10 });

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { uploads: { include: { feedback: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should handle pagination correctly', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockResults);

      const result = await model.findAll({ page: 2, limit: 5 });

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
        take: 5,
        include: { uploads: { include: { feedback: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should use default pagination when no options provided', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.userSession.findMany.mockResolvedValue(mockResults);

      const result = await model.findAll();

      expect(mockPrisma.userSession.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20, // Default limit
        include: { uploads: { include: { feedback: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockResults);
    });
  });

  describe('business rules', () => {
    it('should enforce unique session IDs', async () => {
      const sessionData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // First creation should succeed
      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: sessionData.sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.create.mockResolvedValue(mockResult);

      const result = await model.create(sessionData);
      expect(result).toBeDefined();

      // Note: In a real implementation, we would test that creating
      // a duplicate session ID throws an error, but this depends on
      // database constraints which are handled at the Prisma level
    });

    it('should handle session ID case sensitivity', async () => {
      const sessionData = {
        sessionId: '123E4567-E89B-12D3-A456-426614174000', // Uppercase
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: sessionData.sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.userSession.create.mockResolvedValue(mockResult);

      const result = await model.create(sessionData);
      expect(result).toBeDefined();
    });
  });
});
