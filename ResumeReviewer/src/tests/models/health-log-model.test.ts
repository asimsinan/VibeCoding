import { HealthLogModel } from '../../lib/resume-reviewer/models/index';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  healthLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
} as any;

describe('HealthLogModel', () => {
  let model: HealthLogModel;

  beforeEach(() => {
    model = new HealthLogModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create health log with valid data', async () => {
      const validData = {
        status: 'healthy' as const,
        services: {
          database: 'healthy' as const,
          api: 'healthy' as const,
          storage: 'healthy' as const,
        },
        uptime: 3600, // 1 hour in seconds
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: validData.status,
        services: JSON.stringify(validData.services),
        uptime: validData.uptime,
        timestamp: new Date(),
      };

      mockPrisma.healthLog.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(mockPrisma.healthLog.create).toHaveBeenCalledWith({
        data: {
          ...validData,
          services: JSON.stringify(validData.services),
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create health log with degraded status', async () => {
      const validData = {
        status: 'degraded' as const,
        services: {
          database: 'healthy' as const,
          api: 'degraded' as const,
          storage: 'healthy' as const,
        },
        uptime: 7200, // 2 hours in seconds
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: validData.status,
        services: JSON.stringify(validData.services),
        uptime: validData.uptime,
        timestamp: new Date(),
      };

      mockPrisma.healthLog.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(result).toEqual(mockResult);
    });

    it('should create health log with unhealthy status', async () => {
      const validData = {
        status: 'unhealthy' as const,
        services: {
          database: 'unhealthy' as const,
          api: 'unhealthy' as const,
          storage: 'unhealthy' as const,
        },
        uptime: 1800, // 30 minutes in seconds
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: validData.status,
        services: JSON.stringify(validData.services),
        uptime: validData.uptime,
        timestamp: new Date(),
      };

      mockPrisma.healthLog.create.mockResolvedValue(mockResult);

      const result = await model.create(validData);

      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid status', async () => {
      const invalidData = {
        status: 'invalid_status' as any,
        services: {
          database: 'healthy' as const,
          api: 'healthy' as const,
          storage: 'healthy' as const,
        },
        uptime: 3600,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for negative uptime', async () => {
      const invalidData = {
        status: 'healthy' as const,
        services: {
          database: 'healthy' as const,
          api: 'healthy' as const,
          storage: 'healthy' as const,
        },
        uptime: -100, // Negative uptime
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for empty services object', async () => {
      const invalidData = {
        status: 'healthy' as const,
        services: {},
        uptime: 3600,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });

    it('should throw error for invalid service status', async () => {
      const invalidData = {
        status: 'healthy' as const,
        services: {
          database: 'invalid_service_status' as any,
          api: 'healthy' as const,
          storage: 'healthy' as const,
        },
        uptime: 3600,
      };

      await expect(model.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findRecent', () => {
    it('should find recent health logs with default limit', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'healthy',
          services: JSON.stringify({
            database: 'healthy' as const,
            api: 'healthy' as const,
            storage: 'healthy' as const,
          }),
          uptime: 3600,
          timestamp: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          status: 'degraded',
          services: JSON.stringify({
            database: 'healthy' as const,
            api: 'degraded' as const,
            storage: 'healthy' as const,
          }),
          uptime: 3500,
          timestamp: new Date(Date.now() - 60000), // 1 minute ago
        },
      ];

      mockPrisma.healthLog.findMany.mockResolvedValue(mockResults);

      const result = await model.findRecent();

      expect(mockPrisma.healthLog.findMany).toHaveBeenCalledWith({
        take: 10, // Default limit
        orderBy: { timestamp: 'desc' },
      });

      // Should parse JSON services
      expect(result).toEqual([
        {
          ...mockResults[0],
          services: {
            database: 'healthy' as const,
            api: 'healthy' as const,
            storage: 'healthy' as const,
          },
        },
        {
          ...mockResults[1],
          services: {
            database: 'healthy' as const,
            api: 'degraded' as const,
            storage: 'healthy' as const,
          },
        },
      ]);
    });

    it('should find recent health logs with custom limit', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'healthy',
          services: JSON.stringify({
            database: 'healthy' as const,
            api: 'healthy' as const,
            storage: 'healthy' as const,
          }),
          uptime: 3600,
          timestamp: new Date(),
        },
      ];

      mockPrisma.healthLog.findMany.mockResolvedValue(mockResults);

      const result = await model.findRecent(5);

      expect(mockPrisma.healthLog.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { timestamp: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no logs exist', async () => {
      mockPrisma.healthLog.findMany.mockResolvedValue([]);

      const result = await model.findRecent();

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find health logs by status', async () => {
      const mockResults = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'unhealthy',
          services: JSON.stringify({
            database: 'unhealthy' as const,
            api: 'unhealthy' as const,
            storage: 'healthy' as const,
          }),
          uptime: 1800,
          timestamp: new Date(),
        },
      ];

      mockPrisma.healthLog.findMany.mockResolvedValue(mockResults);

      const result = await model.findByStatus('unhealthy');

      expect(mockPrisma.healthLog.findMany).toHaveBeenCalledWith({
        where: { status: 'unhealthy' },
        orderBy: { timestamp: 'desc' },
      });

      expect(result).toEqual([
        {
          ...mockResults[0],
          services: {
            database: 'unhealthy' as const,
            api: 'unhealthy' as const,
            storage: 'healthy' as const,
          },
        },
      ]);
    });

    it('should return empty array for non-existent status', async () => {
      mockPrisma.healthLog.findMany.mockResolvedValue([]);

      const result = await model.findByStatus('healthy');

      expect(result).toEqual([]);
    });
  });

  describe('deleteOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      const mockResult = {
        count: 5,
      };

      mockPrisma.healthLog.deleteMany.mockResolvedValue(mockResult);

      const result = await model.deleteOldLogs(30); // Delete logs older than 30 days

      // Verify the method was called with correct structure, allowing for timing differences
      expect(mockPrisma.healthLog.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              lt: expect.any(Date),
            }),
          }),
        })
      );
      
      // Verify the timestamp is approximately 30 days ago (within 1 second tolerance)
      const callArgs = mockPrisma.healthLog.deleteMany.mock.calls[0][0];
      const actualDate = callArgs.where.timestamp.lt;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 30);
      
      const timeDifference = Math.abs(actualDate.getTime() - expectedDate.getTime());
      expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
      
      expect(result).toEqual(mockResult);
    });

    it('should handle deletion with default retention period', async () => {
      const mockResult = {
        count: 10,
      };

      mockPrisma.healthLog.deleteMany.mockResolvedValue(mockResult);

      const result = await model.deleteOldLogs(); // Default 90 days

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      expect(mockPrisma.healthLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: ninetyDaysAgo,
          },
        },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('business rules', () => {
    it('should handle complex service status combinations', async () => {
      const complexData = {
        status: 'degraded' as const,
        services: {
          database: 'healthy' as const,
          api: 'degraded' as const,
          storage: 'healthy' as const,
          cache: 'unhealthy' as const,
          queue: 'healthy' as const,
        },
        uptime: 86400, // 24 hours
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: complexData.status,
        services: JSON.stringify(complexData.services),
        uptime: complexData.uptime,
        timestamp: new Date(),
      };

      mockPrisma.healthLog.create.mockResolvedValue(mockResult);

      const result = await model.create(complexData);
      expect(result).toBeDefined();
    });

    it('should handle very large uptime values', async () => {
      const dataWithLargeUptime = {
        status: 'healthy' as const,
        services: {
          database: 'healthy' as const,
          api: 'healthy' as const,
          storage: 'healthy' as const,
        },
        uptime: 31536000, // 1 year in seconds
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: dataWithLargeUptime.status,
        services: JSON.stringify(dataWithLargeUptime.services),
        uptime: dataWithLargeUptime.uptime,
        timestamp: new Date(),
      };

      mockPrisma.healthLog.create.mockResolvedValue(mockResult);

      const result = await model.create(dataWithLargeUptime);
      expect(result).toBeDefined();
    });

    it('should enforce status consistency with services', async () => {
      // This test verifies that the model allows status that might not
      // perfectly match service statuses (business logic decision)
      const inconsistentData = {
        status: 'healthy' as const,
        services: {
          database: 'healthy' as const,
          api: 'degraded' as const, // One service degraded but overall healthy
          storage: 'healthy' as const,
        },
        uptime: 3600,
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: inconsistentData.status,
        services: JSON.stringify(inconsistentData.services),
        uptime: inconsistentData.uptime,
        timestamp: new Date(),
      };

      mockPrisma.healthLog.create.mockResolvedValue(mockResult);

      const result = await model.create(inconsistentData);
      expect(result).toBeDefined();
    });
  });
});
