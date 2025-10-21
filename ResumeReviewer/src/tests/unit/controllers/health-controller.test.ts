import { NextRequest } from 'next/server';
import { HealthController } from '../../../lib/resume-reviewer/controllers/health-controller';
import { ModelFactory } from '../../../lib/resume-reviewer/models';

// Mock the models
jest.mock('../../../lib/resume-reviewer/models');

describe('HealthController', () => {
  let controller: HealthController;
  let mockModelFactory: jest.Mocked<typeof ModelFactory>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModelFactory = ModelFactory as jest.Mocked<typeof ModelFactory>;
    
    controller = new HealthController();
  });

  describe('GET /api/v1/health', () => {
    it('should return healthy status when all services are operational', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'healthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 150,
        memoryUsage: 512,
        cpuUsage: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        metrics: {
          responseTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          cpuUsage: expect.any(Number)
        },
        uptime: expect.any(Number)
      });
    });

    it('should return degraded status when some services are degraded', async () => {
      const mockRequest = {
        headers: new Headers({
          'x-simulate-ai-degraded': 'true'
        })
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'degraded',
        services: {
          database: 'healthy',
          ai_service: 'degraded',
          file_storage: 'healthy'
        },
        responseTime: 500,
        memoryUsage: 1024,
        cpuUsage: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        status: 'degraded',
        timestamp: expect.any(String),
        services: {
          database: 'healthy',
          ai_service: 'degraded',
          file_storage: 'healthy'
        },
        metrics: {
          responseTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          cpuUsage: expect.any(Number)
        },
        uptime: expect.any(Number)
      });
    });

    it('should return unhealthy status when critical services are down', async () => {
      const mockRequest = {
        headers: new Headers({
          'x-simulate-db-unhealthy': 'true'
        })
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'unhealthy',
        services: {
          database: 'unhealthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 2000,
        memoryUsage: 2048,
        cpuUsage: 95,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(503);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        services: {
          database: 'unhealthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        metrics: {
          responseTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          cpuUsage: expect.any(Number)
        },
        uptime: expect.any(Number)
      });
    });

    it('should handle database connection errors', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(503);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        services: {
          database: 'unhealthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        metrics: {
          responseTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          cpuUsage: expect.any(Number)
        },
        uptime: expect.any(Number),
        error: 'Database connection failed'
      });
    });

    it('should handle AI service simulation headers', async () => {
      const mockRequest = {
        headers: new Headers({
          'x-simulate-ai-degraded': 'true'
        })
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'degraded',
        services: {
          database: 'healthy',
          ai_service: 'degraded',
          file_storage: 'healthy'
        },
        responseTime: 300,
        memoryUsage: 512,
        cpuUsage: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.services.ai_service).toBe('degraded');
    });

    it('should handle storage service simulation headers', async () => {
      const mockRequest = {
        headers: new Headers({
          'x-simulate-storage-unhealthy': 'true'
        })
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'unhealthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'unhealthy'
        },
        responseTime: 400,
        memoryUsage: 512,
        cpuUsage: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(503);
      const responseData = await response.json();
      expect(responseData.services.file_storage).toBe('unhealthy');
    });

    it('should handle database simulation headers', async () => {
      const mockRequest = {
        headers: new Headers({
          'x-simulate-db-unhealthy': 'true'
        })
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'unhealthy',
        services: {
          database: 'unhealthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 1000,
        memoryUsage: 512,
        cpuUsage: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockRejectedValue(new Error('Simulated database error'))
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(503);
      const responseData = await response.json();
      expect(responseData.services.database).toBe('unhealthy');
    });

    it('should handle service unavailable simulation headers', async () => {
      const mockRequest = {
        headers: new Headers({
          'x-simulate-service-unavailable': 'true'
        })
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'unhealthy',
        services: {
          database: 'unhealthy',
          ai_service: 'unhealthy',
          file_storage: 'unhealthy'
        },
        responseTime: 5000,
        memoryUsage: 2048,
        cpuUsage: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockRejectedValue(new Error('Service unavailable'))
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(503);
      const responseData = await response.json();
      expect(responseData.status).toBe('unhealthy');
      expect(responseData.services.database).toBe('unhealthy');
      expect(responseData.services.ai_service).toBe('unhealthy');
      expect(responseData.services.file_storage).toBe('unhealthy');
    });

    it('should include proper metrics in response', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'healthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 150,
        memoryUsage: 512,
        cpuUsage: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.metrics).toMatchObject({
        responseTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        cpuUsage: expect.any(Number)
      });
      expect(responseData.metrics.responseTime).toBeGreaterThan(0);
      expect(responseData.metrics.memoryUsage).toBeGreaterThan(0);
      expect(responseData.metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should include uptime in response', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'healthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 150,
        memoryUsage: 512,
        cpuUsage: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.uptime).toBeGreaterThan(0);
    });

    it('should handle concurrent health check requests', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'healthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 150,
        memoryUsage: 512,
        cpuUsage: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      // Simulate concurrent health check requests
      const promises = Array.from({ length: 5 }, () => controller.getHealth(mockRequest));
      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      // Mock an unexpected error
      mockModelFactory.getHealthLogModel.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await controller.getHealth(mockRequest);

      expect(response.status).toBe(503);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        services: {
          database: 'unhealthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        metrics: {
          responseTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          cpuUsage: expect.any(Number)
        },
        uptime: expect.any(Number),
        error: 'Unexpected error'
      });
    });

    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      mockModelFactory.getHealthLogModel.mockImplementation(() => {
        throw new Error('Test error');
      });

      await controller.getHealth(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith('Health check error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const mockRequest = {
        headers: new Headers()
      } as unknown as NextRequest;

      const mockHealthLog = {
        id: 'health-123',
        timestamp: new Date(),
        status: 'healthy',
        services: {
          database: 'healthy',
          ai_service: 'healthy',
          file_storage: 'healthy'
        },
        responseTime: 150,
        memoryUsage: 512,
        cpuUsage: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockModelFactory.getHealthLogModel.mockReturnValue({
        create: jest.fn().mockResolvedValue(mockHealthLog),
        getPrismaClient: jest.fn().mockReturnValue({
          $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }])
        })
      } as any);

      const startTime = Date.now();
      const response = await controller.getHealth(mockRequest);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
