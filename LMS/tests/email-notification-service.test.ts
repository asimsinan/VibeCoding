import { PrismaClient, UserRole, CourseStatus, EnrollmentStatus } from '@prisma/client';
import { emailNotificationService } from '@/services/email-notification.service';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';

describe('EmailNotificationService', () => {
  let prisma: PrismaClient;
  let organization: any;
  let course: any;
  let module: any;
  let lesson: any;
  let quiz: any;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;
  let otherStudentUser: any;
  let enrollment: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await TestCleanup.cleanupAll();
  });

  beforeEach(async () => {
    await TestCleanup.cleanupAll();
    
    // Create test data
    organization = await TestDataFactory.createOrganization();
    course = await TestDataFactory.createCourse({ 
      organizationId: organization.id,
      status: CourseStatus.PUBLISHED,
    });
    module = await TestDataFactory.createModule({ courseId: course.id });
    lesson = await TestDataFactory.createLesson({ moduleId: module.id });
    quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });
    
    adminUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.ADMIN,
    });
    
    instructorUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.INSTRUCTOR,
    });
    
    studentUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.STUDENT,
    });

    otherStudentUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.STUDENT,
    });

    // Create enrollment
    enrollment = await TestDataFactory.createEnrollment({
      userId: studentUser.id,
      courseId: course.id,
      organizationId: organization.id,
      status: EnrollmentStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    await TestCleanup.cleanupAll();
    await prisma.$disconnect();
  });

  describe('Email Sending', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: [{ email: studentUser.email, name: studentUser.name }],
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        text: 'Test',
      };

      const result = await emailNotificationService.sendEmail(emailData, adminUser.id);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should allow instructors to send emails', async () => {
      const emailData = {
        to: [{ email: studentUser.email, name: studentUser.name }],
        subject: 'Instructor Email',
        html: '<h1>From Instructor</h1>',
        text: 'From Instructor',
      };

      const result = await emailNotificationService.sendEmail(emailData, instructorUser.id);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should prevent students from sending emails', async () => {
      const emailData = {
        to: [{ email: adminUser.email, name: adminUser.name }],
        subject: 'Student Email',
        html: '<h1>From Student</h1>',
        text: 'From Student',
      };

      await expect(
        emailNotificationService.sendEmail(emailData, studentUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate email data', async () => {
      const invalidEmailData = {
        to: [],
        subject: '',
        html: '',
        text: '',
      };

      await expect(
        emailNotificationService.sendEmail(invalidEmailData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate email addresses', async () => {
      const emailData = {
        to: [{ email: 'invalid-email', name: 'Test User' }],
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        text: 'Test',
      };

      await expect(
        emailNotificationService.sendEmail(emailData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should require either HTML or text content', async () => {
      const emailData = {
        to: [{ email: studentUser.email, name: studentUser.name }],
        subject: 'Test Email',
        html: '',
        text: '',
      };

      await expect(
        emailNotificationService.sendEmail(emailData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should support CC and BCC recipients', async () => {
      const emailData = {
        to: [{ email: studentUser.email, name: studentUser.name }],
        cc: [{ email: instructorUser.email, name: instructorUser.name }],
        bcc: [{ email: adminUser.email, name: adminUser.name }],
        subject: 'Test Email with CC/BCC',
        html: '<h1>Test</h1>',
        text: 'Test',
      };

      const result = await emailNotificationService.sendEmail(emailData, adminUser.id);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Event Notifications', () => {
    it('should send user welcome notification', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'user_welcome',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {},
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send course enrollment notification', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'course_enrollment',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            course: {
              title: course.title,
              description: course.description,
            },
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send quiz completion notification', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'quiz_completion',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            quiz: {
              title: quiz.title,
            },
            score: 85,
            passed: true,
            feedback: 'Great job!',
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send course completion notification', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'course_completion',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            course: {
              title: course.title,
            },
            completionDate: new Date().toISOString(),
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send password reset notification', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'password_reset',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            resetLink: 'https://example.com/reset?token=abc123',
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should prevent sending notifications for non-existent users', async () => {
      await expect(
        emailNotificationService.sendEventNotification(
          {
            type: 'user_welcome',
            userId: 'non-existent-id',
            organizationId: organization.id,
            data: {},
          },
          adminUser.id
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should prevent sending notifications for non-existent organizations', async () => {
      await expect(
        emailNotificationService.sendEventNotification(
          {
            type: 'user_welcome',
            userId: studentUser.id,
            organizationId: 'non-existent-id',
            data: {},
          },
          adminUser.id
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should prevent sending notifications for unsupported event types', async () => {
      await expect(
        emailNotificationService.sendEventNotification(
          {
            type: 'unsupported_event',
            userId: studentUser.id,
            organizationId: organization.id,
            data: {},
          },
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Bulk Notifications', () => {
    it('should send bulk notifications successfully', async () => {
      const result = await emailNotificationService.sendBulkNotifications(
        'user_welcome',
        [studentUser.id, otherStudentUser.id],
        organization.id,
        {},
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });

    it('should handle partial failures in bulk notifications', async () => {
      const result = await emailNotificationService.sendBulkNotifications(
        'user_welcome',
        [studentUser.id, 'non-existent-id', otherStudentUser.id],
        organization.id,
        {},
        adminUser.id
      );

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(2);
      expect(result.failedCount).toBe(1);
    });

    it('should allow instructors to send bulk notifications', async () => {
      const result = await emailNotificationService.sendBulkNotifications(
        'course_enrollment',
        [studentUser.id],
        organization.id,
        {
          course: {
            title: course.title,
            description: course.description,
          },
        },
        instructorUser.id
      );

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(result.failedCount).toBe(0);
    });

    it('should prevent students from sending bulk notifications', async () => {
      await expect(
        emailNotificationService.sendBulkNotifications(
          'user_welcome',
          [adminUser.id],
          organization.id,
          {},
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate bulk notification data', async () => {
      await expect(
        emailNotificationService.sendBulkNotifications(
          'user_welcome',
          [],
          organization.id,
          {},
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Notification History', () => {
    beforeEach(async () => {
      // Send some test notifications
      const emailData = {
        to: [{ email: studentUser.email, name: studentUser.name }],
        subject: 'Test Email 1',
        html: '<h1>Test 1</h1>',
        text: 'Test 1',
      };

      await emailNotificationService.sendEmail(emailData, adminUser.id);

      const emailData2 = {
        to: [{ email: otherStudentUser.email, name: otherStudentUser.name }],
        subject: 'Test Email 2',
        html: '<h1>Test 2</h1>',
        text: 'Test 2',
      };

      await emailNotificationService.sendEmail(emailData2, adminUser.id);
    });

    it('should get notification history', async () => {
      const history = await emailNotificationService.getNotificationHistory(
        organization.id,
        adminUser.id,
        1,
        10
      );

      expect(history).toBeDefined();
      expect(history.data).toHaveLength(2);
      expect(history.total).toBe(2);
      expect(history.data[0].subject).toBe('Test Email 2'); // Most recent first
    });

    it('should support pagination', async () => {
      const page1 = await emailNotificationService.getNotificationHistory(
        organization.id,
        adminUser.id,
        1,
        1
      );

      expect(page1.data).toHaveLength(1);
      expect(page1.total).toBe(2);
      expect(page1.totalPages).toBe(2);

      const page2 = await emailNotificationService.getNotificationHistory(
        organization.id,
        adminUser.id,
        2,
        1
      );

      expect(page2.data).toHaveLength(1);
      expect(page2.total).toBe(2);
      expect(page2.totalPages).toBe(2);
    });

    it('should prevent non-admins from viewing notification history', async () => {
      await expect(
        emailNotificationService.getNotificationHistory(
          organization.id,
          instructorUser.id,
          1,
          10
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization access to notification history', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherUser = await TestDataFactory.createUser({
        organizationId: otherOrg.id,
        role: UserRole.ADMIN,
      });

      await expect(
        emailNotificationService.getNotificationHistory(
          organization.id,
          otherUser.id,
          1,
          10
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Template Rendering', () => {
    it('should render templates with user data', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'user_welcome',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {},
        },
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify the notification was logged with rendered content
      const notification = await prisma.emailNotification.findFirst({
        where: { sentBy: adminUser.id },
        orderBy: { sentAt: 'desc' },
      });

      expect(notification).toBeDefined();
      expect(notification?.subject).toContain(organization.name);
      expect(notification?.html).toContain(studentUser.name);
    });

    it('should render templates with course data', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'course_enrollment',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            course: {
              title: course.title,
              description: course.description,
            },
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify the notification was logged with rendered content
      const notification = await prisma.emailNotification.findFirst({
        where: { sentBy: adminUser.id },
        orderBy: { sentAt: 'desc' },
      });

      expect(notification).toBeDefined();
      expect(notification?.subject).toContain(course.title);
      expect(notification?.html).toContain(course.description);
    });

    it('should render templates with quiz data', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'quiz_completion',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            quiz: {
              title: quiz.title,
            },
            score: 85,
            passed: true,
            feedback: 'Great job!',
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify the notification was logged with rendered content
      const notification = await prisma.emailNotification.findFirst({
        where: { sentBy: adminUser.id },
        orderBy: { sentAt: 'desc' },
      });

      expect(notification).toBeDefined();
      expect(notification?.subject).toContain(quiz.title);
      expect(notification?.html).toContain('85%');
      expect(notification?.html).toContain('Passed');
      expect(notification?.html).toContain('Great job!');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty notification history', async () => {
      const emptyOrg = await TestDataFactory.createOrganization({
        domain: 'empty.com',
      });

      const history = await emailNotificationService.getNotificationHistory(
        emptyOrg.id,
        adminUser.id,
        1,
        10
      );

      expect(history.data).toHaveLength(0);
      expect(history.total).toBe(0);
    });

    it('should handle missing template variables gracefully', async () => {
      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'user_welcome',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            // Missing some expected data
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
    });

    it('should handle special characters in template data', async () => {
      const specialCourse = await TestDataFactory.createCourse({
        organizationId: organization.id,
        title: 'Course with "Special" Characters & Symbols',
        description: 'Description with <script>alert("test")</script>',
        status: CourseStatus.PUBLISHED,
      });

      const result = await emailNotificationService.sendEventNotification(
        {
          type: 'course_enrollment',
          userId: studentUser.id,
          organizationId: organization.id,
          data: {
            course: {
              title: specialCourse.title,
              description: specialCourse.description,
            },
          },
        },
        adminUser.id
      );

      expect(result.success).toBe(true);
    });
  });
});
