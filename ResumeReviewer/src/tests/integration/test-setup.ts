import { PrismaClient } from '@prisma/client';

// Individual test setup for integration tests
let testPrisma: PrismaClient;

beforeAll(async () => {
  // Create a test database connection
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public'
      }
    }
  });
  
  await testPrisma.$connect();
  
  // Verify database connection
  try {
    await testPrisma.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`);
  }
});

afterAll(async () => {
  if (testPrisma) {
    await testPrisma.$disconnect();
  }
});

beforeEach(async () => {
  // Clean up all test data before each test
  // Order matters due to foreign key constraints
  await testPrisma.feedback.deleteMany();
  await testPrisma.resumeUpload.deleteMany();
  await testPrisma.userSession.deleteMany();
  await testPrisma.healthLog.deleteMany();
});

// Helper function to get test database client
export function getTestPrismaClient(): PrismaClient {
  return testPrisma;
}

// Helper function to create test data
export async function createTestUpload(data: Partial<any> = {}) {
  return await testPrisma.resumeUpload.create({
    data: {
      fileName: 'test-resume.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      ...data,
    }
  });
}

export async function createTestSession(data: Partial<any> = {}) {
  return await testPrisma.userSession.create({
    data: {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      ...data,
    }
  });
}

export async function createTestFeedback(uploadId: string, data: Partial<any> = {}) {
  return await testPrisma.feedback.create({
    data: {
      uploadId,
      overallScore: 85,
      contentScore: 90,
      formattingScore: 80,
      keywordScore: 88,
      suggestions: JSON.stringify(['Improve action verbs']),
      strengths: JSON.stringify(['Clear objective']),
      improvements: JSON.stringify(['Add more metrics']),
      ...data,
    }
  });
}

export async function createTestHealthLog(data: Partial<any> = {}) {
  return await testPrisma.healthLog.create({
    data: {
      status: 'healthy',
      services: JSON.stringify({ database: 'healthy', api: 'healthy', storage: 'healthy' }),
      uptime: 3600,
      ...data,
    }
  });
}

// Test timeout configuration
jest.setTimeout(30000); // 30 seconds for integration tests
