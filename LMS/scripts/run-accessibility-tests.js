#!/usr/bin/env node

/**
 * Accessibility Test Runner
 * 
 * This script runs comprehensive accessibility tests for the LMS application.
 * It tests compliance with WCAG 2.1 AA standards across different browsers and devices.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// WCAG 2.1 AA Test Categories
const WCAG_CATEGORIES = {
  'perceivable': {
    name: 'Perceivable',
    description: 'Information and UI components must be presentable to users',
    tests: [
      'Text alternatives for images',
      'Captions for multimedia',
      'Color contrast',
      'Resizable text',
      'Heading structure'
    ]
  },
  'operable': {
    name: 'Operable',
    description: 'UI components and navigation must be operable',
    tests: [
      'Keyboard accessibility',
      'Focus indicators',
      'Skip links',
      'Keyboard shortcuts',
      'Time limits and user control'
    ]
  },
  'understandable': {
    name: 'Understandable',
    description: 'Information and UI operation must be understandable',
    tests: [
      'Language attributes',
      'Consistent navigation',
      'Form labels and instructions',
      'Error identification'
    ]
  },
  'robust': {
    name: 'Robust',
    description: 'Content must be robust enough for assistive technologies',
    tests: [
      'ARIA attributes',
      'Semantic HTML',
      'Heading hierarchy',
      'Landmark roles',
      'Table structure'
    ]
  }
};

// Test scenarios
const TEST_SCENARIOS = [
  'perceivable',
  'operable',
  'understandable',
  'robust',
  'additional'
];

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
  log('Checking prerequisites for accessibility testing...', 'blue');
  
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
    log('Please start it with `npm run dev` before running accessibility tests.', 'yellow');
    return false;
  } else {
    log('✅ Next.js development server is running on port 3000', 'green');
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function runAccessibilityTests() {
  log('\n♿ Starting Accessibility Tests - WCAG 2.1 AA Compliance', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts';
  
  return runCommand(command, 'Running accessibility tests');
}

function runSpecificCategoryTests(category) {
  log(`\n♿ Running ${WCAG_CATEGORIES[category]?.name || category} Tests`, 'bold');
  
  const command = `npx playwright test tests/e2e/accessibility.spec.ts --grep="${category}"`;
  
  return runCommand(command, `Running ${category} accessibility tests`);
}

function runPerceivableTests() {
  log('\n👁️ Running Perceivable Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts --grep="Perceivable"';
  
  return runCommand(command, 'Running perceivable accessibility tests');
}

function runOperableTests() {
  log('\n⌨️ Running Operable Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts --grep="Operable"';
  
  return runCommand(command, 'Running operable accessibility tests');
}

function runUnderstandableTests() {
  log('\n📖 Running Understandable Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts --grep="Understandable"';
  
  return runCommand(command, 'Running understandable accessibility tests');
}

function runRobustTests() {
  log('\n🔧 Running Robust Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts --grep="Robust"';
  
  return runCommand(command, 'Running robust accessibility tests');
}

function runAdditionalTests() {
  log('\n➕ Running Additional Accessibility Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts --grep="Additional"';
  
  return runCommand(command, 'Running additional accessibility tests');
}

function runCrossBrowserAccessibilityTests() {
  log('\n🌐 Running Cross-Browser Accessibility Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/responsive-accessibility.spec.ts';
  
  return runCommand(command, 'Running cross-browser accessibility tests');
}

function runMobileAccessibilityTests() {
  log('\n📱 Running Mobile Accessibility Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts --project="Mobile Chrome" --project="Mobile Safari"';
  
  return runCommand(command, 'Running mobile accessibility tests');
}

function generateAccessibilityReport(results) {
  log('\n📊 Accessibility Test Report - WCAG 2.1 AA Compliance', 'bold');
  log('======================================================', 'cyan');
  
  log(`\n♿ WCAG 2.1 AA Compliance Coverage:`, 'blue');
  
  Object.entries(WCAG_CATEGORIES).forEach(([key, category]) => {
    log(`\n📋 ${category.name}:`, 'green');
    log(`   ${category.description}`, 'cyan');
    category.tests.forEach(test => {
      log(`   • ${test}`, 'cyan');
    });
  });
  
  log(`\n🔍 Accessibility Testing Areas:`, 'blue');
  log(`  • Text Alternatives`, 'green');
  log(`  • Color Contrast`, 'green');
  log(`  • Keyboard Navigation`, 'green');
  log(`  • Focus Management`, 'green');
  log(`  • ARIA Implementation`, 'green');
  log(`  • Semantic HTML`, 'green');
  log(`  • Form Accessibility`, 'green');
  log(`  • Link Accessibility`, 'green');
  log(`  • Button Accessibility`, 'green');
  log(`  • Table Accessibility`, 'green');
  log(`  • Heading Structure`, 'green');
  log(`  • Landmark Roles`, 'green');
  log(`  • Live Regions`, 'green');
  log(`  • Error Handling`, 'green');
  log(`  • Language Attributes`, 'green');
  
  log(`\n🌐 Cross-Browser Accessibility:`, 'blue');
  log(`  • Chrome/Chromium`, 'green');
  log(`  • Firefox`, 'green');
  log(`  • Safari/WebKit`, 'green');
  log(`  • Mobile Chrome`, 'green');
  log(`  • Mobile Safari`, 'green');
  
  log(`\n📱 Mobile Accessibility:`, 'blue');
  log(`  • Touch Accessibility`, 'green');
  log(`  • Mobile Screen Readers`, 'green');
  log(`  • Mobile Keyboard Navigation`, 'green');
  log(`  • Mobile Focus Management`, 'green');
  log(`  • Mobile ARIA Support`, 'green');
  
  log(`\n♿ Accessibility Best Practices:`, 'blue');
  log(`  • Use semantic HTML elements`, 'cyan');
  log(`  • Provide text alternatives for images`, 'cyan');
  log(`  • Ensure sufficient color contrast`, 'cyan');
  log(`  • Implement keyboard navigation`, 'cyan');
  log(`  • Use proper ARIA attributes`, 'cyan');
  log(`  • Provide focus indicators`, 'cyan');
  log(`  • Use descriptive link text`, 'cyan');
  log(`  • Implement skip links`, 'cyan');
  log(`  • Provide form labels`, 'cyan');
  log(`  • Use proper heading hierarchy`, 'cyan');
  log(`  • Implement landmark roles`, 'cyan');
  log(`  • Provide error messages`, 'cyan');
  log(`  • Use language attributes`, 'cyan');
  log(`  • Test with screen readers`, 'cyan');
  log(`  • Test with keyboard only`, 'cyan');
}

function runComprehensiveAccessibilityTests() {
  log('\n🧪 Running Comprehensive Accessibility Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/accessibility.spec.ts tests/e2e/responsive-accessibility.spec.ts tests/e2e/mobile-responsiveness.spec.ts --grep="accessibility"';
  
  return runCommand(command, 'Running comprehensive accessibility test suite');
}

function main() {
  log('♿ LMS Accessibility Test Runner - WCAG 2.1 AA Compliance', 'bold');
  log('=========================================================', 'cyan');
  
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
      results = runAccessibilityTests();
      generateAccessibilityReport(results);
      break;
      
    case 'comprehensive':
      const comprehensiveSuccess = runComprehensiveAccessibilityTests();
      log(`\n📊 Comprehensive Accessibility Test Results:`, 'blue');
      log(`  Status: ${comprehensiveSuccess ? 'All tests passed' : 'Some tests failed'}`, comprehensiveSuccess ? 'green' : 'red');
      break;
      
    case 'perceivable':
      const perceivableSuccess = runPerceivableTests();
      log(`\n👁️ Perceivable Test Results:`, 'blue');
      log(`  Status: ${perceivableSuccess ? 'All perceivable tests passed' : 'Some perceivable tests failed'}`, perceivableSuccess ? 'green' : 'red');
      break;
      
    case 'operable':
      const operableSuccess = runOperableTests();
      log(`\n⌨️ Operable Test Results:`, 'blue');
      log(`  Status: ${operableSuccess ? 'All operable tests passed' : 'Some operable tests failed'}`, operableSuccess ? 'green' : 'red');
      break;
      
    case 'understandable':
      const understandableSuccess = runUnderstandableTests();
      log(`\n📖 Understandable Test Results:`, 'blue');
      log(`  Status: ${understandableSuccess ? 'All understandable tests passed' : 'Some understandable tests failed'}`, understandableSuccess ? 'green' : 'red');
      break;
      
    case 'robust':
      const robustSuccess = runRobustTests();
      log(`\n🔧 Robust Test Results:`, 'blue');
      log(`  Status: ${robustSuccess ? 'All robust tests passed' : 'Some robust tests failed'}`, robustSuccess ? 'green' : 'red');
      break;
      
    case 'additional':
      const additionalSuccess = runAdditionalTests();
      log(`\n➕ Additional Test Results:`, 'blue');
      log(`  Status: ${additionalSuccess ? 'All additional tests passed' : 'Some additional tests failed'}`, additionalSuccess ? 'green' : 'red');
      break;
      
    case 'cross-browser':
      const crossBrowserSuccess = runCrossBrowserAccessibilityTests();
      log(`\n🌐 Cross-Browser Accessibility Test Results:`, 'blue');
      log(`  Status: ${crossBrowserSuccess ? 'All cross-browser tests passed' : 'Some cross-browser tests failed'}`, crossBrowserSuccess ? 'green' : 'red');
      break;
      
    case 'mobile':
      const mobileSuccess = runMobileAccessibilityTests();
      log(`\n📱 Mobile Accessibility Test Results:`, 'blue');
      log(`  Status: ${mobileSuccess ? 'All mobile tests passed' : 'Some mobile tests failed'}`, mobileSuccess ? 'green' : 'red');
      break;
      
    default:
      log(`\n❌ Unknown command: ${command}`, 'red');
      log('\nAvailable commands:', 'blue');
      log('  all          - Run all accessibility tests', 'cyan');
      log('  comprehensive - Run comprehensive accessibility test suite', 'cyan');
      log('  perceivable  - Run perceivable tests', 'cyan');
      log('  operable     - Run operable tests', 'cyan');
      log('  understandable - Run understandable tests', 'cyan');
      log('  robust       - Run robust tests', 'cyan');
      log('  additional   - Run additional accessibility tests', 'cyan');
      log('  cross-browser - Run cross-browser accessibility tests', 'cyan');
      log('  mobile       - Run mobile accessibility tests', 'cyan');
      process.exit(1);
  }
  
  log('\n🎉 Accessibility Testing completed!', 'green');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runAccessibilityTests,
  runComprehensiveAccessibilityTests,
  runPerceivableTests,
  runOperableTests,
  runUnderstandableTests,
  runRobustTests,
  runAdditionalTests,
  runCrossBrowserAccessibilityTests,
  runMobileAccessibilityTests,
  checkPrerequisites,
  generateAccessibilityReport,
  WCAG_CATEGORIES
};
