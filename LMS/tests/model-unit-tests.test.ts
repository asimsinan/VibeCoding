import { describe, it, expect } from '@jest/globals';
import {
  // Organization schemas
  OrganizationSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  validateOrganization,
  validateCreateOrganization,
  validateUpdateOrganization,
  
  // User schemas
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserRoleSchema,
  validateUser,
  validateCreateUser,
  validateUpdateUser,
  
  // Course schemas
  CourseSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  CourseStatusSchema,
  validateCourse,
  validateCreateCourse,
  validateUpdateCourse,
  
  // Module schemas
  ModuleSchema,
  CreateModuleSchema,
  UpdateModuleSchema,
  validateModule,
  validateCreateModule,
  validateUpdateModule,
  
  // Lesson schemas
  LessonSchema,
  CreateLessonSchema,
  UpdateLessonSchema,
  LessonTypeSchema,
  validateLesson,
  validateCreateLesson,
  validateUpdateLesson,
  
  // Quiz schemas
  QuizSchema,
  CreateQuizSchema,
  UpdateQuizSchema,
  validateQuiz,
  validateCreateQuiz,
  validateUpdateQuiz,
  
  // Question schemas
  QuestionSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  QuestionTypeSchema,
  validateQuestion,
  validateCreateQuestion,
  validateUpdateQuestion,
  
  // Enrollment schemas
  EnrollmentSchema,
  CreateEnrollmentSchema,
  UpdateEnrollmentSchema,
  EnrollmentStatusSchema,
  validateEnrollment,
  validateCreateEnrollment,
  validateUpdateEnrollment,
  
  // Progress schemas
  ProgressSchema,
  CreateProgressSchema,
  UpdateProgressSchema,
  ProgressStatusSchema,
  validateProgress,
  validateCreateProgress,
  validateUpdateProgress,
  
  // Quiz Attempt schemas
  QuizAttemptSchema,
  CreateQuizAttemptSchema,
  QuizSubmissionSchema,
  validateQuizAttempt,
  validateCreateQuizAttempt,
  validateQuizSubmission,
  
  // Dashboard schemas
  DashboardStatsSchema,
  validateDashboardStats,
  
  // API Response schemas
  ApiResponseSchema,
  ApiErrorSchema
} from '../src/lib/schemas';

// Unit Tests for Data Models and Validation Logic
// These tests validate the Zod schemas and TypeScript types

