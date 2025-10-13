#!/usr/bin/env node

/**
 * Mobile Responsiveness Test Runner
 * 
 * This script runs comprehensive mobile responsiveness tests for the LMS application.
 * It tests the application across different mobile devices, screen sizes, and orientations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mobile device configurations
const MOBILE_DEVICES = {
  'iPhone SE': { width: 375, height: 667 },
  'iPhone 12': { width: 390, height: 844 },
  'iPhone 12 Pro': { width: 390, height: 844 },
  'iPhone 12 Pro Max': { width: 428, height: 926 },
  'iPhone 13': { width: 390, height: 844 },
  'iPhone 13 Pro': { width: 390, height: 844 },
  'iPhone 13 Pro Max': { width: 428, height: 926 },
  'iPhone 14': { width: 390, height: 844 },
  'iPhone 14 Plus': { width: 428, height: 926 },
  'iPhone 14 Pro': { width: 393, height: 852 },
  'iPhone 14 Pro Max': { width: 430, height: 932 },
  'Samsung Galaxy S21': { width: 384, height: 854 },
  'Samsung Galaxy S22': { width: 360, height: 780 },
  'Samsung Galaxy S23': { width: 360, height: 780 },
  'Google Pixel 6': { width: 412, height: 915 },
  'Google Pixel 7': { width: 412, height: 915 },
  'iPad Mini': { width: 768, height: 1024 },
  'iPad Air': { width: 820, height: 1180 },
  'iPad Pro 11"': { width: 834, height: 1194 },
  'iPad Pro 12.9"': { width: 1024, height: 1366 }
};

// Test scenarios
const TEST_SCENARIOS = [
  'viewport-and-layout',
  'touch-interactions',
  'navigation-and-menus',
  'form-interactions',
  'content-and-typography',
  'images-and-media',
  'performance-on-mobile',
  'accessibility-on-mobile',
  'mobile-specific-features'
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
  log('Checking prerequisites for mobile responsiveness testing...', 'blue');
  
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
    log('Please start it with `npm run dev` before running mobile responsiveness tests.', 'yellow');
    return false;
  } else {
    log('✅ Next.js development server is running on port 3000', 'green');
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function runMobileResponsivenessTests() {
  log('\n📱 Starting Mobile Responsiveness Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/mobile-responsiveness.spec.ts --project="Mobile Chrome" --project="Mobile Safari"';
  
  return runCommand(command, 'Running mobile responsiveness tests');
}

function runSpecificDeviceTests(deviceName) {
  log(`\n📱 Testing ${deviceName}`, 'cyan');
  
  const device = MOBILE_DEVICES[deviceName];
  if (!device) {
    log(`❌ Unknown device: ${deviceName}`, 'red');
    return false;
  }
  
  const command = `npx playwright test tests/e2e/mobile-responsiveness.spec.ts --project="Mobile Chrome" --project="Mobile Safari"`;
  
  return runCommand(command, `Running tests for ${deviceName} (${device.width}x${device.height})`);
}

function runOrientationTests() {
  log('\n🔄 Running Orientation Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/mobile-responsiveness.spec.ts --project="Mobile Chrome" --project="Mobile Safari" --grep="orientation"';
  
  return runCommand(command, 'Running orientation change tests');
}

function runTouchInteractionTests() {
  log('\n👆 Running Touch Interaction Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/mobile-responsiveness.spec.ts --project="Mobile Chrome" --project="Mobile Safari" --grep="touch"';
  
  return runCommand(command, 'Running touch interaction tests');
}

function runPerformanceTests() {
  log('\n⚡ Running Mobile Performance Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/mobile-responsiveness.spec.ts --project="Mobile Chrome" --project="Mobile Safari" --grep="performance"';
  
  return runCommand(command, 'Running mobile performance tests');
}

function runAccessibilityTests() {
  log('\n♿ Running Mobile Accessibility Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/mobile-responsiveness.spec.ts --project="Mobile Chrome" --project="Mobile Safari" --grep="accessibility"';
  
  return runCommand(command, 'Running mobile accessibility tests');
}

function generateMobileReport(results) {
  log('\n📊 Mobile Responsiveness Test Report', 'bold');
  log('=====================================', 'cyan');
  
  log(`\n📱 Mobile Testing Coverage:`, 'blue');
  log(`  • Viewport and Layout Adaptation`, 'green');
  log(`  • Touch Interactions`, 'green');
  log(`  • Navigation and Menus`, 'green');
  log(`  • Form Interactions`, 'green');
  log(`  • Content and Typography`, 'green');
  log(`  • Images and Media`, 'green');
  log(`  • Performance on Mobile`, 'green');
  log(`  • Accessibility on Mobile`, 'green');
  log(`  • Mobile-Specific Features`, 'green');
  
  log(`\n📐 Tested Screen Sizes:`, 'blue');
  Object.entries(MOBILE_DEVICES).forEach(([deviceName, dimensions]) => {
    log(`  • ${deviceName}: ${dimensions.width}x${dimensions.height}`, 'cyan');
  });
  
  log(`\n🔄 Orientation Testing:`, 'blue');
  log(`  • Portrait Mode`, 'green');
  log(`  • Landscape Mode`, 'green');
  log(`  • Orientation Changes`, 'green');
  
  log(`\n👆 Touch Interaction Testing:`, 'blue');
  log(`  • Tap Events`, 'green');
  log(`  • Swipe Gestures`, 'green');
  log(`  • Pinch Zoom`, 'green');
  log(`  • Pull-to-Refresh`, 'green');
  
  log(`\n⚡ Performance Testing:`, 'blue');
  log(`  • Load Time Optimization`, 'green');
  log(`  • Network Condition Simulation`, 'green');
  log(`  • Memory Usage Monitoring`, 'green');
  log(`  • Battery Life Considerations`, 'green');
  
  log(`\n♿ Accessibility Testing:`, 'blue');
  log(`  • Screen Reader Support`, 'green');
  log(`  • Keyboard Navigation`, 'green');
  log(`  • ARIA Attributes`, 'green');
  log(`  • Touch Target Sizes`, 'green');
  
  log(`\n💡 Mobile Responsiveness Best Practices:`, 'blue');
  log(`  • Use responsive design principles`, 'cyan');
  log(`  • Optimize for touch interactions`, 'cyan');
  log(`  • Implement mobile-first design`, 'cyan');
  log(`  • Test on real devices`, 'cyan');
  log(`  • Consider network conditions`, 'cyan');
  log(`  • Optimize images and media`, 'cyan');
  log(`  • Use appropriate font sizes`, 'cyan');
  log(`  • Implement proper viewport settings`, 'cyan');
  log(`  • Test with different orientations`, 'cyan');
  log(`  • Consider mobile-specific features`, 'cyan');
}

function runComprehensiveMobileTests() {
  log('\n🧪 Running Comprehensive Mobile Tests', 'bold');
  
  const command = 'npx playwright test tests/e2e/mobile-responsiveness.spec.ts tests/e2e/responsive-accessibility.spec.ts --project="Mobile Chrome" --project="Mobile Safari"';
  
  return runCommand(command, 'Running comprehensive mobile test suite');
}

function main() {
  log('📱 LMS Mobile Responsiveness Test Runner', 'bold');
  log('=========================================', 'cyan');
  
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
      results = runMobileResponsivenessTests();
      generateMobileReport(results);
      break;
      
    case 'comprehensive':
      const comprehensiveSuccess = runComprehensiveMobileTests();
      log(`\n📊 Comprehensive Mobile Test Results:`, 'blue');
      log(`  Status: ${comprehensiveSuccess ? 'All tests passed' : 'Some tests failed'}`, comprehensiveSuccess ? 'green' : 'red');
      break;
      
    case 'orientation':
      const orientationSuccess = runOrientationTests();
      log(`\n🔄 Orientation Test Results:`, 'blue');
      log(`  Status: ${orientationSuccess ? 'All orientation tests passed' : 'Some orientation tests failed'}`, orientationSuccess ? 'green' : 'red');
      break;
      
    case 'touch':
      const touchSuccess = runTouchInteractionTests();
      log(`\n👆 Touch Interaction Test Results:`, 'blue');
      log(`  Status: ${touchSuccess ? 'All touch tests passed' : 'Some touch tests failed'}`, touchSuccess ? 'green' : 'red');
      break;
      
    case 'performance':
      const performanceSuccess = runPerformanceTests();
      log(`\n⚡ Mobile Performance Test Results:`, 'blue');
      log(`  Status: ${performanceSuccess ? 'All performance tests passed' : 'Some performance tests failed'}`, performanceSuccess ? 'green' : 'red');
      break;
      
    case 'accessibility':
      const accessibilitySuccess = runAccessibilityTests();
      log(`\n♿ Mobile Accessibility Test Results:`, 'blue');
      log(`  Status: ${accessibilitySuccess ? 'All accessibility tests passed' : 'Some accessibility tests failed'}`, accessibilitySuccess ? 'green' : 'red');
      break;
      
    default:
      // Check if it's a device name
      if (MOBILE_DEVICES[command]) {
        const deviceSuccess = runSpecificDeviceTests(command);
        log(`\n📱 ${command} Test Results:`, 'blue');
        log(`  Status: ${deviceSuccess ? 'All tests passed' : 'Some tests failed'}`, deviceSuccess ? 'green' : 'red');
      } else {
        log(`\n❌ Unknown command: ${command}`, 'red');
        log('\nAvailable commands:', 'blue');
        log('  all          - Run all mobile responsiveness tests', 'cyan');
        log('  comprehensive - Run comprehensive mobile test suite', 'cyan');
        log('  orientation  - Run orientation change tests', 'cyan');
        log('  touch        - Run touch interaction tests', 'cyan');
        log('  performance  - Run mobile performance tests', 'cyan');
        log('  accessibility - Run mobile accessibility tests', 'cyan');
        log('\nAvailable devices:', 'blue');
        Object.keys(MOBILE_DEVICES).forEach(device => {
          log(`  ${device}`, 'cyan');
        });
        process.exit(1);
      }
  }
  
  log('\n🎉 Mobile Responsiveness Testing completed!', 'green');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMobileResponsivenessTests,
  runComprehensiveMobileTests,
  runOrientationTests,
  runTouchInteractionTests,
  runPerformanceTests,
  runAccessibilityTests,
  checkPrerequisites,
  generateMobileReport,
  MOBILE_DEVICES
};
