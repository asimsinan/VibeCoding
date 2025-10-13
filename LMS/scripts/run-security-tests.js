#!/usr/bin/env node

/**
 * Security Test Runner
 * 
 * This script runs comprehensive security tests for the LMS application.
 * It includes tests for authentication, authorization, input validation,
 * multi-tenant isolation, API security, and vulnerability prevention.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const SECURITY_CONFIG = {
  timeout: 30000, // 30 seconds per test
  retries: 1,
  workers: 1, // Run tests sequentially for security
  reporter: 'json',
  outputDir: './test-results/security'
};

// Security test suites
const SECURITY_SUITES = [
  'security-tests.test.ts',
  'multi-tenant-security-tests.test.ts'
];

// Security test categories
const SECURITY_CATEGORIES = {
  AUTHENTICATION: 'Authentication Security',
  AUTHORIZATION: 'Authorization Security',
  INPUT_VALIDATION: 'Input Validation & Sanitization',
  MULTI_TENANT: 'Multi-Tenant Isolation',
  API_SECURITY: 'API Security',
  VULNERABILITY_PREVENTION: 'Vulnerability Prevention'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.bold}${description}${colors.reset}`);
  log(`Running: ${command}`, 'blue');
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    if (output) {
      console.log(output);
    }
    
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    console.error(error.stdout || error.message);
    return false;
  }
}

function checkPrerequisites() {
  log('Checking prerequisites...', 'blue');
  
  // Check if Jest is installed
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    log('✅ Jest is installed', 'green');
  } catch (error) {
    log('❌ Jest is not installed. Installing...', 'yellow');
    runCommand('npm install jest @jest/globals', 'Installing Jest');
  }
  
  // Check if test files exist
  const testDir = path.join(__dirname, 'tests');
  if (!fs.existsSync(testDir)) {
    log('❌ Test directory does not exist', 'red');
    return false;
  }
  
  // Check if security test files exist
  for (const testFile of SECURITY_SUITES) {
    const testPath = path.join(testDir, testFile);
    if (!fs.existsSync(testPath)) {
      log(`❌ Security test file ${testFile} does not exist`, 'red');
      return false;
    }
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function runSecurityTests() {
  log('\n🔒 Starting Security Tests', 'bold');
  
  // Create output directory
  const outputDir = SECURITY_CONFIG.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Run security tests
  const command = [
    'npx jest',
    `--testTimeout=${SECURITY_CONFIG.timeout}`,
    `--maxWorkers=${SECURITY_CONFIG.workers}`,
    `--reporter=${SECURITY_CONFIG.reporter}`,
    `--outputFile=${path.join(outputDir, 'security-results.json')}`,
    'tests/security-tests.test.ts',
    'tests/multi-tenant-security-tests.test.ts'
  ].join(' ');
  
  return runCommand(command, 'Running Security Tests');
}

function generateSecurityReport() {
  log('\n🛡️ Generating Security Report', 'blue');
  
  const reportPath = path.join(SECURITY_CONFIG.outputDir, 'security-results.json');
  if (fs.existsSync(reportPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      generateDetailedSecurityReport(results);
    } catch (error) {
      log('❌ Failed to parse security results', 'red');
    }
  } else {
    log('❌ Security results not found', 'red');
  }
}

function generateDetailedSecurityReport(results) {
  log('\n🔐 Security Test Report', 'bold');
  log('=====================', 'cyan');
  
  if (results.success) {
    log('✅ All security tests passed!', 'green');
  } else {
    log('❌ Some security tests failed', 'red');
  }
  
  log(`\n📊 Test Summary:`, 'blue');
  log(`  Total Tests: ${results.numTotalTests}`, 'cyan');
  log(`  Passed: ${results.numPassedTests}`, 'green');
  log(`  Failed: ${results.numFailedTests}`, 'red');
  log(`  Duration: ${(results.perfStats.end - results.perfStats.start) / 1000}s`, 'cyan');
  
  if (results.testResults && results.testResults.length > 0) {
    log(`\n🔍 Security Test Categories:`, 'blue');
    
    const categoryResults = {};
    
    results.testResults.forEach((testResult) => {
      const testName = testResult.name;
      
      // Categorize tests
      let category = 'Other';
      if (testName.includes('Authentication')) category = 'Authentication';
      else if (testName.includes('Authorization')) category = 'Authorization';
      else if (testName.includes('Input Validation') || testName.includes('XSS') || testName.includes('SQL Injection')) category = 'Input Validation';
      else if (testName.includes('Multi-Tenant') || testName.includes('Isolation')) category = 'Multi-Tenant';
      else if (testName.includes('API Security')) category = 'API Security';
      else if (testName.includes('Vulnerability') || testName.includes('Security')) category = 'Vulnerability Prevention';
      
      if (!categoryResults[category]) {
        categoryResults[category] = { passed: 0, failed: 0, total: 0 };
      }
      
      categoryResults[category].total++;
      if (testResult.status === 'passed') {
        categoryResults[category].passed++;
      } else {
        categoryResults[category].failed++;
      }
    });
    
    Object.entries(categoryResults).forEach(([category, stats]) => {
      const status = stats.failed === 0 ? '✅' : '❌';
      log(`\n${status} ${category}:`, stats.failed === 0 ? 'green' : 'red');
      log(`   Passed: ${stats.passed}`, 'green');
      log(`   Failed: ${stats.failed}`, 'red');
      log(`   Total: ${stats.total}`, 'cyan');
    });
  }
  
  log(`\n🛡️ Security Coverage:`, 'blue');
  log(`  • Authentication bypass prevention`, 'green');
  log(`  • Authorization and access control`, 'green');
  log(`  • Input validation and sanitization`, 'green');
  log(`  • XSS attack prevention`, 'green');
  log(`  • SQL injection prevention`, 'green');
  log(`  • Multi-tenant data isolation`, 'green');
  log(`  • API endpoint security`, 'green');
  log(`  • Password security`, 'green');
  log(`  • Session security`, 'green');
  log(`  • Error handling security`, 'green');
}

function runAuthenticationTests() {
  log('\n🔐 Running Authentication Security Tests', 'bold');
  
  const authTestCommand = [
    'npx jest',
    '--testNamePattern="Authentication Security"',
    '--verbose'
  ].join(' ');
  
  return runCommand(authTestCommand, 'Running Authentication Security Tests');
}

function runAuthorizationTests() {
  log('\n👤 Running Authorization Security Tests', 'bold');
  
  const authzTestCommand = [
    'npx jest',
    '--testNamePattern="Authorization Security"',
    '--verbose'
  ].join(' ');
  
  return runCommand(authzTestCommand, 'Running Authorization Security Tests');
}

function runInputValidationTests() {
  log('\n🛡️ Running Input Validation Tests', 'bold');
  
  const validationTestCommand = [
    'npx jest',
    '--testNamePattern="Input Validation"',
    '--verbose'
  ].join(' ');
  
  return runCommand(validationTestCommand, 'Running Input Validation Tests');
}

function runMultiTenantTests() {
  log('\n🏢 Running Multi-Tenant Security Tests', 'bold');
  
  const multiTenantTestCommand = [
    'npx jest',
    '--testNamePattern="Multi-Tenant"',
    '--verbose'
  ].join(' ');
  
  return runCommand(multiTenantTestCommand, 'Running Multi-Tenant Security Tests');
}

function runAPISecurityTests() {
  log('\n🌐 Running API Security Tests', 'bold');
  
  const apiSecurityTestCommand = [
    'npx jest',
    '--testNamePattern="API Security"',
    '--verbose'
  ].join(' ');
  
  return runCommand(apiSecurityTestCommand, 'Running API Security Tests');
}

function runVulnerabilityTests() {
  log('\n🚨 Running Vulnerability Prevention Tests', 'bold');
  
  const vulnerabilityTestCommand = [
    'npx jest',
    '--testNamePattern="XSS|SQL Injection|CSRF"',
    '--verbose'
  ].join(' ');
  
  return runCommand(vulnerabilityTestCommand, 'Running Vulnerability Prevention Tests');
}

function main() {
  log('🛡️ LMS Security Test Runner', 'bold');
  log('============================', 'cyan');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites check failed. Exiting.', 'red');
    process.exit(1);
  }
  
  // Run security tests
  const success = runSecurityTests();
  
  // Generate report
  generateSecurityReport();
  
  // Run specific test categories
  log('\n🔬 Running Specific Security Test Categories', 'bold');
  log('==============================================', 'cyan');
  
  runAuthenticationTests();
  runAuthorizationTests();
  runInputValidationTests();
  runMultiTenantTests();
  runAPISecurityTests();
  runVulnerabilityTests();
  
  // Summary
  log('\n📋 Security Test Summary', 'bold');
  log('=========================', 'cyan');
  
  if (success) {
    log('✅ Security tests completed successfully!', 'green');
    log('\n🛡️ Security Coverage:', 'blue');
    log('  • Authentication bypass prevention', 'green');
    log('  • Authorization and access control', 'green');
    log('  • Input validation and sanitization', 'green');
    log('  • XSS attack prevention', 'green');
    log('  • SQL injection prevention', 'green');
    log('  • Multi-tenant data isolation', 'green');
    log('  • API endpoint security', 'green');
    log('  • Password security', 'green');
    log('  • Session security', 'green');
    log('  • Error handling security', 'green');
  } else {
    log('❌ Some security tests failed. Check the report for details.', 'red');
    process.exit(1);
  }
  
  log('\n💡 Security Best Practices:', 'blue');
  log('  • Regularly update dependencies', 'cyan');
  log('  • Implement proper input validation', 'cyan');
  log('  • Use parameterized queries to prevent SQL injection', 'cyan');
  log('  • Sanitize all user input', 'cyan');
  log('  • Implement proper authentication and authorization', 'cyan');
  log('  • Use HTTPS in production', 'cyan');
  log('  • Implement rate limiting', 'cyan');
  log('  • Monitor for security vulnerabilities', 'cyan');
  log('  • Regular security audits', 'cyan');
  log('  • Keep security documentation updated', 'cyan');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runSecurityTests,
  checkPrerequisites,
  generateSecurityReport
};
