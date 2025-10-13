import { PrismaClient } from '../src/generated/prisma';
import { hashPassword } from '../src/lib/auth';
import { UserRole, CourseStatus, LessonType, QuestionType, EnrollmentStatus, ProgressStatus } from '../src/generated/prisma';

// Test database setup
const prisma = new PrismaClient();

// Test data factories
export class TestDataFactory {
  static async hashPassword(password: string): Promise<string> {
    return await hashPassword(password);
  }
  static async createOrganization(data?: Partial<any>) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    return await prisma.organization.create({
      data: {
        name: `Test Organization ${timestamp}`,
        domain: `test-${randomId}-${timestamp}.com`,
        settings: { theme: 'blue' },
        ...data,
      },
    });
  }

  static async createUser(organizationId?: string, role: UserRole = UserRole.STUDENT, data?: Partial<any>) {
    let org;
    if (organizationId) {
      org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        throw new Error(`Organization with id ${organizationId} not found`);
      }
    } else {
      org = await this.createOrganization();
    }
    
    const hashedPassword = await hashPassword('password123');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    return await prisma.user.create({
      data: {
        email: `test-${randomId}-${timestamp}@example.com`,
        name: `Test User ${timestamp}`,
        password: hashedPassword,
        role: role,
        organizationId: org.id,
        ...data,
      },
    });
  }

  static async createCourse(organizationId?: string, data?: Partial<any>) {
    let org;
    if (organizationId) {
      org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        throw new Error(`Organization with id ${organizationId} not found`);
      }
    } else {
      org = await this.createOrganization();
    }
    
    return await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course',
        status: CourseStatus.PUBLISHED,
        organizationId: org.id,
        ...data,
      },
    });
  }

  static async createModule(data?: Partial<any>) {
    const course = await this.createCourse();
    
    return await prisma.module.create({
      data: {
        title: 'Test Module',
        order: 1,
        courseId: course.id,
        ...data,
      },
    });
  }

  static async createLesson(data?: Partial<any>) {
    const module = await this.createModule();
    
    return await prisma.lesson.create({
      data: {
        title: 'Test Lesson',
        content: 'Test lesson content',
        type: LessonType.TEXT,
        order: 1,
        moduleId: module.id,
        ...data,
      },
    });
  }

  static async createQuiz(data?: Partial<any>) {
    const lesson = await this.createLesson();
    
    return await prisma.quiz.create({
      data: {
        title: 'Test Quiz',
        timeLimit: 30,
        lessonId: lesson.id,
        ...data,
      },
    });
  }

  static async createQuestion(data?: Partial<any>) {
    const quiz = await this.createQuiz();
    
    return await prisma.question.create({
      data: {
        text: 'What is 2 + 2?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        order: 1,
        quizId: quiz.id,
        ...data,
      },
    });
  }

  static async createEnrollment(data?: Partial<any>) {
    const user = await this.createUser();
    const course = await this.createCourse();
    
    return await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        organizationId: user.organizationId,
        status: EnrollmentStatus.ACTIVE,
        ...data,
      },
    });
  }

  static async createProgress(data?: Partial<any>) {
    const enrollment = await this.createEnrollment();
    const lesson = await this.createLesson();
    
    return await prisma.progress.create({
      data: {
        userId: enrollment.userId,
        lessonId: lesson.id,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
        ...data,
      },
    });
  }

  static async createQuizAttempt(data?: Partial<any>) {
    const enrollment = await this.createEnrollment();
    const quiz = await this.createQuiz();
    
    return await prisma.quizAttempt.create({
      data: {
        userId: enrollment.userId,
        quizId: quiz.id,
        score: 80,
        answers: { question1: 'answer1' },
        ...data,
      },
    });
  }
}

// Test cleanup utilities
export class TestCleanup {
  static async cleanup() {
    await this.cleanupAll();
  }

  static async cleanupAll() {
    await prisma.quizAttempt.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.verificationToken.deleteMany();
  }

  static async cleanupOrganization(organizationId: string) {
    await prisma.quizAttempt.deleteMany({
      where: {
        user: {
          organizationId,
        },
      },
    });
    await prisma.progress.deleteMany({
      where: {
        user: {
          organizationId,
        },
      },
    });
    await prisma.enrollment.deleteMany({
      where: {
        user: {
          organizationId,
        },
      },
    });
    await prisma.question.deleteMany({
      where: {
        quiz: {
          lesson: {
            module: {
              course: {
                organizationId,
              },
            },
          },
        },
      },
    });
    await prisma.quiz.deleteMany({
      where: {
        lesson: {
          module: {
            course: {
              organizationId,
            },
          },
        },
      },
    });
    await prisma.lesson.deleteMany({
      where: {
        module: {
          course: {
            organizationId,
          },
        },
      },
    });
    await prisma.module.deleteMany({
      where: {
        course: {
          organizationId,
        },
      },
    });
    await prisma.course.deleteMany({
      where: {
        organizationId,
      },
    });
    await prisma.user.deleteMany({
      where: {
        organizationId,
      },
    });
    await prisma.organization.deleteMany({
      where: {
        id: organizationId,
      },
    });
  }
}

