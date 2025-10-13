import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  PerformanceMetrics,
  MemoryMonitor,
  ConcurrentUserSimulator,
  DatabasePerformanceTester,
  APIPerformanceTester,
  PerformanceAssertions,
  PERFORMANCE_THRESHOLDS,
} from './performance-test-utils';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { PrismaClient } from '../src/generated/prisma';

// Create a shared Prisma client for performance tests
const prisma = new PrismaClient();

describe('Database Performance Tests', () => {
  beforeAll(async () => {
    await TestCleanup.cleanup();
    MemoryMonitor.startMonitoring();
  });

  afterAll(async () => {
    PerformanceMetrics.printReport();
    await TestCleanup.cleanup();
  });

  beforeEach(() => {
    PerformanceMetrics.clearMetrics();
  });

  describe('Query Performance', () => {
    it('should perform simple queries within threshold', async () => {
      const testOrg = await TestDataFactory.createOrganization();
      
      const queryTime = await DatabasePerformanceTester.testQueryPerformance(
        'SimpleUserQuery',
        async () => {
          const users = await prisma.user.findMany({
            where: { organizationId: testOrg.id },
            take: 10,
          });
          return users;
        }
      );

      PerformanceAssertions.assertResponseTime(queryTime, PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME);
    });

    it('should perform complex queries with joins efficiently', async () => {
      const queryTime = await DatabasePerformanceTester.testComplexQueryPerformance();
      
      PerformanceAssertions.assertResponseTime(queryTime, PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME * 3);
    });

    it('should utilize database indexes effectively', async () => {
      const queryTime = await DatabasePerformanceTester.testIndexPerformance();
      
      PerformanceAssertions.assertResponseTime(queryTime, PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk insert operations efficiently', async () => {
      const insertTime = await DatabasePerformanceTester.testBulkInsertPerformance(100);
      
      PerformanceAssertions.assertResponseTime(insertTime, PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME * 10);
    });

    it('should handle large dataset queries', async () => {
      // Create large dataset
      const testOrg = await TestDataFactory.createOrganization();
      await DatabasePerformanceTester.testBulkInsertPerformance(500);
      
      const queryTime = await DatabasePerformanceTester.testQueryPerformance(
        'LargeDatasetQuery',
        async () => {
          const users = await prisma.user.findMany({
            where: { organizationId: testOrg.id },
            take: 1000,
          });
          return users;
        }
      );

      PerformanceAssertions.assertResponseTime(queryTime, PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME * 5);
    });
  });

  describe('Concurrent Database Access', () => {
    it('should handle concurrent database operations', async () => {
      const testOrg = await TestDataFactory.createOrganization();
      
      const operations = [
        async () => {
          await prisma.user.findMany({
            where: { organizationId: testOrg.id },
            take: 10,
          });
        },
        async () => {
          await prisma.course.findMany({
            where: { organizationId: testOrg.id },
            take: 10,
          });
        },
        async () => {
          await prisma.enrollment.findMany({
            where: { organizationId: testOrg.id },
            take: 10,
          });
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(20, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 20);
      PerformanceAssertions.assertResponseTime(result.avgResponseTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });
  });
});

describe('API Performance Tests', () => {
  beforeAll(async () => {
    await TestCleanup.cleanup();
    MemoryMonitor.startMonitoring();
  });

  afterAll(async () => {
    PerformanceMetrics.printReport();
    await TestCleanup.cleanup();
  });

  beforeEach(() => {
    PerformanceMetrics.clearMetrics();
  });

  describe('Endpoint Response Times', () => {
    it('should respond to authentication endpoints quickly', async () => {
      const results = await APIPerformanceTester.testAPIEndpoint('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password123',
      }, 10);

      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should respond to course endpoints efficiently', async () => {
      const results = await APIPerformanceTester.testAPIEndpoint('/api/courses', 'GET', undefined, 10);

      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle user management endpoints quickly', async () => {
      const results = await APIPerformanceTester.testAPIEndpoint('/api/users', 'GET', undefined, 10);

      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });
  });

  describe('Concurrent API Load', () => {
    it('should handle concurrent authentication requests', async () => {
      const result = await APIPerformanceTester.testConcurrentAPICalls('/api/auth/login', 50, 5);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 250);
      PerformanceAssertions.assertResponseTime(result.avgResponseTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2);
    });

    it('should handle concurrent course requests', async () => {
      const result = await APIPerformanceTester.testConcurrentAPICalls('/api/courses', 30, 3);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 90);
      PerformanceAssertions.assertResponseTime(result.avgResponseTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle mixed concurrent operations', async () => {
      const operations = [
        async () => APIPerformanceTester.testAPIEndpoint('/api/courses', 'GET', undefined, 1),
        async () => APIPerformanceTester.testAPIEndpoint('/api/users', 'GET', undefined, 1),
        async () => APIPerformanceTester.testAPIEndpoint('/api/enrollments', 'GET', undefined, 1),
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(25, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 25);
    });
  });
});

describe('Memory Performance Tests', () => {
  beforeAll(async () => {
    MemoryMonitor.startMonitoring();
  });

  afterAll(async () => {
    const memoryUsage = MemoryMonitor.getMemoryUsage();
    console.log('\nMemory Usage Report:');
    console.log(`RSS: ${MemoryMonitor.formatMemory(memoryUsage.rss)}`);
    console.log(`Heap Total: ${MemoryMonitor.formatMemory(memoryUsage.heapTotal)}`);
    console.log(`Heap Used: ${MemoryMonitor.formatMemory(memoryUsage.heapUsed)}`);
    console.log(`External: ${MemoryMonitor.formatMemory(memoryUsage.external)}`);
    console.log(`Array Buffers: ${MemoryMonitor.formatMemory(memoryUsage.arrayBuffers)}`);
    
    const increase = MemoryMonitor.getMemoryIncrease();
    console.log(`Memory Increase: ${MemoryMonitor.formatMemory(increase)}`);
    
    PerformanceAssertions.assertMemoryUsage(memoryUsage.heapUsed);
  });

  it('should not have memory leaks during bulk operations', async () => {
    const initialMemory = MemoryMonitor.getMemoryUsage();
    
    // Perform bulk operations
    await DatabasePerformanceTester.testBulkInsertPerformance(200);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = MemoryMonitor.getMemoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB for 200 records)
    PerformanceAssertions.assertMemoryUsage(memoryIncrease, 50);
  });

  it('should handle memory efficiently during concurrent operations', async () => {
    const initialMemory = MemoryMonitor.getMemoryUsage();
    
    const operations = [
      async () => DatabasePerformanceTester.testQueryPerformance('MemoryTest', async () => {
        const users = await prisma.user.findMany({ take: 100 });
        return users;
      }),
    ];

    await ConcurrentUserSimulator.simulateConcurrentUsers(50, operations);
    
    const finalMemory = MemoryMonitor.getMemoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    PerformanceAssertions.assertMemoryUsage(memoryIncrease, 100);
  });
});

describe('System Performance Tests', () => {
  beforeAll(async () => {
    await TestCleanup.cleanup();
    MemoryMonitor.startMonitoring();
  });

  afterAll(async () => {
    PerformanceMetrics.printReport();
    await TestCleanup.cleanup();
  });

  it('should maintain performance under high load', async () => {
    const operations = [
      async () => APIPerformanceTester.testAPIEndpoint('/api/courses', 'GET', undefined, 1),
      async () => DatabasePerformanceTester.testQueryPerformance('HighLoadTest', async () => {
        const courses = await prisma.course.findMany({ take: 50 });
        return courses;
      }),
    ];

    const result = await ConcurrentUserSimulator.simulateConcurrentUsers(100, operations);
    
    PerformanceAssertions.assertConcurrentUsers(result.successCount, 100, 0.90);
  });

  it('should handle large dataset operations efficiently', async () => {
    // Create large dataset
    const testOrg = await TestDataFactory.createOrganization();
    await DatabasePerformanceTester.testBulkInsertPerformance(1000);
    
    // Test various operations on large dataset
    const operations = [
      async () => DatabasePerformanceTester.testQueryPerformance('LargeDatasetSearch', async () => {
        const users = await prisma.user.findMany({
          where: { organizationId: testOrg.id },
          take: 100,
        });
        return users;
      }),
      async () => DatabasePerformanceTester.testQueryPerformance('LargeDatasetCount', async () => {
        const count = await prisma.user.count({
          where: { organizationId: testOrg.id },
        });
        return count;
      }),
    ];

    const result = await ConcurrentUserSimulator.simulateConcurrentUsers(20, operations);
    
    PerformanceAssertions.assertConcurrentUsers(result.successCount, 20);
  });

  it('should maintain consistent performance over time', async () => {
    const iterations = 5;
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const endTimer = PerformanceMetrics.startTimer(`ConsistencyTest_${i}`);
      
      // Perform standard operations
      await DatabasePerformanceTester.testQueryPerformance(`ConsistencyQuery_${i}`, async () => {
        const users = await prisma.user.findMany({ take: 10 });
        return users;
      });
      
      results.push(endTimer());
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check that performance is consistent (variance should be low)
    const avg = results.reduce((sum, time) => sum + time, 0) / results.length;
    const variance = results.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / results.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Standard deviation should be less than 20% of average
    expect(standardDeviation / avg).toBeLessThan(0.2);
  });
});
