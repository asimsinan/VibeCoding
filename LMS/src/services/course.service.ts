import { PrismaClient, Course, CourseStatus, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export class CourseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new course
   * @param data - Course creation data
   * @param createdBy - User ID who created the course
   * @returns Created course
   */
  async createCourse(
    data: Prisma.CourseCreateInput,
    createdBy: string
  ): Promise<Course> {
    try {
      logger.info('Creating course', { data, createdBy });

      // Verify creator has permission
      const creator = await this.prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true, organizationId: true },
      });

      if (!creator) {
        throw new ForbiddenError('Creator user not found');
      }

      // Only admins and instructors can create courses
      if (!['ADMIN', 'INSTRUCTOR'].includes(creator.role)) {
        throw new ForbiddenError('Only administrators and instructors can create courses');
      }

      const course = await this.prisma.course.create({
        data: {
          ...data,
          organization: {
            connect: { id: (data as any).organizationId || creator.organizationId }
          },
          status: data.status || CourseStatus.DRAFT,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          modules: {
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
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      });

      logger.info('Course created successfully', { 
        courseId: course.id,
        createdBy 
      });

      return course;
    } catch (error) {
      logger.error('Failed to create course', { error, createdBy });
      throw error;
    }
  }

  /**
   * Get course by ID
   * @param id - Course ID
   * @param requesterId - User ID requesting the course
   * @returns Course data
   */
  async getCourseById(id: string, requesterId: string): Promise<Course> {
    try {
      logger.info('Fetching course by ID', { id, requesterId });

      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          modules: {
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
            },
            orderBy: { order: 'asc' },
          },
          enrollments: {
            select: {
              id: true,
              status: true,
              enrolledAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view courses from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this course');
      }

      logger.info('Course fetched successfully', { 
        courseId: id,
        requesterId 
      });

      return course;
    } catch (error) {
      logger.error('Failed to fetch course', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Get all courses for an organization
   * @param organizationId - Organization ID
   * @param requesterId - User ID requesting the courses
   * @param page - Page number
   * @param limit - Items per page
   * @param status - Filter by course status
   * @returns Paginated courses
   */
  async getCoursesByOrganization(
    organizationId: string,
    requesterId: string,
    page: number = 1,
    limit: number = 10,
    status?: CourseStatus
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching courses by organization', { organizationId, requesterId, page, limit, status });

      // Verify requester has permission
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Check permissions
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view courses in this organization');
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const whereClause: Prisma.CourseWhereInput = {
        organizationId,
        ...(status && { status }),
      };

      const [courses, total] = await Promise.all([
        this.prisma.course.findMany({
          where: whereClause,
          skip,
          take,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
            _count: {
              select: {
                modules: true,
                enrollments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.course.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Courses fetched successfully', { 
        organizationId,
        requesterId,
        count: courses.length,
        total 
      });

      return {
        courses,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to fetch courses by organization', { error, organizationId, requesterId, page, limit, status });
      throw error;
    }
  }

  /**
   * Update course
   * @param id - Course ID
   * @param data - Update data
   * @param updaterId - User ID performing the update
   * @returns Updated course
   */
  async updateCourse(
    id: string,
    data: Prisma.CourseUpdateInput,
    updaterId: string
  ): Promise<Course> {
    try {
      logger.info('Updating course', { id, data, updaterId });

      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
        select: { id: true, organizationId: true, status: true },
      });

      if (!existingCourse) {
        throw new NotFoundError('Course not found');
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
        updater.organizationId !== existingCourse.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to update this course');
      }

      // Only admins and instructors can update courses
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can update courses');
      }

      const course = await this.prisma.course.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          modules: {
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
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      });

      logger.info('Course updated successfully', { 
        courseId: id,
        updaterId 
      });

      return course;
    } catch (error) {
      logger.error('Failed to update course', { error, id, updaterId });
      throw error;
    }
  }

  /**
   * Delete course
   * @param id - Course ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteCourse(id: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting course', { id, deleterId });

      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
      });

      if (!existingCourse) {
        throw new NotFoundError('Course not found');
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
        deleter.organizationId !== existingCourse.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this course');
      }

      // Only admins can delete courses
      if (deleter.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can delete courses');
      }

      // Check if course has enrollments
      if (existingCourse._count.enrollments > 0) {
        throw new ValidationError('Cannot delete course with existing enrollments', {
          course: ['Course must have no enrollments before deletion'],
        });
      }

      await this.prisma.course.delete({
        where: { id },
      });

      logger.info('Course deleted successfully', { 
        courseId: id,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete course', { error, id, deleterId });
      throw error;
    }
  }

  /**
   * Publish course
   * @param id - Course ID
   * @param publisherId - User ID publishing the course
   * @returns Updated course
   */
  async publishCourse(id: string, publisherId: string): Promise<Course> {
    try {
      logger.info('Publishing course', { id, publisherId });

      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      });

      if (!existingCourse) {
        throw new NotFoundError('Course not found');
      }

      // Verify publisher has permission
      const publisher = await this.prisma.user.findUnique({
        where: { id: publisherId },
        select: { role: true, organizationId: true },
      });

      if (!publisher) {
        throw new ForbiddenError('Publisher not found');
      }

      // Check permissions
      if (
        publisher.role !== 'ADMIN' &&
        publisher.organizationId !== existingCourse.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to publish this course');
      }

      // Only admins and instructors can publish courses
      if (!['ADMIN', 'INSTRUCTOR'].includes(publisher.role)) {
        throw new ForbiddenError('Only administrators and instructors can publish courses');
      }

      // Check if course has modules and lessons
      if (existingCourse.modules.length === 0) {
        throw new ValidationError('Course must have at least one module before publishing', {
          course: ['Course must have modules before publishing'],
        });
      }

      const hasLessons = existingCourse.modules.some(module => module.lessons.length > 0);
      if (!hasLessons) {
        throw new ValidationError('Course must have at least one lesson before publishing', {
          course: ['Course must have lessons before publishing'],
        });
      }

      const course = await this.prisma.course.update({
        where: { id },
        data: {
          status: CourseStatus.PUBLISHED,
          updatedAt: new Date(),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          modules: {
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
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      });

      logger.info('Course published successfully', { 
        courseId: id,
        publisherId 
      });

      return course;
    } catch (error) {
      logger.error('Failed to publish course', { error, id, publisherId });
      throw error;
    }
  }

  /**
   * Archive course
   * @param id - Course ID
   * @param archiverId - User ID archiving the course
   * @returns Updated course
   */
  async archiveCourse(id: string, archiverId: string): Promise<Course> {
    try {
      logger.info('Archiving course', { id, archiverId });

      // Check if course exists
      const existingCourse = await this.prisma.course.findUnique({
        where: { id },
        select: { id: true, organizationId: true },
      });

      if (!existingCourse) {
        throw new NotFoundError('Course not found');
      }

      // Verify archiver has permission
      const archiver = await this.prisma.user.findUnique({
        where: { id: archiverId },
        select: { role: true, organizationId: true },
      });

      if (!archiver) {
        throw new ForbiddenError('Archiver not found');
      }

      // Check permissions
      if (
        archiver.role !== 'ADMIN' &&
        archiver.organizationId !== existingCourse.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to archive this course');
      }

      // Only admins and instructors can archive courses
      if (!['ADMIN', 'INSTRUCTOR'].includes(archiver.role)) {
        throw new ForbiddenError('Only administrators and instructors can archive courses');
      }

      const course = await this.prisma.course.update({
        where: { id },
        data: {
          status: CourseStatus.ARCHIVED,
          updatedAt: new Date(),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          modules: {
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
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      });

      logger.info('Course archived successfully', { 
        courseId: id,
        archiverId 
      });

      return course;
    } catch (error) {
      logger.error('Failed to archive course', { error, id, archiverId });
      throw error;
    }
  }

  /**
   * Get course statistics
   * @param id - Course ID
   * @param requesterId - User ID requesting statistics
   * @returns Course statistics
   */
  async getCourseStats(id: string, requesterId: string): Promise<{
    totalModules: number;
    totalLessons: number;
    totalEnrollments: number;
    completedEnrollments: number;
    averageProgress: number;
    totalQuizAttempts: number;
    averageQuizScore: number;
  }> {
    try {
      logger.info('Fetching course statistics', { id, requesterId });

      // Verify requester has access to this course
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      const course = await this.prisma.course.findUnique({
        where: { id },
        select: { id: true, organizationId: true },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Check permissions
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this course\'s statistics');
      }

      const [
        totalModules,
        totalLessons,
        totalEnrollments,
        completedEnrollments,
        totalProgressRecords,
        quizAttempts,
      ] = await Promise.all([
        this.prisma.module.count({
          where: { courseId: id },
        }),
        this.prisma.lesson.count({
          where: { module: { courseId: id } },
        }),
        this.prisma.enrollment.count({
          where: { courseId: id },
        }),
        this.prisma.enrollment.count({
          where: {
            courseId: id,
            status: 'COMPLETED',
          },
        }),
        this.prisma.progress.count({
          where: {
            lesson: {
              module: {
                courseId: id,
              },
            },
          },
        }),
        this.prisma.quizAttempt.findMany({
          where: {
            quiz: {
              lesson: {
                module: {
                  courseId: id,
                },
              },
            },
          },
          select: {
            score: true,
          },
        }),
      ]);

      const completedProgressRecords = await this.prisma.progress.count({
        where: {
          lesson: {
            module: {
              courseId: id,
            },
          },
          status: 'COMPLETED',
        },
      });

      const averageProgress = totalProgressRecords > 0 
        ? (completedProgressRecords / totalProgressRecords) * 100 
        : 0;

      // Calculate average quiz score
      const averageQuizScore = quizAttempts.length > 0 
        ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
        : 0;

      const stats = {
        totalModules,
        totalLessons,
        totalEnrollments,
        completedEnrollments,
        averageProgress: Math.round(averageProgress * 100) / 100,
        totalQuizAttempts: quizAttempts.length,
        averageQuizScore: Math.round(averageQuizScore * 100) / 100,
      };

      logger.info('Course statistics fetched successfully', { 
        courseId: id,
        requesterId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch course statistics', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Search courses
   * @param query - Search query
   * @param organizationId - Organization ID to search within
   * @param requesterId - User ID performing the search
   * @param page - Page number
   * @param limit - Items per page
   * @returns Search results
   */
  async searchCourses(
    query: string,
    organizationId: string,
    requesterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    courses: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      logger.info('Searching courses', { query, organizationId, requesterId, page, limit });

      // Verify requester has permission
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Check permissions
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to search courses in this organization');
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const whereClause: Prisma.CourseWhereInput = {
        organizationId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      };

      const [courses, total] = await Promise.all([
        this.prisma.course.findMany({
          where: whereClause,
          skip,
          take,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
            _count: {
              select: {
                modules: true,
                enrollments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.course.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Course search completed', { 
        query,
        organizationId,
        requesterId,
        count: courses.length,
        total 
      });

      return {
        courses,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to search courses', { error, query, organizationId, requesterId, page, limit });
      throw error;
    }
  }
}

// Export singleton instance
export const courseService = new CourseService(
  require('../lib/database').db
);
