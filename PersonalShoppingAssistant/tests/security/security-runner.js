#!/usr/bin/env node
/**
 * Comprehensive Security Test Runner
 * 
 * Runs all security tests and generates a comprehensive report
 */

const { SecurityTestRunner } = require('./security-test');
const { SQLInjectionTester } = require('./sql-injection-test');
const { HeadersTester } = require('./headers-test');
const fs = require('fs');
const path = require('path');

class ComprehensiveSecurityRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {}
    };
  }

  async runAllSecurityTests() {
    console.log('🔒 Personal Shopping Assistant - Comprehensive Security Testing');
    console.log('='.repeat(80));
    console.log('🎯 Running all security test suites...\n');

    const startTime = Date.now();

    try {
      // Run main security tests
      console.log('1️⃣ Running Main Security Tests...');
      const securityTester = new SecurityTestRunner();
      await securityTester.runAllSecurityTests();
      this.results.tests.security = securityTester.results;

      // Run SQL injection tests
      console.log('\n2️⃣ Running SQL Injection Tests...');
      const sqlTester = new SQLInjectionTester();
      await sqlTester.runAllTests();
      this.results.tests.sqlInjection = sqlTester.results;

      // Run headers tests
      console.log('\n3️⃣ Running Security Headers Tests...');
      const headersTester = new HeadersTester();
      await headersTester.runAllTests();
      this.results.tests.headers = headersTester.results;

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Generate comprehensive summary
      this.generateSummary(totalTime);
      this.printComprehensiveResults();
      await this.saveComprehensiveResults();

      console.log('\n✅ Comprehensive security testing completed!');
      
    } catch (error) {
      console.error('❌ Security testing failed:', error);
      process.exit(1);
    }
  }

  generateSummary(totalTime) {
    const securityResults = this.results.tests.security || [];
    const sqlResults = this.results.tests.sqlInjection || [];
    const headersResults = this.results.tests.headers || [];

    const totalTests = securityResults.length + sqlResults.length + headersResults.length;
    const passedTests = securityResults.filter(r => r.passed).length + 
                       sqlResults.filter(r => !r.vulnerable).length + 
                       headersResults.length; // Headers tests are pass/fail per endpoint

    const vulnerabilities = sqlResults.filter(r => r.vulnerable).length;
    const securityIssues = securityResults.filter(r => !r.passed).length;

    this.results.summary = {
      totalTime: totalTime,
      totalTests: totalTests,
      passedTests: passedTests,
      failedTests: totalTests - passedTests,
      passRate: (passedTests / totalTests) * 100,
      vulnerabilities: vulnerabilities,
      securityIssues: securityIssues,
      riskLevel: this.calculateRiskLevel(passedTests, totalTests, vulnerabilities)
    };
  }

  calculateRiskLevel(passed, total, vulnerabilities) {
    const passRate = (passed / total) * 100;
    
    if (vulnerabilities > 0) {
      return 'CRITICAL';
    } else if (passRate < 70) {
      return 'HIGH';
    } else if (passRate < 90) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  printComprehensiveResults() {
    console.log('\n📊 COMPREHENSIVE SECURITY REPORT');
    console.log('='.repeat(80));

    const summary = this.results.summary;
    
    console.log(`⏱️  Total Time: ${(summary.totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passedTests}`);
    console.log(`❌ Failed: ${summary.failedTests}`);
    console.log(`📈 Pass Rate: ${summary.passRate.toFixed(1)}%`);
    console.log(`🚨 Vulnerabilities: ${summary.vulnerabilities}`);
    console.log(`⚠️  Security Issues: ${summary.securityIssues}`);

    const riskColor = {
      'CRITICAL': '🔴',
      'HIGH': '🟠', 
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };

    console.log(`\n🎯 Risk Level: ${riskColor[summary.riskLevel]} ${summary.riskLevel}`);

    // Detailed breakdown
    this.printDetailedBreakdown();
    this.printSecurityRecommendations();
  }

  printDetailedBreakdown() {
    console.log('\n🔍 DETAILED BREAKDOWN');
    console.log('-'.repeat(50));

    // Security tests breakdown
    const securityResults = this.results.tests.security || [];
    const securityCategories = [...new Set(securityResults.map(r => r.category))];
    
    console.log('\n🛡️ Security Tests:');
    securityCategories.forEach(category => {
      const categoryResults = securityResults.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const total = categoryResults.length;
      const status = passed === total ? '✅' : '❌';
      console.log(`   ${status} ${category}: ${passed}/${total}`);
    });

    // SQL injection results
    const sqlResults = this.results.tests.sqlInjection || [];
    const vulnerable = sqlResults.filter(r => r.vulnerable).length;
    const safe = sqlResults.filter(r => !r.vulnerable).length;
    const sqlStatus = vulnerable === 0 ? '✅' : '🚨';
    console.log(`\n${sqlStatus} SQL Injection: ${safe}/${sqlResults.length} safe`);

    // Headers results
    const headersResults = this.results.tests.headers || [];
    if (headersResults.length > 0) {
      const avgScore = headersResults.reduce((sum, r) => sum + r.analysis.score, 0) / headersResults.length;
      const headersStatus = avgScore >= 90 ? '✅' : avgScore >= 70 ? '⚠️' : '❌';
      console.log(`\n${headersStatus} Security Headers: ${avgScore.toFixed(1)}% average score`);
    }
  }

  printSecurityRecommendations() {
    console.log('\n💡 SECURITY RECOMMENDATIONS');
    console.log('-'.repeat(50));

    const summary = this.results.summary;
    const securityResults = this.results.tests.security || [];
    const sqlResults = this.results.tests.sqlInjection || [];
    const headersResults = this.results.tests.headers || [];

    const recommendations = [];

    // Critical vulnerabilities
    if (summary.vulnerabilities > 0) {
      recommendations.push('🚨 CRITICAL: Fix SQL injection vulnerabilities immediately');
    }

    // Security issues
    if (summary.securityIssues > 0) {
      recommendations.push('⚠️ HIGH: Address authentication and input validation issues');
    }

    // Headers issues
    if (headersResults.length > 0) {
      const avgScore = headersResults.reduce((sum, r) => sum + r.analysis.score, 0) / headersResults.length;
      if (avgScore < 70) {
        recommendations.push('📋 MEDIUM: Implement missing security headers');
      }
    }

    // General recommendations based on risk level
    switch (summary.riskLevel) {
      case 'CRITICAL':
        recommendations.push('🔴 IMMEDIATE ACTION REQUIRED: Address all critical vulnerabilities');
        recommendations.push('🔒 Implement comprehensive input validation');
        recommendations.push('🛡️ Add security headers and middleware');
        break;
      case 'HIGH':
        recommendations.push('🟠 HIGH PRIORITY: Fix authentication and validation issues');
        recommendations.push('🔐 Review and strengthen authentication mechanisms');
        break;
      case 'MEDIUM':
        recommendations.push('🟡 MEDIUM PRIORITY: Improve security headers and validation');
        recommendations.push('📊 Implement security monitoring');
        break;
      case 'LOW':
        recommendations.push('🟢 LOW PRIORITY: Maintain current security practices');
        recommendations.push('📈 Consider advanced security features');
        break;
    }

    // Specific recommendations
    const failedSecurityTests = securityResults.filter(r => !r.passed);
    if (failedSecurityTests.length > 0) {
      const categories = [...new Set(failedSecurityTests.map(r => r.category))];
      categories.forEach(category => {
        switch (category) {
          case 'authentication':
            recommendations.push('🔐 Review authentication logic and token validation');
            break;
          case 'authorization':
            recommendations.push('🛡️ Strengthen authorization checks for protected endpoints');
            break;
          case 'inputValidation':
            recommendations.push('🧹 Implement comprehensive input sanitization');
            break;
          case 'rateLimiting':
            recommendations.push('⏱️ Review and adjust rate limiting configuration');
            break;
        }
      });
    }

    if (recommendations.length === 0) {
      console.log('🎉 No specific recommendations - security is well implemented!');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log('\n📚 General Security Best Practices:');
    console.log('   • Implement HTTPS in production');
    console.log('   • Use parameterized queries to prevent SQL injection');
    console.log('   • Validate and sanitize all user inputs');
    console.log('   • Implement proper authentication and authorization');
    console.log('   • Add security headers (use helmet.js)');
    console.log('   • Implement rate limiting');
    console.log('   • Regular security audits and penetration testing');
    console.log('   • Keep dependencies updated');
    console.log('   • Implement logging and monitoring');
  }

  async saveComprehensiveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join('./tests/security/results', `comprehensive-security-${timestamp}.json`);
    
    // Ensure results directory exists
    if (!fs.existsSync('./tests/security/results')) {
      fs.mkdirSync('./tests/security/results', { recursive: true });
    }

    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Comprehensive results saved to: ${resultsFile}`);
  }
}

// Main execution
async function main() {
  const runner = new ComprehensiveSecurityRunner();
  await runner.runAllSecurityTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ComprehensiveSecurityRunner };
