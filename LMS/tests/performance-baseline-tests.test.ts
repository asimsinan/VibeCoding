import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '../src/generated/prisma';
import { hashPassword } from '../src/lib/auth';
import { UserRole, CourseStatus, LessonType, QuestionType, EnrollmentStatus, ProgressStatus } from '../src/generated/prisma';
import { MetricsCollector } from '../src/lib/monitoring';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  // Database operations (in milliseconds)
  USER_CREATE: 100,
  COURSE_CREATE: 150,
  ENROLLMENT_CREATE: 200,
  PROGRESS_CREATE: 150,
  QUIZ_ATTEMPT_CREATE: 200,
  
  // Query operations (in milliseconds)
  USER_FIND_UNIQUE: 50,
  COURSE_FIND_MANY: 100,
  ENROLLMENT_FIND_MANY: 150,
  PROGRESS_FIND_MANY: 100,
  QUIZ_ATTEMPT_FIND_MANY: 150,
  
  // Complex queries (in milliseconds)
  COMPLEX_JOIN_QUERY: 500,
  BULK_OPERATION: 2000,
  
  // API operations (in milliseconds)
  API_RESPONSE_TIME: 1000,
  AUTHENTICATION_TIME: 200,
  AUTHORIZATION_TIME: 100,
  
  // Memory usage (in MB)
  MAX_MEMORY_USAGE: 512,
  
  // CPU usage (in microseconds)
  MAX_CPU_USAGE: 1000000,
};

// Test database setup
const prisma = new PrismaClient();
const metrics = MetricsCollector.getInstance();

