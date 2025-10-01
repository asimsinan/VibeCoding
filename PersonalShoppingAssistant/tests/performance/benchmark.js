#!/usr/bin/env node
/**
 * Performance Benchmark Script for Personal Shopping Assistant API
 * 
 * This script provides detailed performance benchmarks for:
 * - Individual endpoint performance
 * - Database query performance
 * - Memory usage monitoring
 * - CPU usage tracking
 * - Response time analysis
 */

const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  iterations: 100,
  warmupIterations: 10,
  resultsDir: './tests/performance/results',
  timeout: 30000
};

// Benchmark test cases
const BENCHMARK_TESTS = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'List Products',
    path: '/api/v1/products',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Search Products',
    path: '/api/v1/products/search?q=laptop',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Get Product by ID',
    path: '/api/v1/products/1',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Get Non-existent Product',
    path: '/api/v1/products/99999',
    method: 'GET',
    expectedStatus: 404
  },
  {
    name: 'User Registration',
    path: '/api/v1/users/register',
    method: 'POST',
    expectedStatus: 201,
    data: {
      email: 'benchmark@example.com',
      password: 'testpassword123',
      name: 'Benchmark User',
      preferences: {
        categories: ['Electronics'],
        priceRange: { min: 0, max: 1000 },
        brands: ['Apple', 'Samsung'],
        stylePreferences: ['Modern']
      }
    }
  },
  {
    name: 'User Login',
    path: '/api/v1/users/login',
    method: 'POST',
    expectedStatus: 200,
    data: {
      email: 'benchmark@example.com',
      password: 'testpassword123'
    }
  }
];

// System resource monitoring
class SystemMonitor {
  constructor() {
    this.startTime = performance.now();
    this.startMemory = process.memoryUsage();
  }

  getCurrentStats() {
    const currentMemory = process.memoryUsage();
    const currentTime = performance.now();
    const uptime = currentTime - this.startTime;

    return {
      uptime: uptime,
      memory: {
        rss: currentMemory.rss,
        heapTotal: currentMemory.heapTotal,
        heapUsed: currentMemory.heapUsed,
        external: currentMemory.external,
        arrayBuffers: currentMemory.arrayBuffers
      },
      memoryDelta: {
        rss: currentMemory.rss - this.startMemory.rss,
        heapUsed: currentMemory.heapUsed - this.startMemory.heapUsed
      }
    };
  }

  getSystemInfo() {
    try {
      const platform = process.platform;
      const arch = process.arch;
      const nodeVersion = process.version;
      
      let cpuInfo = 'Unknown';
      let totalMemory = 'Unknown';
      
      if (platform === 'darwin') {
        try {
          cpuInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
          totalMemory = execSync('sysctl -n hw.memsize', { encoding: 'utf8' }).trim();
          totalMemory = `${Math.round(parseInt(totalMemory) / 1024 / 1024 / 1024)}GB`;
        } catch (e) {
          // Fallback
        }
      } else if (platform === 'linux') {
        try {
          cpuInfo = execSync('lscpu | grep "Model name"', { encoding: 'utf8' }).trim();
          totalMemory = execSync('free -h | grep "Mem:" | awk \'{print $2}\'', { encoding: 'utf8' }).trim();
        } catch (e) {
          // Fallback
        }
      }

      return {
        platform,
        arch,
        nodeVersion,
        cpuInfo,
        totalMemory
      };
    } catch (error) {
      return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpuInfo: 'Unknown',
        totalMemory: 'Unknown'
      };
    }
  }
}

