#!/usr/bin/env ts-node

/**
 * Test Runner Script
 * TASK-019: API Integration Tests - FR-001 through FR-007
 * 
 * This script runs all tests with proper configuration and reporting.
 */

import { spawn } from 'child_process';
import path from 'path';

interface TestConfig {
  name: string;
  pattern: string;
  timeout: number;
  parallel: boolean;
}

const testConfigs: TestConfig[] = [
  {
    name: 'Unit Tests',
    pattern: 'tests/unit/**/*.test.ts',
    timeout: 30000,
    parallel: true
  },
  {
    name: 'Integration Tests',
    pattern: 'tests/integration/**/*.test.ts',
    timeout: 60000,
    parallel: false
  },
  {
    name: 'Contract Tests',
    pattern: 'tests/contract/**/*.test.ts',
    timeout: 30000,
    parallel: true
  }
];

async function runTests(): Promise<void> {
  console.log('🧪 Starting Personal Shopping Assistant Test Suite\n');

  const results: { name: string; success: boolean; duration: number }[] = [];

  for (const config of testConfigs) {
    console.log(`\n📋 Running ${config.name}...`);
    const startTime = Date.now();

    try {
      await runTestSuite(config);
      const duration = Date.now() - startTime;
      results.push({ name: config.name, success: true, duration });
      console.log(`✅ ${config.name} completed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ name: config.name, success: false, duration });
      console.log(`❌ ${config.name} failed after ${duration}ms`);
      console.error('Error:', error);
    }
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  let totalSuccess = 0;
  let totalDuration = 0;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    console.log(`${status} ${result.name}: ${duration}`);
    
    if (result.success) totalSuccess++;
    totalDuration += result.duration;
  });

  console.log(`\n📈 Overall: ${totalSuccess}/${results.length} test suites passed`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);

  if (totalSuccess === results.length) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

function runTestSuite(config: TestConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--config', 'jest.config.js',
      '--testPathPattern', config.pattern,
      '--testTimeout', config.timeout.toString(),
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (config.parallel) {
      jestArgs.push('--maxWorkers', '4');
    } else {
      jestArgs.push('--runInBand');
    }

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test suite failed with code ${code}`));
      }
    });

    jest.on('error', (error) => {
      reject(error);
    });
  });
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Personal Shopping Assistant Test Runner

Usage: npm run test [options]

Options:
  --help, -h          Show this help message
  --unit              Run only unit tests
  --integration       Run only integration tests
  --contract          Run only contract tests
  --watch             Run tests in watch mode
  --coverage          Run tests with coverage report
  --verbose           Run tests with verbose output

Examples:
  npm run test                    # Run all tests
  npm run test -- --unit         # Run only unit tests
  npm run test -- --coverage     # Run with coverage
  npm run test -- --watch        # Run in watch mode
`);
  process.exit(0);
}

if (args.includes('--unit')) {
  testConfigs.splice(1, 2); // Keep only unit tests
} else if (args.includes('--integration')) {
  testConfigs.splice(0, 1); // Remove unit tests
  testConfigs.splice(1, 1); // Remove contract tests
} else if (args.includes('--contract')) {
  testConfigs.splice(0, 2); // Keep only contract tests
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