describe('Performance Baseline Tests', () => {
  let testOrg: any;
  let testUsers: any[] = [];
  let testCourses: any[] = [];
  let testEnrollments: any[] = [];
  let testProgress: any[] = [];
  let testQuizAttempts: any[] = [];

  beforeAll(async () => {
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
    
    // Create test organization
    testOrg = await prisma.organization.create({
      data: {
        name: 'Performance Test Organization',
        domain: 'perftest.com',
        settings: { theme: 'blue' },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset metrics before each test
    metrics.resetMetrics();
  });

  describe('Database Write Performance', () => {
    it('should create users within performance threshold', async () => {
      const startTime = Date.now();
      
      // Create 10 users
      for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
          data: {
            email: `user${i}@perftest.com`,
            name: `User ${i}`,
            password: await hashPassword('password123'),
            role: UserRole.STUDENT,
            organizationId: testOrg.id,
          },
        });
        testUsers.push(user);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageTime = duration / 10;
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.USER_CREATE);
      metrics.setGauge('user_create_avg_ms', averageTime);
    });

    it('should create courses within performance threshold', async () => {
      const startTime = Date.now();
      
      // Create 5 courses
      for (let i = 0; i < 5; i++) {
        const course = await prisma.course.create({
          data: {
            title: `Performance Test Course ${i}`,
            description: `Course ${i} for performance testing`,
            status: CourseStatus.PUBLISHED,
            organizationId: testOrg.id,
          },
        });
        testCourses.push(course);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageTime = duration / 5;
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COURSE_CREATE);
      metrics.setGauge('course_create_avg_ms', averageTime);
    });

    it('should create enrollments within performance threshold', async () => {
      const startTime = Date.now();
      
      // Create enrollments for each user-course combination
      for (const user of testUsers) {
        for (const course of testCourses) {
          const enrollment = await prisma.enrollment.create({
            data: {
              userId: user.id,
              courseId: course.id,
              organizationId: testOrg.id,
              status: EnrollmentStatus.ACTIVE,
            },
          });
          testEnrollments.push(enrollment);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageTime = duration / testEnrollments.length;
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ENROLLMENT_CREATE);
      metrics.setGauge('enrollment_create_avg_ms', averageTime);
    });

    it('should create progress records within performance threshold', async () => {
      const startTime = Date.now();
      
      // Create modules and lessons for each course
      for (const course of testCourses) {
        const module = await prisma.module.create({
          data: {
            title: `Module for ${course.title}`,
            order: 1,
            courseId: course.id,
          },
        });
        
        const lesson = await prisma.lesson.create({
          data: {
            title: `Lesson for ${course.title}`,
            content: 'Performance test lesson content',
            type: LessonType.TEXT,
            order: 1,
            moduleId: module.id,
          },
        });
        
        // Create progress for each enrollment
        for (const enrollment of testEnrollments) {
          if (enrollment.courseId === course.id) {
            const progress = await prisma.progress.create({
              data: {
                userId: enrollment.userId,
                lessonId: lesson.id,
                status: ProgressStatus.COMPLETED,
                completedAt: new Date(),
              },
            });
            testProgress.push(progress);
          }
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageTime = duration / testProgress.length;
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PROGRESS_CREATE);
      metrics.setGauge('progress_create_avg_ms', averageTime);
    });

    it('should create quiz attempts within performance threshold', async () => {
      const startTime = Date.now();
      
      // Create quizzes and questions for each course
      for (const course of testCourses) {
        const module = await prisma.module.findFirst({
          where: { courseId: course.id },
        });
        
        if (module) {
          const lesson = await prisma.lesson.findFirst({
            where: { moduleId: module.id },
          });
          
          if (lesson) {
            const quiz = await prisma.quiz.create({
              data: {
                title: `Quiz for ${course.title}`,
                timeLimit: 30,
                lessonId: lesson.id,
              },
            });
            
            const question = await prisma.question.create({
              data: {
                text: 'What is 2 + 2?',
                type: QuestionType.MULTIPLE_CHOICE,
                options: ['3', '4', '5', '6'],
                correctAnswer: '4',
                order: 1,
                quizId: quiz.id,
              },
            });
            
            // Create quiz attempts for each enrollment
            for (const enrollment of testEnrollments) {
              if (enrollment.courseId === course.id) {
                const quizAttempt = await prisma.quizAttempt.create({
                  data: {
                    userId: enrollment.userId,
                    quizId: quiz.id,
                    answers: { question1: '4' },
                    score: 100,
                    submittedAt: new Date(),
                  },
                });
                testQuizAttempts.push(quizAttempt);
              }
            }
          }
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageTime = duration / testQuizAttempts.length;
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QUIZ_ATTEMPT_CREATE);
      metrics.setGauge('quiz_attempt_create_avg_ms', averageTime);
    });
  });

  describe('Database Read Performance', () => {
    it('should find users within performance threshold', async () => {
      const startTime = Date.now();
      
      // Find each user by ID
      for (const user of testUsers) {
        const foundUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        expect(foundUser).toBeDefined();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageTime = duration / testUsers.length;
      
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.USER_FIND_UNIQUE);
      metrics.setGauge('user_find_unique_avg_ms', averageTime);
    });

    it('should find courses within performance threshold', async () => {
      const startTime = Date.now();
      
      // Find all courses
      const courses = await prisma.course.findMany({
        where: { organizationId: testOrg.id },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COURSE_FIND_MANY);
      expect(courses).toHaveLength(testCourses.length);
      metrics.setGauge('course_find_many_ms', duration);
    });

    it('should find enrollments within performance threshold', async () => {
      const startTime = Date.now();
      
      // Find all enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { organizationId: testOrg.id },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ENROLLMENT_FIND_MANY);
      expect(enrollments).toHaveLength(testEnrollments.length);
      metrics.setGauge('enrollment_find_many_ms', duration);
    });

    it('should find progress records within performance threshold', async () => {
      const startTime = Date.now();
      
      // Find all progress records
      const progress = await prisma.progress.findMany({
        where: { userId: { in: testUsers.map(u => u.id) } },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.PROGRESS_FIND_MANY);
      expect(progress).toHaveLength(testProgress.length);
      metrics.setGauge('progress_find_many_ms', duration);
    });

    it('should find quiz attempts within performance threshold', async () => {
      const startTime = Date.now();
      
      // Find all quiz attempts
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId: { in: testUsers.map(u => u.id) } },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.QUIZ_ATTEMPT_FIND_MANY);
      expect(quizAttempts).toHaveLength(testQuizAttempts.length);
      metrics.setGauge('quiz_attempt_find_many_ms', duration);
    });
  });

  describe('Complex Query Performance', () => {
    it('should execute complex join queries within performance threshold', async () => {
      const startTime = Date.now();
      
      // Complex query with multiple joins
      const result = await prisma.progress.findMany({
        where: {
          userId: { in: testUsers.map(u => u.id) },
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
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPLEX_JOIN_QUERY);
      expect(result).toBeDefined();
      metrics.setGauge('complex_join_query_ms', duration);
    });

    it('should execute bulk operations within performance threshold', async () => {
      const startTime = Date.now();
      
      // Bulk update operation
      const updateResult = await prisma.progress.updateMany({
        where: {
          userId: { in: testUsers.map(u => u.id) },
        },
        data: {
          status: ProgressStatus.COMPLETED,
        },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATION);
      expect(updateResult.count).toBeGreaterThan(0);
      metrics.setGauge('bulk_operation_ms', duration);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain memory usage within threshold', async () => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      expect(memUsageMB).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE);
      metrics.setGauge('memory_usage_mb', memUsageMB);
    });

    it('should handle memory pressure gracefully', async () => {
      const initialMemUsage = process.memoryUsage();
      
      // Create a large number of objects to test memory handling
      const largeArray = [];
      for (let i = 0; i < 10000; i++) {
        largeArray.push({
          id: i,
          data: 'x'.repeat(1000), // 1KB per object
        });
      }
      
      const finalMemUsage = process.memoryUsage();
      const memIncreaseMB = (finalMemUsage.heapUsed - initialMemUsage.heapUsed) / 1024 / 1024;
      
      // Memory increase should be reasonable
      expect(memIncreaseMB).toBeLessThan(100); // Less than 100MB increase
      metrics.setGauge('memory_increase_mb', memIncreaseMB);
    });
  });

  describe('CPU Usage Performance', () => {
    it('should maintain CPU usage within threshold', async () => {
      const cpuUsage = process.cpuUsage();
      const totalCpuUsage = cpuUsage.user + cpuUsage.system;
      
      expect(totalCpuUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_CPU_USAGE);
      metrics.setGauge('cpu_usage_us', totalCpuUsage);
    });

    it('should handle CPU-intensive operations efficiently', async () => {
      const startTime = Date.now();
      const startCpuUsage = process.cpuUsage();
      
      // Perform CPU-intensive operation
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i);
      }
      
      const endTime = Date.now();
      const endCpuUsage = process.cpuUsage();
      const duration = endTime - startTime;
      const cpuUsage = (endCpuUsage.user - startCpuUsage.user) + (endCpuUsage.system - startCpuUsage.system);
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(cpuUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_CPU_USAGE);
      metrics.setGauge('cpu_intensive_duration_ms', duration);
      metrics.setGauge('cpu_intensive_usage_us', cpuUsage);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent database operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple concurrent operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          prisma.user.create({
            data: {
              email: `concurrent${i}@perftest.com`,
              name: `Concurrent User ${i}`,
              password: await hashPassword('password123'),
              role: UserRole.STUDENT,
              organizationId: testOrg.id,
            },
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      metrics.setGauge('concurrent_operations_ms', duration);
    });

    it('should handle concurrent read operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple concurrent read operations
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          prisma.course.findMany({
            where: { organizationId: testOrg.id },
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      metrics.setGauge('concurrent_reads_ms', duration);
    });
  });

  describe('Performance Metrics Export', () => {
    it('should export performance metrics', async () => {
      const allMetrics = metrics.getMetrics();
      
      expect(allMetrics).toBeDefined();
      expect(Object.keys(allMetrics).length).toBeGreaterThan(0);
      
      // Log metrics for analysis
      console.log('Performance Metrics:', allMetrics);
      
      // Verify key metrics are present
      expect(allMetrics).toHaveProperty('user_create_avg_ms');
      expect(allMetrics).toHaveProperty('course_create_avg_ms');
      expect(allMetrics).toHaveProperty('enrollment_create_avg_ms');
      expect(allMetrics).toHaveProperty('progress_create_avg_ms');
      expect(allMetrics).toHaveProperty('quiz_attempt_create_avg_ms');
    });
  });
});
