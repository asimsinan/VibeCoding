import { PrismaClient, UserRole, EnrollmentStatus, CourseStatus } from '../src/generated/prisma';
import { enrollmentService } from '../src/services/enrollment.service';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('EnrollmentService', () => {
  let prisma: PrismaClient;
  let organization: any;
  let course: any;
  let module: any;
  let lesson: any;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;
  let otherStudentUser: any;

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
  });

  afterAll(async () => {
    await TestCleanup.cleanupAll();
    await prisma.$disconnect();
  });

  describe('Student Enrollment', () => {
    it('should enroll a student in a course successfully', async () => {
      const enrollment = await enrollmentService.enrollStudent(
        course.id,
        studentUser.id,
        adminUser.id
      );

      expect(enrollment).toBeDefined();
      expect(enrollment.userId).toBe(studentUser.id);
      expect(enrollment.courseId).toBe(course.id);
      expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
      expect(enrollment.enrolledAt).toBeDefined();
    });

    it('should allow students to self-enroll', async () => {
      const enrollment = await enrollmentService.enrollStudent(
        course.id,
        studentUser.id,
        studentUser.id
      );

      expect(enrollment).toBeDefined();
      expect(enrollment.userId).toBe(studentUser.id);
      expect(enrollment.courseId).toBe(course.id);
      expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
    });

    it('should prevent duplicate enrollments', async () => {
      // First enrollment
      await enrollmentService.enrollStudent(
        course.id,
        studentUser.id,
        adminUser.id
      );

      // Attempt duplicate enrollment
      await expect(
        enrollmentService.enrollStudent(
          course.id,
          studentUser.id,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent enrolling in unpublished courses', async () => {
      const draftCourse = await TestDataFactory.createCourse({
        organizationId: organization.id,
        status: CourseStatus.DRAFT,
      });

      await expect(
        enrollmentService.enrollStudent(
          draftCourse.id,
          studentUser.id,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent non-students from being enrolled', async () => {
      await expect(
        enrollmentService.enrollStudent(
          course.id,
          adminUser.id, // Admin user, not student
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent cross-organization enrollments', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherCourse = await TestDataFactory.createCourse({
        organizationId: otherOrg.id,
        status: CourseStatus.PUBLISHED,
      });

      await expect(
        enrollmentService.enrollStudent(
          otherCourse.id,
          studentUser.id,
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Enrollment Retrieval', () => {
    let enrollment: any;

    beforeEach(async () => {
      enrollment = await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course.id,
        organizationId: organization.id,
      });
    });

    it('should get enrollment by ID', async () => {
      const retrievedEnrollment = await enrollmentService.getEnrollmentById(
        enrollment.id,
        adminUser.id
      );

      expect(retrievedEnrollment).toBeDefined();
      expect(retrievedEnrollment.id).toBe(enrollment.id);
      expect(retrievedEnrollment.userId).toBe(studentUser.id);
      expect(retrievedEnrollment.courseId).toBe(course.id);
    });

    it('should allow students to view their own enrollments', async () => {
      const retrievedEnrollment = await enrollmentService.getEnrollmentById(
        enrollment.id,
        studentUser.id
      );

      expect(retrievedEnrollment).toBeDefined();
      expect(retrievedEnrollment.id).toBe(enrollment.id);
    });

    it('should prevent students from viewing other students\' enrollments', async () => {
      await expect(
        enrollmentService.getEnrollmentById(
          enrollment.id,
          otherStudentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should get course enrollments', async () => {
      const enrollments = await enrollmentService.getCourseEnrollments(
        course.id,
        adminUser.id,
        1,
        10
      );

      expect(enrollments).toBeDefined();
      expect(enrollments.data).toHaveLength(1);
      expect(enrollments.data[0].id).toBe(enrollment.id);
      expect(enrollments.total).toBe(1);
    });

    it('should get student enrollments', async () => {
      const enrollments = await enrollmentService.getStudentEnrollments(
        studentUser.id,
        adminUser.id,
        1,
        10
      );

      expect(enrollments).toBeDefined();
      expect(enrollments.data).toHaveLength(1);
      expect(enrollments.data[0].id).toBe(enrollment.id);
      expect(enrollments.total).toBe(1);
    });

    it('should support pagination', async () => {
      // Create multiple enrollments
      const course2 = await TestDataFactory.createCourse({
        organizationId: organization.id,
        status: CourseStatus.PUBLISHED,
      });
      await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course2.id,
        organizationId: organization.id,
      });

      const page1 = await enrollmentService.getStudentEnrollments(
        studentUser.id,
        adminUser.id,
        1,
        1
      );

      expect(page1.data).toHaveLength(1);
      expect(page1.total).toBe(2);
      expect(page1.totalPages).toBe(2);

      const page2 = await enrollmentService.getStudentEnrollments(
        studentUser.id,
        adminUser.id,
        2,
        1
      );

      expect(page2.data).toHaveLength(1);
      expect(page2.total).toBe(2);
      expect(page2.totalPages).toBe(2);
    });
  });

  describe('Enrollment Status Management', () => {
    let enrollment: any;

    beforeEach(async () => {
      enrollment = await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course.id,
        organizationId: organization.id,
        status: EnrollmentStatus.ACTIVE,
      });
    });

    it('should update enrollment status to completed', async () => {
      const updatedEnrollment = await enrollmentService.updateEnrollmentStatus(
        enrollment.id,
        EnrollmentStatus.COMPLETED,
        adminUser.id
      );

      expect(updatedEnrollment.status).toBe(EnrollmentStatus.COMPLETED);
      expect(updatedEnrollment.completedAt).toBeDefined();
    });

    it('should update enrollment status to cancelled', async () => {
      const updatedEnrollment = await enrollmentService.updateEnrollmentStatus(
        enrollment.id,
        EnrollmentStatus.CANCELLED,
        adminUser.id
      );

      expect(updatedEnrollment.status).toBe(EnrollmentStatus.CANCELLED);
    });

    it('should prevent invalid status transitions', async () => {
      // First complete the enrollment
      await enrollmentService.updateEnrollmentStatus(
        enrollment.id,
        EnrollmentStatus.COMPLETED,
        adminUser.id
      );

      // Try to change from completed to active (invalid)
      await expect(
        enrollmentService.updateEnrollmentStatus(
          enrollment.id,
          EnrollmentStatus.ACTIVE,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should allow reactivating cancelled enrollments', async () => {
      // First cancel the enrollment
      await enrollmentService.updateEnrollmentStatus(
        enrollment.id,
        EnrollmentStatus.CANCELLED,
        adminUser.id
      );

      // Reactivate it
      const reactivatedEnrollment = await enrollmentService.updateEnrollmentStatus(
        enrollment.id,
        EnrollmentStatus.ACTIVE,
        adminUser.id
      );

      expect(reactivatedEnrollment.status).toBe(EnrollmentStatus.ACTIVE);
    });

    it('should prevent students from updating enrollment status', async () => {
      await expect(
        enrollmentService.updateEnrollmentStatus(
          enrollment.id,
          EnrollmentStatus.COMPLETED,
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Enrollment Cancellation', () => {
    let enrollment: any;

    beforeEach(async () => {
      enrollment = await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course.id,
        organizationId: organization.id,
        status: EnrollmentStatus.ACTIVE,
      });
    });

    it('should cancel enrollment successfully', async () => {
      const result = await enrollmentService.cancelEnrollment(
        enrollment.id,
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify status was updated
      const updatedEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollment.id },
      });
      expect(updatedEnrollment?.status).toBe(EnrollmentStatus.CANCELLED);
    });

    it('should allow students to cancel their own enrollments', async () => {
      const result = await enrollmentService.cancelEnrollment(
        enrollment.id,
        studentUser.id
      );

      expect(result.success).toBe(true);
    });

    it('should prevent students from cancelling other students\' enrollments', async () => {
      await expect(
        enrollmentService.cancelEnrollment(
          enrollment.id,
          otherStudentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cancelling completed enrollments', async () => {
      // First complete the enrollment
      await enrollmentService.updateEnrollmentStatus(
        enrollment.id,
        EnrollmentStatus.COMPLETED,
        adminUser.id
      );

      // Try to cancel it
      await expect(
        enrollmentService.cancelEnrollment(
          enrollment.id,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Enrollment Statistics', () => {
    beforeEach(async () => {
      // Create multiple enrollments with different statuses
      await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course.id,
        organizationId: organization.id,
        status: EnrollmentStatus.ACTIVE,
      });

      const course2 = await TestDataFactory.createCourse({
        organizationId: organization.id,
        status: CourseStatus.PUBLISHED,
      });

      await TestDataFactory.createEnrollment({
        userId: otherStudentUser.id,
        courseId: course2.id,
        organizationId: organization.id,
        status: EnrollmentStatus.COMPLETED,
      });

      const course3 = await TestDataFactory.createCourse({
        organizationId: organization.id,
        status: CourseStatus.PUBLISHED,
      });

      await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course3.id,
        organizationId: organization.id,
        status: EnrollmentStatus.CANCELLED,
      });
    });

    it('should get enrollment statistics', async () => {
      const stats = await enrollmentService.getEnrollmentStats(
        organization.id,
        adminUser.id
      );

      expect(stats.totalEnrollments).toBe(3);
      expect(stats.activeEnrollments).toBe(1);
      expect(stats.completedEnrollments).toBe(1);
      expect(stats.cancelledEnrollments).toBe(1);
      expect(stats.completionRate).toBe(33); // 1/3 * 100 = 33%
    });

    it('should get organization-specific statistics', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });

      const otherCourse = await TestDataFactory.createCourse({
        organizationId: otherOrg.id,
        status: CourseStatus.PUBLISHED,
      });

      await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: otherCourse.id,
        organizationId: otherOrg.id,
        status: EnrollmentStatus.ACTIVE,
      });

      // Get stats for original organization only
      const stats = await enrollmentService.getEnrollmentStats(
        organization.id,
        adminUser.id
      );

      expect(stats.totalEnrollments).toBe(3); // Should not include other org's enrollment
    });

    it('should prevent non-admins from viewing cross-organization stats', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });

      await expect(
        enrollmentService.getEnrollmentStats(
          otherOrg.id,
          instructorUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Access Control', () => {
    let otherOrganization: any;
    let otherUser: any;
    let enrollment: any;

    beforeEach(async () => {
      otherOrganization = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      otherUser = await TestDataFactory.createUser({
        organizationId: otherOrganization.id,
        role: UserRole.ADMIN,
      });
      enrollment = await TestDataFactory.createEnrollment({
        userId: studentUser.id,
        courseId: course.id,
        organizationId: organization.id,
      });
    });

    it('should prevent cross-organization access to enrollments', async () => {
      await expect(
        enrollmentService.getEnrollmentById(enrollment.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization enrollment updates', async () => {
      await expect(
        enrollmentService.updateEnrollmentStatus(
          enrollment.id,
          EnrollmentStatus.COMPLETED,
          otherUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization enrollment cancellation', async () => {
      await expect(
        enrollmentService.cancelEnrollment(enrollment.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
