import { PrismaClient } from '../generated/prisma';

// Database connection pooling configuration
// This module provides optimized database connection management

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  // Connection health check
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Connection metrics
  public async getConnectionMetrics(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
  }> {
    try {
      // For PostgreSQL, query pg_stat_activity for real metrics
      if (process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('prisma+postgres://')) {
        const result = await this.prisma.$queryRaw`
          SELECT 
            COUNT(*) FILTER (WHERE state = 'active') as active_connections,
            COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
            COUNT(*) as total_connections
          FROM pg_stat_activity 
          WHERE datname = current_database()
        ` as any[];
        
        return {
          activeConnections: Number(result[0]?.active_connections || 0),
          idleConnections: Number(result[0]?.idle_connections || 0),
          totalConnections: Number(result[0]?.total_connections || 0),
        };
      }
      
      // Fallback for other databases
      return {
        activeConnections: 1,
        idleConnections: 0,
        totalConnections: 1,
      };
    } catch (error) {
      console.error('Failed to get connection metrics:', error);
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
      };
    }
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance().getClient();

// Export manager for advanced operations
export const dbManager = DatabaseManager.getInstance();

// Connection pooling utilities
export class ConnectionPool {
  private static readonly MAX_CONNECTIONS = 10;
  private static readonly MIN_CONNECTIONS = 2;
  private static readonly CONNECTION_TIMEOUT = 30000; // 30 seconds

  // Execute query with connection management
  public static async executeQuery<T>(
    query: () => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          query(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), this.CONNECTION_TIMEOUT)
          ),
        ]);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Query failed after all retries');
  }

  // Batch operations with connection pooling
  public static async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(operation => this.executeQuery(operation))
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch operation failed:', result.reason);
          throw result.reason;
        }
      });
    }
    
    return results;
  }
}

// Transaction utilities
export class TransactionManager {
  // Execute operations in a transaction
  public static async executeTransaction<T>(
    operations: (tx: any) => Promise<T>
  ): Promise<T> {
    return await db.$transaction(async (tx) => {
      return await operations(tx);
    });
  }

  // Execute multiple operations in a transaction
  public static async executeBatchTransaction<T>(
    operations: Array<(tx: any) => Promise<T>>
  ): Promise<T[]> {
    return await db.$transaction(async (tx) => {
      const results: T[] = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    });
  }
}

// Query optimization utilities
export class QueryOptimizer {
  // Pagination helper
  public static paginate(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  // Include common relations
  public static getCommonIncludes() {
    return {
      organization: true,
      user: {
        include: {
          organization: true,
        },
      },
      course: {
        include: {
          organization: true,
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      },
    };
  }

  // Optimize queries for specific use cases
  public static optimizeForList() {
    return {
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    };
  }

  public static optimizeForDetail() {
    return {
      include: this.getCommonIncludes(),
    };
  }
}

// Database monitoring
export class DatabaseMonitor {
  private static metrics: {
    queryCount: number;
    errorCount: number;
    averageQueryTime: number;
    lastHealthCheck: Date;
  } = {
    queryCount: 0,
    errorCount: 0,
    averageQueryTime: 0,
    lastHealthCheck: new Date(),
  };

  public static incrementQueryCount(): void {
    this.metrics.queryCount++;
  }

  public static incrementErrorCount(): void {
    this.metrics.errorCount++;
  }

  public static updateAverageQueryTime(time: number): void {
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime + time) / 2;
  }

  public static getMetrics() {
    return { ...this.metrics };
  }

  public static async performHealthCheck(): Promise<boolean> {
    const isHealthy = await dbManager.healthCheck();
    this.metrics.lastHealthCheck = new Date();
    return isHealthy;
  }
}

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    DatabaseMonitor.incrementQueryCount();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      DatabaseMonitor.updateAverageQueryTime(duration);
      return result;
    } catch (error) {
      DatabaseMonitor.incrementErrorCount();
      throw error;
    }
  };
}

// Export default database client
export default db;