describe('Data Model Unit Tests', () => {
  describe('Organization Schemas', () => {
    it('should validate valid organization data', () => {
      const validOrg = {
        id: 'clx123456789',
        name: 'Test Organization',
        domain: 'https://test.com',
        settings: { theme: 'blue' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateOrganization(validOrg)).not.toThrow();
      const result = validateOrganization(validOrg);
      expect(result.name).toBe('Test Organization');
      expect(result.domain).toBe('https://test.com');
    });

    it('should validate create organization data', () => {
      const validCreateOrg = {
        name: 'New Organization',
        domain: 'https://neworg.com',
        settings: { theme: 'dark' }
      };

      expect(() => validateCreateOrganization(validCreateOrg)).not.toThrow();
      const result = validateCreateOrganization(validCreateOrg);
      expect(result.name).toBe('New Organization');
    });

    it('should validate update organization data', () => {
      const validUpdateOrg = {
        name: 'Updated Organization',
        settings: { theme: 'green' }
      };

      expect(() => validateUpdateOrganization(validUpdateOrg)).not.toThrow();
      const result = validateUpdateOrganization(validUpdateOrg);
      expect(result.name).toBe('Updated Organization');
    });

    it('should reject invalid organization data', () => {
      const invalidOrg = {
        id: 'invalid-id',
        name: '', // Empty name should fail
        domain: 'not-a-url',
        createdAt: 'not-a-date'
      };

      expect(() => validateOrganization(invalidOrg)).toThrow();
    });

    it('should reject create organization without required name', () => {
      const invalidCreateOrg = {
        domain: 'https://test.com'
        // Missing required name field
      };

      expect(() => validateCreateOrganization(invalidCreateOrg)).toThrow();
    });
  });

  describe('User Schemas', () => {
    it('should validate valid user data', () => {
      const validUser = {
        id: 'clx123456789',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: 'clx987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateUser(validUser)).not.toThrow();
      const result = validateUser(validUser);
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('ADMIN');
    });

    it('should validate create user data', () => {
      const validCreateUser = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'STUDENT',
        organizationId: 'clx987654321'
      };

      expect(() => validateCreateUser(validCreateUser)).not.toThrow();
      const result = validateCreateUser(validCreateUser);
      expect(result.email).toBe('newuser@example.com');
      expect(result.role).toBe('STUDENT');
    });

    it('should validate update user data', () => {
      const validUpdateUser = {
        name: 'Updated User Name',
        email: 'updated@example.com'
      };

      expect(() => validateUpdateUser(validUpdateUser)).not.toThrow();
      const result = validateUpdateUser(validUpdateUser);
      expect(result.name).toBe('Updated User Name');
    });

    it('should reject invalid email format', () => {
      const invalidUser = {
        email: 'not-an-email',
        name: 'Test User',
        role: 'STUDENT',
        organizationId: 'clx987654321'
      };

      expect(() => validateCreateUser(invalidUser)).toThrow();
    });

    it('should reject invalid user role', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'INVALID_ROLE',
        organizationId: 'clx987654321'
      };

      expect(() => validateCreateUser(invalidUser)).toThrow();
    });

    it('should default role to STUDENT when not provided', () => {
      const userWithoutRole = {
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'clx987654321'
      };

      const result = validateCreateUser(userWithoutRole);
      expect(result.role).toBe('STUDENT');
    });
  });

  describe('Course Schemas', () => {
    it('should validate valid course data', () => {
      const validCourse = {
        id: 'clx123456789',
        title: 'Test Course',
        description: 'A test course',
        status: 'PUBLISHED',
        organizationId: 'clx987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateCourse(validCourse)).not.toThrow();
      const result = validateCourse(validCourse);
      expect(result.title).toBe('Test Course');
      expect(result.status).toBe('PUBLISHED');
    });

    it('should validate create course data', () => {
      const validCreateCourse = {
        title: 'New Course',
        description: 'A new course',
        status: 'DRAFT'
      };

      expect(() => validateCreateCourse(validCreateCourse)).not.toThrow();
      const result = validateCreateCourse(validCreateCourse);
      expect(result.title).toBe('New Course');
    });

    it('should validate update course data', () => {
      const validUpdateCourse = {
        title: 'Updated Course',
        status: 'PUBLISHED'
      };

      expect(() => validateUpdateCourse(validUpdateCourse)).not.toThrow();
      const result = validateUpdateCourse(validUpdateCourse);
      expect(result.title).toBe('Updated Course');
    });

    it('should reject course without required title', () => {
      const invalidCourse = {
        description: 'A course without title',
        status: 'DRAFT'
      };

      expect(() => validateCreateCourse(invalidCourse)).toThrow();
    });

    it('should reject invalid course status', () => {
      const invalidCourse = {
        title: 'Test Course',
        status: 'INVALID_STATUS'
      };

      expect(() => validateCreateCourse(invalidCourse)).toThrow();
    });

    it('should default status to DRAFT when not provided', () => {
      const courseWithoutStatus = {
        title: 'Test Course'
      };

      const result = validateCreateCourse(courseWithoutStatus);
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('Module Schemas', () => {
    it('should validate valid module data', () => {
      const validModule = {
        id: 'clx123456789',
        title: 'Test Module',
        order: 1,
        courseId: 'clx987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateModule(validModule)).not.toThrow();
      const result = validateModule(validModule);
      expect(result.title).toBe('Test Module');
      expect(result.order).toBe(1);
    });

    it('should validate create module data', () => {
      const validCreateModule = {
        title: 'New Module',
        order: 2,
        courseId: 'clx987654321'
      };

      expect(() => validateCreateModule(validCreateModule)).not.toThrow();
      const result = validateCreateModule(validCreateModule);
      expect(result.title).toBe('New Module');
    });

    it('should reject negative order values', () => {
      const invalidModule = {
        title: 'Test Module',
        order: -1,
        courseId: 'clx987654321'
      };

      expect(() => validateCreateModule(invalidModule)).toThrow();
    });

    it('should reject non-integer order values', () => {
      const invalidModule = {
        title: 'Test Module',
        order: 1.5,
        courseId: 'clx987654321'
      };

      expect(() => validateCreateModule(invalidModule)).toThrow();
    });
  });

  describe('Lesson Schemas', () => {
    it('should validate valid lesson data', () => {
      const validLesson = {
        id: 'clx123456789',
        title: 'Test Lesson',
        content: 'Lesson content',
        type: 'TEXT',
        order: 1,
        moduleId: 'clx987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateLesson(validLesson)).not.toThrow();
      const result = validateLesson(validLesson);
      expect(result.title).toBe('Test Lesson');
      expect(result.type).toBe('TEXT');
    });

    it('should validate create lesson data', () => {
      const validCreateLesson = {
        title: 'New Lesson',
        content: 'New lesson content',
        type: 'VIDEO',
        order: 1,
        moduleId: 'clx987654321'
      };

      expect(() => validateCreateLesson(validCreateLesson)).not.toThrow();
      const result = validateCreateLesson(validCreateLesson);
      expect(result.title).toBe('New Lesson');
      expect(result.type).toBe('VIDEO');
    });

    it('should reject invalid lesson type', () => {
      const invalidLesson = {
        title: 'Test Lesson',
        type: 'INVALID_TYPE',
        order: 1,
        moduleId: 'clx987654321'
      };

      expect(() => validateCreateLesson(invalidLesson)).toThrow();
    });

    it('should default lesson type to TEXT when not provided', () => {
      const lessonWithoutType = {
        title: 'Test Lesson',
        order: 1,
        moduleId: 'clx987654321'
      };

      const result = validateCreateLesson(lessonWithoutType);
      expect(result.type).toBe('TEXT');
    });
  });

  describe('Quiz Schemas', () => {
    it('should validate valid quiz data', () => {
      const validQuiz = {
        id: 'clx123456789',
        title: 'Test Quiz',
        timeLimit: 30,
        lessonId: 'clx987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateQuiz(validQuiz)).not.toThrow();
      const result = validateQuiz(validQuiz);
      expect(result.title).toBe('Test Quiz');
      expect(result.timeLimit).toBe(30);
    });

    it('should validate create quiz data', () => {
      const validCreateQuiz = {
        title: 'New Quiz',
        timeLimit: 45,
        lessonId: 'clx987654321'
      };

      expect(() => validateCreateQuiz(validCreateQuiz)).not.toThrow();
      const result = validateCreateQuiz(validCreateQuiz);
      expect(result.title).toBe('New Quiz');
    });

    it('should reject negative time limit', () => {
      const invalidQuiz = {
        title: 'Test Quiz',
        timeLimit: -5,
        lessonId: 'clx987654321'
      };

      expect(() => validateCreateQuiz(invalidQuiz)).toThrow();
    });

    it('should reject zero time limit', () => {
      const invalidQuiz = {
        title: 'Test Quiz',
        timeLimit: 0,
        lessonId: 'clx987654321'
      };

      expect(() => validateCreateQuiz(invalidQuiz)).toThrow();
    });
  });

  describe('Question Schemas', () => {
    it('should validate valid question data', () => {
      const validQuestion = {
        id: 'clx123456789',
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
        quizId: 'clx987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateQuestion(validQuestion)).not.toThrow();
      const result = validateQuestion(validQuestion);
      expect(result.text).toBe('What is 2 + 2?');
      expect(result.type).toBe('MULTIPLE_CHOICE');
    });

    it('should validate create question data', () => {
      const validCreateQuestion = {
        text: 'True or False: JavaScript is a programming language.',
        type: 'TRUE_FALSE',
        correctAnswer: { answer: true },
        order: 1,
        quizId: 'clx987654321'
      };

      expect(() => validateCreateQuestion(validCreateQuestion)).not.toThrow();
      const result = validateCreateQuestion(validCreateQuestion);
      expect(result.text).toBe('True or False: JavaScript is a programming language.');
      expect(result.type).toBe('TRUE_FALSE');
    });

    it('should reject invalid question type', () => {
      const invalidQuestion = {
        text: 'Test question',
        type: 'INVALID_TYPE',
        order: 1,
        quizId: 'clx987654321'
      };

      expect(() => validateCreateQuestion(invalidQuestion)).toThrow();
    });

    it('should validate essay question without options', () => {
      const essayQuestion = {
        text: 'Explain the concept of object-oriented programming.',
        type: 'ESSAY',
        order: 1,
        quizId: 'clx987654321'
      };

      expect(() => validateCreateQuestion(essayQuestion)).not.toThrow();
      const result = validateCreateQuestion(essayQuestion);
      expect(result.type).toBe('ESSAY');
    });
  });

  describe('Enrollment Schemas', () => {
    it('should validate valid enrollment data', () => {
      const validEnrollment = {
        id: 'clx123456789',
        userId: 'clx111111111',
        courseId: 'clx222222222',
        organizationId: 'clx333333333',
        status: 'ACTIVE',
        enrolledAt: new Date(),
        completedAt: null
      };

      expect(() => validateEnrollment(validEnrollment)).not.toThrow();
      const result = validateEnrollment(validEnrollment);
      expect(result.status).toBe('ACTIVE');
    });

    it('should validate create enrollment data', () => {
      const validCreateEnrollment = {
        userId: 'clx111111111',
        courseId: 'clx222222222',
        organizationId: 'clx333333333',
        status: 'ACTIVE'
      };

      expect(() => validateCreateEnrollment(validCreateEnrollment)).not.toThrow();
      const result = validateCreateEnrollment(validCreateEnrollment);
      expect(result.status).toBe('ACTIVE');
    });

    it('should reject invalid enrollment status', () => {
      const invalidEnrollment = {
        userId: 'clx111111111',
        courseId: 'clx222222222',
        organizationId: 'clx333333333',
        status: 'INVALID_STATUS'
      };

      expect(() => validateCreateEnrollment(invalidEnrollment)).toThrow();
    });

    it('should default status to ACTIVE when not provided', () => {
      const enrollmentWithoutStatus = {
        userId: 'clx111111111',
        courseId: 'clx222222222',
        organizationId: 'clx333333333'
      };

      const result = validateCreateEnrollment(enrollmentWithoutStatus);
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('Progress Schemas', () => {
    it('should validate valid progress data', () => {
      const validProgress = {
        id: 'clx123456789',
        userId: 'clx111111111',
        lessonId: 'clx222222222',
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateProgress(validProgress)).not.toThrow();
      const result = validateProgress(validProgress);
      expect(result.status).toBe('COMPLETED');
    });

    it('should validate create progress data', () => {
      const validCreateProgress = {
        userId: 'clx111111111',
        lessonId: 'clx222222222',
        status: 'IN_PROGRESS'
      };

      expect(() => validateCreateProgress(validCreateProgress)).not.toThrow();
      const result = validateCreateProgress(validCreateProgress);
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should reject invalid progress status', () => {
      const invalidProgress = {
        userId: 'clx111111111',
        lessonId: 'clx222222222',
        status: 'INVALID_STATUS'
      };

      expect(() => validateCreateProgress(invalidProgress)).toThrow();
    });

    it('should default status to NOT_STARTED when not provided', () => {
      const progressWithoutStatus = {
        userId: 'clx111111111',
        lessonId: 'clx222222222'
      };

      const result = validateCreateProgress(progressWithoutStatus);
      expect(result.status).toBe('NOT_STARTED');
    });
  });

  describe('Quiz Attempt Schemas', () => {
    it('should validate valid quiz attempt data', () => {
      const validQuizAttempt = {
        id: 'clx123456789',
        userId: 'clx111111111',
        quizId: 'clx222222222',
        answers: {
          question1: 'A',
          question2: true,
          question3: 'Short answer'
        },
        score: 85.5,
        submittedAt: new Date()
      };

      expect(() => validateQuizAttempt(validQuizAttempt)).not.toThrow();
      const result = validateQuizAttempt(validQuizAttempt);
      expect(result.score).toBe(85.5);
    });

    it('should validate create quiz attempt data', () => {
      const validCreateQuizAttempt = {
        userId: 'clx111111111',
        quizId: 'clx222222222',
        answers: {
          question1: 'B',
          question2: false
        }
      };

      expect(() => validateCreateQuizAttempt(validCreateQuizAttempt)).not.toThrow();
      const result = validateCreateQuizAttempt(validCreateQuizAttempt);
      expect(result.userId).toBe('clx111111111');
    });

    it('should validate quiz submission data', () => {
      const validSubmission = {
        answers: {
          question1: 'A',
          question2: true,
          question3: 'Essay answer here'
        }
      };

      expect(() => validateQuizSubmission(validSubmission)).not.toThrow();
      const result = validateQuizSubmission(validSubmission);
      expect(result.answers.question1).toBe('A');
    });

    it('should reject quiz attempt with invalid score range', () => {
      const invalidQuizAttempt = {
        id: 'clx123456789',
        userId: 'clx111111111',
        quizId: 'clx222222222',
        answers: { question1: 'A' },
        score: 150, // Score above 100
        submittedAt: new Date()
      };

      expect(() => validateQuizAttempt(invalidQuizAttempt)).toThrow();
    });

    it('should reject quiz attempt with negative score', () => {
      const invalidQuizAttempt = {
        id: 'clx123456789',
        userId: 'clx111111111',
        quizId: 'clx222222222',
        answers: { question1: 'A' },
        score: -10, // Negative score
        submittedAt: new Date()
      };

      expect(() => validateQuizAttempt(invalidQuizAttempt)).toThrow();
    });
  });

  describe('Dashboard Stats Schema', () => {
    it('should validate valid dashboard stats data', () => {
      const validStats = {
        totalCourses: 25,
        totalStudents: 150,
        totalInstructors: 8,
        activeEnrollments: 120,
        completedCourses: 30,
        averageCompletionRate: 75.5,
        recentActivity: [
          {
            type: 'enrollment',
            description: 'New student enrolled in Web Development course',
            timestamp: new Date()
          },
          {
            type: 'completion',
            description: 'Student completed JavaScript Fundamentals',
            timestamp: new Date()
          }
        ]
      };

      expect(() => validateDashboardStats(validStats)).not.toThrow();
      const result = validateDashboardStats(validStats);
      expect(result.totalCourses).toBe(25);
      expect(result.totalStudents).toBe(150);
      expect(result.recentActivity).toHaveLength(2);
    });

    it('should reject dashboard stats with negative values', () => {
      const invalidStats = {
        totalCourses: -5,
        totalStudents: 150,
        totalInstructors: 8,
        activeEnrollments: 120,
        completedCourses: 30,
        averageCompletionRate: 75.5,
        recentActivity: []
      };

      expect(() => validateDashboardStats(invalidStats)).toThrow();
    });

    it('should reject dashboard stats with completion rate above 100', () => {
      const invalidStats = {
        totalCourses: 25,
        totalStudents: 150,
        totalInstructors: 8,
        activeEnrollments: 120,
        completedCourses: 30,
        averageCompletionRate: 150.5, // Above 100%
        recentActivity: []
      };

      expect(() => validateDashboardStats(invalidStats)).toThrow();
    });
  });

  describe('API Response Schemas', () => {
    it('should validate valid API response', () => {
      const validResponse = {
        data: { id: '123', name: 'Test' },
        message: 'Success',
        status: 'success'
      };

      expect(() => ApiResponseSchema.parse(validResponse)).not.toThrow();
      const result = ApiResponseSchema.parse(validResponse);
      expect(result.message).toBe('Success');
      expect(result.status).toBe('success');
    });

    it('should validate valid API error', () => {
      const validError = {
        error: 'ValidationError',
        message: 'Invalid input data',
        status: 'error'
      };

      expect(() => ApiErrorSchema.parse(validError)).not.toThrow();
      const result = ApiErrorSchema.parse(validError);
      expect(result.error).toBe('ValidationError');
      expect(result.message).toBe('Invalid input data');
    });

    it('should reject API response without required fields', () => {
      const invalidResponse = {
        data: { id: '123' }
        // Missing message and status
      };

      expect(() => ApiResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('Enum Validation', () => {
    it('should validate UserRole enum values', () => {
      expect(() => UserRoleSchema.parse('ADMIN')).not.toThrow();
      expect(() => UserRoleSchema.parse('INSTRUCTOR')).not.toThrow();
      expect(() => UserRoleSchema.parse('STUDENT')).not.toThrow();
      expect(() => UserRoleSchema.parse('INVALID_ROLE')).toThrow();
    });

    it('should validate CourseStatus enum values', () => {
      expect(() => CourseStatusSchema.parse('DRAFT')).not.toThrow();
      expect(() => CourseStatusSchema.parse('PUBLISHED')).not.toThrow();
      expect(() => CourseStatusSchema.parse('ARCHIVED')).not.toThrow();
      expect(() => CourseStatusSchema.parse('INVALID_STATUS')).toThrow();
    });

    it('should validate LessonType enum values', () => {
      expect(() => LessonTypeSchema.parse('TEXT')).not.toThrow();
      expect(() => LessonTypeSchema.parse('VIDEO')).not.toThrow();
      expect(() => LessonTypeSchema.parse('IMAGE')).not.toThrow();
      expect(() => LessonTypeSchema.parse('DOCUMENT')).not.toThrow();
      expect(() => LessonTypeSchema.parse('INTERACTIVE')).not.toThrow();
      expect(() => LessonTypeSchema.parse('INVALID_TYPE')).toThrow();
    });

    it('should validate QuestionType enum values', () => {
      expect(() => QuestionTypeSchema.parse('MULTIPLE_CHOICE')).not.toThrow();
      expect(() => QuestionTypeSchema.parse('TRUE_FALSE')).not.toThrow();
      expect(() => QuestionTypeSchema.parse('SHORT_ANSWER')).not.toThrow();
      expect(() => QuestionTypeSchema.parse('ESSAY')).not.toThrow();
      expect(() => QuestionTypeSchema.parse('INVALID_TYPE')).toThrow();
    });

    it('should validate EnrollmentStatus enum values', () => {
      expect(() => EnrollmentStatusSchema.parse('ACTIVE')).not.toThrow();
      expect(() => EnrollmentStatusSchema.parse('COMPLETED')).not.toThrow();
      expect(() => EnrollmentStatusSchema.parse('DROPPED')).not.toThrow();
      expect(() => EnrollmentStatusSchema.parse('SUSPENDED')).not.toThrow();
      expect(() => EnrollmentStatusSchema.parse('INVALID_STATUS')).toThrow();
    });

    it('should validate ProgressStatus enum values', () => {
      expect(() => ProgressStatusSchema.parse('NOT_STARTED')).not.toThrow();
      expect(() => ProgressStatusSchema.parse('IN_PROGRESS')).not.toThrow();
      expect(() => ProgressStatusSchema.parse('COMPLETED')).not.toThrow();
      expect(() => ProgressStatusSchema.parse('INVALID_STATUS')).toThrow();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle null and undefined values appropriately', () => {
      const orgWithNulls = {
        id: 'clx123456789',
        name: 'Test Org',
        domain: null,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validateOrganization(orgWithNulls)).not.toThrow();
    });

    it('should handle empty strings appropriately', () => {
      const userWithEmptyName = {
        email: 'test@example.com',
        name: '',
        role: 'STUDENT',
        organizationId: 'clx987654321'
      };

      expect(() => validateCreateUser(userWithEmptyName)).not.toThrow();
    });

    it('should handle large numbers', () => {
      const moduleWithLargeOrder = {
        title: 'Test Module',
        order: 999999,
        courseId: 'clx987654321'
      };

      expect(() => validateCreateModule(moduleWithLargeOrder)).not.toThrow();
    });

    it('should handle complex nested objects', () => {
      const complexSettings = {
        theme: 'dark',
        colors: {
          primary: '#000000',
          secondary: '#ffffff'
        },
        features: {
          notifications: true,
          analytics: false,
          customBranding: {
            logo: 'https://example.com/logo.png',
            favicon: 'https://example.com/favicon.ico'
          }
        }
      };

      const orgWithComplexSettings = {
        name: 'Complex Org',
        settings: complexSettings
      };

      expect(() => validateCreateOrganization(orgWithComplexSettings)).not.toThrow();
    });
  });
});
