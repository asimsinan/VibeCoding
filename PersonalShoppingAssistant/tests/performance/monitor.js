#!/usr/bin/env node
/**
 * Performance Monitoring Script for Personal Shopping Assistant API
 * 
 * This script continuously monitors API performance and provides:
 * - Real-time performance metrics
 * - Alerting for performance degradation
 * - Historical performance tracking
 * - Database query performance monitoring
 */

const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  checkInterval: 5000, // 5 seconds
  alertThresholds: {
    responseTime: 1000, // 1 second
    errorRate: 0.05, // 5%
    availability: 0.95 // 95%
  },
  resultsDir: './tests/performance/results',
  maxHistorySize: 1000
};

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.alerts = [];
    this.isRunning = false;
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(CONFIG.resultsDir)) {
      fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
    }
  }

  async start() {
    console.log('🔍 Starting Performance Monitor...');
    console.log(`🎯 Monitoring: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Check Interval: ${CONFIG.checkInterval}ms`);
    console.log(`📊 Response Time Alert: ${CONFIG.alertThresholds.responseTime}ms`);
    console.log(`❌ Error Rate Alert: ${CONFIG.alertThresholds.errorRate * 100}%`);
    console.log(`✅ Availability Alert: ${CONFIG.alertThresholds.availability * 100}%`);
    console.log('='.repeat(60));

    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        await this.performHealthCheck();
        await this.performPerformanceCheck();
        await this.checkAlerts();
        await this.saveMetrics();
        
        // Display current status
        this.displayStatus();
        
        await this.sleep(CONFIG.checkInterval);
      } catch (error) {
        console.error('❌ Monitor error:', error.message);
        await this.sleep(CONFIG.checkInterval);
      }
    }
  }

  stop() {
    console.log('\n🛑 Stopping Performance Monitor...');
    this.isRunning = false;
  }

  async performHealthCheck() {
    const startTime = performance.now();
    
    try {
      const result = await this.makeRequest('/health');
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.addMetric('health', {
        success: result.success,
        responseTime: responseTime,
        statusCode: result.statusCode,
        timestamp: Date.now()
      });
    } catch (error) {
      this.addMetric('health', {
        success: false,
        responseTime: 0,
        statusCode: 0,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async performPerformanceCheck() {
    const endpoints = [
      { path: '/api/v1/products', name: 'list_products' },
      { path: '/api/v1/products/search?q=test', name: 'search_products' },
      { path: '/api/v1/products/1', name: 'get_product' }
    ];

    for (const endpoint of endpoints) {
      const startTime = performance.now();
      
      try {
        const result = await this.makeRequest(endpoint.path);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.addMetric(endpoint.name, {
          success: result.success,
          responseTime: responseTime,
          statusCode: result.statusCode,
          timestamp: Date.now()
        });
      } catch (error) {
        this.addMetric(endpoint.name, {
          success: false,
          responseTime: 0,
          statusCode: 0,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(CONFIG.baseUrl + path);
      const startTime = performance.now();
      
      const req = http.request({
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'PerformanceMonitor/1.0'
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  addMetric(type, metric) {
    this.metrics.push({ type, ...metric });
    
    // Keep only recent metrics
    if (this.metrics.length > CONFIG.maxHistorySize) {
      this.metrics = this.metrics.slice(-CONFIG.maxHistorySize);
    }
  }

  async checkAlerts() {
    const recentMetrics = this.getRecentMetrics(60000); // Last minute
    if (recentMetrics.length === 0) return;

    const stats = this.calculateStats(recentMetrics);
    
    // Check response time alert
    if (stats.avgResponseTime > CONFIG.alertThresholds.responseTime) {
      this.addAlert('response_time', `High response time: ${stats.avgResponseTime.toFixed(2)}ms`);
    }

    // Check error rate alert
    if (stats.errorRate > CONFIG.alertThresholds.errorRate) {
      this.addAlert('error_rate', `High error rate: ${(stats.errorRate * 100).toFixed(2)}%`);
    }

    // Check availability alert
    if (stats.availability < CONFIG.alertThresholds.availability) {
      this.addAlert('availability', `Low availability: ${(stats.availability * 100).toFixed(2)}%`);
    }
  }

  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    console.log(`🚨 ALERT [${type.toUpperCase()}]: ${message}`);
  }

  getRecentMetrics(timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  calculateStats(metrics) {
    if (metrics.length === 0) {
      return {
        avgResponseTime: 0,
        errorRate: 0,
        availability: 0,
        totalRequests: 0
      };
    }

    const successfulMetrics = metrics.filter(m => m.success);
    const failedMetrics = metrics.filter(m => !m.success);
    
    const avgResponseTime = successfulMetrics.length > 0 
      ? successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length
      : 0;
    
    const errorRate = failedMetrics.length / metrics.length;
    const availability = successfulMetrics.length / metrics.length;
    
    return {
      avgResponseTime,
      errorRate,
      availability,
      totalRequests: metrics.length,
      successfulRequests: successfulMetrics.length,
      failedRequests: failedMetrics.length
    };
  }

  displayStatus() {
    const recentMetrics = this.getRecentMetrics(60000); // Last minute
    const stats = this.calculateStats(recentMetrics);
    
    const timestamp = new Date().toLocaleTimeString();
    const status = stats.availability > 0.95 ? '✅' : stats.availability > 0.8 ? '⚠️' : '❌';
    
    console.log(`[${timestamp}] ${status} RPS: ${(stats.totalRequests / 60).toFixed(1)} | ` +
                `Avg: ${stats.avgResponseTime.toFixed(0)}ms | ` +
                `Errors: ${(stats.errorRate * 100).toFixed(1)}% | ` +
                `Uptime: ${(stats.availability * 100).toFixed(1)}%`);
  }

  async saveMetrics() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const metricsFile = path.join(CONFIG.resultsDir, `metrics-${timestamp}.json`);
    
    const data = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      metrics: this.metrics.slice(-100), // Last 100 metrics
      alerts: this.alerts.slice(-50), // Last 50 alerts
      summary: this.calculateStats(this.metrics)
    };

    fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSummary() {
    const allStats = this.calculateStats(this.metrics);
    const recentStats = this.calculateStats(this.getRecentMetrics(300000)); // Last 5 minutes
    
    return {
      overall: allStats,
      recent: recentStats,
      alerts: this.alerts.slice(-10),
      uptime: this.calculateUptime()
    };
  }

  calculateUptime() {
    const totalChecks = this.metrics.length;
    const successfulChecks = this.metrics.filter(m => m.success).length;
    return totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
  }
}

// Database performance monitoring
class DatabaseMonitor {
  constructor() {
    this.queryMetrics = [];
  }

  async monitorDatabasePerformance() {
    // This would typically connect to the database and monitor query performance
    // For now, we'll simulate some database monitoring
    console.log('📊 Database performance monitoring not implemented yet');
  }
}

// Main execution
async function main() {
  const monitor = new PerformanceMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });

  try {
    await monitor.start();
  } catch (error) {
    console.error('❌ Monitor failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PerformanceMonitor, DatabaseMonitor };
