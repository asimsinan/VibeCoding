import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  PerformanceMetrics,
  MemoryMonitor,
  ConcurrentUserSimulator,
  PerformanceAssertions,
  PERFORMANCE_THRESHOLDS,
} from './performance-test-utils';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { withAuth, AuthContext } from '../src/lib/middleware';
import { PrismaClient } from '../src/generated/prisma';

// Create a shared Prisma client for performance tests
const prisma = new PrismaClient();

// Mock API handlers for performance testing
const mockApiHandlers = {
  // Courses API
  getCourses: withAuth(
    async (request: NextRequest, authContext: AuthContext) => {
      const courses = await prisma.course.findMany({
        where: { organizationId: authContext.organizationId },
        take: 50,
      });
      return NextResponse.json(courses);
    },
    { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
  ),

  createCourse: withAuth(
    async (request: NextRequest, authContext: AuthContext) => {
      const body = await request.json();
      const course = await prisma.course.create({
        data: {
          ...body,
          organizationId: authContext.organizationId,
        },
      });
      return NextResponse.json(course, { status: 201 });
    },
    { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
  ),

  // Users API
  getUsers: withAuth(
    async (request: NextRequest, authContext: AuthContext) => {
      const users = await prisma.user.findMany({
        where: { organizationId: authContext.organizationId },
        take: 50,
      });
      return NextResponse.json(users);
    },
    { requiredRoles: ['ADMIN'] }
  ),

  createUser: withAuth(
    async (request: NextRequest, authContext: AuthContext) => {
      const body = await request.json();
      const user = await prisma.user.create({
        data: {
          ...body,
          organizationId: authContext.organizationId,
        },
      });
      return NextResponse.json(user, { status: 201 });
    },
    { requiredRoles: ['ADMIN'] }
  ),

  // Enrollments API
  getEnrollments: withAuth(
    async (request: NextRequest, authContext: AuthContext) => {
      const enrollments = await prisma.enrollment.findMany({
        where: { organizationId: authContext.organizationId },
        include: {
          user: true,
          course: true,
        },
        take: 50,
      });
      return NextResponse.json(enrollments);
    },
    { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
  ),

  createEnrollment: withAuth(
    async (request: NextRequest, authContext: AuthContext) => {
      const body = await request.json();
      const enrollment = await prisma.enrollment.create({
        data: {
          ...body,
          organizationId: authContext.organizationId,
        },
      });
      return NextResponse.json(enrollment, { status: 201 });
    },
    { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
  ),
};

// Helper function to create mock requests
const createMockRequest = (method: string, url: string, body?: any, authContext?: AuthContext): NextRequest => {
  const absoluteUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  return new NextRequest(absoluteUrl, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(authContext && { 'x-mock-auth': JSON.stringify(authContext) }),
    },
  });
};

describe('API Endpoint Performance Tests', () => {
  let testOrg: any;
  let testUser: any;
  let authContext: AuthContext;

  beforeAll(async () => {
    await TestCleanup.cleanup();
    MemoryMonitor.startMonitoring();
    
    testOrg = await TestDataFactory.createOrganization();
    testUser = await TestDataFactory.createUser(testOrg.id, 'ADMIN');
    
    authContext = {
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        organizationId: testUser.organizationId,
      },
      organizationId: testUser.organizationId,
    };
  });

  afterAll(async () => {
    PerformanceMetrics.printReport();
    await TestCleanup.cleanup();
  });

  beforeEach(() => {
    PerformanceMetrics.clearMetrics();
  });

  describe('Course API Performance', () => {
    it('should handle GET /api/courses efficiently', async () => {
      const iterations = 20;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endTimer = PerformanceMetrics.startTimer(`API_GET_Courses_${i}`);
        
        const request = createMockRequest('GET', '/api/courses', undefined, authContext);
        const response = await mockApiHandlers.getCourses(request);
        
        results.push(endTimer());
        expect(response.status).toBe(200);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle POST /api/courses efficiently', async () => {
      const iterations = 15;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endTimer = PerformanceMetrics.startTimer(`API_POST_Courses_${i}`);
        
        const courseData = {
          title: `Performance Test Course ${i}`,
          description: `Description ${i}`,
          status: 'DRAFT',
        };
        
        const request = createMockRequest('POST', '/api/courses', courseData, authContext);
        const response = await mockApiHandlers.createCourse(request);
        
        results.push(endTimer());
        expect(response.status).toBe(201);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle concurrent course API requests', async () => {
      const operations = [
        async () => {
          const request = createMockRequest('GET', '/api/courses', undefined, authContext);
          const response = await mockApiHandlers.getCourses(request);
          expect(response.status).toBe(200);
        },
        async () => {
          const courseData = {
            title: 'Concurrent Course',
            description: 'Concurrent test course',
            status: 'DRAFT',
          };
          const request = createMockRequest('POST', '/api/courses', courseData, authContext);
          const response = await mockApiHandlers.createCourse(request);
          expect(response.status).toBe(201);
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(25, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 25);
      PerformanceAssertions.assertResponseTime(result.avgResponseTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2);
    });
  });

  describe('User API Performance', () => {
    it('should handle GET /api/users efficiently', async () => {
      const iterations = 15;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endTimer = PerformanceMetrics.startTimer(`API_GET_Users_${i}`);
        
        const request = createMockRequest('GET', '/api/users', undefined, authContext);
        const response = await mockApiHandlers.getUsers(request);
        
        results.push(endTimer());
        expect(response.status).toBe(200);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle POST /api/users efficiently', async () => {
      const iterations = 10;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endTimer = PerformanceMetrics.startTimer(`API_POST_Users_${i}`);
        
        const userData = {
          name: `Performance Test User ${i}`,
          email: `perf-test-${i}-${Date.now()}@example.com`,
          password: 'password123',
          role: 'STUDENT',
        };
        
        const request = createMockRequest('POST', '/api/users', userData, authContext);
        const response = await mockApiHandlers.createUser(request);
        
        results.push(endTimer());
        expect(response.status).toBe(201);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle bulk user creation efficiently', async () => {
      const endTimer = PerformanceMetrics.startTimer('API_BulkUserCreation');
      
      const promises = [];
      for (let i = 0; i < 30; i++) {
        const userData = {
          name: `Bulk User ${i}`,
          email: `bulk-user-${i}-${Date.now()}@example.com`,
          password: 'password123',
          role: 'STUDENT',
        };
        
        const request = createMockRequest('POST', '/api/users', userData, authContext);
        promises.push(mockApiHandlers.createUser(request));
      }
      
      const responses = await Promise.all(promises);
      
      const duration = endTimer();
      PerformanceAssertions.assertResponseTime(duration, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 5);
      
      expect(responses.every(response => response.status === 201)).toBe(true);
    });
  });

  describe('Enrollment API Performance', () => {
    let testCourse: any;
    let testStudent: any;

    beforeAll(async () => {
      testCourse = await TestDataFactory.prisma.course.create({
        data: {
          title: 'Enrollment Test Course',
          description: 'Course for enrollment testing',
          status: 'PUBLISHED',
          organizationId: testOrg.id,
        },
      });
      
      testStudent = await TestDataFactory.prisma.user.create({
        data: {
          name: 'Test Student',
          email: `test-student-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'STUDENT',
          organizationId: testOrg.id,
        },
      });
    });

    it('should handle GET /api/enrollments efficiently', async () => {
      const iterations = 12;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endTimer = PerformanceMetrics.startTimer(`API_GET_Enrollments_${i}`);
        
        const request = createMockRequest('GET', '/api/enrollments', undefined, authContext);
        const response = await mockApiHandlers.getEnrollments(request);
        
        results.push(endTimer());
        expect(response.status).toBe(200);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle POST /api/enrollments efficiently', async () => {
      const iterations = 8;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const endTimer = PerformanceMetrics.startTimer(`API_POST_Enrollments_${i}`);
        
        const student = await TestDataFactory.prisma.user.create({
          data: {
            name: `Enrollment Student ${i}`,
            email: `enrollment-student-${i}-${Date.now()}@example.com`,
            password: 'hashedpassword',
            role: 'STUDENT',
            organizationId: testOrg.id,
          },
        });
        
        const enrollmentData = {
          userId: student.id,
          courseId: testCourse.id,
        };
        
        const request = createMockRequest('POST', '/api/enrollments', enrollmentData, authContext);
        const response = await mockApiHandlers.createEnrollment(request);
        
        results.push(endTimer());
        expect(response.status).toBe(201);
      }
      
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      PerformanceAssertions.assertResponseTime(avgTime, PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle concurrent enrollment API requests', async () => {
      const operations = [
        async () => {
          const request = createMockRequest('GET', '/api/enrollments', undefined, authContext);
          const response = await mockApiHandlers.getEnrollments(request);
          expect(response.status).toBe(200);
        },
        async () => {
          const student = await TestDataFactory.prisma.user.create({
            data: {
              name: 'Concurrent Enrollment Student',
              email: `concurrent-enrollment-${Date.now()}@example.com`,
              password: 'hashedpassword',
              role: 'STUDENT',
              organizationId: testOrg.id,
            },
          });
          
          const enrollmentData = {
            userId: student.id,
            courseId: testCourse.id,
          };
          
          const request = createMockRequest('POST', '/api/enrollments', enrollmentData, authContext);
          const response = await mockApiHandlers.createEnrollment(request);
          expect(response.status).toBe(201);
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(20, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 20);
    });
  });

  describe('Mixed API Performance', () => {
    it('should handle mixed API operations efficiently', async () => {
      const operations = [
        async () => {
          const request = createMockRequest('GET', '/api/courses', undefined, authContext);
          const response = await mockApiHandlers.getCourses(request);
          expect(response.status).toBe(200);
        },
        async () => {
          const request = createMockRequest('GET', '/api/users', undefined, authContext);
          const response = await mockApiHandlers.getUsers(request);
          expect(response.status).toBe(200);
        },
        async () => {
          const request = createMockRequest('GET', '/api/enrollments', undefined, authContext);
          const response = await mockApiHandlers.getEnrollments(request);
          expect(response.status).toBe(200);
        },
        async () => {
          const courseData = {
            title: 'Mixed API Course',
            description: 'Course for mixed API testing',
            status: 'DRAFT',
          };
          const request = createMockRequest('POST', '/api/courses', courseData, authContext);
          const response = await mockApiHandlers.createCourse(request);
          expect(response.status).toBe(201);
        },
      ];

      const result = await ConcurrentUserSimulator.simulateConcurrentUsers(30, operations);
      
      PerformanceAssertions.assertConcurrentUsers(result.successCount, 30);
    });

    it('should maintain performance under sustained load', async () => {
      const operations = [
        async () => {
          const request = createMockRequest('GET', '/api/courses', undefined, authContext);
          return await mockApiHandlers.getCourses(request);
        },
        async () => {
          const request = createMockRequest('GET', '/api/users', undefined, authContext);
          return await mockApiHandlers.getUsers(request);
        },
      ];

      // Run sustained load for multiple rounds
      const rounds = 5;
      const usersPerRound = 20;
      
      for (let round = 0; round < rounds; round++) {
        const result = await ConcurrentUserSimulator.simulateConcurrentUsers(usersPerRound, operations);
        
        PerformanceAssertions.assertConcurrentUsers(result.successCount, usersPerRound, 0.90);
        
        // Small delay between rounds
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });
});
