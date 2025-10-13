import { PrismaClient, Organization, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export class OrganizationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new organization
   * @param data - Organization creation data
   * @param createdBy - User ID who created the organization
   * @returns Created organization
   */
  async createOrganization(
    data: Prisma.OrganizationCreateInput,
    createdBy: string
  ): Promise<Organization> {
    try {
      logger.info('Creating organization', { data, createdBy });

      // Validate domain uniqueness if provided
      if (data.domain) {
        const existingOrg = await this.prisma.organization.findUnique({
          where: { domain: data.domain },
        });

        if (existingOrg) {
          throw new ValidationError('Domain already exists', {
            domain: ['Domain must be unique'],
          });
        }
      }

      const organization = await this.prisma.organization.create({
        data: {
          ...data,
          settings: data.settings || {},
        },
      });

      logger.info('Organization created successfully', { 
        organizationId: organization.id,
        createdBy 
      });

      return organization;
    } catch (error) {
      logger.error('Failed to create organization', { error, data, createdBy });
      throw error;
    }
  }

  /**
   * Get organization by ID
   * @param id - Organization ID
   * @param userId - User ID requesting the organization
   * @returns Organization data
   */
  async getOrganizationById(id: string, userId: string): Promise<Organization> {
    try {
      logger.info('Fetching organization by ID', { id, userId });

      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
          courses: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              users: true,
              courses: true,
              enrollments: true,
            },
          },
        },
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      logger.info('Organization fetched successfully', { 
        organizationId: id,
        userId 
      });

      return organization;
    } catch (error) {
      logger.error('Failed to fetch organization', { error, id, userId });
      throw error;
    }
  }

  /**
   * Get all organizations (admin only)
   * @param userId - User ID requesting organizations
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @returns Paginated organizations
   */
  async getAllOrganizations(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    organizations: Organization[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching all organizations', { userId, page, limit });

      // Verify user is admin (this would be checked in middleware)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can view all organizations');
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const [organizations, total] = await Promise.all([
        this.prisma.organization.findMany({
          skip,
          take,
          include: {
            _count: {
              select: {
                users: true,
                courses: true,
                enrollments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.organization.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('All organizations fetched successfully', { 
        userId,
        count: organizations.length,
        total 
      });

      return {
        organizations,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to fetch all organizations', { error, userId, page, limit });
      throw error;
    }
  }

  /**
   * Update organization
   * @param id - Organization ID
   * @param data - Update data
   * @param userId - User ID performing the update
   * @returns Updated organization
   */
  async updateOrganization(
    id: string,
    data: Prisma.OrganizationUpdateInput,
    userId: string
  ): Promise<Organization> {
    try {
      logger.info('Updating organization', { id, data, userId });

      // Check if organization exists
      const existingOrg = await this.prisma.organization.findUnique({
        where: { id },
      });

      if (!existingOrg) {
        throw new NotFoundError('Organization not found');
      }

      // Verify user has permission to update this organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true },
      });

      if (!user) {
        throw new ForbiddenError('User not found');
      }

      // Only admins or users from the same organization can update
      if (user.role !== 'ADMIN' && user.organizationId !== id) {
        throw new ForbiddenError('Insufficient permissions to update this organization');
      }

      // Validate domain uniqueness if being updated
      if (data.domain && typeof data.domain === 'string') {
        const domainExists = await this.prisma.organization.findFirst({
          where: {
            domain: data.domain,
            id: { not: id },
          },
        });

        if (domainExists) {
          throw new ValidationError('Domain already exists', {
            domain: ['Domain must be unique'],
          });
        }
      }

      const organization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      logger.info('Organization updated successfully', { 
        organizationId: id,
        userId 
      });

      return organization;
    } catch (error) {
      logger.error('Failed to update organization', { error, id, data, userId });
      throw error;
    }
  }

  /**
   * Delete organization
   * @param id - Organization ID
   * @param userId - User ID performing the deletion
   * @returns Success status
   */
  async deleteOrganization(id: string, userId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting organization', { id, userId });

      // Check if organization exists
      const existingOrg = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              courses: true,
            },
          },
        },
      });

      if (!existingOrg) {
        throw new NotFoundError('Organization not found');
      }

      // Verify user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can delete organizations');
      }

      // Check if organization has users or courses
      if (existingOrg._count.users > 0 || existingOrg._count.courses > 0) {
        throw new ValidationError('Cannot delete organization with existing users or courses', {
          organization: ['Organization must be empty before deletion'],
        });
      }

      await this.prisma.organization.delete({
        where: { id },
      });

      logger.info('Organization deleted successfully', { 
        organizationId: id,
        userId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete organization', { error, id, userId });
      throw error;
    }
  }

  /**
   * Get organization statistics
   * @param id - Organization ID
   * @param userId - User ID requesting statistics
   * @returns Organization statistics
   */
  async getOrganizationStats(id: string, userId: string): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    activeUsers: number;
    publishedCourses: number;
    completedEnrollments: number;
  }> {
    try {
      logger.info('Fetching organization statistics', { id, userId });

      // Verify user has access to this organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, organizationId: true },
      });

      if (!user) {
        throw new ForbiddenError('User not found');
      }

      if (user.role !== 'ADMIN' && user.organizationId !== id) {
        throw new ForbiddenError('Insufficient permissions to view organization statistics');
      }

      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers,
        publishedCourses,
        completedEnrollments,
      ] = await Promise.all([
        this.prisma.user.count({
          where: { organizationId: id },
        }),
        this.prisma.course.count({
          where: { organizationId: id },
        }),
        this.prisma.enrollment.count({
          where: { organizationId: id },
        }),
        this.prisma.user.count({
          where: {
            organizationId: id,
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        this.prisma.course.count({
          where: {
            organizationId: id,
            status: 'PUBLISHED',
          },
        }),
        this.prisma.enrollment.count({
          where: {
            organizationId: id,
            status: 'COMPLETED',
          },
        }),
      ]);

      const stats = {
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers,
        publishedCourses,
        completedEnrollments,
      };

      logger.info('Organization statistics fetched successfully', { 
        organizationId: id,
        userId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch organization statistics', { error, id, userId });
      throw error;
    }
  }

  /**
   * Search organizations
   * @param query - Search query
   * @param userId - User ID performing the search
   * @param page - Page number
   * @param limit - Items per page
   * @returns Search results
   */
  async searchOrganizations(
    query: string,
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    organizations: Organization[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      logger.info('Searching organizations', { query, userId, page, limit });

      // Verify user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can search organizations');
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const whereClause: Prisma.OrganizationWhereInput = {
        OR: [
          { name: { contains: query } },
          { domain: { contains: query } },
        ],
      };

      const [organizations, total] = await Promise.all([
        this.prisma.organization.findMany({
          where: whereClause,
          skip,
          take,
          include: {
            _count: {
              select: {
                users: true,
                courses: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.organization.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Organization search completed', { 
        query,
        userId,
        count: organizations.length,
        total 
      });

      return {
        organizations,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to search organizations', { error, query, userId, page, limit });
      throw error;
    }
  }
}

// Export singleton instance
export const organizationService = new OrganizationService(
  require('../lib/database').db
);
