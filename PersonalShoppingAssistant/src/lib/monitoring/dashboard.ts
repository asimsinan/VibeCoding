/**
 * Monitoring Dashboard for Personal Shopping Assistant
 * 
 * Provides real-time monitoring data and health status
 */

import { Request, Response } from 'express';
import monitor from './monitor';
import logger from './logger';

// Dashboard data interface
interface DashboardData {
  system: {
    status: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  api: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      rate: number;
    };
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    errors: {
      total: number;
      rate: number;
      byType: Record<string, number>;
    };
  };
  recommendations: {
    totalGenerated: number;
    averageScore: number;
    algorithm: string;
  };
  users: {
    total: number;
    active: number;
    newToday: number;
  };
  products: {
    total: number;
    categories: Record<string, number>;
    brands: Record<string, number>;
  };
  timestamp: string;
}

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const healthData = monitor.getHealthCheckData();
    
    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Detailed health check endpoint
export const detailedHealthCheck = async (req: Request, res: Response) => {
  try {
    const systemHealth = monitor.getSystemHealth();
    const apiMetrics = monitor.getAPIMetrics();
    
    const healthData = {
      ...systemHealth,
      api: apiMetrics,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Detailed health check failed',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Metrics endpoint
export const getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = monitor.getMetrics();
    const apiMetrics = monitor.getAPIMetrics();
    
    res.status(200).json({
      success: true,
      data: {
        metrics,
        api: apiMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get metrics',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Dashboard endpoint
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const systemHealth = monitor.getSystemHealth();
    const apiMetrics = monitor.getAPIMetrics();
    
    // Mock data for demonstration - in production, this would come from database
    const dashboardData: DashboardData = {
      system: {
        status: systemHealth.status,
        uptime: systemHealth.uptime,
        memory: systemHealth.memory,
        cpu: {
          usage: 0 // Would be calculated from system metrics
        }
      },
      api: apiMetrics,
      recommendations: {
        totalGenerated: 1250,
        averageScore: 0.85,
        algorithm: 'collaborative_filtering'
      },
      users: {
        total: 150,
        active: 45,
        newToday: 8
      },
      products: {
        total: 5000,
        categories: {
          'Electronics': 2000,
          'Clothing': 1500,
          'Books': 1000,
          'Home': 500
        },
        brands: {
          'Apple': 300,
          'Samsung': 250,
          'Nike': 200,
          'Sony': 150
        }
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Failed to get dashboard data', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get dashboard data',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// System status endpoint
export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const systemHealth = monitor.getSystemHealth();
    const apiMetrics = monitor.getAPIMetrics();
    
    // Determine overall system status
    let status = 'healthy';
    const issues = [];
    
    // Check memory usage
    if (systemHealth.memory.percentage > 85) {
      status = 'warning';
      issues.push('High memory usage');
    }
    
    // Check error rate
    if (apiMetrics.errors.rate > 10) {
      status = 'warning';
      issues.push('High error rate');
    }
    
    // Check response time
    if (apiMetrics.responseTime.p95 > 5000) {
      status = 'warning';
      issues.push('High response time');
    }
    
    // Check success rate
    const successRate = apiMetrics.requests.successful / Math.max(apiMetrics.requests.total, 1);
    if (successRate < 0.95) {
      status = 'critical';
      issues.push('Low success rate');
    }
    
    res.status(200).json({
      success: true,
      data: {
        status,
        issues,
        system: systemHealth,
        api: apiMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get system status', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get system status',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Performance metrics endpoint
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const apiMetrics = monitor.getAPIMetrics();
    
    const performanceData = {
      responseTime: {
        average: apiMetrics.responseTime.average,
        p95: apiMetrics.responseTime.p95,
        p99: apiMetrics.responseTime.p99,
        min: Math.min(...monitor.getMetrics().filter(m => m.name === 'api.response_time').map(m => m.value)),
        max: Math.max(...monitor.getMetrics().filter(m => m.name === 'api.response_time').map(m => m.value))
      },
      throughput: {
        requestsPerMinute: apiMetrics.requests.rate,
        requestsPerSecond: apiMetrics.requests.rate / 60,
        totalRequests: apiMetrics.requests.total
      },
      reliability: {
        successRate: apiMetrics.requests.successful / Math.max(apiMetrics.requests.total, 1),
        errorRate: apiMetrics.errors.rate,
        uptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get performance metrics',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Error analytics endpoint
export const getErrorAnalytics = async (req: Request, res: Response) => {
  try {
    const apiMetrics = monitor.getAPIMetrics();
    
    const errorData = {
      summary: {
        totalErrors: apiMetrics.errors.total,
        errorRate: apiMetrics.errors.rate,
        successRate: apiMetrics.requests.successful / Math.max(apiMetrics.requests.total, 1)
      },
      byType: apiMetrics.errors.byType,
      trends: {
        lastHour: apiMetrics.errors.rate,
        lastDay: apiMetrics.errors.rate * 24, // Approximate
        lastWeek: apiMetrics.errors.rate * 24 * 7 // Approximate
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: errorData
    });
  } catch (error) {
    logger.error('Failed to get error analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get error analytics',
        status: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Export all dashboard functions
export const dashboard = {
  healthCheck,
  detailedHealthCheck,
  getMetrics,
  getDashboard,
  getSystemStatus,
  getPerformanceMetrics,
  getErrorAnalytics
};
