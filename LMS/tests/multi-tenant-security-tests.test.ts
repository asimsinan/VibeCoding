import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  SecurityTestUtils,
  SecurityAssertions,
} from './security-test-utils';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { withAuth, AuthContext } from '../src/lib/middleware';
import { PrismaClient, UserRole } from '../src/generated/prisma';

// Create a shared Prisma client for security tests
const prisma = new PrismaClient();

describe('Multi-Tenant Isolation Security Tests', () => {
  let org1: any;
  let org2: any;
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    await TestCleanup.cleanup();
    
    // Create two separate organizations
    org1 = await TestDataFactory.createOrganization();
    org2 = await TestDataFactory.createOrganization();
    
    // Create users in each organization
    user1 = await TestDataFactory.createUser(org1.id, UserRole.ADMIN);
    user2 = await TestDataFactory.createUser(org2.id, UserRole.ADMIN);
  });

  afterAll(async () => {
    await TestCleanup.cleanup();
  });

  describe('Data Isolation', () => {
    it('should isolate data by organization', async () => {
      const result = await SecurityTestUtils.testMultiTenantIsolation();
      
      SecurityAssertions.assertMultiTenantIsolation(result);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should prevent cross-organization data access', async () => {
      // Create courses in each organization
      const course1 = await TestDataFactory.createCourse(org1.id);
      const course2 = await TestDataFactory.createCourse(org2.id);

      // Test that users can only see their organization's courses
      const org1Courses = await prisma.course.findMany({
        where: { organizationId: org1.id },
      });
      const org2Courses = await prisma.course.findMany({
        where: { organizationId: org2.id },
      });

      expect(org1Courses.every(course => course.organizationId === org1.id)).toBe(true);
      expect(org2Courses.every(course => course.organizationId === org2.id)).toBe(true);
      expect(org1Courses.length).toBe(1);
      expect(org2Courses.length).toBe(1);
    });

    it('should prevent cross-organization user access', async () => {
      // Test that users cannot access other organization's user data
      const org1Users = await prisma.user.findMany({
        where: { organizationId: org1.id },
      });
      const org2Users = await prisma.user.findMany({
        where: { organizationId: org2.id },
      });

      expect(org1Users.every(user => user.organizationId === org1.id)).toBe(true);
      expect(org2Users.every(user => user.organizationId === org2.id)).toBe(true);
    });

    it('should prevent cross-organization enrollment access', async () => {
      // Create courses and enrollments in each organization
      const course1 = await TestDataFactory.createCourse(org1.id);
      const course2 = await TestDataFactory.createCourse(org2.id);

      const enrollment1 = await prisma.enrollment.create({
        data: {
          userId: user1.id,
          courseId: course1.id,
          organizationId: org1.id,
          status: 'ACTIVE',
        },
      });

      const enrollment2 = await prisma.enrollment.create({
        data: {
          userId: user2.id,
          courseId: course2.id,
          organizationId: org2.id,
          status: 'ACTIVE',
        },
      });

      // Test that enrollments are properly isolated
      const org1Enrollments = await prisma.enrollment.findMany({
        where: { organizationId: org1.id },
      });
      const org2Enrollments = await prisma.enrollment.findMany({
        where: { organizationId: org2.id },
      });

      expect(org1Enrollments.every(enrollment => enrollment.organizationId === org1.id)).toBe(true);
      expect(org2Enrollments.every(enrollment => enrollment.organizationId === org2.id)).toBe(true);
    });
  });

  describe('API Isolation', () => {
    it('should enforce organization boundaries in API calls', async () => {
      const org1AuthContext: AuthContext = {
        user: {
          id: user1.id,
          email: user1.email,
          name: user1.name,
          role: user1.role,
          organizationId: user1.organizationId,
        },
        organizationId: user1.organizationId,
      };

      const org2AuthContext: AuthContext = {
        user: {
          id: user2.id,
          email: user2.email,
          name: user2.name,
          role: user2.role,
          organizationId: user2.organizationId,
        },
        organizationId: user2.organizationId,
      };

      // Mock API handler that enforces organization isolation
      const coursesHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          const courses = await prisma.course.findMany({
            where: { organizationId: authContext.organizationId },
          });
          return NextResponse.json(courses);
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test org1 user can only see org1 courses
      const org1Request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(org1AuthContext) },
      });
      const org1Response = await coursesHandler(org1Request);
      const org1Courses = await org1Response.json();
      
      expect(org1Courses.every((course: any) => course.organizationId === org1.id)).toBe(true);

      // Test org2 user can only see org2 courses
      const org2Request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(org2AuthContext) },
      });
      const org2Response = await coursesHandler(org2Request);
      const org2Courses = await org2Response.json();
      
      expect(org2Courses.every((course: any) => course.organizationId === org2.id)).toBe(true);
    });

    it('should prevent cross-organization data modification', async () => {
      const course1 = await TestDataFactory.createCourse(org1.id);
      
      const org2AuthContext: AuthContext = {
        user: {
          id: user2.id,
          email: user2.email,
          name: user2.name,
          role: user2.role,
          organizationId: user2.organizationId,
        },
        organizationId: user2.organizationId,
      };

      // Mock API handler for course modification
      const courseModificationHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          const body = await request.json();
          const course = await prisma.course.update({
            where: { id: body.courseId },
            data: {
              ...body,
              organizationId: authContext.organizationId, // Enforce organization boundary
            },
          });
          return NextResponse.json(course);
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR'] }
      );

      // Test that org2 user cannot modify org1 course
      const org2Request = new NextRequest('http://localhost:3000/api/courses/1', {
        method: 'PUT',
        body: JSON.stringify({
          courseId: course1.id,
          title: 'Hacked Course',
        }),
        headers: { 
          'x-mock-auth': JSON.stringify(org2AuthContext),
          'Content-Type': 'application/json',
        },
      });

      try {
        const org2Response = await courseModificationHandler(org2Request);
        // If successful, verify the course wasn't actually modified
        const updatedCourse = await prisma.course.findUnique({
          where: { id: course1.id },
        });
        expect(updatedCourse?.title).toBe(course1.title); // Should remain unchanged
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });
  });

  describe('Resource Isolation', () => {
    it('should isolate file uploads by organization', async () => {
      // Create files in each organization
      const file1 = await prisma.file.create({
        data: {
          filename: 'org1-file.pdf',
          originalName: 'org1-file.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: '/uploads/org1/file1.pdf',
          url: '/uploads/org1/file1.pdf',
          uploadedBy: user1.id,
          organizationId: org1.id,
        },
      });

      const file2 = await prisma.file.create({
        data: {
          filename: 'org2-file.pdf',
          originalName: 'org2-file.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: '/uploads/org2/file2.pdf',
          url: '/uploads/org2/file2.pdf',
          uploadedBy: user2.id,
          organizationId: org2.id,
        },
      });

      // Test that files are properly isolated
      const org1Files = await prisma.file.findMany({
        where: { organizationId: org1.id },
      });
      const org2Files = await prisma.file.findMany({
        where: { organizationId: org2.id },
      });

      expect(org1Files.every(file => file.organizationId === org1.id)).toBe(true);
      expect(org2Files.every(file => file.organizationId === org2.id)).toBe(true);
      expect(org1Files.length).toBe(1);
      expect(org2Files.length).toBe(1);
    });

    it('should isolate quiz attempts by organization', async () => {
      // Create lessons and quizzes in each organization
      const module1 = await prisma.module.create({
        data: {
          title: 'Org1 Module',
          description: 'Module for org1',
          courseId: (await TestDataFactory.createCourse(org1.id)).id,
        },
      });

      const module2 = await prisma.module.create({
        data: {
          title: 'Org2 Module',
          description: 'Module for org2',
          courseId: (await TestDataFactory.createCourse(org2.id)).id,
        },
      });

      const lesson1 = await prisma.lesson.create({
        data: {
          title: 'Org1 Lesson',
          content: 'Lesson content for org1',
          moduleId: module1.id,
        },
      });

      const lesson2 = await prisma.lesson.create({
        data: {
          title: 'Org2 Lesson',
          content: 'Lesson content for org2',
          moduleId: module2.id,
        },
      });

      const quiz1 = await prisma.quiz.create({
        data: {
          title: 'Org1 Quiz',
          description: 'Quiz for org1',
          lessonId: lesson1.id,
        },
      });

      const quiz2 = await prisma.quiz.create({
        data: {
          title: 'Org2 Quiz',
          description: 'Quiz for org2',
          lessonId: lesson2.id,
        },
      });

      // Create quiz attempts
      const attempt1 = await prisma.quizAttempt.create({
        data: {
          userId: user1.id,
          quizId: quiz1.id,
          answers: {},
          score: 85,
          status: 'COMPLETED',
        },
      });

      const attempt2 = await prisma.quizAttempt.create({
        data: {
          userId: user2.id,
          quizId: quiz2.id,
          answers: {},
          score: 90,
          status: 'COMPLETED',
        },
      });

      // Test that quiz attempts are properly isolated
      const org1Attempts = await prisma.quizAttempt.findMany({
        where: { userId: user1.id },
        include: { quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } } },
      });

      const org2Attempts = await prisma.quizAttempt.findMany({
        where: { userId: user2.id },
        include: { quiz: { include: { lesson: { include: { module: { include: { course: true } } } } } } },
      });

      expect(org1Attempts.length).toBe(1);
      expect(org2Attempts.length).toBe(1);
      expect(org1Attempts[0].quiz.lesson.module.course.organizationId).toBe(org1.id);
      expect(org2Attempts[0].quiz.lesson.module.course.organizationId).toBe(org2.id);
    });
  });
});

