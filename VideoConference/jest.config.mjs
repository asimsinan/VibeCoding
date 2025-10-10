import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/contracts/(.*)$': '<rootDir>/src/contracts/$1',
    '^@/tests/(.*)$': '<rootDir>/src/tests/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/src/tests/unit/**/*.test.{ts,tsx}', '<rootDir>/src/tests/e2e/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
        }],
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
    },
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
        }],
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
    },
    {
      displayName: 'api-factory',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/tests/integration/api-service-factory.integration.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
        }],
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
    },
  {
    displayName: 'security',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/tests/security/**/*.test.ts'],
    globalSetup: '<rootDir>/src/tests/security/global-setup.ts',
    globalTeardown: '<rootDir>/src/tests/security/global-teardown.ts',
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        useESM: true,
      }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    maxWorkers: 1, // Run security tests sequentially to avoid database conflicts
  },
  {
    displayName: 'accessibility',
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['<rootDir>/src/tests/accessibility/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/accessibility/setup.ts'],
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        useESM: true,
      }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    maxWorkers: 1, // Run accessibility tests sequentially
  },
  {
    displayName: 'compatibility',
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['<rootDir>/src/tests/compatibility/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/compatibility/setup.ts'],
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        useESM: true,
      }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    maxWorkers: 1, // Run compatibility tests sequentially
  },
  {
    displayName: 'load',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/tests/load/**/*.test.ts'],
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        useESM: true,
      }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    maxWorkers: 1, // Run load tests sequentially to avoid resource conflicts
    testTimeout: 300000, // 5 minutes timeout for load tests
  },
  {
    displayName: 'uat',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/tests/uat/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/uat/setup.ts'],
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        useESM: true,
      }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    maxWorkers: 1, // Run UAT tests sequentially to avoid database conflicts
    testTimeout: 60000, // 1 minute timeout for UAT tests
  },
  ],
};

export default createJestConfig(customJestConfig);
