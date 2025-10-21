// Jest setup file for global test configuration
import 'jest';
import 'whatwg-fetch';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
(process.env as any).NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public';

// Global test utilities
(global as any).testUtils = {
  generateUUID: () => '123e4567-e89b-12d3-a456-426614174000',
  generateTimestamp: () => new Date('2024-01-01T00:00:00Z'),
  mockDate: (date: string) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(date));
  },
  restoreDate: () => {
    jest.useRealTimers();
  },
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});