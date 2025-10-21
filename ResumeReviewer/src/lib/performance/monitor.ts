export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export interface GeminiMetrics {
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  latency: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private apiMetrics: APIMetrics[] = [];
  private geminiMetrics: GeminiMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    // Store start time in metadata
    const operationData = {
      id,
      operation,
      startTime,
      metadata: metadata || {}
    };
    
    // Store in a temporary way (in production, use Redis or similar)
    if (typeof window !== 'undefined') {
      (window as any).__perfOps = (window as any).__perfOps || {};
      (window as any).__perfOps[id] = operationData;
    }
    
    return id;
  }

  endOperation(id: string, success: boolean = true, error?: string): PerformanceMetrics | null {
    const endTime = performance.now();
    
    // Retrieve operation data
    let operationData: any = null;
    if (typeof window !== 'undefined') {
      operationData = (window as any).__perfOps?.[id];
      delete (window as any).__perfOps?.[id];
    }
    
    if (!operationData) {
      console.warn(`Performance operation ${id} not found`);
      return null;
    }

    const metric: PerformanceMetrics = {
      operation: operationData.operation,
      startTime: operationData.startTime,
      endTime,
      duration: endTime - operationData.startTime,
      success,
      error,
      metadata: operationData.metadata
    };

    this.addMetric(metric);
    return metric;
  }

  addAPIMetric(metric: APIMetrics): void {
    this.apiMetrics.push(metric);
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics.shift();
    }
  }

  addGeminiMetric(metric: GeminiMetrics): void {
    this.geminiMetrics.push(metric);
    if (this.geminiMetrics.length > this.maxMetrics) {
      this.geminiMetrics.shift();
    }
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAPIMetrics(): APIMetrics[] {
    return [...this.apiMetrics];
  }

  getGeminiMetrics(): GeminiMetrics[] {
    return [...this.geminiMetrics];
  }

  getAverageLatency(operation?: string): number {
    const relevantMetrics = operation ? 
      this.metrics.filter(m => m.operation === operation) : 
      this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const totalDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / relevantMetrics.length;
  }

  getSuccessRate(operation?: string): number {
    const relevantMetrics = operation ? 
      this.metrics.filter(m => m.operation === operation) : 
      this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const successCount = relevantMetrics.filter(m => m.success).length;
    return (successCount / relevantMetrics.length) * 100;
  }

  getPerformanceSummary(): {
    totalOperations: number;
    averageLatency: number;
    successRate: number;
    topSlowOperations: Array<{ operation: string; avgLatency: number }>;
    errorRate: number;
  } {
    const totalOperations = this.metrics.length;
    const averageLatency = this.getAverageLatency();
    const successRate = this.getSuccessRate();
    
    // Group by operation and calculate average latency
    const operationGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = [];
      }
      groups[metric.operation].push(metric);
      return groups;
    }, {} as Record<string, PerformanceMetrics[]>);
    
    const topSlowOperations = Object.entries(operationGroups)
      .map(([operation, metrics]) => ({
        operation,
        avgLatency: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
      }))
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 5);
    
    const errorRate = totalOperations > 0 ? 
      ((totalOperations - this.metrics.filter(m => m.success).length) / totalOperations) * 100 : 0;
    
    return {
      totalOperations,
      averageLatency,
      successRate,
      topSlowOperations,
      errorRate
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.geminiMetrics = [];
  }
}

// Performance decorator for functions
export function measurePerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      const id = monitor.startOperation(operationName);
      
      try {
        const result = await method.apply(this, args);
        monitor.endOperation(id, true);
        return result;
      } catch (error) {
        monitor.endOperation(id, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Performance wrapper for API calls
export class APIPerformanceTracker {
  static async trackRequest<T>(
    endpoint: string,
    method: string,
    requestFn: () => Promise<T>,
    requestSize?: number
  ): Promise<T> {
    const startTime = performance.now();
    const monitor = PerformanceMonitor.getInstance();
    
    try {
      const response = await requestFn();
      const endTime = performance.now();
      
      const metric: APIMetrics = {
        endpoint,
        method,
        statusCode: 200,
        responseTime: endTime - startTime,
        requestSize: requestSize || 0,
        responseSize: JSON.stringify(response).length,
        timestamp: Date.now()
      };
      
      monitor.addAPIMetric(metric);
      return response;
    } catch (error) {
      const endTime = performance.now();
      
      const metric: APIMetrics = {
        endpoint,
        method,
        statusCode: 500,
        responseTime: endTime - startTime,
        requestSize: requestSize || 0,
        responseSize: 0,
        timestamp: Date.now()
      };
      
      monitor.addAPIMetric(metric);
      throw error;
    }
  }
}

// Gemini-specific performance tracking
export class GeminiPerformanceTracker {
  static trackRequest(
    model: string,
    promptTokens: number,
    responseTokens: number,
    latency: number,
    success: boolean,
    error?: string
  ): void {
    const monitor = PerformanceMonitor.getInstance();
    
    const metric: GeminiMetrics = {
      model,
      promptTokens,
      responseTokens,
      totalTokens: promptTokens + responseTokens,
      latency,
      success,
      error,
      timestamp: Date.now()
    };
    
    monitor.addGeminiMetric(metric);
  }
}

// Performance middleware for Next.js API routes
export function withPerformanceTracking(handler: Function) {
  return async (req: any, res: any) => {
    const monitor = PerformanceMonitor.getInstance();
    const operationId = monitor.startOperation(`${req.method} ${req.url}`);
    
    try {
      const result = await handler(req, res);
      monitor.endOperation(operationId, true);
      return result;
    } catch (error) {
      monitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}
