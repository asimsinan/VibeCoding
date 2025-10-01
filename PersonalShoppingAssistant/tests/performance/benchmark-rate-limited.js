#!/usr/bin/env node
/**
 * Rate-Limited Performance Benchmark Script
 * 
 * This version of the benchmark respects rate limiting and provides
 * more realistic performance measurements for production-like scenarios.
 */

const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration for rate-limited testing
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  iterations: 50, // Reduced to respect rate limits
  warmupIterations: 5,
  delayBetweenRequests: 100, // 100ms delay between requests
  resultsDir: './tests/performance/results',
  timeout: 30000
};

// Test cases with rate limiting considerations
const BENCHMARK_TESTS = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    expectedStatus: 200,
    weight: 0.2
  },
  {
    name: 'List Products',
    path: '/api/v1/products',
    method: 'GET',
    expectedStatus: 200,
    weight: 0.3
  },
  {
    name: 'Search Products',
    path: '/api/v1/products/search?q=laptop',
    method: 'GET',
    expectedStatus: 200,
    weight: 0.2
  },
  {
    name: 'Get Product by ID',
    path: '/api/v1/products/1',
    method: 'GET',
    expectedStatus: 200,
    weight: 0.2
  },
  {
    name: 'Get Non-existent Product',
    path: '/api/v1/products/99999',
    method: 'GET',
    expectedStatus: 404,
    weight: 0.1
  }
];

// HTTP request helper with rate limiting awareness
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
        'User-Agent': 'RateLimitedBenchmark/1.0',
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
        
        // Check for rate limiting
        const isRateLimited = res.statusCode === 429;
        const isSuccess = res.statusCode === options.expectedStatus || isRateLimited;
        
        resolve({
          success: isSuccess,
          statusCode: res.statusCode,
          responseTime: responseTime,
          dataLength: data.length,
          headers: res.headers,
          isRateLimited: isRateLimited,
          retryAfter: isRateLimited ? res.headers['retry-after'] : null
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
        dataLength: 0,
        isRateLimited: false
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
        dataLength: 0,
        isRateLimited: false
      });
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

// Rate-limited benchmark runner
class RateLimitedBenchmarkRunner {
  constructor() {
    this.results = [];
    this.rateLimitHits = 0;
    this.totalRequests = 0;
  }

