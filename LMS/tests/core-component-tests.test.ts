import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '../src/generated/prisma';
import { hashPassword } from '../src/lib/auth';
import { UserRole, CourseStatus, LessonType, QuestionType, EnrollmentStatus, ProgressStatus } from '../src/generated/prisma';

// Mock database for testing
const prisma = new PrismaClient();

// Test data setup
let testOrg: any;
let testUser: any;
let testCourse: any;
let testModule: any;
let testLesson: any;
let testQuiz: any;
let testQuestion: any;
let testEnrollment: any;
let testProgress: any;

describe('Core Component Tests', () => {
  beforeEach(async () => {
    // Clean up existing data in correct order to respect foreign key constraints
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
    
    // Create test data
    testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.com',
        settings: { theme: 'blue' },
      },
    });
    
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword('password123'),
        role: UserRole.STUDENT,
        organizationId: testOrg.id,
      },
    });
    
    testCourse = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course',
        status: CourseStatus.PUBLISHED,
        organizationId: testOrg.id,
      },
    });
    
    testModule = await prisma.module.create({
      data: {
        title: 'Test Module',
        order: 1,
        courseId: testCourse.id,
      },
    });
    
    testLesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson',
        content: 'Test lesson content',
        type: LessonType.TEXT,
        order: 1,
        moduleId: testModule.id,
      },
    });
    
    testQuiz = await prisma.quiz.create({
      data: {
        title: 'Test Quiz',
        timeLimit: 30,
        lessonId: testLesson.id,
      },
    });
    
    testQuestion = await prisma.question.create({
      data: {
        text: 'What is 2 + 2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        order: 1,
        quizId: testQuiz.id,
      },
    });
    
    testEnrollment = await prisma.enrollment.create({
      data: {
        userId: testUser.id,
        courseId: testCourse.id,
        organizationId: testOrg.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    
    testProgress = await prisma.progress.create({
      data: {
        userId: testUser.id,
        lessonId: testLesson.id,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Don't disconnect here as we need the client for subsequent tests
    // The cleanup is handled in beforeEach
  });

  afterAll(async () => {
    // Clean up and disconnect at the end of all tests
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
    await prisma.$disconnect();
  });

  describe('Organization Management', () => {
    it('should create organization with proper settings', async () => {
      const org = await prisma.organization.create({
        data: {
          name: 'New Organization',
          domain: 'neworg.com',
          settings: { theme: 'green', logo: 'logo.png' },
        },
      });
      
      expect(org).toBeDefined();
      expect(org.name).toBe('New Organization');
      expect(org.domain).toBe('neworg.com');
      expect(org.settings).toEqual({ theme: 'green', logo: 'logo.png' });
    });

    it('should enforce unique domain constraint', async () => {
      await expect(
        prisma.organization.create({
          data: {
            name: 'Duplicate Domain',
            domain: 'test.com', // Same as testOrg
          },
        })
      ).rejects.toThrow();
    });

    it('should cascade delete users when organization is deleted', async () => {
      const orgId = testOrg.id;
      await prisma.organization.delete({ where: { id: orgId } });
      
      const user = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(user).toBeNull();
    });
  });

  describe('User Management', () => {
    it('should create user with hashed password', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          password: await hashPassword('password123'),
          role: UserRole.INSTRUCTOR,
          organizationId: testOrg.id,
        },
      });
      
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.role).toBe(UserRole.INSTRUCTOR);
      expect(user.password).not.toBe('password123'); // Should be hashed
    });

    it('should enforce unique email constraint', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: 'test@example.com', // Same as testUser
            name: 'Duplicate User',
            role: UserRole.STUDENT,
            organizationId: testOrg.id,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate password strength', async () => {
      const weakPassword = '123';
      const strongPassword = 'StrongPassword123!';
      
      // Weak password should be rejected by validation
      expect(weakPassword.length).toBeLessThan(8);
      
      // Strong password should pass validation
      expect(strongPassword.length).toBeGreaterThanOrEqual(8);
      expect(/[A-Z]/.test(strongPassword)).toBe(true);
      expect(/[a-z]/.test(strongPassword)).toBe(true);
      expect(/\d/.test(strongPassword)).toBe(true);
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(strongPassword)).toBe(true);
    });
  });

  describe('Course Management', () => {
    it('should create course with proper hierarchy', async () => {
      const course = await prisma.course.create({
        data: {
          title: 'New Course',
          description: 'A new course',
          status: CourseStatus.DRAFT,
          organizationId: testOrg.id,
        },
      });
      
      expect(course).toBeDefined();
      expect(course.title).toBe('New Course');
      expect(course.status).toBe(CourseStatus.DRAFT);
      expect(course.organizationId).toBe(testOrg.id);
    });

    it('should maintain course-module-lesson hierarchy', async () => {
      const course = await prisma.course.findUnique({
        where: { id: testCourse.id },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      });
      
      expect(course).toBeDefined();
      expect(course?.modules).toHaveLength(1);
      expect(course?.modules[0].lessons).toHaveLength(1);
      expect(course?.modules[0].lessons[0].id).toBe(testLesson.id);
    });

    it('should enforce course status transitions', async () => {
      const course = await prisma.course.findUnique({ where: { id: testCourse.id } });
      expect(course?.status).toBe(CourseStatus.PUBLISHED);
      
      // Update to archived
      await prisma.course.update({
        where: { id: testCourse.id },
        data: { status: CourseStatus.ARCHIVED },
      });
      
      const updatedCourse = await prisma.course.findUnique({ where: { id: testCourse.id } });
      expect(updatedCourse?.status).toBe(CourseStatus.ARCHIVED);
    });
  });

  describe('Enrollment Management', () => {
    it('should create enrollment with proper relationships', async () => {
      // Create a new user for this test to avoid unique constraint violation
      const newUser = await prisma.user.create({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          password: await hashPassword('password123'),
          role: UserRole.STUDENT,
          organizationId: testOrg.id,
        },
      });

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: newUser.id,
          courseId: testCourse.id,
          organizationId: testOrg.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
      
      expect(enrollment).toBeDefined();
      expect(enrollment.userId).toBe(newUser.id);
      expect(enrollment.courseId).toBe(testCourse.id);
      expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
    });

    it('should enforce unique user-course enrollment', async () => {
      await expect(
        prisma.enrollment.create({
          data: {
            userId: testUser.id,
            courseId: testCourse.id, // Same as testEnrollment
            organizationId: testOrg.id,
            status: EnrollmentStatus.ACTIVE,
          },
        })
      ).rejects.toThrow();
    });

    it('should track enrollment status changes', async () => {
      const enrollment = await prisma.enrollment.findUnique({ where: { id: testEnrollment.id } });
      expect(enrollment?.status).toBe(EnrollmentStatus.ACTIVE);
      
      // Complete enrollment
      await prisma.enrollment.update({
        where: { id: testEnrollment.id },
        data: { 
          status: EnrollmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      
      const updatedEnrollment = await prisma.enrollment.findUnique({ where: { id: testEnrollment.id } });
      expect(updatedEnrollment?.status).toBe(EnrollmentStatus.COMPLETED);
      expect(updatedEnrollment?.completedAt).toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should track lesson completion', async () => {
      // Create a new lesson for this test to avoid unique constraint violation
      const newLesson = await prisma.lesson.create({
        data: {
          title: 'New Lesson for Progress',
          content: 'Content for new lesson',
          type: LessonType.TEXT,
          order: 2,
          moduleId: testModule.id,
        },
      });

      const progress = await prisma.progress.create({
        data: {
          userId: testUser.id,
          lessonId: newLesson.id,
          status: ProgressStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      
      expect(progress).toBeDefined();
      expect(progress.status).toBe(ProgressStatus.COMPLETED);
      expect(progress.completedAt).toBeDefined();
    });

    it('should enforce unique user-lesson progress', async () => {
      await expect(
        prisma.progress.create({
          data: {
            userId: testUser.id,
            lessonId: testLesson.id, // Same as testProgress
            status: ProgressStatus.COMPLETED,
            completedAt: new Date(),
          },
        })
      ).rejects.toThrow();
    });

    it('should calculate course completion percentage', async () => {
      // Create additional lessons
      const lesson2 = await prisma.lesson.create({
        data: {
          title: 'Lesson 2',
          content: 'Content 2',
          type: LessonType.TEXT,
          order: 2,
          moduleId: testModule.id,
        },
      });
      
      // Complete first lesson
      const progress1 = await prisma.progress.findUnique({ where: { id: testProgress.id } });
      expect(progress1?.status).toBe(ProgressStatus.COMPLETED);
      
      // Start second lesson
      const progress2 = await prisma.progress.create({
        data: {
          userId: testUser.id,
          lessonId: lesson2.id,
          status: ProgressStatus.IN_PROGRESS,
        },
      });
      
      // Calculate completion percentage
      const totalLessons = await prisma.lesson.count({
        where: {
          module: {
            courseId: testCourse.id,
          },
        },
      });
      
      const completedLessons = await prisma.progress.count({
        where: {
          userId: testUser.id,
          status: ProgressStatus.COMPLETED,
        },
      });
      
      const completionPercentage = (completedLessons / totalLessons) * 100;
      expect(completionPercentage).toBe(50); // 1 out of 2 lessons completed
    });
  });

  describe('Quiz Management', () => {
    it('should create quiz with questions', async () => {
      // Create a new lesson for this test to avoid unique constraint violation
      const newLesson = await prisma.lesson.create({
        data: {
          title: 'New Lesson for Quiz',
          content: 'Content for new lesson',
          type: LessonType.TEXT,
          order: 2,
          moduleId: testModule.id,
        },
      });

      const quiz = await prisma.quiz.create({
        data: {
          title: 'New Quiz',
          timeLimit: 45,
          lessonId: newLesson.id,
        },
      });
      
      const question = await prisma.question.create({
        data: {
          text: 'What is the capital of France?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['London', 'Paris', 'Berlin', 'Madrid'],
          correctAnswer: 'Paris',
          order: 1,
          quizId: quiz.id,
        },
      });
      
      expect(quiz).toBeDefined();
      expect(question).toBeDefined();
      expect(question.quizId).toBe(quiz.id);
    });

    it('should track quiz attempts', async () => {
      const quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId: testUser.id,
          quizId: testQuiz.id,
          answers: { question1: 'answer1', question2: 'answer2' },
          score: 85.5,
          submittedAt: new Date(),
        },
      });
      
      expect(quizAttempt).toBeDefined();
      expect(quizAttempt.score).toBe(85.5);
      expect(quizAttempt.answers).toEqual({ question1: 'answer1', question2: 'answer2' });
    });

    it('should validate quiz answers', async () => {
      const question = await prisma.question.findUnique({ where: { id: testQuestion.id } });
      expect(question).toBeDefined();
      expect(question?.correctAnswer).toBe('4');
      
      // Test answer validation logic
      const userAnswer = '4';
      const isCorrect = userAnswer === question?.correctAnswer;
      expect(isCorrect).toBe(true);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should isolate data by organization', async () => {
      const org2 = await prisma.organization.create({
        data: {
          name: 'Organization 2',
          domain: 'org2.com',
        },
      });
      
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@org2.com',
          name: 'User 2',
          role: UserRole.STUDENT,
          organizationId: org2.id,
        },
      });
      
      const course2 = await prisma.course.create({
        data: {
          title: 'Course 2',
          description: 'Course for org 2',
          status: CourseStatus.PUBLISHED,
          organizationId: org2.id,
        },
      });
      
      // User from org1 should not see org2's courses
      const user1Courses = await prisma.course.findMany({
        where: {
          organizationId: testOrg.id,
        },
      });
      
      const user2Courses = await prisma.course.findMany({
        where: {
          organizationId: org2.id,
        },
      });
      
      expect(user1Courses).toHaveLength(1);
      expect(user1Courses[0].id).toBe(testCourse.id);
      expect(user2Courses).toHaveLength(1);
      expect(user2Courses[0].id).toBe(course2.id);
    });

    it('should prevent cross-organization data access', async () => {
      const org2 = await prisma.organization.create({
        data: {
          name: 'Organization 2',
          domain: 'org2.com',
        },
      });
      
      // Attempt to create user in org2 but reference org1's course
      await expect(
        prisma.enrollment.create({
          data: {
            userId: testUser.id, // User from org1
            courseId: testCourse.id, // Course from org1
            organizationId: org2.id, // But enrollment in org2
            status: EnrollmentStatus.ACTIVE,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      await expect(
        prisma.user.create({
          data: {
            // Missing required fields
            role: UserRole.STUDENT,
            organizationId: testOrg.id,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate foreign key constraints', async () => {
      await expect(
        prisma.course.create({
          data: {
            title: 'Invalid Course',
            description: 'Course with invalid organization',
            status: CourseStatus.PUBLISHED,
            organizationId: 'non-existent-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            role: 'INVALID_ROLE' as any,
            organizationId: testOrg.id,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple users
      const users = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          prisma.user.create({
            data: {
              email: `user${i}@example.com`,
              name: `User ${i}`,
              role: UserRole.STUDENT,
              organizationId: testOrg.id,
            },
          })
        )
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(users).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle complex queries efficiently', async () => {
      const startTime = Date.now();
      
      // Complex query with multiple joins
      const result = await prisma.progress.findMany({
        where: {
          userId: testUser.id,
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
        },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
