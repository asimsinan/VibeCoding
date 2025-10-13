import { PrismaClient } from '@prisma/client';
import { OrganizationService } from '../services/organization.service';
import { UserService } from '../services/user.service';
import { CourseService } from '../services/course.service';
import { ModuleLessonService } from '../services/module-lesson.service';
import { QuizService } from '../services/quiz.service';
import { EnrollmentService } from '../services/enrollment.service';
import { ProgressService } from '../services/progress.service';
import { QuizGradingService } from '../services/quiz-grading.service';
import { FileUploadService } from '../services/file-upload.service';
import { EmailNotificationService } from '../services/email-notification.service';
import { AuditLoggingService } from '../services/audit-logging.service';
import { CachingService } from '../services/caching.service';
import { SearchService } from '../services/search.service';
import { AnalyticsService } from '../services/analytics.service';
import { MultiTenantIsolationService } from '../services/multi-tenant-isolation.service';
import { DataValidationService } from '../lib/validation';

describe('Service Integration Tests', () => {
  let prisma: PrismaClient;
  let organizationService: OrganizationService;
  let userService: UserService;
  let courseService: CourseService;
  let moduleLessonService: ModuleLessonService;
  let quizService: QuizService;
  let enrollmentService: EnrollmentService;
  let progressService: ProgressService;
  let quizGradingService: QuizGradingService;
  let fileUploadService: FileUploadService;
  let emailNotificationService: EmailNotificationService;
  let auditLoggingService: AuditLoggingService;
  let cachingService: CachingService;
  let searchService: SearchService;
  let analyticsService: AnalyticsService;
  let isolationService: MultiTenantIsolationService;

  let testOrganization: any;
  let testAdmin: any;
  let testInstructor: any;
  let testStudent: any;
  let testCourse: any;
  let testModule: any;
  let testLesson: any;
  let testQuiz: any;
  let testQuestion: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Initialize all services
    organizationService = new OrganizationService(prisma);
    userService = new UserService(prisma);
    courseService = new CourseService(prisma);
    moduleLessonService = new ModuleLessonService(prisma);
    quizService = new QuizService(prisma);
    enrollmentService = new EnrollmentService(prisma);
    progressService = new ProgressService(prisma);
    quizGradingService = new QuizGradingService(prisma);
    fileUploadService = new FileUploadService(prisma);
    emailNotificationService = new EmailNotificationService();
    auditLoggingService = new AuditLoggingService(prisma);
    cachingService = new CachingService();
    searchService = new SearchService(prisma);
    analyticsService = new AnalyticsService(prisma);
    isolationService = new MultiTenantIsolationService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();
    
    // Create test organization
    testOrganization = await organizationService.createOrganization({
      name: 'Test Organization',
      domain: 'test.com',
      description: 'Test organization for integration tests',
    });

    // Create test users
    testAdmin = await userService.createUser({
      email: 'admin@test.com',
      name: 'Test Admin',
      password: 'Password123',
      role: 'ADMIN',
      organizationId: testOrganization.id,
    });

    testInstructor = await userService.createUser({
      email: 'instructor@test.com',
      name: 'Test Instructor',
      password: 'Password123',
      role: 'INSTRUCTOR',
      organizationId: testOrganization.id,
    });

    testStudent = await userService.createUser({
      email: 'student@test.com',
      name: 'Test Student',
      password: 'Password123',
      role: 'STUDENT',
      organizationId: testOrganization.id,
    });

    // Create test course
    testCourse = await courseService.createCourse({
      title: 'Test Course',
      description: 'A test course for integration tests',
      organizationId: testOrganization.id,
      instructorId: testInstructor.id,
    });

    // Create test module
    testModule = await moduleLessonService.createModule({
      title: 'Test Module',
      courseId: testCourse.id,
      organizationId: testOrganization.id,
    });

    // Create test lesson
    testLesson = await moduleLessonService.createLesson({
      title: 'Test Lesson',
      content: 'This is a test lesson content',
      type: 'TEXT',
      moduleId: testModule.id,
      organizationId: testOrganization.id,
    });

    // Create test quiz
    testQuiz = await quizService.createQuiz({
      title: 'Test Quiz',
      lessonId: testLesson.id,
      timeLimit: 30,
      maxAttempts: 3,
      passingScore: 70,
    });

    // Create test question
    testQuestion = await quizService.createQuestion({
      text: 'What is 2 + 2?',
      type: 'MULTIPLE_CHOICE',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: '2 + 2 equals 4',
      quizId: testQuiz.id,
      points: 10,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  async function cleanupTestData() {
    // Delete in reverse order of dependencies
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
    await prisma.auditLog.deleteMany();
  }

  describe('Organization and User Management Integration', () => {
    it('should create organization and users with proper relationships', async () => {
      // Verify organization was created
      expect(testOrganization).toBeDefined();
      expect(testOrganization.name).toBe('Test Organization');

      // Verify users were created with correct organization
      expect(testAdmin.organizationId).toBe(testOrganization.id);
      expect(testInstructor.organizationId).toBe(testOrganization.id);
      expect(testStudent.organizationId).toBe(testOrganization.id);

      // Verify roles
      expect(testAdmin.role).toBe('ADMIN');
      expect(testInstructor.role).toBe('INSTRUCTOR');
      expect(testStudent.role).toBe('STUDENT');
    });

    it('should enforce organization isolation', async () => {
      // Create another organization
      const otherOrg = await organizationService.createOrganization({
        name: 'Other Organization',
        domain: 'other.com',
      });

      // Try to access other organization's data
      const users = await userService.getUsers(testAdmin.id, testOrganization.id);
      expect(users.every(user => user.organizationId === testOrganization.id)).toBe(true);

      // Verify isolation service works
      const isValid = isolationService.validateDataOwnership(testAdmin, testOrganization.id);
      expect(isValid).toBe(true);

      const isInvalid = isolationService.validateDataOwnership(testAdmin, otherOrg.id);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Course Management Integration', () => {
    it('should create course with proper instructor relationship', async () => {
      expect(testCourse).toBeDefined();
      expect(testCourse.organizationId).toBe(testOrganization.id);
      expect(testCourse.instructorId).toBe(testInstructor.id);

      // Verify course can be retrieved by instructor
      const instructorCourses = await courseService.getCourses(testInstructor.id, testOrganization.id);
      expect(instructorCourses.some(course => course.id === testCourse.id)).toBe(true);
    });

    it('should create module and lesson hierarchy', async () => {
      expect(testModule).toBeDefined();
      expect(testModule.courseId).toBe(testCourse.id);

      expect(testLesson).toBeDefined();
      expect(testLesson.moduleId).toBe(testModule.id);

      // Verify hierarchy can be retrieved
      const courseWithModules = await courseService.getCourseById(testCourse.id, testOrganization.id);
      expect(courseWithModules.modules).toBeDefined();
      expect(courseWithModules.modules.length).toBeGreaterThan(0);
    });
  });

  describe('Quiz System Integration', () => {
    it('should create quiz with questions', async () => {
      expect(testQuiz).toBeDefined();
      expect(testQuiz.lessonId).toBe(testLesson.id);

      expect(testQuestion).toBeDefined();
      expect(testQuestion.quizId).toBe(testQuiz.id);

      // Verify quiz can be retrieved with questions
      const quizWithQuestions = await quizService.getQuizById(testQuiz.id, testOrganization.id);
      expect(quizWithQuestions.questions).toBeDefined();
      expect(quizWithQuestions.questions.length).toBeGreaterThan(0);
    });

    it('should handle quiz attempts and grading', async () => {
      // Create enrollment first
      const enrollment = await enrollmentService.createEnrollment({
        userId: testStudent.id,
        courseId: testCourse.id,
        organizationId: testOrganization.id,
      });

      // Submit quiz attempt
      const attempt = await quizGradingService.submitQuizAttempt({
        userId: testStudent.id,
        quizId: testQuiz.id,
        answers: [
          {
            questionId: testQuestion.id,
            answer: '4',
          },
        ],
      });

      expect(attempt).toBeDefined();
      expect(attempt.score).toBeDefined();
      expect(attempt.score).toBeGreaterThan(0);
    });
  });

  describe('Enrollment and Progress Integration', () => {
    it('should handle course enrollment and progress tracking', async () => {
      // Create enrollment
      const enrollment = await enrollmentService.createEnrollment({
        userId: testStudent.id,
        courseId: testCourse.id,
        organizationId: testOrganization.id,
      });

      expect(enrollment).toBeDefined();
      expect(enrollment.userId).toBe(testStudent.id);
      expect(enrollment.courseId).toBe(testCourse.id);

      // Update progress
      const progress = await progressService.updateProgress({
        userId: testStudent.id,
        lessonId: testLesson.id,
        status: 'COMPLETED',
      });

      expect(progress).toBeDefined();
      expect(progress.status).toBe('COMPLETED');

      // Verify progress can be retrieved
      const userProgress = await progressService.getUserProgress(testStudent.id, testCourse.id);
      expect(userProgress).toBeDefined();
      expect(userProgress.some(p => p.lessonId === testLesson.id)).toBe(true);
    });
  });

  describe('Search Integration', () => {
    it('should search across all content types', async () => {
      // Search for courses
      const courseResults = await searchService.searchCourses(
        'Test',
        testOrganization.id,
        {},
        { page: 1, pageSize: 10 }
      );

      expect(courseResults.results.length).toBeGreaterThan(0);
      expect(courseResults.results[0].item.title).toContain('Test');

      // Search for lessons
      const lessonResults = await searchService.searchLessons(
        'Test',
        testOrganization.id,
        {},
        { page: 1, pageSize: 10 }
      );

      expect(lessonResults.results.length).toBeGreaterThan(0);
      expect(lessonResults.results[0].item.title).toContain('Test');
    });

    it('should provide search suggestions', async () => {
      const suggestions = await searchService.getSuggestions('Test', testOrganization.id);
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Analytics Integration', () => {
    it('should generate dashboard analytics', async () => {
      const dashboardData = await analyticsService.getDashboardData(testOrganization.id, '30d');

      expect(dashboardData).toBeDefined();
      expect(dashboardData.overview).toBeDefined();
      expect(dashboardData.charts).toBeDefined();
      expect(dashboardData.topContent).toBeDefined();
      expect(dashboardData.userEngagement).toBeDefined();

      expect(dashboardData.overview.totalUsers.total).toBeGreaterThan(0);
      expect(dashboardData.overview.totalCourses.total).toBeGreaterThan(0);
    });

    it('should generate user analytics', async () => {
      const userAnalytics = await analyticsService.getUserAnalytics(testOrganization.id, '30d');

      expect(userAnalytics).toBeDefined();
      expect(userAnalytics.total).toBeDefined();
      expect(userAnalytics.growth).toBeDefined();
      expect(userAnalytics.byRole).toBeDefined();
      expect(userAnalytics.activity).toBeDefined();
      expect(userAnalytics.engagement).toBeDefined();
    });

    it('should generate course analytics', async () => {
      const courseAnalytics = await analyticsService.getCourseAnalytics(testOrganization.id, '30d');

      expect(courseAnalytics).toBeDefined();
      expect(courseAnalytics.total).toBeDefined();
      expect(courseAnalytics.enrollments).toBeDefined();
      expect(courseAnalytics.completionRates).toBeDefined();
      expect(courseAnalytics.topCourses).toBeDefined();
      expect(courseAnalytics.byStatus).toBeDefined();
    });
  });

  describe('Caching Integration', () => {
    it('should cache and retrieve data', async () => {
      const cacheKey = 'test-key';
      const testData = { id: '1', name: 'Test' };

      // Set cache
      cachingService.set(cacheKey, testData, 300);

      // Get from cache
      const cachedData = cachingService.get(cacheKey);
      expect(cachedData).toEqual(testData);

      // Verify cache stats
      const stats = cachingService.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle cache expiration', async () => {
      const cacheKey = 'expiring-key';
      const testData = { id: '1', name: 'Test' };

      // Set cache with short TTL
      cachingService.set(cacheKey, testData, 1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to get expired data
      const expiredData = cachingService.get(cacheKey);
      expect(expiredData).toBeNull();
    });
  });

  describe('Audit Logging Integration', () => {
    it('should log user actions', async () => {
      await auditLoggingService.logUserAction(
        testAdmin.id,
        'CREATE',
        'COURSE',
        testCourse.id,
        testOrganization.id,
        { title: testCourse.title }
      );

      // Verify audit log was created
      const auditLogs = await auditLoggingService.getOrganizationAuditLogs(
        testOrganization.id,
        1,
        10
      );

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs[0].userId).toBe(testAdmin.id);
      expect(auditLogs.logs[0].action).toBe('CREATE');
      expect(auditLogs.logs[0].resource).toBe('COURSE');
    });

    it('should log authentication events', async () => {
      await auditLoggingService.logAuthentication(
        testStudent.id,
        'LOGIN',
        testOrganization.id,
        { method: 'credentials' }
      );

      const auditLogs = await auditLoggingService.getUserAuditLogs(
        testStudent.id,
        testOrganization.id,
        1,
        10
      );

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs[0].action).toBe('LOGIN');
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate user data', () => {
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
        role: 'STUDENT',
        organizationId: testOrganization.id,
      };

      const validatedData = DataValidationService.validate(
        DataValidationService.CreateUserSchema,
        validUserData
      );

      expect(validatedData).toEqual(validUserData);
    });

    it('should reject invalid user data', () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: '',
        password: 'weak',
        role: 'INVALID_ROLE',
        organizationId: testOrganization.id,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateUserSchema,
          invalidUserData
        );
      }).toThrow('Validation failed');
    });

    it('should validate course data', () => {
      const validCourseData = {
        title: 'Test Course',
        description: 'A test course',
        organizationId: testOrganization.id,
        instructorId: testInstructor.id,
        status: 'DRAFT',
      };

      const validatedData = DataValidationService.validate(
        DataValidationService.CreateCourseSchema,
        validCourseData
      );

      expect(validatedData).toEqual(validCourseData);
    });
  });

  describe('File Upload Integration', () => {
    it('should handle file upload metadata', async () => {
      const fileData = {
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test-file.pdf',
        url: 'https://example.com/uploads/test-file.pdf',
        uploadedBy: testInstructor.id,
        organizationId: testOrganization.id,
        courseId: testCourse.id,
        lessonId: testLesson.id,
      };

      const uploadedFile = await fileUploadService.uploadFile(fileData);

      expect(uploadedFile).toBeDefined();
      expect(uploadedFile.filename).toBe(fileData.filename);
      expect(uploadedFile.organizationId).toBe(testOrganization.id);
    });

    it('should validate file upload data', () => {
      const validFileData = {
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test-file.pdf',
        url: 'https://example.com/uploads/test-file.pdf',
        uploadedBy: testInstructor.id,
        organizationId: testOrganization.id,
      };

      const validatedData = DataValidationService.validate(
        DataValidationService.FileUploadSchema,
        validFileData
      );

      expect(validatedData).toEqual(validFileData);
    });
  });

  describe('Email Notification Integration', () => {
    it('should send email notifications', async () => {
      const emailData = {
        to: [{ email: testStudent.email, name: testStudent.name }],
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const result = await emailNotificationService.sendEmail(emailData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should send event notifications', async () => {
      const eventData = {
        eventType: 'COURSE_ENROLLMENT',
        userId: testStudent.id,
        organizationId: testOrganization.id,
        data: {
          courseId: testCourse.id,
          courseTitle: testCourse.title,
        },
      };

      const result = await emailNotificationService.sendEventNotification(eventData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full course workflow', async () => {
      // 1. Create course
      const course = await courseService.createCourse({
        title: 'E2E Test Course',
        description: 'End-to-end test course',
        organizationId: testOrganization.id,
        instructorId: testInstructor.id,
      });

      // 2. Create module
      const module = await moduleLessonService.createModule({
        title: 'E2E Test Module',
        courseId: course.id,
        organizationId: testOrganization.id,
      });

      // 3. Create lesson
      const lesson = await moduleLessonService.createLesson({
        title: 'E2E Test Lesson',
        content: 'End-to-end test lesson content',
        type: 'TEXT',
        moduleId: module.id,
        organizationId: testOrganization.id,
      });

      // 4. Create quiz
      const quiz = await quizService.createQuiz({
        title: 'E2E Test Quiz',
        lessonId: lesson.id,
        timeLimit: 30,
        maxAttempts: 3,
        passingScore: 70,
      });

      // 5. Create question
      const question = await quizService.createQuestion({
        text: 'What is the capital of France?',
        type: 'MULTIPLE_CHOICE',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital of France',
        quizId: quiz.id,
        points: 10,
      });

      // 6. Enroll student
      const enrollment = await enrollmentService.createEnrollment({
        userId: testStudent.id,
        courseId: course.id,
        organizationId: testOrganization.id,
      });

      // 7. Update progress
      const progress = await progressService.updateProgress({
        userId: testStudent.id,
        lessonId: lesson.id,
        status: 'COMPLETED',
      });

      // 8. Submit quiz attempt
      const attempt = await quizGradingService.submitQuizAttempt({
        userId: testStudent.id,
        quizId: quiz.id,
        answers: [
          {
            questionId: question.id,
            answer: 'Paris',
          },
        ],
      });

      // 9. Verify all data is properly linked
      expect(course.id).toBeDefined();
      expect(module.courseId).toBe(course.id);
      expect(lesson.moduleId).toBe(module.id);
      expect(quiz.lessonId).toBe(lesson.id);
      expect(question.quizId).toBe(quiz.id);
      expect(enrollment.courseId).toBe(course.id);
      expect(enrollment.userId).toBe(testStudent.id);
      expect(progress.lessonId).toBe(lesson.id);
      expect(progress.userId).toBe(testStudent.id);
      expect(attempt.quizId).toBe(quiz.id);
      expect(attempt.userId).toBe(testStudent.id);

      // 10. Verify analytics can access the data
      const analytics = await analyticsService.getDashboardData(testOrganization.id, '30d');
      expect(analytics.overview.totalCourses.total).toBeGreaterThan(0);
      expect(analytics.overview.totalEnrollments.total).toBeGreaterThan(0);

      // 11. Verify search can find the content
      const searchResults = await searchService.searchAll(
        'E2E Test',
        testOrganization.id,
        {},
        { page: 1, pageSize: 10 }
      );
      expect(searchResults.results.length).toBeGreaterThan(0);
    });
  });
});