// Integration test scenarios
export class IntegrationTestScenarios {
  // Test complete course enrollment flow
  static async testCourseEnrollmentFlow() {
    const org = await TestDataFactory.createOrganization();
    const user = await TestDataFactory.createUser({ organizationId: org.id });
    const course = await TestDataFactory.createCourse({ organizationId: org.id });
    
    // Create course structure
      const module = await prisma.module.create({
        data: {
          title: 'Module 1',
          order: 1,
          courseId: course.id,
        },
      });
    
    const lesson = await prisma.lesson.create({
      data: {
        title: 'Lesson 1',
        content: 'Lesson content',
        type: LessonType.TEXT,
        order: 1,
        moduleId: module.id,
      },
    });
    
      const quiz = await prisma.quiz.create({
        data: {
          title: 'Quiz 1',
          timeLimit: 30,
          lessonId: lesson.id,
        },
      });
    
    // Test enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        organizationId: user.organizationId,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    
    // Test progress tracking
    const progress = await prisma.progress.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    
    // Test quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        score: 85,
        answers: { question1: 'answer1' },
      },
    });
    
    return {
      organization: org,
      user,
      course,
      module,
      lesson,
      quiz,
      enrollment,
      progress,
      quizAttempt,
    };
  }

  // Test multi-tenant isolation
  static async testMultiTenantIsolation() {
    const org1 = await TestDataFactory.createOrganization({ name: 'Org 1' });
    const org2 = await TestDataFactory.createOrganization({ name: 'Org 2' });
    
    const user1 = await TestDataFactory.createUser({ 
      organizationId: org1.id,
      email: 'user1@org1.com',
    });
    const user2 = await TestDataFactory.createUser({ 
      organizationId: org2.id,
      email: 'user2@org2.com',
    });
    
    const course1 = await TestDataFactory.createCourse({ 
      organizationId: org1.id,
      title: 'Course 1',
    });
    const course2 = await TestDataFactory.createCourse({ 
      organizationId: org2.id,
      title: 'Course 2',
    });
    
    // Test that users can only access their organization's courses
    const user1Courses = await prisma.course.findMany({
      where: {
        organizationId: org1.id,
      },
    });
    
    const user2Courses = await prisma.course.findMany({
      where: {
        organizationId: org2.id,
      },
    });
    
    return {
      org1,
      org2,
      user1,
      user2,
      course1,
      course2,
      user1Courses,
      user2Courses,
    };
  }

  // Test role-based access control
  static async testRoleBasedAccess() {
    const org = await TestDataFactory.createOrganization();
    
    const admin = await TestDataFactory.createUser({
      organizationId: org.id,
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    });
    
    const instructor = await TestDataFactory.createUser({
      organizationId: org.id,
      role: UserRole.INSTRUCTOR,
      email: 'instructor@test.com',
    });
    
    const student = await TestDataFactory.createUser({
      organizationId: org.id,
      role: UserRole.STUDENT,
      email: 'student@test.com',
    });
    
    const course = await TestDataFactory.createCourse({ organizationId: org.id });
    
    return {
      org,
      admin,
      instructor,
      student,
      course,
    };
  }

  // Test course completion flow
  static async testCourseCompletionFlow() {
    const org = await TestDataFactory.createOrganization();
    const user = await TestDataFactory.createUser({ organizationId: org.id });
    const course = await TestDataFactory.createCourse({ organizationId: org.id });
    
    // Create course with multiple modules and lessons
    const module1 = await prisma.module.create({
      data: {
        title: 'Module 1',
        order: 1,
        courseId: course.id,
      },
    });
    
    const module2 = await prisma.module.create({
      data: {
        title: 'Module 2',
        order: 2,
        courseId: course.id,
      },
    });
    
    const lesson1 = await prisma.lesson.create({
      data: {
        title: 'Lesson 1',
        content: 'Content 1',
        type: LessonType.TEXT,
        order: 1,
        moduleId: module1.id,
      },
    });
    
    const lesson2 = await prisma.lesson.create({
      data: {
        title: 'Lesson 2',
        content: 'Content 2',
        type: LessonType.TEXT,
        order: 1,
        moduleId: module2.id,
      },
    });
    
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        organizationId: user.organizationId,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    
    // Complete all lessons
    const progress1 = await prisma.progress.create({
      data: {
        userId: user.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    
    const progress2 = await prisma.progress.create({
      data: {
        userId: user.id,
        lessonId: lesson2.id,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    
    return {
      org,
      user,
      course,
      module1,
      module2,
      lesson1,
      lesson2,
      enrollment,
      progress1,
      progress2,
    };
  }
}

// Test assertions
export class TestAssertions {
  static assertOrganizationIsolation(data: any) {
    expect(data.user1Courses).toHaveLength(1);
    expect(data.user1Courses[0].id).toBe(data.course1.id);
    expect(data.user2Courses).toHaveLength(1);
    expect(data.user2Courses[0].id).toBe(data.course2.id);
  }

  static assertRolePermissions(data: any) {
    expect(data.admin.role).toBe(UserRole.ADMIN);
    expect(data.instructor.role).toBe(UserRole.INSTRUCTOR);
    expect(data.student.role).toBe(UserRole.STUDENT);
  }

  static assertCourseStructure(data: any) {
    expect(data.course).toBeDefined();
    expect(data.module).toBeDefined();
    expect(data.lesson).toBeDefined();
    expect(data.quiz).toBeDefined();
    expect(data.enrollment).toBeDefined();
    expect(data.progress).toBeDefined();
  }

  static assertProgressTracking(data: any) {
    expect(data.progress1.status).toBe(ProgressStatus.COMPLETED);
    expect(data.progress2.status).toBe(ProgressStatus.COMPLETED);
    expect(data.progress1.completedAt).toBeDefined();
    expect(data.progress2.completedAt).toBeDefined();
  }
}

// Export test utilities
export {
  prisma as testDb,
};
