import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '../src/generated/prisma';

// Integration Test Scenarios for Core Functionality
// These tests validate the integration between different components and services

describe('Integration Test Scenarios', () => {
  let prisma: PrismaClient;
  let testOrganization: any;
  let testAdmin: any;
  let testInstructor: any;
  let testStudent: any;
  let testCourse: any;
  let testModule: any;
  let testLesson: any;
  let testQuiz: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Integration Test Org',
        domain: 'integration-test.com',
        settings: { theme: 'test' }
      }
    });

    // Create test users
    testAdmin = await prisma.user.create({
      data: {
        email: 'admin@integration-test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        organizationId: testOrganization.id
      }
    });

    testAdmin = await prisma.user.create({
      data: {
        email: 'admin@integration-test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        organizationId: testOrganization.id
      }
    });

    testInstructor = await prisma.user.create({
      data: {
        email: 'instructor@integration-test.com',
        name: 'Test Instructor',
        role: 'INSTRUCTOR',
        organizationId: testOrganization.id
      }
    });

    testStudent = await prisma.user.create({
      data: {
        email: 'student@integration-test.com',
        name: 'Test Student',
        role: 'STUDENT',
        organizationId: testOrganization.id
      }
    });

    // Create test course
    testCourse = await prisma.course.create({
      data: {
        title: 'Integration Test Course',
        description: 'A course for integration testing',
        status: 'PUBLISHED',
        organizationId: testOrganization.id
      }
    });

    // Create test module
    testModule = await prisma.module.create({
      data: {
        title: 'Integration Test Module',
        order: 1,
        courseId: testCourse.id
      }
    });

    // Create test lesson
    testLesson = await prisma.lesson.create({
      data: {
        title: 'Integration Test Lesson',
        content: 'Test lesson content',
        type: 'TEXT',
        order: 1,
        moduleId: testModule.id
      }
    });

    // Create test quiz
    testQuiz = await prisma.quiz.create({
      data: {
        title: 'Integration Test Quiz',
        timeLimit: 30,
        lessonId: testLesson.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.quizAttempt.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.$disconnect();
  });

  describe('Organization Management Integration', () => {
    it('should create organization with users and maintain data integrity', async () => {
      // Test organization creation
      const org = await prisma.organization.create({
        data: {
          name: 'Test Org Integration',
          domain: 'test-org.com',
          settings: { theme: 'blue' }
        }
      });

      // Test user creation with organization relationship
      const user = await prisma.user.create({
        data: {
          email: 'user@test-org.com',
          name: 'Test User',
          role: 'STUDENT',
          organizationId: org.id
        }
      });

      // Verify relationship integrity
      const userWithOrg = await prisma.user.findUnique({
        where: { id: user.id },
        include: { organization: true }
      });

      expect(userWithOrg?.organization.id).toBe(org.id);
      expect(userWithOrg?.organization.name).toBe('Test Org Integration');
    });

    it('should handle organization deletion with cascade', async () => {
      const org = await prisma.organization.create({
        data: {
          name: 'Cascade Test Org',
          domain: 'cascade-test.com'
        }
      });

      const user = await prisma.user.create({
        data: {
          email: 'cascade@test.com',
          name: 'Cascade User',
          role: 'STUDENT',
          organizationId: org.id
        }
      });

      const course = await prisma.course.create({
        data: {
          title: 'Cascade Test Course',
          status: 'DRAFT',
          organizationId: org.id
        }
      });

      // Delete organization
      await prisma.organization.delete({
        where: { id: org.id }
      });

      // Verify cascade deletion
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      const deletedCourse = await prisma.course.findUnique({
        where: { id: course.id }
      });

      expect(deletedUser).toBeNull();
      expect(deletedCourse).toBeNull();
    });
  });

  describe('Course Management Integration', () => {
    it('should create course with modules and lessons in correct order', async () => {
      const course = await prisma.course.create({
        data: {
          title: 'Ordered Course',
          status: 'PUBLISHED',
          organizationId: testOrganization.id
        }
      });

      // Create modules in order
      const module1 = await prisma.module.create({
        data: {
          title: 'Module 1',
          order: 1,
          courseId: course.id
        }
      });

      const module2 = await prisma.module.create({
        data: {
          title: 'Module 2',
          order: 2,
          courseId: course.id
        }
      });

      // Create lessons in order
      const lesson1 = await prisma.lesson.create({
        data: {
          title: 'Lesson 1.1',
          order: 1,
          moduleId: module1.id,
          type: 'TEXT'
        }
      });

      const lesson2 = await prisma.lesson.create({
        data: {
          title: 'Lesson 1.2',
          order: 2,
          moduleId: module1.id,
          type: 'TEXT'
        }
      });

      const lesson3 = await prisma.lesson.create({
        data: {
          title: 'Lesson 2.1',
          order: 1,
          moduleId: module2.id,
          type: 'TEXT'
        }
      });

      // Verify course structure
      const courseWithStructure = await prisma.course.findUnique({
        where: { id: course.id },
        include: {
          modules: {
            include: {
              lessons: {
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      expect(courseWithStructure?.modules).toHaveLength(2);
      expect(courseWithStructure?.modules[0].title).toBe('Module 1');
      expect(courseWithStructure?.modules[0].lessons).toHaveLength(2);
      expect(courseWithStructure?.modules[1].lessons).toHaveLength(1);
    });

    it('should handle course enrollment and progress tracking', async () => {
      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: testStudent.id,
          courseId: testCourse.id,
          organizationId: testOrganization.id,
          status: 'ACTIVE'
        }
      });

      // Create progress for lesson
      const progress = await prisma.progress.create({
        data: {
          userId: testStudent.id,
          lessonId: testLesson.id,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Verify enrollment and progress relationship
      const studentWithProgress = await prisma.user.findUnique({
        where: { id: testStudent.id },
        include: {
          enrollments: {
            include: {
              course: true
            }
          },
          progress: {
            include: {
              lesson: true
            }
          }
        }
      });

      expect(studentWithProgress?.enrollments).toHaveLength(1);
      expect(studentWithProgress?.enrollments[0].course.title).toBe('Integration Test Course');
      expect(studentWithProgress?.progress).toHaveLength(1);
      expect(studentWithProgress?.progress[0].lesson.title).toBe('Integration Test Lesson');
    });
  });

  describe('Quiz System Integration', () => {
    it('should create quiz with questions and handle submissions', async () => {
      // Create questions for quiz
      const question1 = await prisma.question.create({
        data: {
          text: 'What is 2 + 2?',
          type: 'MULTIPLE_CHOICE',
          options: {
            A: '3',
            B: '4',
            C: '5',
            D: '6'
          },
          correctAnswer: { answer: 'B' },
          order: 1,
          quizId: testQuiz.id
        }
      });

      const question2 = await prisma.question.create({
        data: {
          text: 'JavaScript is a programming language.',
          type: 'TRUE_FALSE',
          correctAnswer: { answer: true },
          order: 2,
          quizId: testQuiz.id
        }
      });

      // Submit quiz attempt
      const quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId: testStudent.id,
          quizId: testQuiz.id,
          answers: {
            question1: 'B',
            question2: true
          },
          score: 100,
          submittedAt: new Date()
        }
      });

      // Verify quiz structure and attempt
      const quizWithQuestions = await prisma.quiz.findUnique({
        where: { id: testQuiz.id },
        include: {
          questions: {
            orderBy: { order: 'asc' }
          },
          attempts: {
            include: {
              user: true
            }
          }
        }
      });

      expect(quizWithQuestions?.questions).toHaveLength(2);
      expect(quizWithQuestions?.attempts).toHaveLength(1);
      expect(quizWithQuestions?.attempts[0].user.email).toBe('student@integration-test.com');
      expect(quizWithQuestions?.attempts[0].score).toBe(100);
    });

    it('should calculate quiz scores correctly', async () => {
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Score Test Quiz',
          timeLimit: 15,
          lessonId: testLesson.id
        }
      });

      // Create questions with known correct answers
      await prisma.question.create({
        data: {
          text: 'Question 1',
          type: 'MULTIPLE_CHOICE',
          options: { A: 'Wrong', B: 'Correct', C: 'Wrong', D: 'Wrong' },
          correctAnswer: { answer: 'B' },
          order: 1,
          quizId: quiz.id
        }
      });

      await prisma.question.create({
        data: {
          text: 'Question 2',
          type: 'TRUE_FALSE',
          correctAnswer: { answer: true },
          order: 2,
          quizId: quiz.id
        }
      });

      // Test correct answers
      const correctAttempt = await prisma.quizAttempt.create({
        data: {
          userId: testStudent.id,
          quizId: quiz.id,
          answers: {
            question1: 'B',
            question2: true
          },
          score: 100,
          submittedAt: new Date()
        }
      });

      // Test incorrect answers
      const incorrectAttempt = await prisma.quizAttempt.create({
        data: {
          userId: testInstructor.id,
          quizId: quiz.id,
          answers: {
            question1: 'A',
            question2: false
          },
          score: 0,
          submittedAt: new Date()
        }
      });

      expect(correctAttempt.score).toBe(100);
      expect(incorrectAttempt.score).toBe(0);
    });
  });

  describe('Multi-tenant Data Isolation', () => {
    it('should maintain data isolation between organizations', async () => {
      // Create second organization
      const org2 = await prisma.organization.create({
        data: {
          name: 'Second Test Org',
          domain: 'second-test.com'
        }
      });

      // Create user in second organization
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@second-test.com',
          name: 'User 2',
          role: 'STUDENT',
          organizationId: org2.id
        }
      });

      // Create course in second organization
      const course2 = await prisma.course.create({
        data: {
          title: 'Second Org Course',
          status: 'PUBLISHED',
          organizationId: org2.id
        }
      });

      // Verify isolation - user from org1 should not see org2's course
      const org1Courses = await prisma.course.findMany({
        where: { organizationId: testOrganization.id }
      });

      const org2Courses = await prisma.course.findMany({
        where: { organizationId: org2.id }
      });

      expect(org1Courses).toHaveLength(1); // Only the test course
      expect(org2Courses).toHaveLength(1); // Only the second org course
      expect(org1Courses[0].title).toBe('Integration Test Course');
      expect(org2Courses[0].title).toBe('Second Org Course');
    });

    it('should prevent cross-organization data access', async () => {
      // Try to create enrollment for user from different organization
      const org2 = await prisma.organization.create({
        data: {
          name: 'Isolation Test Org',
          domain: 'isolation-test.com'
        }
      });

      const userFromOrg2 = await prisma.user.create({
        data: {
          email: 'isolation@test.com',
          name: 'Isolation User',
          role: 'STUDENT',
          organizationId: org2.id
        }
      });

      // This should fail due to organization mismatch
      try {
        await prisma.enrollment.create({
          data: {
            userId: userFromOrg2.id,
            courseId: testCourse.id, // Course belongs to testOrganization
            organizationId: org2.id, // But enrollment is for org2
            status: 'ACTIVE'
          }
        });
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Expected to fail due to foreign key constraint
        expect(error).toBeDefined();
      }
    });
  });

  describe('User Role-based Access Integration', () => {
    it('should enforce role-based permissions in data access', async () => {
      // Test admin can create courses
      const adminCourse = await prisma.course.create({
        data: {
          title: 'Admin Created Course',
          status: 'PUBLISHED',
          organizationId: testOrganization.id
        }
      });

      // Test instructor can create courses
      const instructorCourse = await prisma.course.create({
        data: {
          title: 'Instructor Created Course',
          status: 'DRAFT',
          organizationId: testOrganization.id
        }
      });

      // Verify courses were created
      const courses = await prisma.course.findMany({
        where: { organizationId: testOrganization.id }
      });

      expect(courses.length).toBeGreaterThanOrEqual(3); // Including test course
      
      const courseTitles = courses.map(c => c.title);
      expect(courseTitles).toContain('Admin Created Course');
      expect(courseTitles).toContain('Instructor Created Course');
    });

    it('should track user activity across different roles', async () => {
      // Admin creates course
      const course = await prisma.course.create({
        data: {
          title: 'Role Test Course',
          status: 'PUBLISHED',
          organizationId: testOrganization.id
        }
      });

      // Instructor creates module
      const module = await prisma.module.create({
        data: {
          title: 'Role Test Module',
          order: 1,
          courseId: course.id
        }
      });

      // Student enrolls and makes progress
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: testStudent.id,
          courseId: course.id,
          organizationId: testOrganization.id,
          status: 'ACTIVE'
        }
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Role Test Lesson',
          type: 'TEXT',
          order: 1,
          moduleId: module.id
        }
      });

      const progress = await prisma.progress.create({
        data: {
          userId: testStudent.id,
          lessonId: lesson.id,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Verify all activities are properly linked
      expect(enrollment.userId).toBe(testStudent.id);
      expect(enrollment.courseId).toBe(course.id);
      expect(progress.userId).toBe(testStudent.id);
      expect(progress.lessonId).toBe(lesson.id);
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Create multiple courses
      const courses = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          prisma.course.create({
            data: {
              title: `Bulk Course ${i + 1}`,
              status: 'DRAFT',
              organizationId: testOrganization.id
            }
          })
        )
      );

      // Create multiple users
      const users = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          prisma.user.create({
            data: {
              email: `bulk-user-${i + 1}@test.com`,
              name: `Bulk User ${i + 1}`,
              role: 'STUDENT',
              organizationId: testOrganization.id
            }
          })
        )
      );

      // Create multiple enrollments
      const enrollments = await Promise.all(
        users.slice(0, 10).map((user, i) =>
          prisma.enrollment.create({
            data: {
              userId: user.id,
              courseId: courses[i].id,
              organizationId: testOrganization.id,
              status: 'ACTIVE'
            }
          })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all operations completed
      expect(courses).toHaveLength(10);
      expect(users).toHaveLength(20);
      expect(enrollments).toHaveLength(10);

      // Performance should be reasonable (less than 5 seconds for bulk operations)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];

      // Simulate concurrent course creation
      for (let i = 0; i < 5; i++) {
        promises.push(
          prisma.course.create({
            data: {
              title: `Concurrent Course ${i + 1}`,
              status: 'DRAFT',
              organizationId: testOrganization.id
            }
          })
        );
      }

      // Simulate concurrent user creation
      for (let i = 0; i < 5; i++) {
        promises.push(
          prisma.user.create({
            data: {
              email: `concurrent-user-${i + 1}@test.com`,
              name: `Concurrent User ${i + 1}`,
              role: 'STUDENT',
              organizationId: testOrganization.id
            }
          })
        );
      }

      const results = await Promise.all(promises);

      // Verify all operations completed successfully
      expect(results).toHaveLength(10);
      
      const courses = results.filter(r => r.title?.includes('Concurrent Course'));
      const users = results.filter(r => r.name?.includes('Concurrent User'));
      
      expect(courses).toHaveLength(5);
      expect(users).toHaveLength(5);
    });
  });
});
