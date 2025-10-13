import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '../src/generated/prisma';
import { app } from '../src/app';
import request from 'supertest';

// Contract tests based on OpenAPI specification
// These tests validate that our API implementation matches the OpenAPI spec

describe('API Contract Tests', () => {
  let prisma: PrismaClient;
  let testOrganization: any;
  let testUser: any;
  let testCourse: any;
  let authToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create test data
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.example.com',
        settings: { theme: 'light' }
      }
    });

    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: testOrganization.id
      }
    });

    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: testOrganization.id
      }
    });

    testCourse = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course',
        status: 'DRAFT',
        organizationId: testOrganization.id
      }
    });

    // Mock auth token for testing
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Organizations API', () => {
    it('GET /api/v1/organizations should return organizations list', async () => {
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /api/v1/organizations should create new organization', async () => {
      const newOrg = {
        name: 'New Test Organization',
        domain: 'newtest.example.com',
        settings: { theme: 'dark' }
      };

      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', authToken)
        .send(newOrg);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body.data.name).toBe(newOrg.name);
    });

    it('GET /api/v1/organizations/{id} should return organization details', async () => {
      const response = await request(app)
        .get(`/api/v1/organizations/${testOrganization.id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testOrganization.id);
    });

    it('PUT /api/v1/organizations/{id} should update organization', async () => {
      const updateData = {
        name: 'Updated Organization',
        settings: { theme: 'blue' }
      };

      const response = await request(app)
        .put(`/api/v1/organizations/${testOrganization.id}`)
        .set('Authorization', authToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updateData.name);
    });
  });

  describe('Courses API', () => {
    it('GET /api/v1/courses should return courses list', async () => {
      const response = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /api/v1/courses should create new course', async () => {
      const newCourse = {
        title: 'New Test Course',
        description: 'A new test course',
        status: 'DRAFT'
      };

      const response = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', authToken)
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(newCourse.title);
    });

    it('GET /api/v1/courses/{id} should return course with modules', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/${testCourse.id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('modules');
      expect(Array.isArray(response.body.data.modules)).toBe(true);
    });

    it('PUT /api/v1/courses/{id} should update course', async () => {
      const updateData = {
        title: 'Updated Course Title',
        status: 'PUBLISHED'
      };

      const response = await request(app)
        .put(`/api/v1/courses/${testCourse.id}`)
        .set('Authorization', authToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('POST /api/v1/courses/{id}/enroll should enroll student', async () => {
      const student = await prisma.user.create({
        data: {
          email: 'student@example.com',
          name: 'Test Student',
          role: 'STUDENT',
          organizationId: testOrganization.id
        }
      });

      const response = await request(app)
        .post(`/api/v1/courses/${testCourse.id}/enroll`)
        .set('Authorization', authToken);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('Users API', () => {
    it('GET /api/v1/users/profile should return user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('role');
    });

    it('PUT /api/v1/users/profile should update user profile', async () => {
      const updateData = {
        name: 'Updated User Name'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', authToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updateData.name);
    });
  });

  describe('Progress API', () => {
    it('GET /api/v1/progress should return user progress', async () => {
      const response = await request(app)
        .get('/api/v1/progress')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /api/v1/lessons/{id}/complete should mark lesson complete', async () => {
      const module = await prisma.module.create({
        data: {
          title: 'Test Module',
          order: 1,
          courseId: testCourse.id
        }
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Test Lesson',
          content: 'Test content',
          type: 'TEXT',
          order: 1,
          moduleId: module.id
        }
      });

      const response = await request(app)
        .post(`/api/v1/lessons/${lesson.id}/complete`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('Quizzes API', () => {
    it('GET /api/v1/quizzes/{id} should return quiz with questions', async () => {
      const module = await prisma.module.create({
        data: {
          title: 'Quiz Module',
          order: 2,
          courseId: testCourse.id
        }
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Quiz Lesson',
          content: 'Quiz content',
          type: 'INTERACTIVE',
          order: 1,
          moduleId: module.id
        }
      });

      const quiz = await prisma.quiz.create({
        data: {
          title: 'Test Quiz',
          timeLimit: 30,
          lessonId: lesson.id
        }
      });

      const response = await request(app)
        .get(`/api/v1/quizzes/${quiz.id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('questions');
      expect(Array.isArray(response.body.data.questions)).toBe(true);
    });

    it('POST /api/v1/quizzes/{id}/submit should submit quiz answers', async () => {
      const module = await prisma.module.create({
        data: {
          title: 'Submit Quiz Module',
          order: 3,
          courseId: testCourse.id
        }
      });

      const lesson = await prisma.lesson.create({
        data: {
          title: 'Submit Quiz Lesson',
          content: 'Submit quiz content',
          type: 'INTERACTIVE',
          order: 1,
          moduleId: module.id
        }
      });

      const quiz = await prisma.quiz.create({
        data: {
          title: 'Submit Test Quiz',
          timeLimit: 30,
          lessonId: lesson.id
        }
      });

      const submissionData = {
        answers: {
          question1: 'Answer 1',
          question2: 'Answer 2'
        }
      };

      const response = await request(app)
        .post(`/api/v1/quizzes/${quiz.id}/submit`)
        .set('Authorization', authToken)
        .send(submissionData);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('score');
    });
  });

  describe('Dashboard API', () => {
    it('GET /api/v1/dashboard/stats should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalCourses');
      expect(response.body.data).toHaveProperty('totalStudents');
      expect(response.body.data).toHaveProperty('totalInstructors');
      expect(response.body.data).toHaveProperty('activeEnrollments');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/v1/organizations');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent resources', async () => {
      const response = await request(app)
        .get('/api/v1/organizations/non-existent-id')
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', authToken)
        .send({}); // Missing required name field

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
