import type { Config } from 'jest';

const config: Config = {
  // Use multi-project setup to separate browser (jsdom) and node environments
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  projects: [
    {
      displayName: 'web-ui',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src/tests/ui'],
      testMatch: [
        '**/__tests__/**/*.ts',
        '**/__tests__/**/*.tsx',
        '**/?(*.)+(spec|test).ts',
        '**/?(*.)+(spec|test).tsx'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/src/tests/visual/',
        '<rootDir>/src/tests/ui/api-integration/real-api-integration.test.ts'
      ],
      collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.d.ts',
        '!src/tests/**',
        // Exclude non-critical generated or wiring code from UI coverage
        '!src/tests/**',
        '!src/**/index.ts',
        '!src/**/mocks/**',
      ],
      // per-project verbose is not a valid InitialProjectOptions key in some Jest versions
    },
    {
      displayName: 'node-core',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/tests'],
      testMatch: [
        '**/contract/**/*.test.ts',
        '**/integration/**/*.test.ts',
        '**/unit/**/*.test.ts',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup-node.ts'],
      globalSetup: '<rootDir>/src/tests/integration/setup.ts',
      globalTeardown: '<rootDir>/src/tests/integration/setup.ts',
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/src/tests/visual/',
        '<rootDir>/src/tests/ui/',
      ],
      collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.d.ts',
        '!src/tests/**',
        // Exclude prisma-generated types and repository factory plumbing if any
        '!src/**/index.ts',
        '!src/**/mocks/**',
        '!src/lib/**/models/index.ts',
        '!src/lib/**/repositories/repository-factory.ts',
      ],
      // per-project verbose is not a valid InitialProjectOptions key in some Jest versions
    },
  ],
  testTimeout: 20000,
  verbose: true,
};

export default config;
