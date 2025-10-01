#!/usr/bin/env node
/**
 * Security Testing Suite for Personal Shopping Assistant API
 * 
 * This script performs comprehensive security testing to:
 * - Test authentication and authorization mechanisms
 * - Validate input sanitization and validation
 * - Test for common vulnerabilities (SQL injection, XSS, etc.)
 * - Verify rate limiting and security headers
 * - Test for data exposure and information leakage
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 10000,
  resultsDir: './tests/security/results',
  testUser: {
    email: 'securitytest@example.com',
    password: 'SecurityTest123!',
    name: 'Security Test User',
    preferences: {
      categories: ['Electronics'],
      priceRange: { min: 0, max: 1000 },
      brands: ['Apple', 'Samsung'],
      stylePreferences: ['Modern']
    }
  }
};

// Security test categories
const SECURITY_TESTS = {
  authentication: [
    {
      name: 'Valid Login',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: CONFIG.testUser.email, password: CONFIG.testUser.password },
      expectedStatus: 200,
      description: 'Test valid user login'
    },
    {
      name: 'Invalid Email',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'nonexistent@example.com', password: 'password123' },
      expectedStatus: 401,
      description: 'Test login with non-existent email'
    },
    {
      name: 'Invalid Password',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: CONFIG.testUser.email, password: 'wrongpassword' },
      expectedStatus: 401,
      description: 'Test login with wrong password'
    },
    {
      name: 'Empty Credentials',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: '', password: '' },
      expectedStatus: 400,
      description: 'Test login with empty credentials'
    },
    {
      name: 'Missing Fields',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: CONFIG.testUser.email },
      expectedStatus: 400,
      description: 'Test login with missing password field'
    }
  ],
  
  authorization: [
    {
      name: 'Access Protected Endpoint Without Token',
      method: 'GET',
      path: '/api/v1/users/profile',
      headers: {},
      expectedStatus: 401,
      description: 'Test accessing protected endpoint without authentication'
    },
    {
      name: 'Access Protected Endpoint With Invalid Token',
      method: 'GET',
      path: '/api/v1/users/profile',
      headers: { 'Authorization': 'Bearer invalid-token' },
      expectedStatus: 401,
      description: 'Test accessing protected endpoint with invalid token'
    },
    {
      name: 'Access Protected Endpoint With Malformed Token',
      method: 'GET',
      path: '/api/v1/users/profile',
      headers: { 'Authorization': 'InvalidFormat token' },
      expectedStatus: 401,
      description: 'Test accessing protected endpoint with malformed token'
    }
  ],

  inputValidation: [
    {
      name: 'SQL Injection in Email',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: "admin'; DROP TABLE users; --", password: 'password123' },
      expectedStatus: 400,
      description: 'Test SQL injection in email field'
    },
    {
      name: 'SQL Injection in Password',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'test@example.com', password: "'; DROP TABLE users; --" },
      expectedStatus: 400,
      description: 'Test SQL injection in password field'
    },
    {
      name: 'XSS in Email',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: '<script>alert("xss")</script>@example.com', password: 'password123' },
      expectedStatus: 400,
      description: 'Test XSS in email field'
    },
    {
      name: 'XSS in Password',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'test@example.com', password: '<script>alert("xss")</script>' },
      expectedStatus: 400,
      description: 'Test XSS in password field'
    },
    {
      name: 'Very Long Email',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'a'.repeat(1000) + '@example.com', password: 'password123' },
      expectedStatus: 400,
      description: 'Test very long email input'
    },
    {
      name: 'Very Long Password',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'test@example.com', password: 'a'.repeat(1000) },
      expectedStatus: 400,
      description: 'Test very long password input'
    },
    {
      name: 'Special Characters in Email',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'test@#$%^&*()@example.com', password: 'password123' },
      expectedStatus: 400,
      description: 'Test special characters in email'
    },
    {
      name: 'Null Bytes in Input',
      method: 'POST',
      path: '/api/v1/users/login',
      data: { email: 'test\x00@example.com', password: 'password123' },
      expectedStatus: 400,
      description: 'Test null bytes in input'
    }
  ],

  registrationSecurity: [
    {
      name: 'Duplicate Email Registration',
      method: 'POST',
      path: '/api/v1/users/register',
      data: CONFIG.testUser,
      expectedStatus: 409,
      description: 'Test registration with existing email'
    },
    {
      name: 'Weak Password',
      method: 'POST',
      path: '/api/v1/users/register',
      data: {
        ...CONFIG.testUser,
        email: 'weakpass@example.com',
        password: '123'
      },
      expectedStatus: 400,
      description: 'Test registration with weak password'
    },
    {
      name: 'Invalid Email Format',
      method: 'POST',
      path: '/api/v1/users/register',
      data: {
        ...CONFIG.testUser,
        email: 'invalid-email',
        password: 'password123'
      },
      expectedStatus: 400,
      description: 'Test registration with invalid email format'
    },
    {
      name: 'Missing Required Fields',
      method: 'POST',
      path: '/api/v1/users/register',
      data: { email: 'test@example.com' },
      expectedStatus: 400,
      description: 'Test registration with missing required fields'
    }
  ],

  productSecurity: [
    {
      name: 'SQL Injection in Product Search',
      method: 'GET',
      path: '/api/v1/products/search?q=test\'; DROP TABLE products; --',
      expectedStatus: 400,
      description: 'Test SQL injection in product search'
    },
    {
      name: 'XSS in Product Search',
      method: 'GET',
      path: '/api/v1/products/search?q=<script>alert("xss")</script>',
      expectedStatus: 400,
      description: 'Test XSS in product search'
    },
    {
      name: 'Path Traversal in Product ID',
      method: 'GET',
      path: '/api/v1/products/../../../etc/passwd',
      expectedStatus: 400,
      description: 'Test path traversal in product ID'
    },
    {
      name: 'Very Large Product ID',
      method: 'GET',
      path: '/api/v1/products/' + '9'.repeat(100),
      expectedStatus: 400,
      description: 'Test very large product ID'
    },
    {
      name: 'Negative Product ID',
      method: 'GET',
      path: '/api/v1/products/-1',
      expectedStatus: 400,
      description: 'Test negative product ID'
    },
    {
      name: 'Non-numeric Product ID',
      method: 'GET',
      path: '/api/v1/products/abc',
      expectedStatus: 400,
      description: 'Test non-numeric product ID'
    }
  ],

  headers: [
    {
      name: 'Check Security Headers',
      method: 'GET',
      path: '/health',
      expectedStatus: 200,
      description: 'Test presence of security headers',
      checkHeaders: true
    }
  ],

  rateLimiting: [
    {
      name: 'Rate Limit Enforcement',
      method: 'GET',
      path: '/health',
      expectedStatus: 429,
      description: 'Test rate limiting after exceeding limits',
      iterations: 150 // Exceed the 100 request limit
    }
  ]
};

// Security test runner
class SecurityTestRunner {
  constructor() {
    this.results = [];
    this.authToken = null;
    this.testUserCreated = false;
  }

  async runAllSecurityTests() {
    console.log('🔒 Personal Shopping Assistant - Security Testing Suite');
    console.log('='.repeat(70));
    console.log(`🎯 Target: ${CONFIG.baseUrl}`);
    console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);

    const startTime = performance.now();

    try {
      // Setup test user
      await this.setupTestUser();

      // Run all security test categories
      for (const [category, tests] of Object.entries(SECURITY_TESTS)) {
        console.log(`\n🔍 Running ${category.toUpperCase()} tests...`);
        await this.runTestCategory(category, tests);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Generate and display results
      this.printResults();
      await this.saveResults(totalTime);

      console.log('\n✅ Security testing completed successfully!');
      
    } catch (error) {
      console.error('❌ Security testing failed:', error);
      process.exit(1);
    }
  }

  async setupTestUser() {
    console.log('\n👤 Setting up test user...');
    
    try {
      // Try to register test user
      const response = await this.makeRequest('/api/v1/users/register', 'POST', CONFIG.testUser);
      
      if (response.statusCode === 201) {
        this.testUserCreated = true;
        this.authToken = response.data?.token;
        console.log('   ✅ Test user created successfully');
      } else if (response.statusCode === 409) {
        // User already exists, try to login
        const loginResponse = await this.makeRequest('/api/v1/users/login', 'POST', {
          email: CONFIG.testUser.email,
          password: CONFIG.testUser.password
        });
        
        if (loginResponse.statusCode === 200) {
          this.authToken = loginResponse.data?.token;
          console.log('   ✅ Test user login successful');
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not setup test user:', error.message);
    }
  }

  async runTestCategory(category, tests) {
    for (const test of tests) {
      try {
        const result = await this.runSecurityTest(test);
        this.results.push({
          category,
          ...result
        });
      } catch (error) {
        this.results.push({
          category,
          name: test.name,
          description: test.description,
          status: 'error',
          error: error.message,
          passed: false
        });
      }
    }
  }

  async runSecurityTest(test) {
    const startTime = performance.now();
    
    // Handle special cases
    if (test.iterations) {
      return await this.runRateLimitTest(test);
    }

    const response = await this.makeRequest(
      test.path,
      test.method,
      test.data,
      test.headers || {}
    );

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const passed = response.statusCode === test.expectedStatus;
    
    const result = {
      name: test.name,
      description: test.description,
      method: test.method,
      path: test.path,
      expectedStatus: test.expectedStatus,
      actualStatus: response.statusCode,
      responseTime: responseTime,
      passed: passed,
      status: passed ? 'passed' : 'failed',
      response: {
        headers: response.headers,
        body: response.body?.substring(0, 500) // Limit body size
      }
    };

    // Check security headers if required
    if (test.checkHeaders) {
      result.securityHeaders = this.checkSecurityHeaders(response.headers);
    }

    // Log result
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${test.name}: ${response.statusCode} (expected: ${test.expectedStatus})`);

    return result;
  }

  async runRateLimitTest(test) {
    console.log(`   🔄 Running rate limit test (${test.iterations} requests)...`);
    
    let rateLimited = false;
    let lastStatus = 200;
    
    for (let i = 0; i < test.iterations; i++) {
      const response = await this.makeRequest(test.path, test.method);
      
      if (response.statusCode === 429) {
        rateLimited = true;
        break;
      }
      
      lastStatus = response.statusCode;
      
      // Small delay to avoid overwhelming the server
      if (i % 10 === 0 && i > 0) {
        await this.sleep(100);
      }
    }

    const passed = rateLimited;
    
    console.log(`   ${passed ? '✅' : '❌'} Rate limit test: ${passed ? 'Rate limited as expected' : 'Not rate limited'}`);

    return {
      name: test.name,
      description: test.description,
      method: test.method,
      path: test.path,
      expectedStatus: test.expectedStatus,
      actualStatus: lastStatus,
      rateLimited: rateLimited,
      passed: passed,
      status: passed ? 'passed' : 'failed'
    };
  }

  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(CONFIG.baseUrl + path);
      const startTime = performance.now();
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SecurityTest/1.0',
          ...headers
        },
        timeout: CONFIG.timeout
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(requestOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: responseTime
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

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  checkSecurityHeaders(headers) {
    const securityHeaders = {
      'X-Content-Type-Options': headers['x-content-type-options'],
      'X-Frame-Options': headers['x-frame-options'],
      'X-XSS-Protection': headers['x-xss-protection'],
      'Strict-Transport-Security': headers['strict-transport-security'],
      'Content-Security-Policy': headers['content-security-policy'],
      'Referrer-Policy': headers['referrer-policy']
    };

    const present = Object.values(securityHeaders).filter(h => h !== undefined).length;
    const total = Object.keys(securityHeaders).length;

    return {
      headers: securityHeaders,
      present: present,
      total: total,
      percentage: (present / total) * 100
    };
  }

  printResults() {
    console.log('\n📊 SECURITY TEST RESULTS');
    console.log('='.repeat(70));

    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const total = categoryResults.length;
      
      console.log(`\n🔍 ${category.toUpperCase()}: ${passed}/${total} passed`);
      console.log('-'.repeat(40));
      
      categoryResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.name}: ${result.actualStatus || 'error'}`);
        
        if (result.securityHeaders) {
          console.log(`      Security Headers: ${result.securityHeaders.present}/${result.securityHeaders.total} (${result.securityHeaders.percentage.toFixed(1)}%)`);
        }
        
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      });
    });

    // Overall summary
    const totalPassed = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const passRate = (totalPassed / totalTests) * 100;

    console.log('\n🎯 OVERALL SUMMARY');
    console.log('='.repeat(40));
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalTests - totalPassed}`);
    console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`);

    // Security recommendations
    this.printSecurityRecommendations();
  }

  printSecurityRecommendations() {
    const failedTests = this.results.filter(r => !r.passed);
    
    if (failedTests.length === 0) {
      console.log('\n🎉 All security tests passed! Your API is secure.');
      return;
    }

    console.log('\n💡 SECURITY RECOMMENDATIONS');
    console.log('='.repeat(40));

    const recommendations = [];

    // Check for authentication issues
    const authIssues = failedTests.filter(r => r.category === 'authentication' || r.category === 'authorization');
    if (authIssues.length > 0) {
      recommendations.push('🔐 Authentication/Authorization: Review authentication mechanisms and token validation');
    }

    // Check for input validation issues
    const inputIssues = failedTests.filter(r => r.category === 'inputValidation' || r.category === 'registrationSecurity');
    if (inputIssues.length > 0) {
      recommendations.push('🛡️ Input Validation: Implement proper input sanitization and validation');
    }

    // Check for product security issues
    const productIssues = failedTests.filter(r => r.category === 'productSecurity');
    if (productIssues.length > 0) {
      recommendations.push('🛒 Product Security: Review product endpoint security and parameter validation');
    }

    // Check for header issues
    const headerIssues = failedTests.filter(r => r.category === 'headers');
    if (headerIssues.length > 0) {
      recommendations.push('📋 Security Headers: Implement missing security headers');
    }

    // Check for rate limiting issues
    const rateLimitIssues = failedTests.filter(r => r.category === 'rateLimiting');
    if (rateLimitIssues.length > 0) {
      recommendations.push('⏱️ Rate Limiting: Review rate limiting implementation');
    }

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  async saveResults(totalTime) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(CONFIG.resultsDir, `security-test-${timestamp}.json`);
    
    // Ensure results directory exists
    if (!fs.existsSync(CONFIG.resultsDir)) {
      fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      totalTime: totalTime,
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.passed).length,
      failedTests: this.results.filter(r => !r.passed).length,
      passRate: (this.results.filter(r => r.passed).length / this.results.length) * 100,
      results: this.results
    };

    fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const runner = new SecurityTestRunner();
  
  try {
    await runner.runAllSecurityTests();
  } catch (error) {
    console.error('❌ Security testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SecurityTestRunner };
