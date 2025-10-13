import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  PerformanceMetrics,
  MemoryMonitor,
  ConcurrentUserSimulator,
  PerformanceAssertions,
  PERFORMANCE_THRESHOLDS,
} from './performance-test-utils';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { CourseService } from '../src/services/course.service';
import { UserService } from '../src/services/user.service';
import { EnrollmentService } from '../src/services/enrollment.service';
import { QuizService } from '../src/services/quiz.service';
import { ProgressService } from '../src/services/progress.service';
import { PrismaClient } from '../src/generated/prisma';

// Create a shared Prisma client for performance tests
const prisma = new PrismaClient();

describe('Service Layer Performance Tests', () => {
  let courseService: CourseService;
  let userService: UserService;
  let enrollmentService: EnrollmentService;
  let quizService: QuizService;
  let progressService: ProgressService;
  let testOrg: any;
  let testUser: any;

  beforeAll(async () => {
    await TestCleanup.cleanup();
    MemoryMonitor.startMonitoring();
    
    courseService = new CourseService();
    userService = new UserService();
    enrollmentService = new EnrollmentService();
    quizService = new QuizService();
    progressService = new ProgressService();
    
    testOrg = await TestDataFactory.createOrganization();
    testUser = await TestDataFactory.createUser(testOrg.id, 'ADMIN');
  });

  afterAll(async () => {
    PerformanceMetrics.printReport();
    await TestCleanup.cleanup();
  });

  beforeEach(() => {
    PerformanceMetrics.clearMetrics();
  });

  describe('Course Service Performance', () => {
    it('should create courses efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('CourseService_Create');
      
      const course = await courseService.createCourse({
        title: 'Performance Test Course',
        description: 'A course created for performance testing',
        status: 'DRAFT',
        organizationId: testOrg.id,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(course).toBeDefined();
      expect(course.title).toBe('Performance Test Course');
    });

    it('should retrieve courses efficiently', async () => {
      // Create multiple courses first
      for (let i = 0; i < 10; i++) {
        await courseService.createCourse({
          title: `Test Course ${i}`,
          description: `Description ${i}`,
          status: 'DRAFT',
          organizationId: testOrg.id,
        });
      }
      
      const endTimer = PerformanceMetrics.startTimer('CourseService_GetAll');
      
      const courses = await courseService.getCourses(testOrg.id, {
        page: 1,
        limit: 50,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(courses).toBeDefined();
      expect(courses.length).toBeGreaterThan(0);
    });

    it('should handle concurrent course operations', async () => {
      const operations = [
        async () => {
          return await courseService.createCourse({
            title: 'Concurrent Course 1',
            description: 'Concurrent test course',
            status: 'DRAFT',
            organizationId: testOrg.id,
          });
        },
        async () => {
          return await courseService.getCourses(testOrg.id, { page: 1, limit: 10 });
        },
        async () => {
          const courses = await courseService.getCourses(testOrg.id, { page: 1, limit: 5 });
          if (courses.length > 0) {
            return await courseService.getCourseById(courses[0].id, testOrg.id);
          }
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(15, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 15);
    });
  });

  describe('User Service Performance', () => {
    it('should create users efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('UserService_Create');
      
      const user = await userService.createUser({
        name: 'Performance Test User',
        email: `perf-test-${Date.now()}@example.com`,
        password: 'password123',
        role: 'STUDENT',
        organizationId: testOrg.id,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Performance Test User');
    });

    it('should retrieve users efficiently', async () => {
      // Create multiple users first
      for (let i = 0; i < 20; i++) {
        await userService.createUser({
          name: `Test User ${i}`,
          email: `test-user-${i}-${Date.now()}@example.com`,
          password: 'password123',
          role: 'STUDENT',
          organizationId: testOrg.id,
        });
      }
      
      const endTimer = PerformanceMetrics.startTimer('UserService_GetAll');
      
      const users = await userService.getUsers(testOrg.id, {
        page: 1,
        limit: 50,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
    });

    it('should handle bulk user operations efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('UserService_BulkOperations');
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          userService.createUser({
            name: `Bulk User ${i}`,
            email: `bulk-user-${i}-${Date.now()}@example.com`,
            password: 'password123',
            role: 'STUDENT',
            organizationId: testOrg.id,
          })
        );
      }
      
      await Promise.all(promises);
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 5);
    });
  });

  describe('Enrollment Service Performance', () => {
    let testCourse: any;
    let testStudent: any;

    beforeAll(async () => {
      testCourse = await courseService.createCourse({
        title: 'Enrollment Test Course',
        description: 'Course for enrollment testing',
        status: 'PUBLISHED',
        organizationId: testOrg.id,
      });
      
      testStudent = await userService.createUser({
        name: 'Test Student',
        email: `test-student-${Date.now()}@example.com`,
        password: 'password123',
        role: 'STUDENT',
        organizationId: testOrg.id,
      });
    });

    it('should create enrollments efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('EnrollmentService_Create');
      
      const enrollment = await enrollmentService.createEnrollment({
        userId: testStudent.id,
        courseId: testCourse.id,
        organizationId: testOrg.id,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(enrollment).toBeDefined();
      expect(enrollment.userId).toBe(testStudent.id);
    });

    it('should retrieve enrollments efficiently', async () => {
      // Create multiple enrollments first
      for (let i = 0; i < 15; i++) {
        const student = await userService.createUser({
          name: `Enrollment Student ${i}`,
          email: `enrollment-student-${i}-${Date.now()}@example.com`,
          password: 'password123',
          role: 'STUDENT',
          organizationId: testOrg.id,
        });
        
        await enrollmentService.createEnrollment({
          userId: student.id,
          courseId: testCourse.id,
          organizationId: testOrg.id,
        });
      }
      
      const endTimer = PerformanceMetrics.startTimer('EnrollmentService_GetAll');
      
      const enrollments = await enrollmentService.getEnrollments(testOrg.id, {
        page: 1,
        limit: 50,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(enrollments).toBeDefined();
      expect(enrollments.length).toBeGreaterThan(0);
    });

    it('should handle concurrent enrollment operations', async () => {
      const operations = [
        async () => {
          const student = await userService.createUser({
            name: 'Concurrent Student',
            email: `concurrent-student-${Date.now()}@example.com`,
            password: 'password123',
            role: 'STUDENT',
            organizationId: testOrg.id,
          });
          
          return await enrollmentService.createEnrollment({
            userId: student.id,
            courseId: testCourse.id,
            organizationId: testOrg.id,
          });
        },
        async () => {
          return await enrollmentService.getEnrollments(testOrg.id, { page: 1, limit: 10 });
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(10, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 10);
    });
  });

  describe('Quiz Service Performance', () => {
    let testLesson: any;

    beforeAll(async () => {
      // Create a lesson for quiz testing
      const module = await prisma.module.create({
        data: {
          title: 'Test Module',
          description: 'Module for quiz testing',
          courseId: testCourse.id,
        },
      });
      
      testLesson = await prisma.lesson.create({
        data: {
          title: 'Test Lesson',
          content: 'Lesson content for quiz testing',
          moduleId: module.id,
        },
      });
    });

    it('should create quizzes efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('QuizService_Create');
      
      const quiz = await quizService.createQuiz({
        title: 'Performance Test Quiz',
        description: 'A quiz created for performance testing',
        lessonId: testLesson.id,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(quiz).toBeDefined();
      expect(quiz.title).toBe('Performance Test Quiz');
    });

    it('should create questions efficiently', async () => {
      const quiz = await quizService.createQuiz({
        title: 'Question Test Quiz',
        description: 'Quiz for question testing',
        lessonId: testLesson.id,
      });
      
      const endTimer = PerformanceMetrics.startTimer('QuizService_CreateQuestion');
      
      const question = await quizService.createQuestion({
        question: 'What is 2 + 2?',
        type: 'MULTIPLE_CHOICE',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        quizId: quiz.id,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(question).toBeDefined();
      expect(question.question).toBe('What is 2 + 2?');
    });

    it('should handle bulk quiz operations efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('QuizService_BulkOperations');
      
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          quizService.createQuiz({
            title: `Bulk Quiz ${i}`,
            description: `Bulk quiz ${i} description`,
            lessonId: testLesson.id,
          })
        );
      }
      
      await Promise.all(promises);
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 3);
    });
  });

  describe('Progress Service Performance', () => {
    it('should track progress efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('ProgressService_Track');
      
      const progress = await progressService.trackProgress({
        userId: testStudent.id,
        lessonId: testLesson.id,
        status: 'COMPLETED',
        organizationId: testOrg.id,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(progress).toBeDefined();
      expect(progress.status).toBe('COMPLETED');
    });

    it('should retrieve progress efficiently', async () => {
      // Create multiple progress records first
      for (let i = 0; i < 25; i++) {
        const student = await userService.createUser({
          name: `Progress Student ${i}`,
          email: `progress-student-${i}-${Date.now()}@example.com`,
          password: 'password123',
          role: 'STUDENT',
          organizationId: testOrg.id,
        });
        
        await progressService.trackProgress({
          userId: student.id,
          lessonId: testLesson.id,
          status: 'COMPLETED',
          organizationId: testOrg.id,
        });
      }
      
      const endTimer = PerformanceMetrics.startTimer('ProgressService_GetAll');
      
      const progressRecords = await progressService.getProgress(testOrg.id, {
        page: 1,
        limit: 50,
      });
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      expect(progressRecords).toBeDefined();
      expect(progressRecords.length).toBeGreaterThan(0);
    });

    it('should handle concurrent progress operations', async () => {
      const operations = [
        async () => {
          const student = await userService.createUser({
            name: 'Concurrent Progress Student',
            email: `concurrent-progress-${Date.now()}@example.com`,
            password: 'password123',
            role: 'STUDENT',
            organizationId: testOrg.id,
          });
          
          return await progressService.trackProgress({
            userId: student.id,
            lessonId: testLesson.id,
            status: 'IN_PROGRESS',
            organizationId: testOrg.id,
          });
        },
        async () => {
          return await progressService.getProgress(testOrg.id, { page: 1, limit: 10 });
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(8, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 8);
    });
  });
});
