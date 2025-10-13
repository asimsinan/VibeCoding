#!/usr/bin/env node

/**
 * Performance Test Runner
 * 
 * This script runs comprehensive performance tests for the LMS application.
 * It includes tests for database performance, API response times, memory usage,
 * concurrent user handling, and service layer performance.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const PERFORMANCE_CONFIG = {
  timeout: 60000, // 60 seconds per test
  retries: 1,
  workers: 1, // Run tests sequentially for accurate measurements
  reporter: 'json',
  outputDir: './test-results/performance'
};

// Performance test suites
const PERFORMANCE_SUITES = [
  'performance-tests.test.ts',
  'service-performance-tests.test.ts',
  'api-performance-tests.test.ts'
];

// Performance thresholds
const THRESHOLDS = {
  API_RESPONSE_TIME: 500, // 500ms
  DATABASE_QUERY_TIME: 100, // 100ms
  MEMORY_USAGE_MB: 100, // 100MB
  CONCURRENT_SUCCESS_RATE: 0.95, // 95%
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
  
  // Check if performance test files exist
  for (const testFile of PERFORMANCE_SUITES) {
    const testPath = path.join(testDir, testFile);
    if (!fs.existsSync(testPath)) {
      log(`❌ Performance test file ${testFile} does not exist`, 'red');
      return false;
    }
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function runPerformanceTests() {
  log('\n🚀 Starting Performance Tests', 'bold');
  
  // Create output directory
  const outputDir = PERFORMANCE_CONFIG.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Run performance tests
  const command = [
    'npx jest',
    `--testTimeout=${PERFORMANCE_CONFIG.timeout}`,
    `--maxWorkers=${PERFORMANCE_CONFIG.workers}`,
    `--reporter=${PERFORMANCE_CONFIG.reporter}`,
    `--outputFile=${path.join(outputDir, 'performance-results.json')}`,
    'tests/performance-tests.test.ts',
    'tests/service-performance-tests.test.ts',
    'tests/api-performance-tests.test.ts'
  ].join(' ');
  
  return runCommand(command, 'Running Performance Tests');
}

function generatePerformanceReport() {
  log('\n📊 Generating Performance Report', 'blue');
  
  const reportPath = path.join(PERFORMANCE_CONFIG.outputDir, 'performance-results.json');
  if (fs.existsSync(reportPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      generateDetailedReport(results);
    } catch (error) {
      log('❌ Failed to parse performance results', 'red');
    }
  } else {
    log('❌ Performance results not found', 'red');
  }
}

function generateDetailedReport(results) {
  log('\n📈 Performance Test Report', 'bold');
  log('========================', 'cyan');
  
  if (results.success) {
    log('✅ All performance tests passed!', 'green');
  } else {
    log('❌ Some performance tests failed', 'red');
  }
  
  log(`\n📊 Test Summary:`, 'blue');
  log(`  Total Tests: ${results.numTotalTests}`, 'cyan');
  log(`  Passed: ${results.numPassedTests}`, 'green');
  log(`  Failed: ${results.numFailedTests}`, 'red');
  log(`  Duration: ${(results.perfStats.end - results.perfStats.start) / 1000}s`, 'cyan');
  
  if (results.testResults && results.testResults.length > 0) {
    log(`\n🔍 Detailed Results:`, 'blue');
    
    results.testResults.forEach((testResult, index) => {
      log(`\n${index + 1}. ${testResult.name}:`, 'magenta');
      
      if (testResult.status === 'passed') {
        log(`   ✅ Status: PASSED`, 'green');
        log(`   ⏱️  Duration: ${testResult.perfStats.end - testResult.perfStats.start}ms`, 'cyan');
      } else {
        log(`   ❌ Status: FAILED`, 'red');
        log(`   ⏱️  Duration: ${testResult.perfStats.end - testResult.perfStats.start}ms`, 'cyan');
        
        if (testResult.failureMessages && testResult.failureMessages.length > 0) {
          log(`   📝 Failures:`, 'yellow');
          testResult.failureMessages.forEach((failure, i) => {
            log(`      ${i + 1}. ${failure.split('\n')[0]}`, 'yellow');
          });
        }
      }
    });
  }
  
  log(`\n🎯 Performance Thresholds:`, 'blue');
  log(`  API Response Time: ≤ ${THRESHOLDS.API_RESPONSE_TIME}ms`, 'cyan');
  log(`  Database Query Time: ≤ ${THRESHOLDS.DATABASE_QUERY_TIME}ms`, 'cyan');
  log(`  Memory Usage: ≤ ${THRESHOLDS.MEMORY_USAGE_MB}MB`, 'cyan');
  log(`  Concurrent Success Rate: ≥ ${(THRESHOLDS.CONCURRENT_SUCCESS_RATE * 100).toFixed(0)}%`, 'cyan');
}

function runLoadTest() {
  log('\n🔥 Running Load Test', 'bold');
  
  const loadTestCommand = [
    'npx jest',
    '--testNamePattern="should maintain performance under high load"',
    '--verbose'
  ].join(' ');
  
  return runCommand(loadTestCommand, 'Running Load Test');
}

function runConcurrencyTest() {
  log('\n👥 Running Concurrency Test', 'bold');
  
  const concurrencyTestCommand = [
    'npx jest',
    '--testNamePattern="should handle concurrent"',
    '--verbose'
  ].join(' ');
  
  return runCommand(concurrencyTestCommand, 'Running Concurrency Test');
}

function runMemoryTest() {
  log('\n🧠 Running Memory Test', 'bold');
  
  const memoryTestCommand = [
    'npx jest',
    '--testNamePattern="Memory Performance"',
    '--verbose'
  ].join(' ');
  
  return runCommand(memoryTestCommand, 'Running Memory Test');
}

function main() {
  log('⚡ LMS Performance Test Runner', 'bold');
  log('===============================', 'cyan');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites check failed. Exiting.', 'red');
    process.exit(1);
  }
  
  // Run performance tests
  const success = runPerformanceTests();
  
  // Generate report
  generatePerformanceReport();
  
  // Run specific test categories
  log('\n🔬 Running Specific Test Categories', 'bold');
  log('=====================================', 'cyan');
  
  runLoadTest();
  runConcurrencyTest();
  runMemoryTest();
  
  // Summary
  log('\n📋 Performance Test Summary', 'bold');
  log('============================', 'cyan');
  
  if (success) {
    log('✅ Performance tests completed successfully!', 'green');
    log('\n🎯 Performance Coverage:', 'blue');
    log('  • Database query performance', 'green');
    log('  • API endpoint response times', 'green');
    log('  • Service layer performance', 'green');
    log('  • Memory usage and leak detection', 'green');
    log('  • Concurrent user handling', 'green');
    log('  • Bulk operation efficiency', 'green');
    log('  • Load testing under high traffic', 'green');
    log('  • System performance consistency', 'green');
  } else {
    log('❌ Some performance tests failed. Check the report for details.', 'red');
    process.exit(1);
  }
  
  log('\n💡 Performance Optimization Tips:', 'blue');
  log('  • Monitor database query performance regularly', 'cyan');
  log('  • Implement caching for frequently accessed data', 'cyan');
  log('  • Use database indexes for common query patterns', 'cyan');
  log('  • Optimize API response payloads', 'cyan');
  log('  • Implement connection pooling', 'cyan');
  log('  • Monitor memory usage in production', 'cyan');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runPerformanceTests,
  checkPrerequisites,
  generatePerformanceReport
};
