#!/usr/bin/env node

/**
 * Cross-Browser Test Runner
 * 
 * This script runs comprehensive cross-browser tests for the LMS application.
 * It tests compatibility across Chrome, Firefox, Safari, and mobile browsers.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Browser configuration
const BROWSER_CONFIG = {
  browsers: [
    { name: 'chromium', displayName: 'Chrome/Chromium' },
    { name: 'firefox', displayName: 'Firefox' },
    { name: 'webkit', displayName: 'Safari/WebKit' },
    { name: 'Mobile Chrome', displayName: 'Mobile Chrome' },
    { name: 'Mobile Safari', displayName: 'Mobile Safari' }
  ],
  testSuites: [
    'cross-browser.spec.ts',
    'browser-specific.spec.ts',
    'auth.spec.ts',
    'courses.spec.ts',
    'quizzes-progress.spec.ts',
    'responsive-accessibility.spec.ts'
  ]
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
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    log('✅ Playwright is installed', 'green');
  } catch (error) {
    log('❌ Playwright is not installed. Installing...', 'yellow');
    runCommand('npm install @playwright/test', 'Installing Playwright');
  }
  
  // Check if browsers are installed
  try {
    execSync('npx playwright install', { stdio: 'pipe' });
    log('✅ Playwright browsers are installed', 'green');
  } catch (error) {
    log('❌ Failed to install Playwright browsers', 'red');
    return false;
  }
  
  // Check if the Next.js development server is running
  const isDevServerRunning = () => {
    try {
      execSync('lsof -i :3000', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  };

  if (!isDevServerRunning()) {
    log('⚠️ Next.js development server is not running on port 3000.', 'yellow');
    log('Please start it with `npm run dev` before running cross-browser tests.', 'yellow');
    return false;
  } else {
    log('✅ Next.js development server is running on port 3000', 'green');
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function runCrossBrowserTests() {
  log('\n🌐 Starting Cross-Browser Tests', 'bold');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    browsers: {}
  };
  
  // Run tests for each browser
  for (const browser of BROWSER_CONFIG.browsers) {
    log(`\n🔍 Testing ${browser.displayName}`, 'cyan');
    
    const command = `npx playwright test --project=${browser.name} tests/e2e/cross-browser.spec.ts tests/e2e/browser-specific.spec.ts`;
    const success = runCommand(command, `Running tests for ${browser.displayName}`);
    
    results.browsers[browser.name] = {
      displayName: browser.displayName,
      success: success,
      tests: success ? 'All tests passed' : 'Some tests failed'
    };
    
    results.total++;
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

function runComprehensiveTests() {
  log('\n🧪 Running Comprehensive Cross-Browser Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/cross-browser.spec.ts tests/e2e/browser-specific.spec.ts tests/e2e/auth.spec.ts tests/e2e/courses.spec.ts tests/e2e/quizzes-progress.spec.ts tests/e2e/responsive-accessibility.spec.ts';
  
  return runCommand(command, 'Running comprehensive cross-browser test suite');
}

function generateCrossBrowserReport(results) {
  log('\n📊 Cross-Browser Test Report', 'bold');
  log('============================', 'cyan');
  
  log(`\n📈 Overall Results:`, 'blue');
  log(`  Total Browsers Tested: ${results.total}`, 'cyan');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, 'red');
  
  log(`\n🌐 Browser-Specific Results:`, 'blue');
  Object.entries(results.browsers).forEach(([browserName, result]) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`\n${status} ${result.displayName}:`, color);
    log(`   Status: ${result.tests}`, 'cyan');
  });
  
  log(`\n🔍 Cross-Browser Compatibility Coverage:`, 'blue');
  log(`  • Authentication flows`, 'green');
  log(`  • Navigation and routing`, 'green');
  log(`  • Form interactions`, 'green');
  log(`  • CSS and styling`, 'green');
  log(`  • JavaScript functionality`, 'green');
  log(`  • Error handling`, 'green');
  log(`  • Performance metrics`, 'green');
  log(`  • Accessibility features`, 'green');
  log(`  • Mobile responsiveness`, 'green');
  log(`  • Browser-specific features`, 'green');
  
  log(`\n💡 Cross-Browser Testing Best Practices:`, 'blue');
  log(`  • Test on real browsers, not just headless`, 'cyan');
  log(`  • Test on different operating systems`, 'cyan');
  log(`  • Test on mobile devices`, 'cyan');
  log(`  • Test with different screen sizes`, 'cyan');
  log(`  • Test with different network conditions`, 'cyan');
  log(`  • Test with accessibility tools`, 'cyan');
  log(`  • Test with different user agents`, 'cyan');
  log(`  • Test with disabled JavaScript`, 'cyan');
  log(`  • Test with disabled CSS`, 'cyan');
  log(`  • Test with different time zones`, 'cyan');
}

function runSpecificBrowserTests(browserName) {
  log(`\n🎯 Running Tests for ${browserName}`, 'bold');
  
  const command = `npx playwright test --project=${browserName} tests/e2e/cross-browser.spec.ts tests/e2e/browser-specific.spec.ts`;
  
  return runCommand(command, `Running tests for ${browserName}`);
}

function runMobileTests() {
  log('\n📱 Running Mobile Browser Tests', 'bold');
  
  const mobileBrowsers = ['Mobile Chrome', 'Mobile Safari'];
  const results = { passed: 0, failed: 0 };
  
  for (const browser of mobileBrowsers) {
    const success = runSpecificBrowserTests(browser);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  log(`\n📱 Mobile Test Results:`, 'blue');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, 'red');
  
  return results.passed === mobileBrowsers.length;
}

function runDesktopTests() {
  log('\n🖥️ Running Desktop Browser Tests', 'bold');
  
  const desktopBrowsers = ['chromium', 'firefox', 'webkit'];
  const results = { passed: 0, failed: 0 };
  
  for (const browser of desktopBrowsers) {
    const success = runSpecificBrowserTests(browser);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  log(`\n🖥️ Desktop Test Results:`, 'blue');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, 'red');
  
  return results.passed === desktopBrowsers.length;
}

function main() {
  log('🌐 LMS Cross-Browser Test Runner', 'bold');
  log('=================================', 'cyan');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites check failed. Exiting.', 'red');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  let results;
  
  switch (command) {
    case 'all':
      results = runCrossBrowserTests();
      generateCrossBrowserReport(results);
      break;
      
    case 'comprehensive':
      const comprehensiveSuccess = runComprehensiveTests();
      log(`\n📊 Comprehensive Test Results:`, 'blue');
      log(`  Status: ${comprehensiveSuccess ? 'All tests passed' : 'Some tests failed'}`, comprehensiveSuccess ? 'green' : 'red');
      break;
      
    case 'mobile':
      const mobileSuccess = runMobileTests();
      log(`\n📱 Mobile Test Results:`, 'blue');
      log(`  Status: ${mobileSuccess ? 'All mobile tests passed' : 'Some mobile tests failed'}`, mobileSuccess ? 'green' : 'red');
      break;
      
    case 'desktop':
      const desktopSuccess = runDesktopTests();
      log(`\n🖥️ Desktop Test Results:`, 'blue');
      log(`  Status: ${desktopSuccess ? 'All desktop tests passed' : 'Some desktop tests failed'}`, desktopSuccess ? 'green' : 'red');
      break;
      
    case 'chrome':
    case 'chromium':
      runSpecificBrowserTests('chromium');
      break;
      
    case 'firefox':
      runSpecificBrowserTests('firefox');
      break;
      
    case 'safari':
    case 'webkit':
      runSpecificBrowserTests('webkit');
      break;
      
    case 'mobile-chrome':
      runSpecificBrowserTests('Mobile Chrome');
      break;
      
    case 'mobile-safari':
      runSpecificBrowserTests('Mobile Safari');
      break;
      
    default:
      log(`\n❌ Unknown command: ${command}`, 'red');
      log('\nAvailable commands:', 'blue');
      log('  all          - Run tests on all browsers', 'cyan');
      log('  comprehensive - Run comprehensive test suite', 'cyan');
      log('  mobile       - Run tests on mobile browsers only', 'cyan');
      log('  desktop      - Run tests on desktop browsers only', 'cyan');
      log('  chrome       - Run tests on Chrome/Chromium only', 'cyan');
      log('  firefox      - Run tests on Firefox only', 'cyan');
      log('  safari       - Run tests on Safari/WebKit only', 'cyan');
      log('  mobile-chrome - Run tests on Mobile Chrome only', 'cyan');
      log('  mobile-safari - Run tests on Mobile Safari only', 'cyan');
      process.exit(1);
  }
  
  log('\n🎉 Cross-Browser Testing completed!', 'green');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runCrossBrowserTests,
  runComprehensiveTests,
  runMobileTests,
  runDesktopTests,
  checkPrerequisites,
  generateCrossBrowserReport
};
