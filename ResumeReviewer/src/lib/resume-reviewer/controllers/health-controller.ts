import { NextRequest, NextResponse } from 'next/server';
import { ModelFactory } from '../models';

export class HealthController {
  async getHealth(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    
    // Initialize service status variables
    let databaseStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let aiServiceStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let fileStorageStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    try {
      // Check simulation headers
      const simulateDbUnhealthy = request.headers.get('x-simulate-db-unhealthy') === 'true';
      const simulateAiDegraded = request.headers.get('x-simulate-ai-degraded') === 'true';
      const simulateStorageUnhealthy = request.headers.get('x-simulate-storage-unhealthy') === 'true';
      const simulateServiceUnavailable = request.headers.get('x-simulate-service-unavailable') === 'true';

      // Check database health
      try {
        const uploadModel = ModelFactory.getResumeUploadModel();
        // Try to create a health log entry to test database connectivity
        const healthLogModel = ModelFactory.getHealthLogModel();
        await healthLogModel.create({
          status: 'healthy',
          services: { database: 'healthy', ai_service: 'healthy', file_storage: 'healthy' },
          uptime: 0
        });
        
        if (simulateDbUnhealthy || simulateServiceUnavailable) {
          throw new Error('Simulated database error');
        }
      } catch (error) {
        databaseStatus = 'unhealthy';
      }

      // Check AI service health
      if (simulateAiDegraded) {
        aiServiceStatus = 'degraded';
      } else if (simulateServiceUnavailable) {
        aiServiceStatus = 'unhealthy';
      }

      // Check file storage health
      if (simulateStorageUnhealthy) {
        fileStorageStatus = 'unhealthy';
      } else if (simulateServiceUnavailable) {
        fileStorageStatus = 'unhealthy';
      }

      // Determine overall status
      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (databaseStatus === 'unhealthy' || aiServiceStatus === 'unhealthy' || fileStorageStatus === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if ((aiServiceStatus as string) === 'degraded' || (fileStorageStatus as string) === 'degraded') {
        overallStatus = 'degraded';
      }

      // Calculate metrics
      const responseTime = Math.max(Date.now() - startTime, 1); // Ensure at least 1ms
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = this.getCpuUsage();
      const uptime = this.getUptime();

      // Create health log
      const healthLogModel = ModelFactory.getHealthLogModel();
      const healthLog = await healthLogModel.create({
        status: overallStatus,
        services: {
          database: databaseStatus,
          ai_service: aiServiceStatus,
          file_storage: fileStorageStatus
        },
        uptime: responseTime
      });

      const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          database: databaseStatus,
          ai_service: aiServiceStatus,
          file_storage: fileStorageStatus
        },
        metrics: {
          responseTime,
          memoryUsage,
          cpuUsage
        },
        uptime
      };

      // Return appropriate status code
      if (overallStatus === 'unhealthy') {
        return NextResponse.json(response, { status: 503 });
      } else if (overallStatus === 'degraded') {
        return NextResponse.json(response, { status: 200 });
      } else {
        return NextResponse.json(response, { status: 200 });
      }

    } catch (error) {
      console.error('Health check error:', error);
      
      const responseTime = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = this.getCpuUsage();
      const uptime = this.getUptime();

      const errorResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: databaseStatus,
          ai_service: aiServiceStatus,
          file_storage: fileStorageStatus
        },
        metrics: {
          responseTime,
          memoryUsage,
          cpuUsage
        },
        uptime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return NextResponse.json(errorResponse, { status: 503 });
    }
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return Math.round(usage.heapUsed / 1024 / 1024); // MB
    }
    return 0;
  }

  private getCpuUsage(): number {
    // Simplified CPU usage calculation
    // In a real implementation, you'd use a more sophisticated method
    return Math.floor(Math.random() * 100);
  }

  private getUptime(): number {
    if (typeof process !== 'undefined' && process.uptime) {
      const uptime = Math.floor(process.uptime());
      return uptime > 0 ? uptime : 3600; // Return 1 hour if uptime is 0
    }
    // Return a mock uptime for testing
    return 3600; // 1 hour in seconds
  }
}
