import { PrismaClient, Module, Lesson, LessonType, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export class ModuleLessonService {
  constructor(private prisma: PrismaClient) {}

  // ==================== MODULE MANAGEMENT ====================

  /**
   * Create a new module
   * @param data - Module creation data
   * @param createdBy - User ID who created the module
   * @returns Created module
   */
  async createModule(
    data: Prisma.ModuleCreateInput,
    createdBy: string
  ): Promise<Module> {
    try {
      logger.info('Creating module', { data, createdBy });

      // Verify creator has permission
      const creator = await this.prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true, organizationId: true },
      });

      if (!creator) {
        throw new ForbiddenError('Creator user not found');
      }

      // Only admins and instructors can create modules
      if (!['ADMIN', 'INSTRUCTOR'].includes(creator.role)) {
        throw new ForbiddenError('Only administrators and instructors can create modules');
      }

      // Verify course exists and user has access
      const courseId = data.course.connect?.id;
      if (!courseId) {
        throw new ValidationError('Course ID is required', {
          course: ['Course ID is required'],
        });
      }

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, organizationId: true },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      if (
        creator.role !== 'ADMIN' &&
        creator.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to create modules in this course');
      }

      // Get the next order number
      const lastModule = await this.prisma.module.findFirst({
        where: { courseId: course.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = (lastModule?.order || 0) + 1;

      const module = await this.prisma.module.create({
        data: {
          ...data,
          order: data.order || nextOrder,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              organizationId: true,
            },
          },
          lessons: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      });

      logger.info('Module created successfully', { 
        moduleId: module.id,
        createdBy 
      });

      return module;
    } catch (error) {
      logger.error('Failed to create module', { error, createdBy });
      throw error;
    }
  }

  /**
   * Get module by ID
   * @param id - Module ID
   * @param requesterId - User ID requesting the module
   * @returns Module data
   */
  async getModuleById(id: string, requesterId: string): Promise<Module> {
    try {
      logger.info('Fetching module by ID', { id, requesterId });

      const module = await this.prisma.module.findUnique({
        where: { id },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              organizationId: true,
            },
          },
          lessons: {
            include: {
              quiz: {
                include: {
                  questions: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      });

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view modules from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this module');
      }

      logger.info('Module fetched successfully', { 
        moduleId: id,
        requesterId 
      });

      return module;
    } catch (error) {
      logger.error('Failed to fetch module', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Update module
   * @param id - Module ID
   * @param data - Update data
   * @param updaterId - User ID performing the update
   * @returns Updated module
   */
  async updateModule(
    id: string,
    data: Prisma.ModuleUpdateInput,
    updaterId: string
  ): Promise<Module> {
    try {
      logger.info('Updating module', { id, data, updaterId });

      // Check if module exists
      const existingModule = await this.prisma.module.findUnique({
        where: { id },
        include: {
          course: {
            select: { id: true, organizationId: true },
          },
        },
      });

      if (!existingModule) {
        throw new NotFoundError('Module not found');
      }

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== existingModule.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to update this module');
      }

      // Only admins and instructors can update modules
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can update modules');
      }

      const module = await this.prisma.module.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              organizationId: true,
            },
          },
          lessons: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      });

      logger.info('Module updated successfully', { 
        moduleId: id,
        updaterId 
      });

      return module;
    } catch (error) {
      logger.error('Failed to update module', { error, id, updaterId });
      throw error;
    }
  }

  /**
   * Delete module
   * @param id - Module ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteModule(id: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting module', { id, deleterId });

      // Check if module exists
      const existingModule = await this.prisma.module.findUnique({
        where: { id },
        include: {
          course: {
            select: { id: true, organizationId: true },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      });

      if (!existingModule) {
        throw new NotFoundError('Module not found');
      }

      // Verify deleter has permission
      const deleter = await this.prisma.user.findUnique({
        where: { id: deleterId },
        select: { role: true, organizationId: true },
      });

      if (!deleter) {
        throw new ForbiddenError('Deleter not found');
      }

      // Check permissions
      if (
        deleter.role !== 'ADMIN' &&
        deleter.organizationId !== existingModule.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this module');
      }

      // Only admins and instructors can delete modules
      if (!['ADMIN', 'INSTRUCTOR'].includes(deleter.role)) {
        throw new ForbiddenError('Only administrators and instructors can delete modules');
      }

      // Check if module has lessons
      if (existingModule._count.lessons > 0) {
        throw new ValidationError('Cannot delete module with existing lessons', {
          module: ['Module must have no lessons before deletion'],
        });
      }

      await this.prisma.module.delete({
        where: { id },
      });

      logger.info('Module deleted successfully', { 
        moduleId: id,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete module', { error, id, deleterId });
      throw error;
    }
  }

  /**
   * Reorder modules
   * @param courseId - Course ID
   * @param moduleOrders - Array of module IDs in new order
   * @param updaterId - User ID performing the reorder
   * @returns Success status
   */
  async reorderModules(
    courseId: string,
    moduleOrders: string[],
    updaterId: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info('Reordering modules', { courseId, moduleOrders, updaterId });

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Verify course exists and user has access
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, organizationId: true },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to reorder modules in this course');
      }

      // Only admins and instructors can reorder modules
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can reorder modules');
      }

      // Update module orders
      await this.prisma.$transaction(
        moduleOrders.map((moduleId, index) =>
          this.prisma.module.update({
            where: { id: moduleId },
            data: { order: index + 1 },
          })
        )
      );

      logger.info('Modules reordered successfully', { 
        courseId,
        updaterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reorder modules', { error, courseId, updaterId });
      throw error;
    }
  }

  // ==================== LESSON MANAGEMENT ====================

  /**
   * Create a new lesson
   * @param data - Lesson creation data
   * @param createdBy - User ID who created the lesson
   * @returns Created lesson
   */
  async createLesson(
    data: Prisma.LessonCreateInput,
    createdBy: string
  ): Promise<Lesson> {
    try {
      logger.info('Creating lesson', { data, createdBy });

      // Verify creator has permission
      const creator = await this.prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true, organizationId: true },
      });

      if (!creator) {
        throw new ForbiddenError('Creator user not found');
      }

      // Only admins and instructors can create lessons
      if (!['ADMIN', 'INSTRUCTOR'].includes(creator.role)) {
        throw new ForbiddenError('Only administrators and instructors can create lessons');
      }

      // Verify module exists and user has access
      const moduleId = data.module.connect?.id;
      if (!moduleId) {
        throw new ValidationError('Module ID is required', {
          module: ['Module ID is required'],
        });
      }

      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: {
          course: {
            select: { id: true, organizationId: true },
          },
        },
      });

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      // Check permissions
      if (
        creator.role !== 'ADMIN' &&
        creator.organizationId !== module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to create lessons in this module');
      }

      // Get the next order number
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { moduleId: module.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = (lastLesson?.order || 0) + 1;

      const lesson = await this.prisma.lesson.create({
        data: {
          ...data,
          order: data.order || nextOrder,
          type: data.type || LessonType.TEXT,
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  organizationId: true,
                },
              },
            },
          },
          quiz: {
            include: {
              questions: true,
            },
          },
        },
      });

      logger.info('Lesson created successfully', { 
        lessonId: lesson.id,
        createdBy 
      });

      return lesson;
    } catch (error) {
      logger.error('Failed to create lesson', { error, createdBy });
      throw error;
    }
  }

  /**
   * Get lesson by ID
   * @param id - Lesson ID
   * @param requesterId - User ID requesting the lesson
   * @returns Lesson data
   */
  async getLessonById(id: string, requesterId: string): Promise<Lesson> {
    try {
      logger.info('Fetching lesson by ID', { id, requesterId });

      const lesson = await this.prisma.lesson.findUnique({
        where: { id },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  organizationId: true,
                },
              },
            },
          },
          quiz: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view lessons from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this lesson');
      }

      logger.info('Lesson fetched successfully', { 
        lessonId: id,
        requesterId 
      });

      return lesson;
    } catch (error) {
      logger.error('Failed to fetch lesson', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Update lesson
   * @param id - Lesson ID
   * @param data - Update data
   * @param updaterId - User ID performing the update
   * @returns Updated lesson
   */
  async updateLesson(
    id: string,
    data: Prisma.LessonUpdateInput,
    updaterId: string
  ): Promise<Lesson> {
    try {
      logger.info('Updating lesson', { id, data, updaterId });

      // Check if lesson exists
      const existingLesson = await this.prisma.lesson.findUnique({
        where: { id },
        include: {
          module: {
            include: {
              course: {
                select: { id: true, organizationId: true },
              },
            },
          },
        },
      });

      if (!existingLesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== existingLesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to update this lesson');
      }

      // Only admins and instructors can update lessons
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can update lessons');
      }

      const lesson = await this.prisma.lesson.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  organizationId: true,
                },
              },
            },
          },
          quiz: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      logger.info('Lesson updated successfully', { 
        lessonId: id,
        updaterId 
      });

      return lesson;
    } catch (error) {
      logger.error('Failed to update lesson', { error, id, updaterId });
      throw error;
    }
  }

  /**
   * Delete lesson
   * @param id - Lesson ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteLesson(id: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting lesson', { id, deleterId });

      // Check if lesson exists
      const existingLesson = await this.prisma.lesson.findUnique({
        where: { id },
        include: {
          module: {
            include: {
              course: {
                select: { id: true, organizationId: true },
              },
            },
          },
          _count: {
            select: {
              progress: true,
            },
          },
        },
      });

      if (!existingLesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Verify deleter has permission
      const deleter = await this.prisma.user.findUnique({
        where: { id: deleterId },
        select: { role: true, organizationId: true },
      });

      if (!deleter) {
        throw new ForbiddenError('Deleter not found');
      }

      // Check permissions
      if (
        deleter.role !== 'ADMIN' &&
        deleter.organizationId !== existingLesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this lesson');
      }

      // Only admins and instructors can delete lessons
      if (!['ADMIN', 'INSTRUCTOR'].includes(deleter.role)) {
        throw new ForbiddenError('Only administrators and instructors can delete lessons');
      }

      // Check if lesson has progress records
      if (existingLesson._count.progress > 0) {
        throw new ValidationError('Cannot delete lesson with existing progress records', {
          lesson: ['Lesson must have no progress records before deletion'],
        });
      }

      await this.prisma.lesson.delete({
        where: { id },
      });

      logger.info('Lesson deleted successfully', { 
        lessonId: id,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete lesson', { error, id, deleterId });
      throw error;
    }
  }

  /**
   * Reorder lessons
   * @param moduleId - Module ID
   * @param lessonOrders - Array of lesson IDs in new order
   * @param updaterId - User ID performing the reorder
   * @returns Success status
   */
  async reorderLessons(
    moduleId: string,
    lessonOrders: string[],
    updaterId: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info('Reordering lessons', { moduleId, lessonOrders, updaterId });

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Verify module exists and user has access
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: {
          course: {
            select: { id: true, organizationId: true },
          },
        },
      });

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to reorder lessons in this module');
      }

      // Only admins and instructors can reorder lessons
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can reorder lessons');
      }

      // Update lesson orders
      await this.prisma.$transaction(
        lessonOrders.map((lessonId, index) =>
          this.prisma.lesson.update({
            where: { id: lessonId },
            data: { order: index + 1 },
          })
        )
      );

      logger.info('Lessons reordered successfully', { 
        moduleId,
        updaterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reorder lessons', { error, moduleId, updaterId });
      throw error;
    }
  }

  /**
   * Get course structure (modules and lessons)
   * @param courseId - Course ID
   * @param requesterId - User ID requesting the structure
   * @returns Course structure
   */
  async getCourseStructure(
    courseId: string,
    requesterId: string
  ): Promise<{
    course: any;
    modules: Module[];
  }> {
    try {
      logger.info('Fetching course structure', { courseId, requesterId });

      // Verify requester has permission
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Verify course exists and user has access
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, organizationId: true },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this course structure');
      }

      const modules = await this.prisma.module.findMany({
        where: { courseId },
        include: {
          lessons: {
            include: {
              quiz: {
                include: {
                  questions: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      logger.info('Course structure fetched successfully', { 
        courseId,
        requesterId,
        moduleCount: modules.length 
      });

      return {
        course,
        modules,
      };
    } catch (error) {
      logger.error('Failed to fetch course structure', { error, courseId, requesterId });
      throw error;
    }
  }
}

// Export singleton instance
export const moduleLessonService = new ModuleLessonService(
  require('../lib/database').db
);
