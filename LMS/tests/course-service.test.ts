import { PrismaClient, UserRole, CourseStatus } from '../src/generated/prisma';
import { CourseService } from '../src/services/course.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('CourseService', () => {
  let prisma: PrismaClient;
  let courseService: CourseService;
  let testOrganization: any;
  let testUser: any;
  let adminUser: any;
  let instructorUser: any;
  let testCourse: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    courseService = new CourseService(prisma);
  });

  beforeEach(async () => {
    // Clean up existing data
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
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test-org.com',
        settings: { theme: 'blue' },
      },
    });

    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'student@test-org.com',
        name: 'Test Student',
        role: UserRole.STUDENT,
        organizationId: testOrganization.id,
      },
    });

    instructorUser = await prisma.user.create({
      data: {
        email: 'instructor@test-org.com',
        name: 'Test Instructor',
        role: UserRole.INSTRUCTOR,
        organizationId: testOrganization.id,
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@system.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        organizationId: testOrganization.id,
      },
    });

    // Create test course
    testCourse = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'A test course',
        status: CourseStatus.DRAFT,
        organizationId: testOrganization.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createCourse', () => {
    it('should create a new course successfully', async () => {
      const data = {
        title: 'New Course',
        description: 'A new course description',
        status: CourseStatus.DRAFT,
      };

      const course = await courseService.createCourse(data, instructorUser.id);

      expect(course).toBeDefined();
      expect(course.title).toBe(data.title);
      expect(course.description).toBe(data.description);
      expect(course.status).toBe(data.status);
      expect(course.organizationId).toBe(testOrganization.id);
    });

    it('should throw ForbiddenError for student creating course', async () => {
      const data = {
        title: 'Student Course',
        description: 'A course by student',
      };

      await expect(
        courseService.createCourse(data, testUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should create course with default status', async () => {
      const data = {
        title: 'Default Status Course',
        description: 'A course with default status',
      };

      const course = await courseService.createCourse(data, instructorUser.id);

      expect(course).toBeDefined();
      expect(course.status).toBe(CourseStatus.DRAFT);
    });
  });

  describe('getCourseById', () => {
    it('should get course by ID successfully', async () => {
      const course = await courseService.getCourseById(testCourse.id, testUser.id);

      expect(course).toBeDefined();
      expect(course.id).toBe(testCourse.id);
      expect(course.title).toBe(testCourse.title);
      expect(course.organization).toBeDefined();
      expect(course.modules).toBeDefined();
      expect(course._count).toBeDefined();
    });

    it('should allow admin to view any course', async () => {
      const course = await courseService.getCourseById(testCourse.id, adminUser.id);

      expect(course).toBeDefined();
      expect(course.id).toBe(testCourse.id);
    });

    it('should throw ForbiddenError for user from different organization', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          domain: 'other-org.com',
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other-org.com',
          name: 'Other User',
          role: UserRole.STUDENT,
          organizationId: otherOrg.id,
        },
      });

      await expect(
        courseService.getCourseById(testCourse.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent course', async () => {
      await expect(
        courseService.getCourseById('non-existent-id', adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCoursesByOrganization', () => {
    it('should get courses by organization successfully', async () => {
      const result = await courseService.getCoursesByOrganization(
        testOrganization.id,
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.courses).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('should filter courses by status', async () => {
      const result = await courseService.getCoursesByOrganization(
        testOrganization.id,
        adminUser.id,
        1,
        10,
        CourseStatus.DRAFT
      );

      expect(result).toBeDefined();
      expect(result.courses).toBeDefined();
      expect(result.courses.every(course => course.status === CourseStatus.DRAFT)).toBe(true);
    });

    it('should throw ForbiddenError for user from different organization', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          domain: 'other-org.com',
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other-org.com',
          name: 'Other User',
          role: UserRole.STUDENT,
          organizationId: otherOrg.id,
        },
      });

      await expect(
        courseService.getCoursesByOrganization(testOrganization.id, otherUser.id, 1, 10)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateCourse', () => {
    it('should update course successfully', async () => {
      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated description',
      };

      const course = await courseService.updateCourse(
        testCourse.id,
        updateData,
        instructorUser.id
      );

      expect(course).toBeDefined();
      expect(course.title).toBe(updateData.title);
      expect(course.description).toBe(updateData.description);
    });

    it('should throw ForbiddenError for student updating course', async () => {
      const updateData = {
        title: 'Student Updated Course',
      };

      await expect(
        courseService.updateCourse(testCourse.id, updateData, testUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for unauthorized update', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          domain: 'other-org.com',
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other-org.com',
          name: 'Other User',
          role: UserRole.INSTRUCTOR,
          organizationId: otherOrg.id,
        },
      });

      const updateData = {
        title: 'Unauthorized Update',
      };

      await expect(
        courseService.updateCourse(testCourse.id, updateData, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteCourse', () => {
    it('should delete course successfully', async () => {
      const result = await courseService.deleteCourse(testCourse.id, adminUser.id);

      expect(result.success).toBe(true);

      // Verify course is deleted
      const deletedCourse = await prisma.course.findUnique({
        where: { id: testCourse.id },
      });
      expect(deletedCourse).toBeNull();
    });

    it('should throw ForbiddenError for instructor deleting course', async () => {
      await expect(
        courseService.deleteCourse(testCourse.id, instructorUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError for course with enrollments', async () => {
      // Create enrollment
      await prisma.enrollment.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          organizationId: testOrganization.id,
          status: 'ACTIVE',
        },
      });

      await expect(
        courseService.deleteCourse(testCourse.id, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('publishCourse', () => {
    it('should publish course successfully', async () => {
      // Create modules and lessons for the course
      const module = await prisma.module.create({
        data: {
          title: 'Test Module',
          order: 1,
          courseId: testCourse.id,
        },
      });

      await prisma.lesson.create({
        data: {
          title: 'Test Lesson',
          content: 'Lesson content',
          order: 1,
          moduleId: module.id,
        },
      });

      const course = await courseService.publishCourse(testCourse.id, instructorUser.id);

      expect(course).toBeDefined();
      expect(course.status).toBe(CourseStatus.PUBLISHED);
    });

    it('should throw ValidationError for course without modules', async () => {
      await expect(
        courseService.publishCourse(testCourse.id, instructorUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for course without lessons', async () => {
      // Create module without lessons
      await prisma.module.create({
        data: {
          title: 'Test Module',
          order: 1,
          courseId: testCourse.id,
        },
      });

      await expect(
        courseService.publishCourse(testCourse.id, instructorUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError for student publishing course', async () => {
      await expect(
        courseService.publishCourse(testCourse.id, testUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('archiveCourse', () => {
    it('should archive course successfully', async () => {
      const course = await courseService.archiveCourse(testCourse.id, instructorUser.id);

      expect(course).toBeDefined();
      expect(course.status).toBe(CourseStatus.ARCHIVED);
    });

    it('should throw ForbiddenError for student archiving course', async () => {
      await expect(
        courseService.archiveCourse(testCourse.id, testUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getCourseStats', () => {
    it('should get course statistics successfully', async () => {
      const stats = await courseService.getCourseStats(testCourse.id, instructorUser.id);

      expect(stats).toBeDefined();
      expect(stats.totalModules).toBe(0);
      expect(stats.totalLessons).toBe(0);
      expect(stats.totalEnrollments).toBe(0);
      expect(stats.completedEnrollments).toBe(0);
      expect(stats.averageProgress).toBe(0);
      expect(stats.totalQuizAttempts).toBe(0);
      expect(stats.averageQuizScore).toBe(0);
    });

    it('should throw ForbiddenError for unauthorized stats access', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          domain: 'other-org.com',
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other-org.com',
          name: 'Other User',
          role: UserRole.STUDENT,
          organizationId: otherOrg.id,
        },
      });

      await expect(
        courseService.getCourseStats(testCourse.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('searchCourses', () => {
    it('should search courses successfully', async () => {
      const result = await courseService.searchCourses(
        'Test',
        testOrganization.id,
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.courses).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw ForbiddenError for unauthorized search', async () => {
      // Create another organization and user
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          domain: 'other-org.com',
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other-org.com',
          name: 'Other User',
          role: UserRole.STUDENT,
          organizationId: otherOrg.id,
        },
      });

      await expect(
        courseService.searchCourses('Test', testOrganization.id, otherUser.id, 1, 10)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await courseService.searchCourses(
        'NonExistentCourse',
        testOrganization.id,
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.courses).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
