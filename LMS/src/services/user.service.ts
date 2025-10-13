import { PrismaClient, User, UserRole, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';
import bcrypt from 'bcryptjs';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new user
   * @param data - User creation data
   * @param createdBy - User ID who created the user
   * @returns Created user (without password)
   */
  async createUser(
    data: Prisma.UserCreateInput,
    createdBy: string
  ): Promise<Omit<User, 'password'>> {
    try {
      logger.info('Creating user', { data: { ...data, password: '[REDACTED]' }, createdBy });

      // Verify creator has permission
      const creator = await this.prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true, organizationId: true },
      });

      if (!creator) {
        throw new ForbiddenError('Creator user not found');
      }

      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ValidationError('Email already exists', {
          email: ['Email must be unique'],
        });
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 10);
      }

      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          organization: {
            connect: { id: data.organization?.connect?.id || creator.organizationId },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User created successfully', { 
        userId: user.id,
        createdBy 
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', { error, createdBy });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @param requesterId - User ID requesting the user data
   * @returns User data (without password)
   */
  async getUserById(id: string, requesterId: string): Promise<Omit<User, 'password'>> {
    try {
      logger.info('Fetching user by ID', { id, requesterId });

      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          enrollments: {
            select: {
              id: true,
              status: true,
              enrolledAt: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              progress: true,
              quizAttempts: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view their own data unless they're admin or from same organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== user.organizationId &&
        requesterId !== id
      ) {
        throw new ForbiddenError('Insufficient permissions to view this user');
      }

      const { password, ...userWithoutPassword } = user;

      logger.info('User fetched successfully', { 
        userId: id,
        requesterId 
      });

      return userWithoutPassword;
    } catch (error) {
      logger.error('Failed to fetch user', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Get all users in an organization
   * @param organizationId - Organization ID
   * @param requesterId - User ID requesting the users
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated users
   */
  async getUsersByOrganization(
    organizationId: string,
    requesterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching users by organization', { organizationId, requesterId, page, limit });

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
        throw new ForbiddenError('Insufficient permissions to view users in this organization');
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: { organizationId },
          skip,
          take,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                enrollments: true,
                progress: true,
                quizAttempts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({
          where: { organizationId },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Users fetched successfully', { 
        organizationId,
        requesterId,
        count: users.length,
        total 
      });

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to fetch users by organization', { error, organizationId, requesterId, page, limit });
      throw error;
    }
  }

  /**
   * Update user
   * @param id - User ID
   * @param data - Update data
   * @param updaterId - User ID performing the update
   * @returns Updated user (without password)
   */
  async updateUser(
    id: string,
    data: Prisma.UserUpdateInput,
    updaterId: string
  ): Promise<Omit<User, 'password'>> {
    try {
      logger.info('Updating user', { id, data: { ...data, password: '[REDACTED]' }, updaterId });

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, organizationId: true },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
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
        updater.organizationId !== existingUser.organizationId &&
        updaterId !== id
      ) {
        throw new ForbiddenError('Insufficient permissions to update this user');
      }

      // Check email uniqueness if being updated
      if (data.email && typeof data.email === 'string') {
        const emailExists = await this.prisma.user.findFirst({
          where: {
            email: data.email,
            id: { not: id },
          },
        });

        if (emailExists) {
          throw new ValidationError('Email already exists', {
            email: ['Email must be unique'],
          });
        }
      }

      // Hash password if being updated
      if (data.password && typeof data.password === 'string') {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User updated successfully', { 
        userId: id,
        updaterId 
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, id, updaterId });
      throw error;
    }
  }

  /**
   * Delete user
   * @param id - User ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteUser(id: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting user', { id, deleterId });

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              enrollments: true,
              progress: true,
              quizAttempts: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
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
        deleter.organizationId !== existingUser.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this user');
      }

      // Prevent self-deletion
      if (deleterId === id) {
        throw new ValidationError('Cannot delete your own account', {
          user: ['Cannot delete your own account'],
        });
      }

      await this.prisma.user.delete({
        where: { id },
      });

      logger.info('User deleted successfully', { 
        userId: id,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete user', { error, id, deleterId });
      throw error;
    }
  }

  /**
   * Change user password
   * @param id - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Success status
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info('Changing user password', { id });

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.password) {
        throw new ValidationError('User has no password set', {
          password: ['User has no password set'],
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new ValidationError('Current password is incorrect', {
          currentPassword: ['Current password is incorrect'],
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      logger.info('Password changed successfully', { userId: id });

      return { success: true };
    } catch (error) {
      logger.error('Failed to change password', { error, id });
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param id - User ID
   * @param requesterId - User ID requesting statistics
   * @returns User statistics
   */
  async getUserStats(id: string, requesterId: string): Promise<{
    totalEnrollments: number;
    completedCourses: number;
    totalProgress: number;
    averageQuizScore: number;
    totalQuizAttempts: number;
  }> {
    try {
      logger.info('Fetching user statistics', { id, requesterId });

      // Verify requester has permission
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, organizationId: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Check permissions
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== user.organizationId &&
        requesterId !== id
      ) {
        throw new ForbiddenError('Insufficient permissions to view this user\'s statistics');
      }

      const [
        totalEnrollments,
        completedCourses,
        totalProgress,
        quizStats,
      ] = await Promise.all([
        this.prisma.enrollment.count({
          where: { userId: id },
        }),
        this.prisma.enrollment.count({
          where: {
            userId: id,
            status: 'COMPLETED',
          },
        }),
        this.prisma.progress.count({
          where: {
            userId: id,
            status: 'COMPLETED',
          },
        }),
        this.prisma.quizAttempt.aggregate({
          where: { userId: id },
          _avg: { score: true },
          _count: { id: true },
        }),
      ]);

      const stats = {
        totalEnrollments,
        completedCourses,
        totalProgress,
        averageQuizScore: quizStats._avg.score || 0,
        totalQuizAttempts: quizStats._count.id,
      };

      logger.info('User statistics fetched successfully', { 
        userId: id,
        requesterId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch user statistics', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Search users
   * @param query - Search query
   * @param organizationId - Organization ID to search within
   * @param requesterId - User ID performing the search
   * @param page - Page number
   * @param limit - Items per page
   * @returns Search results
   */
  async searchUsers(
    query: string,
    organizationId: string,
    requesterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      logger.info('Searching users', { query, organizationId, requesterId, page, limit });

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
        throw new ForbiddenError('Insufficient permissions to search users in this organization');
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const whereClause: Prisma.UserWhereInput = {
        organizationId,
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      };

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          skip,
          take,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                enrollments: true,
                progress: true,
                quizAttempts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('User search completed', { 
        query,
        organizationId,
        requesterId,
        count: users.length,
        total 
      });

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to search users', { error, query, organizationId, requesterId, page, limit });
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService(
  require('../lib/database').db
);
