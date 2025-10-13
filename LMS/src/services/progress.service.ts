import { PrismaClient, Progress, ProgressStatus, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export class ProgressService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Record lesson completion
   * @param lessonId - Lesson ID
   * @param userId - User ID
   * @param completedBy - User ID who recorded the completion
   * @returns Created/updated progress record
   */
  async recordLessonCompletion(
    lessonId: string,
    userId: string,
    completedBy: string
  ): Promise<Progress> {
    try {
      logger.info('Recording lesson completion', { lessonId, userId, completedBy });

      // Verify the user exists and get their organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          role: true, 
          organizationId: true,
          name: true,
          email: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify the lesson exists and get its organization
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                include: {
                  organization: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Verify completion permissions
      const completer = await this.prisma.user.findUnique({
        where: { id: completedBy },
        select: { id: true, role: true, organizationId: true },
      });

      if (!completer) {
        throw new ForbiddenError('Completer not found');
      }

      // Check permissions: Users can only complete lessons from their organization
      if (
        completer.role !== 'ADMIN' &&
        completer.organizationId !== lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to record completion for this lesson');
      }

      // Users can only complete lessons for users from their organization
      if (
        completer.role !== 'ADMIN' &&
        completer.organizationId !== user.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to record completion for this user');
      }

      // Students can only complete lessons for themselves
      if (completer.role === 'STUDENT' && completer.id !== userId) {
        throw new ForbiddenError('Students can only complete lessons for themselves');
      }

      // Check if user is enrolled in the course
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: lesson.module.course.id,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        throw new ValidationError('User must be enrolled in the course to complete lessons', {
          enrollment: ['User must be enrolled in the course to complete lessons'],
        });
      }

      // Check if progress already exists
      const existingProgress = await this.prisma.progress.findFirst({
        where: {
          userId: userId,
          lessonId: lessonId,
        },
      });

      if (existingProgress) {
        // Update existing progress
        const progress = await this.prisma.progress.update({
          where: { id: existingProgress.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            lesson: {
              select: {
                id: true,
                title: true,
                type: true,
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
              },
            },
          },
        });

        logger.info('Lesson completion updated successfully', { 
          progressId: progress.id,
          lessonId,
          userId,
          completedBy 
        });

        return progress;
      } else {
        // Create new progress record
        const progress = await this.prisma.progress.create({
          data: {
            userId: userId,
            lessonId: lessonId,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            lesson: {
              select: {
                id: true,
                title: true,
                type: true,
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
              },
            },
          },
        });

        logger.info('Lesson completion recorded successfully', { 
          progressId: progress.id,
          lessonId,
          userId,
          completedBy 
        });

        return progress;
      }
    } catch (error) {
      logger.error('Failed to record lesson completion', { error, lessonId, userId, completedBy });
      throw error;
    }
  }

  /**
   * Get progress by ID
   * @param id - Progress ID
   * @param requesterId - User ID requesting the progress
   * @returns Progress data
   */
  async getProgressById(id: string, requesterId: string): Promise<Progress> {
    try {
      logger.info('Fetching progress by ID', { id, requesterId });

      const progress = await this.prisma.progress.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
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
            },
          },
        },
      });

      if (!progress) {
        throw new NotFoundError('Progress not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view progress from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== progress.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this progress');
      }

      // Students can only view their own progress
      if (
        requester.role === 'STUDENT' &&
        requester.id !== progress.userId
      ) {
        throw new ForbiddenError('Students can only view their own progress');
      }

      logger.info('Progress fetched successfully', { 
        progressId: id,
        requesterId 
      });

      return progress;
    } catch (error) {
      logger.error('Failed to fetch progress', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Get progress for a specific course
   * @param courseId - Course ID
   * @param userId - User ID
   * @param requesterId - User ID requesting the progress
   * @returns Course progress data
   */
  async getCourseProgress(
    courseId: string,
    userId: string,
    requesterId: string
  ): Promise<{
    courseId: string;
    userId: string;
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
    progress: Progress[];
  }> {
    try {
      logger.info('Fetching course progress', { courseId, userId, requesterId });

      // Verify course exists and get organization
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view progress from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view progress for this course');
      }

      // Students can only view their own progress
      if (requester.role === 'STUDENT' && requester.id !== userId) {
        throw new ForbiddenError('Students can only view their own progress');
      }

      // Get all lessons in the course
      const lessons = await this.prisma.lesson.findMany({
        where: {
          module: {
            courseId: courseId,
          },
        },
        select: { id: true },
      });

      // Get progress records for the user
      const progress = await this.prisma.progress.findMany({
        where: {
          userId: userId,
          lesson: {
            module: {
              courseId: courseId,
            },
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
              module: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
              },
            },
          },
        },
        orderBy: [
          { lesson: { module: { order: 'asc' } } },
          { lesson: { order: 'asc' } },
        ],
      });

      const totalLessons = lessons.length;
      const completedLessons = progress.filter(p => p.status === 'COMPLETED').length;
      const completionPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      const result = {
        courseId,
        userId,
        totalLessons,
        completedLessons,
        completionPercentage,
        progress,
      };

      logger.info('Course progress fetched successfully', { 
        courseId,
        userId,
        requesterId,
        completionPercentage 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch course progress', { error, courseId, userId, requesterId });
      throw error;
    }
  }

  /**
   * Get all progress for a user
   * @param userId - User ID
   * @param requesterId - User ID requesting the progress
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated progress records
   */
  async getUserProgress(
    userId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: Progress[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching user progress', { userId, requesterId, page, pageSize });

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Students can only view their own progress
      if (requester.role === 'STUDENT' && requester.id !== userId) {
        throw new ForbiddenError('Students can only view their own progress');
      }

      // Users can only view progress from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== user.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view progress for this user');
      }

      const skip = (page - 1) * pageSize;

      const [progress, total] = await Promise.all([
        this.prisma.progress.findMany({
          where: { userId },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                type: true,
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
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.progress.count({
          where: { userId },
        }),
      ]);

      const result = {
        data: progress,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('User progress fetched successfully', { 
        userId,
        requesterId,
        count: progress.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch user progress', { error, userId, requesterId });
      throw error;
    }
  }

  /**
   * Get progress statistics for a course
   * @param courseId - Course ID
   * @param requesterId - User ID requesting statistics
   * @returns Course progress statistics
   */
  async getCourseProgressStats(
    courseId: string,
    requesterId: string
  ): Promise<{
    totalEnrollments: number;
    totalLessons: number;
    averageCompletion: number;
    completionDistribution: {
      completed: number;
      inProgress: number;
      notStarted: number;
    };
  }> {
    try {
      logger.info('Fetching course progress statistics', { courseId, requesterId });

      // Verify course exists and get organization
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view statistics from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view statistics for this course');
      }

      // Only admins and instructors can view course statistics
      if (!['ADMIN', 'INSTRUCTOR'].includes(requester.role)) {
        throw new ForbiddenError('Only administrators and instructors can view course progress statistics');
      }

      // Get total enrollments
      const totalEnrollments = await this.prisma.enrollment.count({
        where: {
          courseId: courseId,
          status: 'ACTIVE',
        },
      });

      // Get total lessons
      const totalLessons = await this.prisma.lesson.count({
        where: {
          module: {
            courseId: courseId,
          },
        },
      });

      // Get completion statistics
      const completionStats = await this.prisma.progress.groupBy({
        by: ['status'],
        where: {
          lesson: {
            module: {
              courseId: courseId,
            },
          },
        },
        _count: {
          status: true,
        },
      });

      const completionDistribution = {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
      };

      completionStats.forEach(stat => {
        if (stat.status === 'COMPLETED') {
          completionDistribution.completed = stat._count.status;
        } else if (stat.status === 'IN_PROGRESS') {
          completionDistribution.inProgress = stat._count.status;
        } else {
          completionDistribution.notStarted = stat._count.status;
        }
      });

      // Calculate average completion percentage
      const totalProgressRecords = completionDistribution.completed + completionDistribution.inProgress;
      const averageCompletion = totalEnrollments > 0 && totalLessons > 0
        ? Math.round((completionDistribution.completed / (totalEnrollments * totalLessons)) * 100)
        : 0;

      const stats = {
        totalEnrollments,
        totalLessons,
        averageCompletion,
        completionDistribution,
      };

      logger.info('Course progress statistics fetched successfully', { 
        courseId,
        requesterId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch course progress statistics', { error, courseId, requesterId });
      throw error;
    }
  }

  /**
   * Reset progress for a lesson
   * @param lessonId - Lesson ID
   * @param userId - User ID
   * @param resetterId - User ID performing the reset
   * @returns Success status
   */
  async resetLessonProgress(
    lessonId: string,
    userId: string,
    resetterId: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info('Resetting lesson progress', { lessonId, userId, resetterId });

      // Verify lesson exists and get organization
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
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

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Verify resetter has permission
      const resetter = await this.prisma.user.findUnique({
        where: { id: resetterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!resetter) {
        throw new ForbiddenError('Resetter not found');
      }

      // Check permissions
      if (
        resetter.role !== 'ADMIN' &&
        resetter.organizationId !== lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to reset progress for this lesson');
      }

      // Only admins and instructors can reset progress
      if (!['ADMIN', 'INSTRUCTOR'].includes(resetter.role)) {
        throw new ForbiddenError('Only administrators and instructors can reset lesson progress');
      }

      // Find and delete the progress record
      const progress = await this.prisma.progress.findFirst({
        where: {
          userId: userId,
          lessonId: lessonId,
        },
      });

      if (progress) {
        await this.prisma.progress.delete({
          where: { id: progress.id },
        });
      }

      logger.info('Lesson progress reset successfully', { 
        lessonId,
        userId,
        resetterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reset lesson progress', { error, lessonId, userId, resetterId });
      throw error;
    }
  }
}

// Export singleton instance
export const progressService = new ProgressService(
  require('../lib/database').db
);
