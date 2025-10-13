#!/usr/bin/env node

/**
 * End-to-End Test Runner
 * 
 * This script runs comprehensive end-to-end tests for the LMS application.
 * It includes tests for authentication, course management, quiz functionality,
 * progress tracking, responsive design, accessibility, and complete user journeys.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per test
  retries: 2,
  workers: 1, // Run tests sequentially for stability
  reporter: 'html',
  outputDir: './test-results/e2e'
};

// Test suites to run
const TEST_SUITES = [
  'auth.spec.ts',
  'courses.spec.ts', 
  'quizzes-progress.spec.ts',
  'responsive-accessibility.spec.ts',
  'complete-journey.spec.ts'
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    log('✅ Playwright is installed', 'green');
  } catch (error) {
    log('❌ Playwright is not installed. Installing...', 'yellow');
    runCommand('npm install @playwright/test playwright', 'Installing Playwright');
    runCommand('npx playwright install', 'Installing Playwright browsers');
  }
  
  // Check if test files exist
  const testDir = path.join(__dirname, 'tests', 'e2e');
  if (!fs.existsSync(testDir)) {
    log('❌ E2E test directory does not exist', 'red');
    return false;
  }
  
  // Check if test files exist
  for (const testFile of TEST_SUITES) {
    const testPath = path.join(testDir, testFile);
    if (!fs.existsSync(testPath)) {
      log(`❌ Test file ${testFile} does not exist`, 'red');
      return false;
    }
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function runE2ETests() {
  log('\n🚀 Starting End-to-End Tests', 'bold');
  
  // Create output directory
  const outputDir = TEST_CONFIG.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Run tests with configuration
  const command = [
    'npx playwright test',
    `--timeout=${TEST_CONFIG.timeout}`,
    `--retries=${TEST_CONFIG.retries}`,
    `--workers=${TEST_CONFIG.workers}`,
    `--reporter=${TEST_CONFIG.reporter}`,
    `--output=${outputDir}`,
    'tests/e2e/'
  ].join(' ');
  
  return runCommand(command, 'Running End-to-End Tests');
}

function generateTestReport() {
  log('\n📊 Generating Test Report', 'blue');
  
  const reportPath = path.join(TEST_CONFIG.outputDir, 'index.html');
  if (fs.existsSync(reportPath)) {
    log(`✅ Test report generated: ${reportPath}`, 'green');
    log(`📖 Open the report in your browser to view detailed results`, 'blue');
  } else {
    log('❌ Test report not found', 'red');
  }
}

function main() {
  log('🧪 LMS End-to-End Test Runner', 'bold');
  log('================================', 'blue');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites check failed. Exiting.', 'red');
    process.exit(1);
  }
  
  // Run tests
  const success = runE2ETests();
  
  // Generate report
  generateTestReport();
  
  // Summary
  log('\n📋 Test Summary', 'bold');
  log('================', 'blue');
  
  if (success) {
    log('✅ All end-to-end tests completed successfully!', 'green');
    log('\n🎯 Test Coverage:', 'blue');
    log('  • Authentication flows (login, register, password reset)', 'green');
    log('  • Course management (create, edit, delete, publish)', 'green');
    log('  • Quiz functionality (create, take, grade)', 'green');
    log('  • Progress tracking (lessons, completion, certificates)', 'green');
    log('  • Responsive design (mobile, tablet, desktop)', 'green');
    log('  • Accessibility (ARIA, keyboard navigation, screen readers)', 'green');
    log('  • Complete user journeys (student, instructor, admin)', 'green');
    log('  • Cross-browser compatibility (Chrome, Firefox, Safari)', 'green');
    log('  • Error handling and edge cases', 'green');
    log('  • Performance and data persistence', 'green');
  } else {
    log('❌ Some tests failed. Check the report for details.', 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runE2ETests,
  checkPrerequisites,
  generateTestReport
};
