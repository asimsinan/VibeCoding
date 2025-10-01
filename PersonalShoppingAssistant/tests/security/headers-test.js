#!/usr/bin/env node
/**
 * Security Headers Testing Script
 * 
 * Tests for presence and correctness of security headers
 */

const http = require('http');

const CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 5000
};

const REQUIRED_HEADERS = {
  'X-Content-Type-Options': {
    required: true,
    expectedValue: 'nosniff',
    description: 'Prevents MIME type sniffing'
  },
  'X-Frame-Options': {
    required: true,
    expectedValues: ['DENY', 'SAMEORIGIN'],
    description: 'Prevents clickjacking attacks'
  },
  'X-XSS-Protection': {
    required: true,
    expectedValue: '1; mode=block',
    description: 'Enables XSS filtering'
  },
  'Strict-Transport-Security': {
    required: false,
    expectedPattern: /max-age=\d+/,
    description: 'Enforces HTTPS connections'
  },
  'Content-Security-Policy': {
    required: false,
    description: 'Prevents XSS and data injection attacks'
  },
  'Referrer-Policy': {
    required: false,
    expectedValues: ['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url'],
    description: 'Controls referrer information'
  },
  'Permissions-Policy': {
    required: false,
    description: 'Controls browser features and APIs'
  }
};

class HeadersTester {
  constructor() {
    this.results = [];
  }

  async testEndpoint(endpoint) {
    console.log(`\n🔍 Testing headers for ${endpoint}...`);
    
    try {
      const response = await this.makeRequest(endpoint);
      const headerAnalysis = this.analyzeHeaders(response.headers);
      
      this.results.push({
        endpoint,
        statusCode: response.statusCode,
        headers: response.headers,
        analysis: headerAnalysis
      });

      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Headers Present: ${headerAnalysis.present}/${headerAnalysis.total}`);
      console.log(`   Score: ${headerAnalysis.score.toFixed(1)}%`);
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(CONFIG.baseUrl + endpoint);
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'HeadersTest/1.0'
        },
        timeout: CONFIG.timeout
      };

      const req = http.request(requestOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
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

  analyzeHeaders(headers) {
    const analysis = {
      present: 0,
      total: Object.keys(REQUIRED_HEADERS).length,
      score: 0,
      details: {}
    };

    for (const [headerName, config] of Object.entries(REQUIRED_HEADERS)) {
      const headerValue = headers[headerName.toLowerCase()];
      const isPresent = !!headerValue;
      
      let isCorrect = false;
      if (isPresent) {
        if (config.expectedValue) {
          isCorrect = headerValue === config.expectedValue;
        } else if (config.expectedValues) {
          isCorrect = config.expectedValues.includes(headerValue);
        } else if (config.expectedPattern) {
          isCorrect = config.expectedPattern.test(headerValue);
        } else {
          isCorrect = true; // Just needs to be present
        }
      }

      analysis.details[headerName] = {
        present: isPresent,
        correct: isCorrect,
        value: headerValue,
        required: config.required,
        description: config.description
      };

      if (isPresent) {
        analysis.present++;
        if (isCorrect) {
          analysis.score += 100 / analysis.total;
        } else {
          analysis.score += 50 / analysis.total; // Partial credit for present but incorrect
        }
      } else if (config.required) {
        // No points for missing required headers
      } else {
        analysis.score += 25 / analysis.total; // Small credit for optional headers
      }
    }

    return analysis;
  }

  async runAllTests() {
    console.log('🛡️ Security Headers Testing Suite');
    console.log('='.repeat(50));

    const endpoints = [
      '/health',
      '/api/v1/products',
      '/api/v1/products/search?q=test',
      '/api/v1/products/1'
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }

    this.printResults();
  }

  printResults() {
    console.log('\n📊 SECURITY HEADERS RESULTS');
    console.log('='.repeat(50));

    const overallScore = this.results.reduce((sum, r) => sum + r.analysis.score, 0) / this.results.length;
    
    console.log(`📈 Overall Score: ${overallScore.toFixed(1)}%`);
    console.log(`📊 Endpoints Tested: ${this.results.length}`);

    console.log('\n🔍 DETAILED ANALYSIS:');
    console.log('-'.repeat(30));

    for (const [headerName, config] of Object.entries(REQUIRED_HEADERS)) {
      const presentCount = this.results.filter(r => r.analysis.details[headerName]?.present).length;
      const correctCount = this.results.filter(r => r.analysis.details[headerName]?.correct).length;
      
      const status = correctCount === this.results.length ? '✅' : 
                   presentCount > 0 ? '⚠️' : '❌';
      
      console.log(`${status} ${headerName}: ${correctCount}/${this.results.length} correct`);
      console.log(`   ${config.description}`);
    }

    this.printRecommendations(overallScore);
  }

  printRecommendations(score) {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(30));

    if (score >= 90) {
      console.log('🎉 Excellent security headers implementation!');
    } else if (score >= 70) {
      console.log('👍 Good security headers, but room for improvement.');
    } else if (score >= 50) {
      console.log('⚠️ Security headers need improvement.');
    } else {
      console.log('🚨 Critical: Security headers are insufficient.');
    }

    // Specific recommendations
    const missingHeaders = [];
    for (const [headerName, config] of Object.entries(REQUIRED_HEADERS)) {
      const correctCount = this.results.filter(r => r.analysis.details[headerName]?.correct).length;
      if (correctCount === 0 && config.required) {
        missingHeaders.push(headerName);
      }
    }

    if (missingHeaders.length > 0) {
      console.log('\n🔧 Missing Required Headers:');
      missingHeaders.forEach(header => {
        console.log(`   • ${header}: ${REQUIRED_HEADERS[header].description}`);
      });
    }

    console.log('\n📚 Implementation Guide:');
    console.log('   • Add security headers in Express middleware');
    console.log('   • Use helmet.js for automatic security headers');
    console.log('   • Configure CSP policy for your application');
    console.log('   • Test headers in different environments');
  }
}

// Main execution
if (require.main === module) {
  const tester = new HeadersTester();
  tester.runAllTests().catch(console.error);
}

module.exports = { HeadersTester };
