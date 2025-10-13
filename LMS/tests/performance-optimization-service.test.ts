import { PerformanceOptimizationService, PerformanceMetrics } from '../services/performance-optimization.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

describe('PerformanceOptimizationService', () => {
  let performanceService: PerformanceOptimizationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      course: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    performanceService = new PerformanceOptimizationService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withQueryCache', () => {
    it('should return cached result if available', async () => {
      const cacheKey = 'test-cache-key';
      const mockResult = { id: '1', name: 'Test' };
      
      // Mock cache service
      const mockCacheService = {
        get: jest.fn().mockReturnValue(mockResult),
        set: jest.fn(),
      };
      
      // Replace the cache service temporarily
      const originalCacheService = require('../services/caching.service').cacheService;
      require('../services/caching.service').cacheService = mockCacheService;

      const query = jest.fn().mockResolvedValue(mockResult);
      const result = await performanceService.withQueryCache(cacheKey, query, 300);

      expect(result).toEqual(mockResult);
      expect(query).not.toHaveBeenCalled();
      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);

      // Restore original cache service
      require('../services/caching.service').cacheService = originalCacheService;
    });

    it('should execute query and cache result if not cached', async () => {
      const cacheKey = 'test-cache-key';
      const mockResult = { id: '1', name: 'Test' };
      
      // Mock cache service
      const mockCacheService = {
        get: jest.fn().mockReturnValue(null),
        set: jest.fn(),
      };
      
      // Replace the cache service temporarily
      const originalCacheService = require('../services/caching.service').cacheService;
      require('../services/caching.service').cacheService = mockCacheService;

      const query = jest.fn().mockResolvedValue(mockResult);
      const result = await performanceService.withQueryCache(cacheKey, query, 300);

      expect(result).toEqual(mockResult);
      expect(query).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, mockResult, 300);

      // Restore original cache service
      require('../services/caching.service').cacheService = originalCacheService;
    });
  });

  describe('optimizedPagination', () => {
    it('should return paginated result with metadata', async () => {
      const mockData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const totalCount = 25;
      const page = 2;
      const pageSize = 10;

      const query = jest.fn().mockResolvedValue(mockData);
      const result = await performanceService.optimizedPagination(
        page,
        pageSize,
        totalCount,
        query
      );

      expect(result).toEqual({
        data: mockData,
        total: totalCount,
        page: 2,
        pageSize: 10,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });

      expect(query).toHaveBeenCalledWith(10, 10); // skip = (page - 1) * pageSize
    });

    it('should handle first page correctly', async () => {
      const mockData = [{ id: '1', name: 'Item 1' }];
      const totalCount = 5;
      const page = 1;
      const pageSize = 10;

      const query = jest.fn().mockResolvedValue(mockData);
      const result = await performanceService.optimizedPagination(
        page,
        pageSize,
        totalCount,
        query
      );

      expect(result.page).toBe(1);
      expect(result.hasPrevious).toBe(false);
      expect(result.hasNext).toBe(false);
      expect(query).toHaveBeenCalledWith(0, 10);
    });

    it('should handle last page correctly', async () => {
      const mockData = [{ id: '5', name: 'Item 5' }];
      const totalCount = 25;
      const page = 3;
      const pageSize = 10;

      const query = jest.fn().mockResolvedValue(mockData);
      const result = await performanceService.optimizedPagination(
        page,
        pageSize,
        totalCount,
        query
      );

      expect(result.page).toBe(3);
      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(false);
      expect(query).toHaveBeenCalledWith(20, 10);
    });
  });

  describe('batchProcess', () => {
    it('should process items in batches', async () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
      const batchSize = 10;
      const processor = jest.fn().mockImplementation(async (batch) => 
        batch.map(item => ({ ...item, processed: true }))
      );

      const result = await performanceService.batchProcess(items, batchSize, processor);

      expect(result).toHaveLength(25);
      expect(processor).toHaveBeenCalledTimes(3); // 10, 10, 5 items
      expect(processor).toHaveBeenNthCalledWith(1, items.slice(0, 10));
      expect(processor).toHaveBeenNthCalledWith(2, items.slice(10, 20));
      expect(processor).toHaveBeenNthCalledWith(3, items.slice(20, 25));
    });

    it('should handle empty items array', async () => {
      const items: any[] = [];
      const batchSize = 10;
      const processor = jest.fn().mockResolvedValue([]);

      const result = await performanceService.batchProcess(items, batchSize, processor);

      expect(result).toHaveLength(0);
      expect(processor).not.toHaveBeenCalled();
    });

    it('should handle single batch', async () => {
      const items = [{ id: 1, name: 'Item 1' }];
      const batchSize = 10;
      const processor = jest.fn().mockResolvedValue([{ id: 1, name: 'Item 1', processed: true }]);

      const result = await performanceService.batchProcess(items, batchSize, processor);

      expect(result).toHaveLength(1);
      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(items);
    });
  });

  describe('streamQueryResults', () => {
    it('should stream query results in batches', async () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
      const batchSize = 10;
      const query = jest.fn()
        .mockResolvedValueOnce(mockData.slice(0, 10))
        .mockResolvedValueOnce(mockData.slice(10, 20))
        .mockResolvedValueOnce(mockData.slice(20, 25))
        .mockResolvedValueOnce([]);

      const results: any[] = [];
      for await (const batch of performanceService.streamQueryResults(query, batchSize)) {
        results.push(...batch);
      }

      expect(results).toHaveLength(25);
      expect(query).toHaveBeenCalledTimes(4);
      expect(query).toHaveBeenNthCalledWith(1, 0, 10);
      expect(query).toHaveBeenNthCalledWith(2, 10, 10);
      expect(query).toHaveBeenNthCalledWith(3, 20, 10);
      expect(query).toHaveBeenNthCalledWith(4, 30, 10);
    });

    it('should handle empty results', async () => {
      const query = jest.fn().mockResolvedValue([]);

      const results: any[] = [];
      for await (const batch of performanceService.streamQueryResults(query, 10)) {
        results.push(...batch);
      }

      expect(results).toHaveLength(0);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('monitorQuery', () => {
    it('should monitor query execution time', async () => {
      const mockResult = { id: '1', name: 'Test' };
      const query = jest.fn().mockResolvedValue(mockResult);
      const queryName = 'test-query';

      const result = await performanceService.monitorQuery(query, queryName);

      expect(result.result).toEqual(mockResult);
      expect(result.queryName).toBe(queryName);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(query).toHaveBeenCalled();
    });

    it('should log slow queries', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockResult = { id: '1', name: 'Test' };
      const query = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds
        return mockResult;
      });
      const queryName = 'slow-query';

      const result = await performanceService.monitorQuery(query, queryName);

      expect(result.executionTime).toBeGreaterThan(1000);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Slow query detected: ${queryName}`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('analyzeQuery', () => {
    it('should analyze query performance', async () => {
      const mockResult = { id: '1', name: 'Test' };
      const query = jest.fn().mockResolvedValue(mockResult);
      const queryName = 'test-query';

      const result = await performanceService.analyzeQuery(query, queryName);

      expect(result.performance.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.performance.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should suggest optimizations for slow queries', async () => {
      const mockResult = { id: '1', name: 'Test' };
      const query = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds
        return mockResult;
      });
      const queryName = 'slow-query';

      const result = await performanceService.analyzeQuery(query, queryName);

      expect(result.suggestions).toContain('Consider adding database indexes');
      expect(result.suggestions).toContain('Review query structure for optimization');
    });

    it('should suggest optimizations for memory-intensive queries', async () => {
      const mockResult = { id: '1', name: 'Test' };
      const query = jest.fn().mockResolvedValue(mockResult);
      const queryName = 'memory-query';

      // Mock memory usage to simulate high memory consumption
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn()
        .mockReturnValueOnce({ heapUsed: 0 })
        .mockReturnValueOnce({ heapUsed: 15 * 1024 * 1024 }); // 15MB

      const result = await performanceService.analyzeQuery(query, queryName);

      expect(result.suggestions).toContain('Consider implementing pagination');
      expect(result.suggestions).toContain('Review data fetching strategy');

      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('optimizeDatabaseQueries', () => {
    it('should complete database query optimization', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await performanceService.optimizeDatabaseQueries();

      expect(consoleSpy).toHaveBeenCalledWith('Database query optimization completed');

      consoleSpy.mockRestore();
    });
  });

  describe('optimizeConnectionPooling', () => {
    it('should complete connection pooling optimization', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await performanceService.optimizeConnectionPooling();

      expect(consoleSpy).toHaveBeenCalledWith('Connection pooling optimization completed');

      consoleSpy.mockRestore();
    });
  });
});

describe('PerformanceMetrics', () => {
  beforeEach(() => {
    PerformanceMetrics.clearMetrics();
  });

  describe('record', () => {
    it('should record performance metric', () => {
      PerformanceMetrics.record('test-operation', 100);

      const metrics = PerformanceMetrics.getMetrics('test-operation');
      expect(metrics).toEqual({
        count: 1,
        totalTime: 100,
        averageTime: 100,
        minTime: 100,
        maxTime: 100,
      });
    });

    it('should update existing metrics', () => {
      PerformanceMetrics.record('test-operation', 100);
      PerformanceMetrics.record('test-operation', 200);

      const metrics = PerformanceMetrics.getMetrics('test-operation');
      expect(metrics).toEqual({
        count: 2,
        totalTime: 300,
        averageTime: 150,
        minTime: 100,
        maxTime: 200,
      });
    });
  });

  describe('getMetrics', () => {
    it('should return specific metric', () => {
      PerformanceMetrics.record('test-operation', 100);

      const metrics = PerformanceMetrics.getMetrics('test-operation');
      expect(metrics).toBeDefined();
      expect(metrics.count).toBe(1);
    });

    it('should return all metrics when no name provided', () => {
      PerformanceMetrics.record('operation1', 100);
      PerformanceMetrics.record('operation2', 200);

      const metrics = PerformanceMetrics.getMetrics();
      expect(metrics).toHaveProperty('operation1');
      expect(metrics).toHaveProperty('operation2');
    });

    it('should return undefined for non-existent metric', () => {
      const metrics = PerformanceMetrics.getMetrics('non-existent');
      expect(metrics).toBeUndefined();
    });
  });

  describe('clearMetrics', () => {
    it('should clear specific metric', () => {
      PerformanceMetrics.record('test-operation', 100);
      PerformanceMetrics.clearMetrics('test-operation');

      const metrics = PerformanceMetrics.getMetrics('test-operation');
      expect(metrics).toBeUndefined();
    });

    it('should clear all metrics when no name provided', () => {
      PerformanceMetrics.record('operation1', 100);
      PerformanceMetrics.record('operation2', 200);
      PerformanceMetrics.clearMetrics();

      const metrics = PerformanceMetrics.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });

  describe('getSummary', () => {
    it('should return performance summary', () => {
      PerformanceMetrics.record('fast-operation', 50);
      PerformanceMetrics.record('slow-operation', 500);
      PerformanceMetrics.record('medium-operation', 200);

      const summary = PerformanceMetrics.getSummary();

      expect(summary.totalMetrics).toBe(3);
      expect(summary.slowestOperations).toHaveLength(3);
      expect(summary.fastestOperations).toHaveLength(3);
      expect(summary.slowestOperations[0].name).toBe('slow-operation');
      expect(summary.fastestOperations[0].name).toBe('fast-operation');
    });

    it('should handle empty metrics', () => {
      const summary = PerformanceMetrics.getSummary();

      expect(summary.totalMetrics).toBe(0);
      expect(summary.slowestOperations).toHaveLength(0);
      expect(summary.fastestOperations).toHaveLength(0);
    });
  });
});

describe('Performance monitoring middleware', () => {
  it('should be defined', () => {
    // The middleware function is exported but not directly testable
    // It would be tested through integration tests
    expect(typeof require('../services/performance-optimization.service').withPerformanceMonitoring).toBe('function');
  });
});

describe('Performance optimization decorator', () => {
  it('should be defined', () => {
    // The decorator function is exported but not directly testable
    // It would be tested through integration tests
    expect(typeof require('../services/performance-optimization.service').optimizePerformance).toBe('function');
  });
});

describe('Database optimization utilities', () => {
  it('should be defined', () => {
    // The utility class is exported but not directly testable
    // It would be tested through integration tests
    expect(typeof require('../services/performance-optimization.service').DatabaseOptimizationUtils).toBe('function');
  });
});
