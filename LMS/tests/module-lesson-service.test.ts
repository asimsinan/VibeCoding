import { PrismaClient, UserRole, LessonType } from '../src/generated/prisma';
import { ModuleLessonService } from '../src/services/module-lesson.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('ModuleLessonService', () => {
  let prisma: PrismaClient;
  let moduleLessonService: ModuleLessonService;
  let testOrganization: any;
  let testUser: any;
  let adminUser: any;
  let instructorUser: any;
  let testCourse: any;
  let testModule: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    moduleLessonService = new ModuleLessonService(prisma);
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
        organizationId: testOrganization.id,
      },
    });

    // Create test module
    testModule = await prisma.module.create({
      data: {
        title: 'Test Module',
        order: 1,
        courseId: testCourse.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Module Management', () => {
    describe('createModule', () => {
      it('should create a new module successfully', async () => {
        const data = {
          title: 'New Module',
          courseId: testCourse.id,
        };

        const module = await moduleLessonService.createModule(data, instructorUser.id);

        expect(module).toBeDefined();
        expect(module.title).toBe(data.title);
        expect(module.courseId).toBe(data.courseId);
        expect(module.order).toBe(2); // Next order after existing module
      });

      it('should throw ForbiddenError for student creating module', async () => {
        const data = {
          title: 'Student Module',
          courseId: testCourse.id,
        };

        await expect(
          moduleLessonService.createModule(data, testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });

      it('should throw NotFoundError for non-existent course', async () => {
        const data = {
          title: 'Module for Non-existent Course',
          courseId: 'non-existent-course-id',
        };

        await expect(
          moduleLessonService.createModule(data, instructorUser.id)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('getModuleById', () => {
      it('should get module by ID successfully', async () => {
        const module = await moduleLessonService.getModuleById(testModule.id, testUser.id);

        expect(module).toBeDefined();
        expect(module.id).toBe(testModule.id);
        expect(module.title).toBe(testModule.title);
        expect(module.course).toBeDefined();
        expect(module.lessons).toBeDefined();
        expect(module._count).toBeDefined();
      });

      it('should throw NotFoundError for non-existent module', async () => {
        await expect(
          moduleLessonService.getModuleById('non-existent-id', adminUser.id)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('updateModule', () => {
      it('should update module successfully', async () => {
        const updateData = {
          title: 'Updated Module Title',
        };

        const module = await moduleLessonService.updateModule(
          testModule.id,
          updateData,
          instructorUser.id
        );

        expect(module).toBeDefined();
        expect(module.title).toBe(updateData.title);
      });

      it('should throw ForbiddenError for student updating module', async () => {
        const updateData = {
          title: 'Student Updated Module',
        };

        await expect(
          moduleLessonService.updateModule(testModule.id, updateData, testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe('deleteModule', () => {
      it('should delete module successfully', async () => {
        const result = await moduleLessonService.deleteModule(testModule.id, adminUser.id);

        expect(result.success).toBe(true);

        // Verify module is deleted
        const deletedModule = await prisma.module.findUnique({
          where: { id: testModule.id },
        });
        expect(deletedModule).toBeNull();
      });

      it('should throw ValidationError for module with lessons', async () => {
        // Create a lesson in the module
        await prisma.lesson.create({
          data: {
            title: 'Test Lesson',
            content: 'Lesson content',
            order: 1,
            moduleId: testModule.id,
          },
        });

        await expect(
          moduleLessonService.deleteModule(testModule.id, adminUser.id)
        ).rejects.toThrow(ValidationError);
      });

      it('should throw ForbiddenError for student deleting module', async () => {
        await expect(
          moduleLessonService.deleteModule(testModule.id, testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe('reorderModules', () => {
      it('should reorder modules successfully', async () => {
        // Create another module
        const module2 = await prisma.module.create({
          data: {
            title: 'Module 2',
            order: 2,
            courseId: testCourse.id,
          },
        });

        const result = await moduleLessonService.reorderModules(
          testCourse.id,
          [module2.id, testModule.id], // Reverse order
          instructorUser.id
        );

        expect(result.success).toBe(true);

        // Verify order was updated
        const updatedModule1 = await prisma.module.findUnique({
          where: { id: testModule.id },
        });
        const updatedModule2 = await prisma.module.findUnique({
          where: { id: module2.id },
        });

        expect(updatedModule1?.order).toBe(2);
        expect(updatedModule2?.order).toBe(1);
      });

      it('should throw ForbiddenError for student reordering modules', async () => {
        await expect(
          moduleLessonService.reorderModules(testCourse.id, [testModule.id], testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('Lesson Management', () => {
    describe('createLesson', () => {
      it('should create a new lesson successfully', async () => {
        const data = {
          title: 'New Lesson',
          content: 'Lesson content',
          type: LessonType.TEXT,
          moduleId: testModule.id,
        };

        const lesson = await moduleLessonService.createLesson(data, instructorUser.id);

        expect(lesson).toBeDefined();
        expect(lesson.title).toBe(data.title);
        expect(lesson.content).toBe(data.content);
        expect(lesson.type).toBe(data.type);
        expect(lesson.moduleId).toBe(data.moduleId);
        expect(lesson.order).toBe(1);
      });

      it('should throw ForbiddenError for student creating lesson', async () => {
        const data = {
          title: 'Student Lesson',
          moduleId: testModule.id,
        };

        await expect(
          moduleLessonService.createLesson(data, testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });

      it('should throw NotFoundError for non-existent module', async () => {
        const data = {
          title: 'Lesson for Non-existent Module',
          moduleId: 'non-existent-module-id',
        };

        await expect(
          moduleLessonService.createLesson(data, instructorUser.id)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('getLessonById', () => {
      let testLesson: any;

      beforeEach(async () => {
        testLesson = await prisma.lesson.create({
          data: {
            title: 'Test Lesson',
            content: 'Lesson content',
            order: 1,
            moduleId: testModule.id,
          },
        });
      });

      it('should get lesson by ID successfully', async () => {
        const lesson = await moduleLessonService.getLessonById(testLesson.id, testUser.id);

        expect(lesson).toBeDefined();
        expect(lesson.id).toBe(testLesson.id);
        expect(lesson.title).toBe(testLesson.title);
        expect(lesson.module).toBeDefined();
        expect(lesson.quiz).toBeDefined();
      });

      it('should throw NotFoundError for non-existent lesson', async () => {
        await expect(
          moduleLessonService.getLessonById('non-existent-id', adminUser.id)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('updateLesson', () => {
      let testLesson: any;

      beforeEach(async () => {
        testLesson = await prisma.lesson.create({
          data: {
            title: 'Test Lesson',
            content: 'Lesson content',
            order: 1,
            moduleId: testModule.id,
          },
        });
      });

      it('should update lesson successfully', async () => {
        const updateData = {
          title: 'Updated Lesson Title',
          content: 'Updated content',
        };

        const lesson = await moduleLessonService.updateLesson(
          testLesson.id,
          updateData,
          instructorUser.id
        );

        expect(lesson).toBeDefined();
        expect(lesson.title).toBe(updateData.title);
        expect(lesson.content).toBe(updateData.content);
      });

      it('should throw ForbiddenError for student updating lesson', async () => {
        const updateData = {
          title: 'Student Updated Lesson',
        };

        await expect(
          moduleLessonService.updateLesson(testLesson.id, updateData, testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe('deleteLesson', () => {
      let testLesson: any;

      beforeEach(async () => {
        testLesson = await prisma.lesson.create({
          data: {
            title: 'Test Lesson',
            content: 'Lesson content',
            order: 1,
            moduleId: testModule.id,
          },
        });
      });

      it('should delete lesson successfully', async () => {
        const result = await moduleLessonService.deleteLesson(testLesson.id, adminUser.id);

        expect(result.success).toBe(true);

        // Verify lesson is deleted
        const deletedLesson = await prisma.lesson.findUnique({
          where: { id: testLesson.id },
        });
        expect(deletedLesson).toBeNull();
      });

      it('should throw ValidationError for lesson with progress records', async () => {
        // Create progress record
        await prisma.progress.create({
          data: {
            userId: testUser.id,
            lessonId: testLesson.id,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await expect(
          moduleLessonService.deleteLesson(testLesson.id, adminUser.id)
        ).rejects.toThrow(ValidationError);
      });

      it('should throw ForbiddenError for student deleting lesson', async () => {
        await expect(
          moduleLessonService.deleteLesson(testLesson.id, testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe('reorderLessons', () => {
      let testLesson1: any;
      let testLesson2: any;

      beforeEach(async () => {
        testLesson1 = await prisma.lesson.create({
          data: {
            title: 'Lesson 1',
            content: 'Lesson 1 content',
            order: 1,
            moduleId: testModule.id,
          },
        });

        testLesson2 = await prisma.lesson.create({
          data: {
            title: 'Lesson 2',
            content: 'Lesson 2 content',
            order: 2,
            moduleId: testModule.id,
          },
        });
      });

      it('should reorder lessons successfully', async () => {
        const result = await moduleLessonService.reorderLessons(
          testModule.id,
          [testLesson2.id, testLesson1.id], // Reverse order
          instructorUser.id
        );

        expect(result.success).toBe(true);

        // Verify order was updated
        const updatedLesson1 = await prisma.lesson.findUnique({
          where: { id: testLesson1.id },
        });
        const updatedLesson2 = await prisma.lesson.findUnique({
          where: { id: testLesson2.id },
        });

        expect(updatedLesson1?.order).toBe(2);
        expect(updatedLesson2?.order).toBe(1);
      });

      it('should throw ForbiddenError for student reordering lessons', async () => {
        await expect(
          moduleLessonService.reorderLessons(testModule.id, [testLesson1.id], testUser.id)
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('getCourseStructure', () => {
    it('should get course structure successfully', async () => {
      const structure = await moduleLessonService.getCourseStructure(testCourse.id, testUser.id);

      expect(structure).toBeDefined();
      expect(structure.course).toBeDefined();
      expect(structure.course.id).toBe(testCourse.id);
      expect(structure.modules).toBeDefined();
      expect(structure.modules).toHaveLength(1);
      expect(structure.modules[0].id).toBe(testModule.id);
    });

    it('should throw NotFoundError for non-existent course', async () => {
      await expect(
        moduleLessonService.getCourseStructure('non-existent-id', adminUser.id)
      ).rejects.toThrow(NotFoundError);
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
        moduleLessonService.getCourseStructure(testCourse.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
