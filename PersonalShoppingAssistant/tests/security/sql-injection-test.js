#!/usr/bin/env node
/**
 * SQL Injection Testing Script
 * 
 * Tests for SQL injection vulnerabilities in various endpoints
 */

const http = require('http');

const CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 5000
};

const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "' OR '1'='1' AND '1'='1",
  "admin'--",
  "admin'/*",
  "' OR 1=1#",
  "' OR 'x'='x",
  "') OR ('1'='1",
  "1' OR '1'='1",
  "1' OR 1=1 --",
  "1' OR 1=1#",
  "1' OR 1=1/*",
  "1' OR '1'='1' AND '1'='1",
  "1' OR '1'='1' OR '1'='1",
  "1' OR '1'='1' UNION SELECT * FROM users --",
  "1' OR '1'='1' UNION SELECT password FROM users --",
  "1' OR '1'='1' UNION SELECT email FROM users --",
  "1' OR '1'='1' UNION SELECT * FROM user_preferences --"
];

class SQLInjectionTester {
  constructor() {
    this.results = [];
  }

  async testEndpoint(endpoint, method, payloads) {
    console.log(`\n🔍 Testing ${endpoint} for SQL injection...`);
    
    for (const payload of payloads) {
      try {
        const response = await this.makeRequest(endpoint, method, payload);
        const isVulnerable = this.analyzeResponse(response, payload);
        
        this.results.push({
          endpoint,
          method,
          payload,
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          vulnerable: isVulnerable,
          response: response.body?.substring(0, 200)
        });

        const status = isVulnerable ? '🚨 VULNERABLE' : '✅ SAFE';
        console.log(`   ${status}: ${payload}`);
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${payload} - ${error.message}`);
      }
    }
  }

  async makeRequest(endpoint, method, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(CONFIG.baseUrl + endpoint);
      const startTime = Date.now();
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SQLInjectionTest/1.0'
        },
        timeout: CONFIG.timeout
      };

      const req = http.request(requestOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const endTime = Date.now();
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: endTime - startTime
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (method === 'POST') {
        const data = JSON.stringify({ 
          email: payload, 
          password: 'test123' 
        });
        req.write(data);
      } else {
        // For GET requests, append payload to query string
        const newUrl = new URL(endpoint, CONFIG.baseUrl);
        newUrl.searchParams.set('q', payload);
        requestOptions.path = newUrl.pathname + newUrl.search;
      }
      
      req.end();
    });
  }

  analyzeResponse(response, payload) {
    // Check for SQL error messages
    const sqlErrors = [
      'sql syntax',
      'mysql_fetch',
      'mysql_num_rows',
      'mysql_query',
      'postgresql',
      'pg_query',
      'pg_fetch',
      'sqlite',
      'sqlite3',
      'database error',
      'sql error',
      'syntax error',
      'unexpected end of sql command',
      'column does not exist',
      'table does not exist',
      'duplicate entry',
      'constraint violation'
    ];

    const body = response.body?.toLowerCase() || '';
    const hasSqlError = sqlErrors.some(error => body.includes(error));
    
    // Check for successful injection (unexpected data)
    const hasUnexpectedData = body.includes('admin') || 
                             body.includes('password') || 
                             body.includes('user') ||
                             body.includes('email');

    return hasSqlError || (response.statusCode === 200 && hasUnexpectedData);
  }

  async runAllTests() {
    console.log('🚨 SQL Injection Testing Suite');
    console.log('='.repeat(50));

    // Test login endpoint
    await this.testEndpoint('/api/v1/users/login', 'POST', SQL_INJECTION_PAYLOADS);
    
    // Test product search
    await this.testEndpoint('/api/v1/products/search', 'GET', SQL_INJECTION_PAYLOADS);
    
    // Test product by ID
    await this.testEndpoint('/api/v1/products/1', 'GET', SQL_INJECTION_PAYLOADS);

    this.printResults();
  }

  printResults() {
    console.log('\n📊 SQL INJECTION TEST RESULTS');
    console.log('='.repeat(50));

    const vulnerable = this.results.filter(r => r.vulnerable);
    const safe = this.results.filter(r => !r.vulnerable);

    console.log(`🚨 Vulnerable: ${vulnerable.length}`);
    console.log(`✅ Safe: ${safe.length}`);
    console.log(`📊 Total Tests: ${this.results.length}`);

    if (vulnerable.length > 0) {
      console.log('\n🚨 VULNERABILITIES FOUND:');
      vulnerable.forEach(result => {
        console.log(`   ${result.endpoint} (${result.method}): ${result.payload}`);
      });
    } else {
      console.log('\n🎉 No SQL injection vulnerabilities found!');
    }
  }
}

// Main execution
if (require.main === module) {
  const tester = new SQLInjectionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = { SQLInjectionTester };
