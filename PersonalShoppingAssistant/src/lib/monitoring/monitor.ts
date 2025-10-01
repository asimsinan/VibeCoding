/**
 * Comprehensive Monitoring System for Personal Shopping Assistant
 * 
 * Provides real-time monitoring, metrics collection, and alerting
 */

import { performance } from 'perf_hooks';
import logger from './logger';

// Metrics collection
interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  timestamp: Date;
}

interface APIMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per minute
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  errors: {
    total: number;
    rate: number; // errors per minute
    byType: Record<string, number>;
  };
}

class MonitoringSystem {
  private metrics: Metric[] = [];
  private apiMetrics: APIMetrics = {
    requests: { total: 0, successful: 0, failed: 0, rate: 0 },
    responseTime: { average: 0, p95: 0, p99: 0 },
    errors: { total: 0, rate: 0, byType: {} }
  };
  private responseTimes: number[] = [];
  private startTime: number = Date.now();
  private lastMinuteRequests: number[] = [];
  private lastMinuteErrors: number[] = [];

  constructor() {
    // Start monitoring intervals
    this.startSystemMonitoring();
    this.startAPIMonitoring();
    this.startCleanupInterval();
  }

  // System monitoring
  private startSystemMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const systemMetrics: SystemMetrics = {
        cpu: {
          usage: this.calculateCPUUsage(cpuUsage),
          loadAverage: this.getLoadAverage()
        },
        memory: {
          used: memUsage.heapUsed,
          free: memUsage.heapTotal - memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        uptime: process.uptime(),
        timestamp: new Date()
      };

      this.recordMetric('system.cpu.usage', systemMetrics.cpu.usage);
      this.recordMetric('system.memory.usage', systemMetrics.memory.percentage);
      this.recordMetric('system.uptime', systemMetrics.uptime);

      // Log system metrics
      logger.debug('System metrics collected', {
        event: 'system_metrics',
        metrics: systemMetrics
      });

      // Check for alerts
      this.checkSystemAlerts(systemMetrics);

    } catch (error) {
      logger.error('Failed to collect system metrics', { error: error.message });
    }
  }

  private calculateCPUUsage(cpuUsage: NodeJS.CpuUsage): number {
    const startUsage = process.cpuUsage();
    const endUsage = process.cpuUsage(startUsage);
    
    const totalUsage = endUsage.user + endUsage.system;
    const totalTime = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
    
    return totalTime;
  }

  private getLoadAverage(): number[] {
    // Simplified load average calculation
    // In production, you might want to use a more sophisticated approach
    return [0, 0, 0]; // Placeholder
  }

  // API monitoring
  private startAPIMonitoring() {
    setInterval(() => {
      this.updateAPIMetrics();
    }, 60000); // Every minute
  }

  private updateAPIMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Update request rates
    this.lastMinuteRequests = this.lastMinuteRequests.filter(time => time > oneMinuteAgo);
    this.apiMetrics.requests.rate = this.lastMinuteRequests.length;

    // Update error rates
    this.lastMinuteErrors = this.lastMinuteErrors.filter(time => time > oneMinuteAgo);
    this.apiMetrics.errors.rate = this.lastMinuteErrors.length;

    // Update response time percentiles
    if (this.responseTimes.length > 0) {
      const sorted = [...this.responseTimes].sort((a, b) => a - b);
      this.apiMetrics.responseTime.average = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
      this.apiMetrics.responseTime.p95 = this.percentile(sorted, 0.95);
      this.apiMetrics.responseTime.p99 = this.percentile(sorted, 0.99);
    }

    // Log API metrics
    logger.info('API metrics updated', {
      event: 'api_metrics',
      metrics: this.apiMetrics
    });

    // Check for API alerts
    this.checkAPIAlerts();
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  // Metric recording
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // API request tracking
  recordAPIRequest(success: boolean, responseTime: number, endpoint?: string) {
    this.apiMetrics.requests.total++;
    this.lastMinuteRequests.push(Date.now());

    if (success) {
      this.apiMetrics.requests.successful++;
    } else {
      this.apiMetrics.requests.failed++;
      this.lastMinuteErrors.push(Date.now());
    }

    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Record detailed metrics
    this.recordMetric('api.requests.total', this.apiMetrics.requests.total);
    this.recordMetric('api.requests.successful', this.apiMetrics.requests.successful);
    this.recordMetric('api.requests.failed', this.apiMetrics.requests.failed);
    this.recordMetric('api.response_time', responseTime, { endpoint: endpoint || 'unknown' });
  }

  recordAPIError(errorType: string, endpoint?: string) {
    this.apiMetrics.errors.total++;
    this.apiMetrics.errors.byType[errorType] = (this.apiMetrics.errors.byType[errorType] || 0) + 1;
    this.lastMinuteErrors.push(Date.now());

    this.recordMetric('api.errors.total', this.apiMetrics.errors.total);
    this.recordMetric('api.errors.by_type', 1, { type: errorType, endpoint: endpoint || 'unknown' });
  }

  // Alert checking
  private checkSystemAlerts(metrics: SystemMetrics) {
    // CPU usage alert
    if (metrics.cpu.usage > 80) {
      this.triggerAlert('high_cpu_usage', {
        value: metrics.cpu.usage,
        threshold: 80
      });
    }

    // Memory usage alert
    if (metrics.memory.percentage > 85) {
      this.triggerAlert('high_memory_usage', {
        value: metrics.memory.percentage,
        threshold: 85
      });
    }

    // Uptime alert (if uptime is very low, might indicate frequent restarts)
    if (metrics.uptime < 300) { // Less than 5 minutes
      this.triggerAlert('low_uptime', {
        value: metrics.uptime,
        threshold: 300
      });
    }
  }

  private checkAPIAlerts() {
    // High error rate alert
    if (this.apiMetrics.errors.rate > 10) { // More than 10 errors per minute
      this.triggerAlert('high_error_rate', {
        value: this.apiMetrics.errors.rate,
        threshold: 10
      });
    }

    // High response time alert
    if (this.apiMetrics.responseTime.p95 > 5000) { // P95 > 5 seconds
      this.triggerAlert('high_response_time', {
        value: this.apiMetrics.responseTime.p95,
        threshold: 5000
      });
    }

    // Low success rate alert
    const successRate = this.apiMetrics.requests.successful / Math.max(this.apiMetrics.requests.total, 1);
    if (successRate < 0.95) { // Less than 95% success rate
      this.triggerAlert('low_success_rate', {
        value: successRate * 100,
        threshold: 95
      });
    }
  }

  private triggerAlert(type: string, details: any) {
    logger.warn('Alert triggered', {
      event: 'alert',
      type,
      details,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to send alerts to external services
    // like Slack, PagerDuty, or email notifications
  }

  // Cleanup
  private startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes
  }

  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(metric => metric.timestamp.getTime() > oneHourAgo);
  }

  // Public methods
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getAPIMetrics(): APIMetrics {
    return { ...this.apiMetrics };
  }

  getSystemHealth(): any {
    const memUsage = process.memoryUsage();
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      api: this.apiMetrics,
      timestamp: new Date().toISOString()
    };
  }

  // Health check endpoint data
  getHealthCheckData(): any {
    const health = this.getSystemHealth();
    return {
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      metrics: {
        requests: health.api.requests,
        responseTime: health.api.responseTime,
        errors: health.api.errors
      }
    };
  }
}

// Create singleton instance
const monitoringSystem = new MonitoringSystem();

// Export monitoring functions
export const monitor = {
  recordAPIRequest: (success: boolean, responseTime: number, endpoint?: string) => {
    monitoringSystem.recordAPIRequest(success, responseTime, endpoint);
  },

  recordAPIError: (errorType: string, endpoint?: string) => {
    monitoringSystem.recordAPIError(errorType, endpoint);
  },

  recordMetric: (name: string, value: number, tags?: Record<string, string>) => {
    monitoringSystem.recordMetric(name, value, tags);
  },

  getMetrics: () => monitoringSystem.getMetrics(),
  getAPIMetrics: () => monitoringSystem.getAPIMetrics(),
  getSystemHealth: () => monitoringSystem.getSystemHealth(),
  getHealthCheckData: () => monitoringSystem.getHealthCheckData()
};

export default monitoringSystem;