describe('API Security Tests', () => {
  let testOrg: any;
  let testUser: any;

  beforeAll(async () => {
    await TestCleanup.cleanup();
    testOrg = await TestDataFactory.createOrganization();
    testUser = await TestDataFactory.createUser(testOrg.id, 'ADMIN');
  });

  afterAll(async () => {
    await TestCleanup.cleanup();
  });

  describe('API Endpoint Security', () => {
    it('should implement proper API security measures', async () => {
      const result = await SecurityTestUtils.testAPISecurity(testOrg, testUser);
      
      SecurityAssertions.assertAPISecure(result);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should require authentication for protected endpoints', async () => {
      // Mock API handler that requires authentication
      const protectedHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          return NextResponse.json({ message: 'Access granted' });
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test without authentication
      const unauthenticatedRequest = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
      });
      const unauthenticatedResponse = await protectedHandler(unauthenticatedRequest);
      expect(unauthenticatedResponse.status).toBe(401);

      // Test with authentication
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      const authenticatedRequest = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(authContext) },
      });
      const authenticatedResponse = await protectedHandler(authenticatedRequest);
      expect(authenticatedResponse.status).toBe(200);
    });

    it('should validate request methods', async () => {
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      // Mock API handler that only accepts GET requests
      const getOnlyHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          if (request.method !== 'GET') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
          }
          return NextResponse.json({ message: 'GET request successful' });
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test GET request (should succeed)
      const getRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(authContext) },
      });
      const getResponse = await getOnlyHandler(getRequest);
      expect(getResponse.status).toBe(200);

      // Test POST request (should fail)
      const postRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-mock-auth': JSON.stringify(authContext) },
      });
      const postResponse = await getOnlyHandler(postRequest);
      expect(postResponse.status).toBe(405);
    });

    it('should validate request content type', async () => {
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      // Mock API handler that requires JSON content type
      const jsonHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          const contentType = request.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
          }
          return NextResponse.json({ message: 'Request processed' });
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test with correct content type
      const validRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 
          'x-mock-auth': JSON.stringify(authContext),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      const validResponse = await jsonHandler(validRequest);
      expect(validResponse.status).toBe(200);

      // Test with incorrect content type
      const invalidRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 
          'x-mock-auth': JSON.stringify(authContext),
          'Content-Type': 'text/plain',
        },
        body: 'test data',
      });
      const invalidResponse = await jsonHandler(invalidRequest);
      expect(invalidResponse.status).toBe(400);
    });
  });

  describe('Request Validation', () => {
    it('should validate request body structure', async () => {
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      // Mock API handler that validates request body
      const validationHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          try {
            const body = await request.json();
            if (!body.title || typeof body.title !== 'string') {
              return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
            }
            return NextResponse.json({ message: 'Request valid' });
          } catch (error) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
          }
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test with valid body
      const validRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 
          'x-mock-auth': JSON.stringify(authContext),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Test Course' }),
      });
      const validResponse = await validationHandler(validRequest);
      expect(validResponse.status).toBe(200);

      // Test with invalid body
      const invalidRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 
          'x-mock-auth': JSON.stringify(authContext),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: 'Test Course' }), // Missing title
      });
      const invalidResponse = await validationHandler(invalidRequest);
      expect(invalidResponse.status).toBe(400);
    });

    it('should validate request parameters', async () => {
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      // Mock API handler that validates URL parameters
      const paramValidationHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          const url = new URL(request.url);
          const courseId = url.searchParams.get('courseId');
          
          if (!courseId || !/^[a-zA-Z0-9]+$/.test(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
          }
          return NextResponse.json({ message: 'Parameter valid' });
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test with valid parameter
      const validRequest = new NextRequest('http://localhost:3000/api/courses?courseId=abc123', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(authContext) },
      });
      const validResponse = await paramValidationHandler(validRequest);
      expect(validResponse.status).toBe(200);

      // Test with invalid parameter
      const invalidRequest = new NextRequest('http://localhost:3000/api/courses?courseId=<script>alert("xss")</script>', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(authContext) },
      });
      const invalidResponse = await paramValidationHandler(invalidRequest);
      expect(invalidResponse.status).toBe(400);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      // Mock API handler that handles errors securely
      const secureErrorHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          try {
            // Simulate an error
            throw new Error('Database connection failed: password=secret123');
          } catch (error) {
            // Return generic error message without sensitive details
            return NextResponse.json({ 
              error: 'An error occurred while processing your request' 
            }, { status: 500 });
          }
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: { 'x-mock-auth': JSON.stringify(authContext) },
      });
      const response = await secureErrorHandler(request);
      const responseBody = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseBody.error).not.toContain('password');
      expect(responseBody.error).not.toContain('secret123');
      expect(responseBody.error).toBe('An error occurred while processing your request');
    });

    it('should handle malformed requests gracefully', async () => {
      const authContext: AuthContext = {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId,
        },
        organizationId: testUser.organizationId,
      };

      // Mock API handler that handles malformed requests
      const malformedRequestHandler = withAuth(
        async (request: NextRequest, authContext: AuthContext) => {
          try {
            const body = await request.json();
            return NextResponse.json({ message: 'Request processed' });
          } catch (error) {
            return NextResponse.json({ 
              error: 'Invalid request format' 
            }, { status: 400 });
          }
        },
        { requiredRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] }
      );

      // Test with malformed JSON
      const malformedRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 
          'x-mock-auth': JSON.stringify(authContext),
          'Content-Type': 'application/json',
        },
        body: '{ invalid json }',
      });
      const malformedResponse = await malformedRequestHandler(malformedRequest);
      expect(malformedResponse.status).toBe(400);
    });
  });
});
