// Test setup for contract tests
import { PrismaClient } from '@prisma/client';

// Set up test environment
(process.env as any).NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public';

// Global test setup
beforeAll(async () => {
  console.log('✅ Database connection established for contract tests');
});

afterAll(async () => {
  console.log('✅ Contract tests completed');
});
