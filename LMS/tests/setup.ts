import { PrismaClient } from '../src/generated/prisma';

// Test setup file
// This file runs before all tests

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up test database before running tests
  try {
    // Clean up in correct order to respect foreign key constraints
    await prisma.quizAttempt.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  } catch (error) {
    console.warn('Setup cleanup warning:', error);
  }
});

afterAll(async () => {
  // Final cleanup after all tests
  try {
    // Clean up in correct order to respect foreign key constraints
    await prisma.quizAttempt.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  } catch (error) {
    console.warn('Final cleanup warning:', error);
  }
  
  await prisma.$disconnect();
});

// Global test utilities
declare global {
  var testUtils: any;
}

global.testUtils = {
  prisma,
  createTestOrganization: async (data = {}) => {
    return await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.example.com',
        settings: { theme: 'light' },
        ...data
      }
    });
  },
  createTestUser: async (organizationId: string, data = {}) => {
    return await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId,
        ...data
      }
    });
  },
  createTestCourse: async (organizationId: string, data = {}) => {
    return await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course',
        status: 'DRAFT',
        organizationId,
        ...data
      }
    });
  }
};
