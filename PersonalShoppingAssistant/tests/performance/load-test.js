#!/usr/bin/env node
/**
 * Load Testing Script for Personal Shopping Assistant API
 * 
 * This script performs comprehensive load testing to:
 * - Measure API response times under various loads
 * - Test concurrent user scenarios
 * - Identify performance bottlenecks
 * - Validate system stability under stress
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  testDuration: 60000, // 60 seconds
  concurrentUsers: [1, 5, 10, 25, 50, 100],
  rampUpTime: 10000, // 10 seconds
  resultsDir: './tests/performance/results',
  maxResponseTime: 2000, // 2 seconds
  errorThreshold: 0.05 // 5% error rate threshold
};

// Test scenarios
const SCENARIOS = {
  healthCheck: {
    path: '/health',
    method: 'GET',
    weight: 0.1
  },
  listProducts: {
    path: '/api/v1/products',
    method: 'GET',
    weight: 0.3
  },
  searchProducts: {
    path: '/api/v1/products/search?q=laptop',
    method: 'GET',
    weight: 0.2
  },
  getProduct: {
    path: '/api/v1/products/1',
    method: 'GET',
    weight: 0.2
  },
  registerUser: {
    path: '/api/v1/users/register',
    method: 'POST',
    weight: 0.1,
    data: {
      email: 'loadtest@example.com',
      password: 'testpassword123',
      name: 'Load Test User',
      preferences: {
        categories: ['Electronics'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Samsung'],
        stylePreferences: ['Modern']
      }
    }
  },
  loginUser: {
    path: '/api/v1/users/login',
    method: 'POST',
    weight: 0.1,
    data: {
      email: 'loadtest@example.com',
      password: 'testpassword123'
    }
  }
};

// Performance metrics
class PerformanceMetrics {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.responseTimes = [];
    this.errors = [];
  }

  addResult(result) {
    this.results.push(result);
    this.totalRequests++;
    
    if (result.success) {
      this.successfulRequests++;
      this.responseTimes.push(result.responseTime);
    } else {
      this.failedRequests++;
      this.errors.push(result.error);
    }
  }

  getStats() {
    const endTime = performance.now();
    const totalTime = endTime - this.startTime;
    const rps = this.totalRequests / (totalTime / 1000);
    const errorRate = this.failedRequests / this.totalRequests;
    
    const sortedResponseTimes = this.responseTimes.sort((a, b) => a - b);
    const p50 = this.percentile(sortedResponseTimes, 0.5);
    const p90 = this.percentile(sortedResponseTimes, 0.9);
    const p95 = this.percentile(sortedResponseTimes, 0.95);
    const p99 = this.percentile(sortedResponseTimes, 0.99);
    
    return {
      totalTime: totalTime,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      requestsPerSecond: rps,
      errorRate: errorRate,
      responseTime: {
        min: Math.min(...this.responseTimes),
        max: Math.max(...this.responseTimes),
        avg: this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length,
        p50: p50,
        p90: p90,
        p95: p95,
        p99: p99
      },
      errors: this.errors.slice(0, 10) // Top 10 errors
    };
  }

  percentile(sortedArray, p) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTest/1.0',
        ...options.headers
      }
    };

    if (options.data) {
      const data = JSON.stringify(options.data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          responseTime: responseTime,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      resolve({
        success: false,
        statusCode: 0,
        responseTime: responseTime,
        error: error.message
      });
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.setTimeout(10000, () => {
      req.destroy();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      resolve({
        success: false,
        statusCode: 0,
        responseTime: responseTime,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

// Load test runner
class LoadTestRunner {
  constructor() {
    this.metrics = new PerformanceMetrics();
    this.isRunning = false;
    this.workers = [];
  }

  async runLoadTest(concurrentUsers) {
    console.log(`\n🚀 Starting load test with ${concurrentUsers} concurrent users...`);
    
    this.metrics = new PerformanceMetrics();
    this.isRunning = true;
    this.workers = [];

    // Start workers
    for (let i = 0; i < concurrentUsers; i++) {
      this.workers.push(this.createWorker(i));
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, CONFIG.testDuration));

    // Stop workers
    this.isRunning = false;
    await Promise.all(this.workers);

    return this.metrics.getStats();
  }

  async createWorker(workerId) {
    while (this.isRunning) {
      try {
        const scenario = this.selectScenario();
        const url = CONFIG.baseUrl + scenario.path;
        
        const result = await makeRequest(url, {
          method: scenario.method,
          data: scenario.data
        });

        this.metrics.addResult({
          ...result,
          scenario: scenario.path,
          workerId: workerId,
          timestamp: Date.now()
        });

        // Add some delay between requests
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      } catch (error) {
        this.metrics.addResult({
          success: false,
          statusCode: 0,
          responseTime: 0,
          error: error.message,
          scenario: 'unknown',
          workerId: workerId,
          timestamp: Date.now()
        });
      }
    }
  }

  selectScenario() {
    const scenarios = Object.values(SCENARIOS);
    const weights = scenarios.map(s => s.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < scenarios.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return scenarios[i];
      }
    }
    
    return scenarios[0];
  }
}

// Results reporter
class ResultsReporter {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  generateReport(testResults) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(this.resultsDir, `load-test-report-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      results: testResults,
      summary: this.generateSummary(testResults)
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📊 Detailed report saved to: ${reportFile}`);
    
    return report;
  }

  generateSummary(testResults) {
    const summary = {
      overall: {
        totalTests: testResults.length,
        passedTests: testResults.filter(r => r.errorRate < CONFIG.errorThreshold).length,
        failedTests: testResults.filter(r => r.errorRate >= CONFIG.errorThreshold).length
      },
      performance: {
        bestRPS: Math.max(...testResults.map(r => r.requestsPerSecond)),
        worstRPS: Math.min(...testResults.map(r => r.requestsPerSecond)),
        bestResponseTime: Math.min(...testResults.map(r => r.responseTime.avg)),
        worstResponseTime: Math.max(...testResults.map(r => r.responseTime.avg))
      },
      recommendations: []
    };

    // Generate recommendations
    const worstResult = testResults.reduce((worst, current) => 
      current.errorRate > worst.errorRate ? current : worst
    );

    if (worstResult.errorRate > CONFIG.errorThreshold) {
      summary.recommendations.push(`High error rate detected: ${(worstResult.errorRate * 100).toFixed(2)}%`);
    }

    if (worstResult.responseTime.avg > CONFIG.maxResponseTime) {
      summary.recommendations.push(`Slow response times detected: ${worstResult.responseTime.avg.toFixed(2)}ms average`);
    }

    if (worstResult.responseTime.p95 > CONFIG.maxResponseTime * 2) {
      summary.recommendations.push(`95th percentile response time is very high: ${worstResult.responseTime.p95.toFixed(2)}ms`);
    }

    return summary;
  }

  printResults(testResults) {
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('='.repeat(80));
    
    testResults.forEach((result, index) => {
      const concurrentUsers = CONFIG.concurrentUsers[index];
      console.log(`\n👥 ${concurrentUsers} Concurrent Users:`);
      console.log(`   📈 Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`   ⏱️  Avg Response Time: ${result.responseTime.avg.toFixed(2)}ms`);
      console.log(`   📊 Response Time P95: ${result.responseTime.p95.toFixed(2)}ms`);
      console.log(`   ❌ Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
      console.log(`   ✅ Success Rate: ${((1 - result.errorRate) * 100).toFixed(2)}%`);
      
      if (result.errorRate > CONFIG.errorThreshold) {
        console.log(`   ⚠️  WARNING: High error rate!`);
      }
      
      if (result.responseTime.avg > CONFIG.maxResponseTime) {
        console.log(`   ⚠️  WARNING: Slow response times!`);
      }
    });
  }
}

// Main execution
async function main() {
  console.log('🚀 Personal Shopping Assistant - Load Testing Suite');
  console.log('='.repeat(60));
  console.log(`🎯 Target: ${CONFIG.baseUrl}`);
  console.log(`⏱️  Duration: ${CONFIG.testDuration / 1000}s per test`);
  console.log(`👥 Users: ${CONFIG.concurrentUsers.join(', ')}`);
  console.log(`📊 Max Response Time: ${CONFIG.maxResponseTime}ms`);
  console.log(`❌ Error Threshold: ${CONFIG.errorThreshold * 100}%`);

  const runner = new LoadTestRunner();
  const reporter = new ResultsReporter(CONFIG.resultsDir);
  const testResults = [];

  try {
    // Run tests for each concurrent user level
    for (const concurrentUsers of CONFIG.concurrentUsers) {
      console.log(`\n⏳ Running test with ${concurrentUsers} concurrent users...`);
      const result = await runner.runLoadTest(concurrentUsers);
      testResults.push(result);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Generate and display results
    reporter.printResults(testResults);
    const report = reporter.generateReport(testResults);
    
    console.log('\n🎯 PERFORMANCE SUMMARY');
    console.log('='.repeat(40));
    console.log(`📈 Best RPS: ${report.summary.performance.bestRPS.toFixed(2)}`);
    console.log(`⏱️  Best Response Time: ${report.summary.performance.bestResponseTime.toFixed(2)}ms`);
    console.log(`✅ Passed Tests: ${report.summary.overall.passedTests}/${report.summary.overall.totalTests}`);
    
    if (report.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.summary.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    console.log('\n✅ Load testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LoadTestRunner, PerformanceMetrics, ResultsReporter };
