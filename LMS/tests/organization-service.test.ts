import { PrismaClient, UserRole } from '../src/generated/prisma';
import { OrganizationService } from '../src/services/organization.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('OrganizationService', () => {
  let prisma: PrismaClient;
  let organizationService: OrganizationService;
  let testOrganization: any;
  let testUser: any;
  let adminUser: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    organizationService = new OrganizationService(prisma);
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
        email: 'test@test-org.com',
        name: 'Test User',
        role: UserRole.INSTRUCTOR,
        organizationId: testOrganization.id,
        password: '$2a$10$test.hash', // Mock hashed password
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@system.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        organizationId: testOrganization.id,
        password: '$2a$10$test.hash', // Mock hashed password
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createOrganization', () => {
    it('should create a new organization successfully', async () => {
      const data = {
        name: 'New Organization',
        domain: 'new-org.com',
        settings: { theme: 'green' },
      };

      const organization = await organizationService.createOrganization(
        data,
        adminUser.id
      );

      expect(organization).toBeDefined();
      expect(organization.name).toBe(data.name);
      expect(organization.domain).toBe(data.domain);
      expect(organization.settings).toEqual(data.settings);
    });

    it('should throw ValidationError for duplicate domain', async () => {
      const data = {
        name: 'Duplicate Domain Org',
        domain: 'test-org.com', // Same as existing
      };

      await expect(
        organizationService.createOrganization(data, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should create organization without domain', async () => {
      const data = {
        name: 'No Domain Org',
      };

      const organization = await organizationService.createOrganization(
        data,
        adminUser.id
      );

      expect(organization).toBeDefined();
      expect(organization.name).toBe(data.name);
      expect(organization.domain).toBeNull();
    });
  });

  describe('getOrganizationById', () => {
    it('should get organization by ID successfully', async () => {
      const organization = await organizationService.getOrganizationById(
        testOrganization.id,
        testUser.id
      );

      expect(organization).toBeDefined();
      expect(organization.id).toBe(testOrganization.id);
      expect(organization.name).toBe(testOrganization.name);
      expect(organization.users).toBeDefined();
      expect(organization.courses).toBeDefined();
      expect(organization._count).toBeDefined();
    });

    it('should throw NotFoundError for non-existent organization', async () => {
      await expect(
        organizationService.getOrganizationById('non-existent-id', testUser.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllOrganizations', () => {
    it('should get all organizations for admin user', async () => {
      const result = await organizationService.getAllOrganizations(
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.organizations).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        organizationService.getAllOrganizations(testUser.id, 1, 10)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const updateData = {
        name: 'Updated Organization Name',
        settings: { theme: 'red' },
      };

      const organization = await organizationService.updateOrganization(
        testOrganization.id,
        updateData,
        adminUser.id
      );

      expect(organization).toBeDefined();
      expect(organization.name).toBe(updateData.name);
      expect(organization.settings).toEqual(updateData.settings);
    });

    it('should allow organization user to update their own organization', async () => {
      const updateData = {
        name: 'Updated by User',
      };

      const organization = await organizationService.updateOrganization(
        testOrganization.id,
        updateData,
        testUser.id
      );

      expect(organization).toBeDefined();
      expect(organization.name).toBe(updateData.name);
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
          role: UserRole.INSTRUCTOR,
          organizationId: otherOrg.id,
        },
      });

      const updateData = {
        name: 'Unauthorized Update',
      };

      await expect(
        organizationService.updateOrganization(
          testOrganization.id,
          updateData,
          otherUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError for duplicate domain', async () => {
      // Create another organization
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          domain: 'other-org.com',
        },
      });

      const updateData = {
        domain: 'other-org.com', // Same as other organization
      };

      await expect(
        organizationService.updateOrganization(
          testOrganization.id,
          updateData,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete empty organization successfully', async () => {
      // Create empty organization
      const emptyOrg = await prisma.organization.create({
        data: {
          name: 'Empty Organization',
          domain: 'empty-org.com',
        },
      });

      const result = await organizationService.deleteOrganization(
        emptyOrg.id,
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify organization is deleted
      const deletedOrg = await prisma.organization.findUnique({
        where: { id: emptyOrg.id },
      });
      expect(deletedOrg).toBeNull();
    });

    it('should throw ValidationError for organization with users', async () => {
      await expect(
        organizationService.deleteOrganization(testOrganization.id, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        organizationService.deleteOrganization(testOrganization.id, testUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getOrganizationStats', () => {
    it('should get organization statistics successfully', async () => {
      const stats = await organizationService.getOrganizationStats(
        testOrganization.id,
        testUser.id
      );

      expect(stats).toBeDefined();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.totalCourses).toBe(0);
      expect(stats.totalEnrollments).toBe(0);
      expect(stats.activeUsers).toBeGreaterThan(0);
      expect(stats.publishedCourses).toBe(0);
      expect(stats.completedEnrollments).toBe(0);
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
          role: UserRole.INSTRUCTOR,
          organizationId: otherOrg.id,
        },
      });

      await expect(
        organizationService.getOrganizationStats(testOrganization.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('searchOrganizations', () => {
    it('should search organizations successfully', async () => {
      const result = await organizationService.searchOrganizations(
        'Test',
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.organizations).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        organizationService.searchOrganizations('Test', testUser.id, 1, 10)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await organizationService.searchOrganizations(
        'NonExistentOrganization',
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.organizations).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
