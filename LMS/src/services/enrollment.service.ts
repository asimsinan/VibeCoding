import { PrismaClient, Enrollment, EnrollmentStatus, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export class EnrollmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Enroll a student in a course
   * @param courseId - Course ID
   * @param studentId - Student ID
   * @param enrolledBy - User ID who performed the enrollment
   * @returns Created enrollment
   */
  async enrollStudent(
    courseId: string,
    studentId: string,
    enrolledBy: string
  ): Promise<Enrollment> {
    try {
      logger.info('Enrolling student in course', { courseId, studentId, enrolledBy });

      // Verify the student exists and get their organization
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { 
          id: true, 
          role: true, 
          organizationId: true,
          name: true,
          email: true,
        },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      if (student.role !== 'STUDENT') {
        throw new ValidationError('Only students can be enrolled in courses', {
          student: ['Only students can be enrolled in courses'],
        });
      }

      // Verify the course exists and get its organization
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

      // Check if course is published
      if (course.status !== 'PUBLISHED') {
        throw new ValidationError('Cannot enroll in unpublished course', {
          course: ['Course must be published before enrollment'],
        });
      }

      // Verify enrollment permissions
      const enroller = await this.prisma.user.findUnique({
        where: { id: enrolledBy },
        select: { id: true, role: true, organizationId: true },
      });

      if (!enroller) {
        throw new ForbiddenError('Enroller not found');
      }

      // Check permissions: Admin can enroll anyone, Instructor can enroll in their courses, Student can self-enroll
      if (enroller.role === 'STUDENT') {
        if (enroller.id !== studentId) {
          throw new ForbiddenError('Students can only enroll themselves');
        }
        if (enroller.organizationId !== course.organizationId) {
          throw new ForbiddenError('Students can only enroll in courses from their organization');
        }
      } else if (enroller.role === 'INSTRUCTOR') {
        if (enroller.organizationId !== course.organizationId) {
          throw new ForbiddenError('Instructors can only enroll students in courses from their organization');
        }
      } else if (enroller.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators, instructors, and students can perform enrollments');
      }

      // Check if student is already enrolled
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId: studentId,
          courseId: courseId,
        },
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === 'ACTIVE') {
          throw new ValidationError('Student is already enrolled in this course', {
            enrollment: ['Student is already enrolled in this course'],
          });
        } else if (existingEnrollment.status === 'COMPLETED') {
          throw new ValidationError('Student has already completed this course', {
            enrollment: ['Student has already completed this course'],
          });
        }
      }

      // Create enrollment
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId: studentId,
          courseId: courseId,
          organizationId: course.organizationId,
          status: 'ACTIVE',
          enrolledAt: new Date(),
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
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info('Student enrolled successfully', { 
        enrollmentId: enrollment.id,
        courseId,
        studentId,
        enrolledBy 
      });

      return enrollment;
    } catch (error) {
      logger.error('Failed to enroll student', { error, courseId, studentId, enrolledBy });
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   * @param id - Enrollment ID
   * @param requesterId - User ID requesting the enrollment
   * @returns Enrollment data
   */
  async getEnrollmentById(id: string, requesterId: string): Promise<Enrollment> {
    try {
      logger.info('Fetching enrollment by ID', { id, requesterId });

      const enrollment = await this.prisma.enrollment.findUnique({
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
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!enrollment) {
        throw new NotFoundError('Enrollment not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view enrollments from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== enrollment.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this enrollment');
      }

      // Students can only view their own enrollments
      if (
        requester.role === 'STUDENT' &&
        requester.id !== enrollment.userId
      ) {
        throw new ForbiddenError('Students can only view their own enrollments');
      }

      logger.info('Enrollment fetched successfully', { 
        enrollmentId: id,
        requesterId 
      });

      return enrollment;
    } catch (error) {
      logger.error('Failed to fetch enrollment', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Get all enrollments for a course
   * @param courseId - Course ID
   * @param requesterId - User ID requesting the enrollments
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated enrollments
   */
  async getCourseEnrollments(
    courseId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: Enrollment[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching course enrollments', { courseId, requesterId, page, pageSize });

      // Verify course exists and get organization
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, organizationId: true, title: true },
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

      // Users can only view enrollments from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view enrollments for this course');
      }

      const skip = (page - 1) * pageSize;

      const [enrollments, total] = await Promise.all([
        this.prisma.enrollment.findMany({
          where: { courseId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.enrollment.count({
          where: { courseId },
        }),
      ]);

      const result = {
        data: enrollments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('Course enrollments fetched successfully', { 
        courseId,
        requesterId,
        count: enrollments.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch course enrollments', { error, courseId, requesterId });
      throw error;
    }
  }

  /**
   * Get all enrollments for a student
   * @param studentId - Student ID
   * @param requesterId - User ID requesting the enrollments
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated enrollments
   */
  async getStudentEnrollments(
    studentId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: Enrollment[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching student enrollments', { studentId, requesterId, page, pageSize });

      // Verify student exists
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Students can only view their own enrollments
      if (requester.role === 'STUDENT' && requester.id !== studentId) {
        throw new ForbiddenError('Students can only view their own enrollments');
      }

      // Users can only view enrollments from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== student.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view enrollments for this student');
      }

      const skip = (page - 1) * pageSize;

      const [enrollments, total] = await Promise.all([
        this.prisma.enrollment.findMany({
          where: { userId: studentId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.enrollment.count({
          where: { userId: studentId },
        }),
      ]);

      const result = {
        data: enrollments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('Student enrollments fetched successfully', { 
        studentId,
        requesterId,
        count: enrollments.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch student enrollments', { error, studentId, requesterId });
      throw error;
    }
  }

  /**
   * Update enrollment status
   * @param id - Enrollment ID
   * @param status - New status
   * @param updaterId - User ID performing the update
   * @returns Updated enrollment
   */
  async updateEnrollmentStatus(
    id: string,
    status: EnrollmentStatus,
    updaterId: string
  ): Promise<Enrollment> {
    try {
      logger.info('Updating enrollment status', { id, status, updaterId });

      // Check if enrollment exists
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, role: true, organizationId: true },
          },
          course: {
            select: { id: true, organizationId: true },
          },
        },
      });

      if (!existingEnrollment) {
        throw new NotFoundError('Enrollment not found');
      }

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== existingEnrollment.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to update this enrollment');
      }

      // Only admins and instructors can update enrollment status
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can update enrollment status');
      }

      // Validate status transition
      this.validateStatusTransition(existingEnrollment.status, status);

      const enrollment = await this.prisma.enrollment.update({
        where: { id },
        data: {
          status,
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
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
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info('Enrollment status updated successfully', { 
        enrollmentId: id,
        status,
        updaterId 
      });

      return enrollment;
    } catch (error) {
      logger.error('Failed to update enrollment status', { error, id, status, updaterId });
      throw error;
    }
  }

  /**
   * Cancel enrollment
   * @param id - Enrollment ID
   * @param cancellerId - User ID performing the cancellation
   * @returns Success status
   */
  async cancelEnrollment(id: string, cancellerId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Cancelling enrollment', { id, cancellerId });

      // Check if enrollment exists
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, role: true, organizationId: true },
          },
        },
      });

      if (!existingEnrollment) {
        throw new NotFoundError('Enrollment not found');
      }

      // Verify canceller has permission
      const canceller = await this.prisma.user.findUnique({
        where: { id: cancellerId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!canceller) {
        throw new ForbiddenError('Canceller not found');
      }

      // Check permissions
      if (
        canceller.role !== 'ADMIN' &&
        canceller.organizationId !== existingEnrollment.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to cancel this enrollment');
      }

      // Students can cancel their own enrollments, admins and instructors can cancel any
      if (
        canceller.role === 'STUDENT' &&
        canceller.id !== existingEnrollment.userId
      ) {
        throw new ForbiddenError('Students can only cancel their own enrollments');
      }

      // Cannot cancel completed enrollments
      if (existingEnrollment.status === 'COMPLETED') {
        throw new ValidationError('Cannot cancel completed enrollment', {
          enrollment: ['Cannot cancel completed enrollment'],
        });
      }

      await this.prisma.enrollment.update({
        where: { id },
        data: {
          status: 'DROPPED',
        },
      });

      logger.info('Enrollment cancelled successfully', { 
        enrollmentId: id,
        cancellerId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to cancel enrollment', { error, id, cancellerId });
      throw error;
    }
  }

  /**
   * Get enrollment statistics
   * @param organizationId - Organization ID (optional)
   * @param requesterId - User ID requesting statistics
   * @returns Enrollment statistics
   */
  async getEnrollmentStats(
    organizationId?: string,
    requesterId?: string
  ): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    cancelledEnrollments: number;
    completionRate: number;
  }> {
    try {
      logger.info('Fetching enrollment statistics', { organizationId, requesterId });

      // If requesterId is provided, check permissions
      if (requesterId) {
        const requester = await this.prisma.user.findUnique({
          where: { id: requesterId },
          select: { id: true, role: true, organizationId: true },
        });

        if (!requester) {
          throw new ForbiddenError('Requester not found');
        }

        // Only admins can view cross-organization stats
        if (requester.role !== 'ADMIN' && organizationId && organizationId !== requester.organizationId) {
          throw new ForbiddenError('Insufficient permissions to view statistics for this organization');
        }

        // If no organizationId provided, use requester's organization
        if (!organizationId && requester.role !== 'ADMIN') {
          organizationId = requester.organizationId;
        }
      }

      const whereClause = organizationId ? { organizationId } : {};

      const [
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        cancelledEnrollments,
      ] = await Promise.all([
        this.prisma.enrollment.count({ where: whereClause }),
        this.prisma.enrollment.count({ where: { ...whereClause, status: 'ACTIVE' } }),
        this.prisma.enrollment.count({ where: { ...whereClause, status: 'COMPLETED' } }),
        this.prisma.enrollment.count({ where: { ...whereClause, status: 'DROPPED' } }),
      ]);

      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;

      const stats = {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        cancelledEnrollments,
        completionRate,
      };

      logger.info('Enrollment statistics fetched successfully', { 
        organizationId,
        requesterId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch enrollment statistics', { error, organizationId, requesterId });
      throw error;
    }
  }

  /**
   * Validate status transition
   * @param currentStatus - Current status
   * @param newStatus - New status
   */
  private validateStatusTransition(currentStatus: EnrollmentStatus, newStatus: EnrollmentStatus): void {
    const validTransitions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
      'ACTIVE': ['COMPLETED', 'DROPPED'],
      'COMPLETED': [], // Cannot transition from completed
      'DROPPED': ['ACTIVE'], // Can reactivate dropped enrollment
      'SUSPENDED': ['ACTIVE', 'DROPPED'], // Can reactivate or drop suspended enrollment
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`, {
        status: [`Cannot transition from ${currentStatus} to ${newStatus}`],
      });
    }
  }
}

// Export singleton instance
export const enrollmentService = new EnrollmentService(
  require('../lib/database').db
);
