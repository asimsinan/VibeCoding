/**
 * Test Setup File
 * Global test configuration and setup
 */

// Set test environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Global test timeout
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  console.log('🧪 Test suite starting...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

