import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'Contract Tests',
  testMatch: ['<rootDir>/src/tests/contract/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/contract/setup.ts'],
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1, // Run contract tests sequentially
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/contracts/(.*)$': '<rootDir>/src/contracts/$1',
    '^@/tests/(.*)$': '<rootDir>/src/tests/$1',
  },
  collectCoverageFrom: [
    'src/lib/**/*.{js,jsx,ts,tsx}',
    'src/app/api/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Contract-specific configuration
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  // Global setup
  globalSetup: '<rootDir>/src/tests/contract/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/contract/global-teardown.ts',
  // Verbose output for contract tests
  verbose: true,
  // Force exit after tests complete
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true,
};

export default createJestConfig(customJestConfig);
