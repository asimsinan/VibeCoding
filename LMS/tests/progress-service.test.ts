import { PrismaClient, UserRole, ProgressStatus, CourseStatus, EnrollmentStatus } from '../src/generated/prisma';
import { progressService } from '../src/services/progress.service';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('ProgressService', () => {
  let prisma: PrismaClient;
  let organization: any;
  let course: any;
  let module: any;
  let lesson1: any;
  let lesson2: any;
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
    lesson1 = await TestDataFactory.createLesson({ moduleId: module.id, order: 1 });
    lesson2 = await TestDataFactory.createLesson({ moduleId: module.id, order: 2 });
    
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

  describe('Lesson Completion Recording', () => {
    it('should record lesson completion successfully', async () => {
      const progress = await progressService.recordLessonCompletion(
        lesson1.id,
        studentUser.id,
        adminUser.id
      );

      expect(progress).toBeDefined();
      expect(progress.userId).toBe(studentUser.id);
      expect(progress.lessonId).toBe(lesson1.id);
      expect(progress.status).toBe(ProgressStatus.COMPLETED);
      expect(progress.completedAt).toBeDefined();
    });

    it('should allow students to complete lessons for themselves', async () => {
      const progress = await progressService.recordLessonCompletion(
        lesson1.id,
        studentUser.id,
        studentUser.id
      );

      expect(progress).toBeDefined();
      expect(progress.userId).toBe(studentUser.id);
      expect(progress.lessonId).toBe(lesson1.id);
      expect(progress.status).toBe(ProgressStatus.COMPLETED);
    });

    it('should update existing progress when lesson is completed again', async () => {
      // First completion
      const firstProgress = await progressService.recordLessonCompletion(
        lesson1.id,
        studentUser.id,
        adminUser.id
      );

      // Second completion (should update existing record)
      const secondProgress = await progressService.recordLessonCompletion(
        lesson1.id,
        studentUser.id,
        adminUser.id
      );

      expect(secondProgress.id).toBe(firstProgress.id);
      expect(secondProgress.status).toBe(ProgressStatus.COMPLETED);
    });

    it('should prevent students from completing lessons for other students', async () => {
      await expect(
        progressService.recordLessonCompletion(
          lesson1.id,
          otherStudentUser.id,
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent completion without enrollment', async () => {
      // Create a student without enrollment
      const unenrolledStudent = await TestDataFactory.createUser({
        organizationId: organization.id,
        role: UserRole.STUDENT,
      });

      await expect(
        progressService.recordLessonCompletion(
          lesson1.id,
          unenrolledStudent.id,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent completion for cancelled enrollment', async () => {
      // Cancel the enrollment
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: EnrollmentStatus.CANCELLED },
      });

      await expect(
        progressService.recordLessonCompletion(
          lesson1.id,
          studentUser.id,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Progress Retrieval', () => {
    let progress: any;

    beforeEach(async () => {
      progress = await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
      });
    });

    it('should get progress by ID', async () => {
      const retrievedProgress = await progressService.getProgressById(
        progress.id,
        adminUser.id
      );

      expect(retrievedProgress).toBeDefined();
      expect(retrievedProgress.id).toBe(progress.id);
      expect(retrievedProgress.userId).toBe(studentUser.id);
      expect(retrievedProgress.lessonId).toBe(lesson1.id);
    });

    it('should allow students to view their own progress', async () => {
      const retrievedProgress = await progressService.getProgressById(
        progress.id,
        studentUser.id
      );

      expect(retrievedProgress).toBeDefined();
      expect(retrievedProgress.id).toBe(progress.id);
    });

    it('should prevent students from viewing other students\' progress', async () => {
      await expect(
        progressService.getProgressById(
          progress.id,
          otherStudentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should get course progress', async () => {
      // Create another lesson completion
      await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson2.id,
        status: ProgressStatus.COMPLETED,
      });

      const courseProgress = await progressService.getCourseProgress(
        course.id,
        studentUser.id,
        adminUser.id
      );

      expect(courseProgress).toBeDefined();
      expect(courseProgress.courseId).toBe(course.id);
      expect(courseProgress.userId).toBe(studentUser.id);
      expect(courseProgress.totalLessons).toBe(2);
      expect(courseProgress.completedLessons).toBe(2);
      expect(courseProgress.completionPercentage).toBe(100);
      expect(courseProgress.progress).toHaveLength(2);
    });

    it('should get user progress with pagination', async () => {
      // Create multiple progress records
      await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson2.id,
        status: ProgressStatus.COMPLETED,
      });

      const userProgress = await progressService.getUserProgress(
        studentUser.id,
        adminUser.id,
        1,
        1
      );

      expect(userProgress).toBeDefined();
      expect(userProgress.data).toHaveLength(1);
      expect(userProgress.total).toBe(2);
      expect(userProgress.totalPages).toBe(2);
    });
  });

  describe('Course Progress Statistics', () => {
    beforeEach(async () => {
      // Create multiple enrollments and progress records
      const student2 = await TestDataFactory.createUser({
        organizationId: organization.id,
        role: UserRole.STUDENT,
      });

      const student3 = await TestDataFactory.createUser({
        organizationId: organization.id,
        role: UserRole.STUDENT,
      });

      // Create enrollments
      await TestDataFactory.createEnrollment({
        userId: student2.id,
        courseId: course.id,
        organizationId: organization.id,
        status: EnrollmentStatus.ACTIVE,
      });

      await TestDataFactory.createEnrollment({
        userId: student3.id,
        courseId: course.id,
        organizationId: organization.id,
        status: EnrollmentStatus.ACTIVE,
      });

      // Create progress records
      await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
      });

      await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson2.id,
        status: ProgressStatus.COMPLETED,
      });

      await TestDataFactory.createProgress({
        userId: student2.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
      });

      await TestDataFactory.createProgress({
        userId: student3.id,
        lessonId: lesson1.id,
        status: ProgressStatus.IN_PROGRESS,
      });
    });

    it('should get course progress statistics', async () => {
      const stats = await progressService.getCourseProgressStats(
        course.id,
        adminUser.id
      );

      expect(stats).toBeDefined();
      expect(stats.totalEnrollments).toBe(3);
      expect(stats.totalLessons).toBe(2);
      expect(stats.completionDistribution.completed).toBe(3); // 2 from student1 + 1 from student2
      expect(stats.completionDistribution.inProgress).toBe(1); // 1 from student3
      expect(stats.averageCompletion).toBeGreaterThan(0);
    });

    it('should prevent students from viewing course statistics', async () => {
      await expect(
        progressService.getCourseProgressStats(
          course.id,
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Progress Reset', () => {
    let progress: any;

    beforeEach(async () => {
      progress = await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
      });
    });

    it('should reset lesson progress successfully', async () => {
      const result = await progressService.resetLessonProgress(
        lesson1.id,
        studentUser.id,
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify progress was deleted
      const deletedProgress = await prisma.progress.findUnique({
        where: { id: progress.id },
      });
      expect(deletedProgress).toBeNull();
    });

    it('should prevent students from resetting progress', async () => {
      await expect(
        progressService.resetLessonProgress(
          lesson1.id,
          studentUser.id,
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should handle resetting non-existent progress gracefully', async () => {
      const result = await progressService.resetLessonProgress(
        lesson2.id, // No progress record for this lesson
        studentUser.id,
        adminUser.id
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Access Control', () => {
    let otherOrganization: any;
    let otherUser: any;
    let progress: any;

    beforeEach(async () => {
      otherOrganization = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      otherUser = await TestDataFactory.createUser({
        organizationId: otherOrganization.id,
        role: UserRole.ADMIN,
      });
      progress = await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
      });
    });

    it('should prevent cross-organization access to progress', async () => {
      await expect(
        progressService.getProgressById(progress.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization progress recording', async () => {
      await expect(
        progressService.recordLessonCompletion(
          lesson1.id,
          studentUser.id,
          otherUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization progress reset', async () => {
      await expect(
        progressService.resetLessonProgress(
          lesson1.id,
          studentUser.id,
          otherUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle course with no lessons', async () => {
      const emptyCourse = await TestDataFactory.createCourse({
        organizationId: organization.id,
        status: CourseStatus.PUBLISHED,
      });

      const courseProgress = await progressService.getCourseProgress(
        emptyCourse.id,
        studentUser.id,
        adminUser.id
      );

      expect(courseProgress.totalLessons).toBe(0);
      expect(courseProgress.completedLessons).toBe(0);
      expect(courseProgress.completionPercentage).toBe(0);
    });

    it('should handle user with no progress', async () => {
      const userProgress = await progressService.getUserProgress(
        otherStudentUser.id,
        adminUser.id,
        1,
        10
      );

      expect(userProgress.data).toHaveLength(0);
      expect(userProgress.total).toBe(0);
    });

    it('should calculate completion percentage correctly', async () => {
      // Complete only 1 out of 2 lessons
      await TestDataFactory.createProgress({
        userId: studentUser.id,
        lessonId: lesson1.id,
        status: ProgressStatus.COMPLETED,
      });

      const courseProgress = await progressService.getCourseProgress(
        course.id,
        studentUser.id,
        adminUser.id
      );

      expect(courseProgress.completionPercentage).toBe(50); // 1/2 * 100 = 50%
    });
  });
});
