import { performance } from 'perf_hooks';
import { PrismaClient } from '../src/generated/prisma';
import { TestDataFactory, TestCleanup } from './integration-test-utils';

// Performance testing utilities
export class PerformanceMetrics {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(label: string): () => number {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      return duration;
    };
  }

  static getMetrics(label: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = values.reduce((sum, val) => sum + val, 0) / count;
    const median = sorted[Math.floor(count / 2)];
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);

    return {
      count,
      min,
      max,
      avg,
      median,
      p95: sorted[p95Index],
      p99: sorted[p99Index]
    };
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label);
    }
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }

  static printReport(): void {
    console.log('\n📊 Performance Test Report');
    console.log('========================');
    
    for (const [label, metrics] of Object.entries(this.getAllMetrics())) {
      if (metrics) {
        console.log(`\n${label}:`);
        console.log(`  Count: ${metrics.count}`);
        console.log(`  Min: ${metrics.min.toFixed(2)}ms`);
        console.log(`  Max: ${metrics.max.toFixed(2)}ms`);
        console.log(`  Avg: ${metrics.avg.toFixed(2)}ms`);
        console.log(`  Median: ${metrics.median.toFixed(2)}ms`);
        console.log(`  P95: ${metrics.p95.toFixed(2)}ms`);
        console.log(`  P99: ${metrics.p99.toFixed(2)}ms`);
      }
    }
  }
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 500, // 500ms
  DATABASE_QUERY_TIME: 100, // 100ms
  PAGE_LOAD_TIME: 2000, // 2 seconds
  MEMORY_USAGE_MB: 100, // 100MB
  CONCURRENT_USERS: 100, // 100 concurrent users
  LARGE_DATASET_SIZE: 1000, // 1000 records
};

// Memory monitoring
export class MemoryMonitor {
  private static initialMemory: NodeJS.MemoryUsage | null = null;

  static startMonitoring(): void {
    this.initialMemory = process.memoryUsage();
  }

  static getMemoryUsage(): {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  } {
    return process.memoryUsage();
  }

  static getMemoryIncrease(): number {
    if (!this.initialMemory) return 0;
    const current = process.memoryUsage();
    return current.heapUsed - this.initialMemory.heapUsed;
  }

  static formatMemory(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }
}

// Concurrent user simulation
export class ConcurrentUserSimulator {
  private static async simulateUser(userId: number, operations: (() => Promise<any>)[]): Promise<void> {
    for (const operation of operations) {
      try {
        await operation();
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      } catch (error) {
        console.error(`User ${userId} operation failed:`, error);
      }
    }
  }

  static async simulateConcurrentUsers(
    userCount: number, 
    operations: (() => Promise<any>)[]
  ): Promise<{ successCount: number; errorCount: number; avgResponseTime: number }> {
    const startTime = performance.now();
    const promises: Promise<void>[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < userCount; i++) {
      promises.push(
        this.simulateUser(i, operations).then(() => {
          successCount++;
        }).catch(() => {
          errorCount++;
        })
      );
    }

    await Promise.all(promises);
    const endTime = performance.now();
    const avgResponseTime = (endTime - startTime) / userCount;

    return { successCount, errorCount, avgResponseTime };
  }
}

// Database performance testing
export class DatabasePerformanceTester {
  private static prisma = new PrismaClient();

  static async testQueryPerformance(queryName: string, query: () => Promise<any>): Promise<number> {
    const endTimer = PerformanceMetrics.startTimer(`DB_${queryName}`);
    
    try {
      await query();
      return endTimer();
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  static async testBulkInsertPerformance(count: number): Promise<number> {
    const endTimer = PerformanceMetrics.startTimer('DB_BulkInsert');
    
    try {
      const testOrg = await TestDataFactory.createOrganization();
      const users = [];
      
      for (let i = 0; i < count; i++) {
        users.push({
          email: `perf-test-${i}-${Date.now()}@example.com`,
          name: `Performance Test User ${i}`,
          password: 'hashedpassword',
          role: 'STUDENT' as const,
          organizationId: testOrg.id,
        });
      }
      
      await this.prisma.user.createMany({
        data: users,
        skipDuplicates: true,
      });
      
      return endTimer();
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  static async testComplexQueryPerformance(): Promise<number> {
    const endTimer = PerformanceMetrics.startTimer('DB_ComplexQuery');
    
    try {
      // Complex query with joins and aggregations
      const result = await this.prisma.user.findMany({
        include: {
          organization: true,
          enrollments: {
            include: {
              course: {
                include: {
                  modules: {
                    include: {
                      lessons: true,
                    },
                  },
                },
              },
            },
          },
          progress: {
            include: {
              lesson: {
                include: {
                  module: {
                    include: {
                      course: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 100,
      });
      
      return endTimer();
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  static async testIndexPerformance(): Promise<number> {
    const endTimer = PerformanceMetrics.startTimer('DB_IndexQuery');
    
    try {
      // Query that should use indexes
      const result = await this.prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          organizationId: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });
      
      return endTimer();
    } catch (error) {
      endTimer();
      throw error;
    }
  }
}

// API performance testing
export class APIPerformanceTester {
  static async testAPIEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    iterations: number = 10
  ): Promise<number[]> {
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const endTimer = PerformanceMetrics.startTimer(`API_${method}_${endpoint}`);
      
      try {
        // Simulate API call (in real implementation, this would be actual HTTP requests)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        results.push(endTimer());
      } catch (error) {
        endTimer();
        throw error;
      }
    }
    
    return results;
  }

  static async testConcurrentAPICalls(
    endpoint: string,
    concurrentUsers: number,
    callsPerUser: number
  ): Promise<{ successCount: number; errorCount: number; avgResponseTime: number }> {
    const operations: (() => Promise<any>)[] = [];
    
    for (let i = 0; i < callsPerUser; i++) {
      operations.push(async () => {
        const endTimer = PerformanceMetrics.startTimer(`API_Concurrent_${endpoint}`);
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
          endTimer();
        } catch (error) {
          endTimer();
          throw error;
        }
      });
    }
    
    return await ConcurrentUserSimulator.simulateConcurrentUsers(concurrentUsers, operations);
  }
}

// Performance test assertions
export class PerformanceAssertions {
  static assertResponseTime(actualTime: number, threshold: number = PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME): void {
    if (actualTime > threshold) {
      throw new Error(`Response time ${actualTime}ms exceeds threshold ${threshold}ms`);
    }
  }

  static assertMemoryUsage(actualUsage: number, threshold: number = PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB): void {
    const usageMB = actualUsage / 1024 / 1024;
    if (usageMB > threshold) {
      throw new Error(`Memory usage ${usageMB.toFixed(2)}MB exceeds threshold ${threshold}MB`);
    }
  }

  static assertConcurrentUsers(successCount: number, totalUsers: number, minSuccessRate: number = 0.95): void {
    const successRate = successCount / totalUsers;
    if (successRate < minSuccessRate) {
      throw new Error(`Success rate ${(successRate * 100).toFixed(2)}% below threshold ${(minSuccessRate * 100).toFixed(2)}%`);
    }
  }

  static assertDatabasePerformance(metrics: any, threshold: number = PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME): void {
    if (metrics && metrics.avg > threshold) {
      throw new Error(`Database query average time ${metrics.avg.toFixed(2)}ms exceeds threshold ${threshold}ms`);
    }
  }
}