  async runBenchmark(test) {
    console.log(`\n🧪 Running rate-limited benchmark: ${test.name}`);
    console.log(`   📍 ${test.method} ${test.path}`);
    console.log(`   🔄 ${CONFIG.iterations} iterations (${CONFIG.warmupIterations} warmup)`);
    console.log(`   ⏱️  Delay between requests: ${CONFIG.delayBetweenRequests}ms`);

    const results = [];
    
    // Warmup phase
    console.log('   🔥 Warming up...');
    for (let i = 0; i < CONFIG.warmupIterations; i++) {
      const result = await this.runSingleTest(test);
      results.push(result);
      await this.sleep(CONFIG.delayBetweenRequests);
    }

    // Actual benchmark
    console.log('   ⚡ Running benchmark...');
    for (let i = 0; i < CONFIG.iterations; i++) {
      const result = await this.runSingleTest(test);
      results.push(result);
      this.totalRequests++;
      
      if (result.isRateLimited) {
        this.rateLimitHits++;
        console.log(`   ⚠️  Rate limited (${this.rateLimitHits}/${this.totalRequests})`);
        
        // If we hit rate limit, wait longer before next request
        if (result.retryAfter) {
          console.log(`   ⏳ Waiting ${result.retryAfter}s before next request...`);
          await this.sleep(parseInt(result.retryAfter) * 1000);
        } else {
          await this.sleep(CONFIG.delayBetweenRequests * 2);
        }
      } else {
        await this.sleep(CONFIG.delayBetweenRequests);
      }
      
      if ((i + 1) % 10 === 0) {
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
    const successfulResults = results.filter(r => r.success && !r.isRateLimited);
    const rateLimitedResults = results.filter(r => r.isRateLimited);
    const failedResults = results.filter(r => !r.success && !r.isRateLimited);
    
    const responseTimes = successfulResults.map(r => r.responseTime);
    const sortedResponseTimes = responseTimes.sort((a, b) => a - b);
    
    const analysis = {
      testName,
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      rateLimitedRequests: rateLimitedResults.length,
      failedRequests: failedResults.length,
      successRate: successfulResults.length / results.length,
      rateLimitRate: rateLimitedResults.length / results.length,
      responseTime: {
        min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        avg: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
        median: this.percentile(sortedResponseTimes, 0.5),
        p90: this.percentile(sortedResponseTimes, 0.9),
        p95: this.percentile(sortedResponseTimes, 0.95),
        p99: this.percentile(sortedResponseTimes, 0.99)
      },
      throughput: {
        requestsPerSecond: results.length / (results.reduce((sum, r) => sum + r.responseTime, 0) / 1000)
      },
      errors: failedResults.map(r => r.error).slice(0, 5),
      dataSize: {
        avg: successfulResults.length > 0 ? successfulResults.reduce((sum, r) => sum + r.dataLength, 0) / successfulResults.length : 0,
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
    console.log('🚀 Personal Shopping Assistant - Rate-Limited Performance Benchmark');
    console.log('='.repeat(70));
    console.log(`🎯 Target: ${CONFIG.baseUrl}`);
    console.log(`🔄 Iterations per test: ${CONFIG.iterations}`);
    console.log(`🔥 Warmup iterations: ${CONFIG.warmupIterations}`);
    console.log(`⏱️  Delay between requests: ${CONFIG.delayBetweenRequests}ms`);
    console.log(`⚠️  Rate limiting: ENABLED (respects API limits)`);

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
    
    return {
      totalTime,
      results: this.results,
      summary: this.generateSummary(),
      rateLimitStats: {
        totalRequests: this.totalRequests,
        rateLimitHits: this.rateLimitHits,
        rateLimitPercentage: (this.rateLimitHits / this.totalRequests) * 100
      }
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
    const totalRateLimitedRequests = allResults.reduce((sum, r) => sum + r.rateLimitedRequests, 0);

    return {
      totalTests: allResults.length,
      totalRequests,
      totalSuccessfulRequests,
      totalRateLimitedRequests,
      overallSuccessRate: totalSuccessfulRequests / totalRequests,
      rateLimitRate: totalRateLimitedRequests / totalRequests,
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
    console.log('\n📊 RATE-LIMITED BENCHMARK RESULTS');
    console.log('='.repeat(70));

    benchmarkResults.results.forEach(result => {
      if (result.error) {
        console.log(`\n❌ ${result.testName}: ${result.error}`);
        return;
      }

      console.log(`\n✅ ${result.testName}:`);
      console.log(`   📈 Success Rate: ${(result.successRate * 100).toFixed(2)}%`);
      console.log(`   ⚠️  Rate Limited: ${(result.rateLimitRate * 100).toFixed(2)}%`);
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
    console.log(`⚠️  Rate Limited: ${(summary.rateLimitRate * 100).toFixed(2)}%`);
    console.log(`⏱️  Average Response Time: ${summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`🏆 Best Performing: ${summary.bestPerformingTest.testName} (${summary.bestPerformingTest.responseTime.avg.toFixed(2)}ms)`);
    console.log(`🐌 Worst Performing: ${summary.worstPerformingTest.testName} (${summary.worstPerformingTest.responseTime.avg.toFixed(2)}ms)`);
    
    console.log('\n🚦 RATE LIMITING STATS');
    console.log('='.repeat(40));
    console.log(`📊 Total Requests: ${benchmarkResults.rateLimitStats.totalRequests}`);
    console.log(`⚠️  Rate Limit Hits: ${benchmarkResults.rateLimitStats.rateLimitHits}`);
    console.log(`📈 Rate Limit Percentage: ${benchmarkResults.rateLimitStats.rateLimitPercentage.toFixed(2)}%`);
  }

  async saveResults(benchmarkResults) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(CONFIG.resultsDir, `rate-limited-benchmark-${timestamp}.json`);
    
    // Ensure results directory exists
    if (!fs.existsSync(CONFIG.resultsDir)) {
      fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
    }

    fs.writeFileSync(resultsFile, JSON.stringify(benchmarkResults, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const runner = new RateLimitedBenchmarkRunner();
  
  try {
    const results = await runner.runAllBenchmarks();
    runner.printResults(results);
    await runner.saveResults(results);
    
    console.log('\n✅ Rate-limited benchmark completed successfully!');
    console.log('\n💡 Note: This benchmark respects API rate limits for realistic performance testing.');
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RateLimitedBenchmarkRunner };
