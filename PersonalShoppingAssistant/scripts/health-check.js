#!/usr/bin/env node
/**
 * Production Health Check Script
 * 
 * This script performs comprehensive health checks on the deployed API
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

const CONFIG = {
  baseUrl: process.env.API_URL || 'https://your-app.vercel.app',
  timeout: 10000,
  retries: 3,
  endpoints: [
    { path: '/health', method: 'GET', expectedStatus: 200 },
    { path: '/api/v1/products', method: 'GET', expectedStatus: 200 },
    { path: '/api/v1/products/search?q=test', method: 'GET', expectedStatus: 200 },
    { path: '/api/v1/products/1', method: 'GET', expectedStatus: 200 }
  ]
};

class HealthChecker {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  async runHealthChecks() {
    console.log('🏥 Personal Shopping Assistant - Production Health Check');
    console.log('='.repeat(60));
    console.log(`🎯 Target: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);
    console.log(`🔄 Retries: ${CONFIG.retries}`);

    for (const endpoint of CONFIG.endpoints) {
      await this.checkEndpoint(endpoint);
    }

    this.printResults();
    return this.getOverallStatus();
  }

  async checkEndpoint(endpoint) {
    const startTime = performance.now();
    let lastError = null;
    let success = false;

    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        const response = await this.makeRequest(endpoint);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        if (response.statusCode === endpoint.expectedStatus) {
          success = true;
          this.results.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: 'healthy',
            statusCode: response.statusCode,
            responseTime: responseTime,
            attempt: attempt,
            timestamp: new Date().toISOString()
          });
          break;
        } else {
          lastError = new Error(`Expected ${endpoint.expectedStatus}, got ${response.statusCode}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt < CONFIG.retries) {
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    if (!success) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'unhealthy',
        statusCode: 0,
        responseTime: responseTime,
        attempt: CONFIG.retries,
        error: lastError?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(CONFIG.baseUrl + endpoint.path);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'User-Agent': 'HealthCheck/1.0',
          'Accept': 'application/json'
        },
        timeout: CONFIG.timeout
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  printResults() {
    const endTime = performance.now();
    const totalTime = endTime - this.startTime;
    
    console.log('\n📊 HEALTH CHECK RESULTS');
    console.log('='.repeat(60));

    const healthy = this.results.filter(r => r.status === 'healthy');
    const unhealthy = this.results.filter(r => r.status === 'unhealthy');

    console.log(`✅ Healthy: ${healthy.length}`);
    console.log(`❌ Unhealthy: ${unhealthy.length}`);
    console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}ms`);

    console.log('\n🔍 DETAILED RESULTS:');
    console.log('-'.repeat(40));

    this.results.forEach(result => {
      const status = result.status === 'healthy' ? '✅' : '❌';
      const responseTime = result.responseTime ? `${result.responseTime.toFixed(2)}ms` : 'N/A';
      
      console.log(`${status} ${result.method} ${result.endpoint}`);
      console.log(`   Status: ${result.statusCode} (${result.status})`);
      console.log(`   Response Time: ${responseTime}`);
      console.log(`   Attempt: ${result.attempt}/${CONFIG.retries}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Overall status
    const overallStatus = this.getOverallStatus();
    const statusEmoji = overallStatus === 'healthy' ? '🟢' : '🔴';
    console.log(`🎯 Overall Status: ${statusEmoji} ${overallStatus.toUpperCase()}`);

    if (overallStatus === 'unhealthy') {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('   • Check server logs for errors');
      console.log('   • Verify database connectivity');
      console.log('   • Check environment variables');
      console.log('   • Review deployment status');
    }
  }

  getOverallStatus() {
    const unhealthyCount = this.results.filter(r => r.status === 'unhealthy').length;
    return unhealthyCount === 0 ? 'healthy' : 'unhealthy';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const checker = new HealthChecker();
  const status = await checker.runHealthChecks();
  
  // Exit with appropriate code
  process.exit(status === 'healthy' ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker };
