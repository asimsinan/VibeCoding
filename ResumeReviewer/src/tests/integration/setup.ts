import { PrismaClient } from '@prisma/client';

// Global test setup for integration tests
let globalPrisma: PrismaClient;

// Global setup function for Jest
export default async function globalSetup() {
  // Create a test database connection
  globalPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_reviewer_dev?schema=public'
      }
    }
  });
  
  await globalPrisma.$connect();
  
  // Verify database connection
  try {
    await globalPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established for integration tests');
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`);
  }
}

// Global teardown function for Jest
export async function globalTeardown() {
  if (globalPrisma) {
    await globalPrisma.$disconnect();
    console.log('🔌 Database connection closed for integration tests');
  }
}

// Helper function to get test database client
export function getTestPrismaClient(): PrismaClient {
  return globalPrisma;
}

// Helper function to create test data
export async function createTestUpload(data: Partial<any> = {}) {
  return await globalPrisma.resumeUpload.create({
    data: {
      fileName: 'test-resume.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      ...data,
    }
  });
}

export async function createTestSession(data: Partial<any> = {}) {
  return await globalPrisma.userSession.create({
    data: {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      ...data,
    }
  });
}

export async function createTestFeedback(uploadId: string, data: Partial<any> = {}) {
  return await globalPrisma.feedback.create({
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
  return await globalPrisma.healthLog.create({
    data: {
      status: 'healthy',
      services: JSON.stringify({ database: 'healthy', api: 'healthy', storage: 'healthy' }),
      uptime: 3600,
      ...data,
    }
  });
}

// Test timeout configuration will be set in individual test files
