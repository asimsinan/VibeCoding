import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  TestDataFactory,
  TestCleanup,
  IntegrationTestScenarios,
  TestAssertions,
  testDb,
} from './integration-test-utils';

describe('Core Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is clean before starting tests
    await TestCleanup.cleanupAll();
  });

  afterAll(async () => {
    // Clean up after all tests
    await TestCleanup.cleanupAll();
    await testDb.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await TestCleanup.cleanupAll();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await testDb.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });

    it('should perform basic CRUD operations', async () => {
      const org = await TestDataFactory.createOrganization();
      expect(org).toBeDefined();
      expect(org.name).toBe('Test Organization');

      const retrieved = await testDb.organization.findUnique({
        where: { id: org.id },
      });
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(org.name);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should maintain organization isolation', async () => {
      const data = await IntegrationTestScenarios.testMultiTenantIsolation();
      
      TestAssertions.assertOrganizationIsolation(data);
      
      // Verify users cannot access other organizations' data
      const user1Courses = await testDb.course.findMany({
        where: {
          organizationId: data.org1.id,
        },
      });
      
      const user2Courses = await testDb.course.findMany({
        where: {
          organizationId: data.org2.id,
        },
      });
      
      expect(user1Courses).toHaveLength(1);
      expect(user2Courses).toHaveLength(1);
      expect(user1Courses[0].id).toBe(data.course1.id);
      expect(user2Courses[0].id).toBe(data.course2.id);
    });

    it('should prevent cross-organization data access', async () => {
      const org1 = await TestDataFactory.createOrganization({ name: 'Org 1' });
      const org2 = await TestDataFactory.createOrganization({ name: 'Org 2' });
      
      const user1 = await TestDataFactory.createUser({ organizationId: org1.id });
      const course1 = await TestDataFactory.createCourse({ organizationId: org1.id });
      
      // User from org1 should not be able to access org2's courses
      const org2Courses = await testDb.course.findMany({
        where: {
          organizationId: org2.id,
        },
      });
      
      expect(org2Courses).toHaveLength(0);
    });
  });

  describe('User Management', () => {
    it('should create users with proper role assignments', async () => {
      const data = await IntegrationTestScenarios.testRoleBasedAccess();
      
      TestAssertions.assertRolePermissions(data);
      
      expect(data.admin.organizationId).toBe(data.org.id);
      expect(data.instructor.organizationId).toBe(data.org.id);
      expect(data.student.organizationId).toBe(data.org.id);
    });

    it('should enforce user-organization relationships', async () => {
      const org = await TestDataFactory.createOrganization();
      const user = await TestDataFactory.createUser({ organizationId: org.id });
      
      const userWithOrg = await testDb.user.findUnique({
        where: { id: user.id },
        include: { organization: true },
      });
      
      expect(userWithOrg?.organizationId).toBe(org.id);
      expect(userWithOrg?.organization?.id).toBe(org.id);
    });
  });

  describe('Course Management', () => {
    it('should create complete course structure', async () => {
      const data = await IntegrationTestScenarios.testCourseEnrollmentFlow();
      
      TestAssertions.assertCourseStructure(data);
      
      // Verify course hierarchy
      expect(data.module.courseId).toBe(data.course.id);
      expect(data.lesson.moduleId).toBe(data.module.id);
      expect(data.quiz.lessonId).toBe(data.lesson.id);
    });

    it('should maintain course-organization relationships', async () => {
      const org = await TestDataFactory.createOrganization();
      const course = await TestDataFactory.createCourse({ organizationId: org.id });
      
      const courseWithOrg = await testDb.course.findUnique({
        where: { id: course.id },
        include: { organization: true },
      });
      
      expect(courseWithOrg?.organizationId).toBe(org.id);
      expect(courseWithOrg?.organization?.id).toBe(org.id);
    });
  });

  describe('Enrollment Management', () => {
    it('should handle course enrollment flow', async () => {
      const org = await TestDataFactory.createOrganization();
      const user = await TestDataFactory.createUser({ organizationId: org.id });
      const course = await TestDataFactory.createCourse({ organizationId: org.id });
      
      const enrollment = await TestDataFactory.createEnrollment({
        userId: user.id,
        courseId: course.id,
      });
      
      expect(enrollment.userId).toBe(user.id);
      expect(enrollment.courseId).toBe(course.id);
      expect(enrollment.status).toBe('ACTIVE');
    });

    it('should prevent duplicate enrollments', async () => {
      const org = await TestDataFactory.createOrganization();
      const user = await TestDataFactory.createUser({ organizationId: org.id });
      const course = await TestDataFactory.createCourse({ organizationId: org.id });
      
      // Create first enrollment
      await TestDataFactory.createEnrollment({
        userId: user.id,
        courseId: course.id,
      });
      
      // Attempt to create duplicate enrollment
      await expect(
        TestDataFactory.createEnrollment({
          userId: user.id,
          courseId: course.id,
        })
      ).rejects.toThrow();
    });
  });

  describe('Progress Tracking', () => {
    it('should track lesson completion', async () => {
      const data = await IntegrationTestScenarios.testCourseCompletionFlow();
      
      TestAssertions.assertProgressTracking(data);
      
      // Verify progress records
      const progressRecords = await testDb.progress.findMany({
        where: {
          enrollmentId: data.enrollment.id,
        },
      });
      
      expect(progressRecords).toHaveLength(2);
      expect(progressRecords.every(p => p.status === 'COMPLETED')).toBe(true);
    });

    it('should calculate course completion percentage', async () => {
      const data = await IntegrationTestScenarios.testCourseCompletionFlow();
      
      const totalLessons = await testDb.lesson.count({
        where: {
          module: {
            courseId: data.course.id,
          },
        },
      });
      
      const completedLessons = await testDb.progress.count({
        where: {
          enrollmentId: data.enrollment.id,
          status: 'COMPLETED',
        },
      });
      
      const completionPercentage = (completedLessons / totalLessons) * 100;
      expect(completionPercentage).toBe(100);
    });
  });

  describe('Quiz Management', () => {
    it('should create quiz with questions', async () => {
      const question = await TestDataFactory.createQuestion();
      
      expect(question).toBeDefined();
      expect(question.text).toBe('What is 2 + 2?');
      expect(question.type).toBe('MULTIPLE_CHOICE');
      expect(question.options).toEqual(['3', '4', '5', '6']);
      expect(question.correctAnswer).toBe('4');
    });

    it('should track quiz attempts', async () => {
      const quizAttempt = await TestDataFactory.createQuizAttempt();
      
      expect(quizAttempt).toBeDefined();
      expect(quizAttempt.score).toBe(80);
      expect(quizAttempt.answers).toEqual({ question1: 'answer1' });
      expect(quizAttempt.completedAt).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      const org = await TestDataFactory.createOrganization();
      
      // Attempt to create user with non-existent organization
      await expect(
        testDb.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            role: 'STUDENT',
            organizationId: 'non-existent-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle cascade deletions', async () => {
      const org = await TestDataFactory.createOrganization();
      const user = await TestDataFactory.createUser({ organizationId: org.id });
      
      // Delete organization should cascade to user
      await testDb.organization.delete({
        where: { id: org.id },
      });
      
      const deletedUser = await testDb.user.findUnique({
        where: { id: user.id },
      });
      
      expect(deletedUser).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const org = await TestDataFactory.createOrganization();
      const course = await TestDataFactory.createCourse({ organizationId: org.id });
      
      const startTime = Date.now();
      
      // Create multiple modules
      const modules = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          testDb.module.create({
            data: {
              title: `Module ${i + 1}`,
              description: `Description ${i + 1}`,
              order: i + 1,
              courseId: course.id,
            },
          })
        )
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(modules).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle complex queries efficiently', async () => {
      const org = await TestDataFactory.createOrganization();
      const user = await TestDataFactory.createUser({ organizationId: org.id });
      const course = await TestDataFactory.createCourse({ organizationId: org.id });
      
      // Create complex course structure
      const module = await testDb.module.create({
        data: {
          title: 'Module 1',
          order: 1,
          courseId: course.id,
        },
      });
      
      const lesson = await testDb.lesson.create({
        data: {
          title: 'Lesson 1',
          content: 'Content',
          type: 'TEXT',
          order: 1,
          moduleId: module.id,
        },
      });
      
      const enrollment = await testDb.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          status: 'ACTIVE',
        },
      });
      
      const startTime = Date.now();
      
      // Complex query with multiple joins
      const result = await testDb.progress.findMany({
        where: {
          enrollment: {
            userId: user.id,
            course: {
              organizationId: org.id,
            },
          },
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    include: {
                      organization: true,
                    },
                  },
                },
              },
            },
          },
          enrollment: {
            include: {
              user: true,
              course: true,
            },
          },
        },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Attempt to create user with invalid email
      await expect(
        testDb.user.create({
          data: {
            email: 'invalid-email',
            name: 'Test User',
            role: 'STUDENT',
            organizationId: 'non-existent-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle constraint violations', async () => {
      const org = await TestDataFactory.createOrganization();
      
      // Create user with unique email
      await TestDataFactory.createUser({
        organizationId: org.id,
        email: 'unique@example.com',
      });
      
      // Attempt to create another user with same email
      await expect(
        TestDataFactory.createUser({
          organizationId: org.id,
          email: 'unique@example.com',
        })
      ).rejects.toThrow();
    });
  });
});