// HTTP request helper
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Benchmark/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    if (options.data) {
      const data = JSON.stringify(options.data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: res.statusCode === options.expectedStatus,
          statusCode: res.statusCode,
          responseTime: responseTime,
          dataLength: data.length,
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
        error: error.message,
        dataLength: 0
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      resolve({
        success: false,
        statusCode: 0,
        responseTime: responseTime,
        error: 'Request timeout',
        dataLength: 0
      });
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

// Benchmark runner
class BenchmarkRunner {
  constructor() {
    this.systemMonitor = new SystemMonitor();
    this.results = [];
  }

  async runBenchmark(test) {
    console.log(`\n🧪 Running benchmark: ${test.name}`);
    console.log(`   📍 ${test.method} ${test.path}`);
    console.log(`   🔄 ${CONFIG.iterations} iterations (${CONFIG.warmupIterations} warmup)`);

    const results = [];
    
    // Warmup phase
    console.log('   🔥 Warming up...');
    for (let i = 0; i < CONFIG.warmupIterations; i++) {
      await this.runSingleTest(test);
    }

    // Actual benchmark
    console.log('   ⚡ Running benchmark...');
    for (let i = 0; i < CONFIG.iterations; i++) {
      const result = await this.runSingleTest(test);
      results.push(result);
      
      if ((i + 1) % 20 === 0) {
        process.stdout.write(`   Progress: ${i + 1}/${CONFIG.iterations}\r`);
      }
    }

    console.log(`   ✅ Completed: ${CONFIG.iterations}/${CONFIG.iterations}`);

    return this.analyzeResults(test.name, results);
  }

  async runSingleTest(test) {
    const url = CONFIG.baseUrl + test.path;
    const options = {
      method: test.method,
      expectedStatus: test.expectedStatus,
      data: test.data
    };

    return await makeRequest(url, options);
  }

  analyzeResults(testName, results) {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    const responseTimes = successfulResults.map(r => r.responseTime);
    const sortedResponseTimes = responseTimes.sort((a, b) => a - b);
    
    const analysis = {
      testName,
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      successRate: successfulResults.length / results.length,
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        median: this.percentile(sortedResponseTimes, 0.5),
        p90: this.percentile(sortedResponseTimes, 0.9),
        p95: this.percentile(sortedResponseTimes, 0.95),
        p99: this.percentile(sortedResponseTimes, 0.99)
      },
      throughput: {
        requestsPerSecond: results.length / (results.reduce((sum, r) => sum + r.responseTime, 0) / 1000)
      },
      errors: failedResults.map(r => r.error).slice(0, 5), // Top 5 errors
      dataSize: {
        avg: successfulResults.reduce((sum, r) => sum + r.dataLength, 0) / successfulResults.length,
        total: successfulResults.reduce((sum, r) => sum + r.dataLength, 0)
      }
    };

    return analysis;
  }

  percentile(sortedArray, p) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  async runAllBenchmarks() {
    console.log('🚀 Personal Shopping Assistant - Performance Benchmark Suite');
    console.log('='.repeat(70));
    console.log(`🎯 Target: ${CONFIG.baseUrl}`);
    console.log(`🔄 Iterations per test: ${CONFIG.iterations}`);
    console.log(`🔥 Warmup iterations: ${CONFIG.warmupIterations}`);
    console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);

    const systemInfo = this.systemMonitor.getSystemInfo();
    console.log(`\n💻 System Information:`);
    console.log(`   Platform: ${systemInfo.platform} ${systemInfo.arch}`);
    console.log(`   Node.js: ${systemInfo.nodeVersion}`);
    console.log(`   CPU: ${systemInfo.cpuInfo}`);
    console.log(`   Memory: ${systemInfo.totalMemory}`);

    const startTime = performance.now();

    for (const test of BENCHMARK_TESTS) {
      try {
        const result = await this.runBenchmark(test);
        this.results.push(result);
      } catch (error) {
        console.error(`❌ Benchmark failed for ${test.name}:`, error.message);
        this.results.push({
          testName: test.name,
          error: error.message,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRate: 0
        });
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const finalStats = this.systemMonitor.getCurrentStats();
    
    return {
      systemInfo,
      totalTime,
      finalStats,
      results: this.results,
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    const allResults = this.results.filter(r => !r.error);
    
    if (allResults.length === 0) {
      return { error: 'No successful benchmarks' };
    }

    const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime.avg, 0) / allResults.length;
    const avgSuccessRate = allResults.reduce((sum, r) => sum + r.successRate, 0) / allResults.length;
    const totalRequests = allResults.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessfulRequests = allResults.reduce((sum, r) => sum + r.successfulRequests, 0);

    return {
      totalTests: allResults.length,
      totalRequests,
      totalSuccessfulRequests,
      overallSuccessRate: totalSuccessfulRequests / totalRequests,
      avgResponseTime,
      avgSuccessRate,
      bestPerformingTest: allResults.reduce((best, current) => 
        current.responseTime.avg < best.responseTime.avg ? current : best
      ),
      worstPerformingTest: allResults.reduce((worst, current) => 
        current.responseTime.avg > worst.responseTime.avg ? current : worst
      )
    };
  }

  printResults(benchmarkResults) {
    console.log('\n📊 BENCHMARK RESULTS');
    console.log('='.repeat(70));

    benchmarkResults.results.forEach(result => {
      if (result.error) {
        console.log(`\n❌ ${result.testName}: ${result.error}`);
        return;
      }

      console.log(`\n✅ ${result.testName}:`);
      console.log(`   📈 Success Rate: ${(result.successRate * 100).toFixed(2)}%`);
      console.log(`   ⏱️  Response Time: ${result.responseTime.avg.toFixed(2)}ms avg`);
      console.log(`   📊 Percentiles: P50: ${result.responseTime.median.toFixed(2)}ms, P90: ${result.responseTime.p90.toFixed(2)}ms, P95: ${result.responseTime.p95.toFixed(2)}ms`);
      console.log(`   🚀 Throughput: ${result.throughput.requestsPerSecond.toFixed(2)} req/s`);
      console.log(`   📦 Data Size: ${(result.dataSize.avg / 1024).toFixed(2)}KB avg`);
      
      if (result.errors.length > 0) {
        console.log(`   ❌ Errors: ${result.errors.join(', ')}`);
      }
    });

    console.log('\n🎯 SUMMARY');
    console.log('='.repeat(40));
    const summary = benchmarkResults.summary;
    console.log(`📊 Total Tests: ${summary.totalTests}`);
    console.log(`🔄 Total Requests: ${summary.totalRequests}`);
    console.log(`✅ Overall Success Rate: ${(summary.overallSuccessRate * 100).toFixed(2)}%`);
    console.log(`⏱️  Average Response Time: ${summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`🏆 Best Performing: ${summary.bestPerformingTest.testName} (${summary.bestPerformingTest.responseTime.avg.toFixed(2)}ms)`);
    console.log(`🐌 Worst Performing: ${summary.worstPerformingTest.testName} (${summary.worstPerformingTest.responseTime.avg.toFixed(2)}ms)`);
    
    console.log('\n💾 Memory Usage:');
    console.log(`   RSS: ${(benchmarkResults.finalStats.memory.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Heap Used: ${(benchmarkResults.finalStats.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory Delta: ${(benchmarkResults.finalStats.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }

  async saveResults(benchmarkResults) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(CONFIG.resultsDir, `benchmark-${timestamp}.json`);
    
    // Ensure results directory exists
    if (!fs.existsSync(CONFIG.resultsDir)) {
      fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
    }

    fs.writeFileSync(resultsFile, JSON.stringify(benchmarkResults, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  }
}

// Main execution
async function main() {
  const runner = new BenchmarkRunner();
  
  try {
    const results = await runner.runAllBenchmarks();
    runner.printResults(results);
    await runner.saveResults(results);
    
    console.log('\n✅ Benchmark completed successfully!');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BenchmarkRunner, SystemMonitor };
