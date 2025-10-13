import { PrismaClient, UserRole } from '../src/generated/prisma';
import { UserService } from '../src/services/user.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('UserService', () => {
  let prisma: PrismaClient;
  let userService: UserService;
  let testOrganization: any;
  let testUser: any;
  let adminUser: any;
  let instructorUser: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    userService = new UserService(prisma);
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
        password: '$2a$10$test.hash', // Mock hashed password
      },
    });

    instructorUser = await prisma.user.create({
      data: {
        email: 'instructor@test-org.com',
        name: 'Test Instructor',
        role: UserRole.INSTRUCTOR,
        organizationId: testOrganization.id,
        password: '$2a$10$test.hash',
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@system.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        organizationId: testOrganization.id,
        password: '$2a$10$test.hash',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const data = {
        email: 'newuser@test-org.com',
        name: 'New User',
        password: 'password123',
        role: UserRole.STUDENT,
        organizationId: testOrganization.id,
      };

      const user = await userService.createUser(data, adminUser.id);

      expect(user).toBeDefined();
      expect(user.email).toBe(data.email);
      expect(user.name).toBe(data.name);
      expect(user.role).toBe(data.role);
      expect(user.organizationId).toBe(data.organizationId);
      expect(user.password).toBeUndefined(); // Password should not be returned
    });

    it('should throw ValidationError for duplicate email', async () => {
      const data = {
        email: 'student@test-org.com', // Same as existing user
        name: 'Duplicate User',
        password: 'password123',
      };

      await expect(
        userService.createUser(data, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should create user without password', async () => {
      const data = {
        email: 'nopassword@test-org.com',
        name: 'No Password User',
        role: UserRole.STUDENT,
      };

      const user = await userService.createUser(data, adminUser.id);

      expect(user).toBeDefined();
      expect(user.email).toBe(data.email);
      expect(user.name).toBe(data.name);
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const user = await userService.getUserById(testUser.id, testUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
      expect(user.password).toBeUndefined(); // Password should not be returned
      expect(user.organization).toBeDefined();
      expect(user.enrollments).toBeDefined();
      expect(user._count).toBeDefined();
    });

    it('should allow admin to view any user', async () => {
      const user = await userService.getUserById(testUser.id, adminUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
    });

    it('should allow users from same organization to view each other', async () => {
      const user = await userService.getUserById(testUser.id, instructorUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
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
        userService.getUserById(testUser.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(
        userService.getUserById('non-existent-id', adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUsersByOrganization', () => {
    it('should get users by organization successfully', async () => {
      const result = await userService.getUsersByOrganization(
        testOrganization.id,
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('should allow organization users to view their organization users', async () => {
      const result = await userService.getUsersByOrganization(
        testOrganization.id,
        instructorUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
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
        userService.getUsersByOrganization(testOrganization.id, otherUser.id, 1, 10)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@test-org.com',
      };

      const user = await userService.updateUser(
        testUser.id,
        updateData,
        adminUser.id
      );

      expect(user).toBeDefined();
      expect(user.name).toBe(updateData.name);
      expect(user.email).toBe(updateData.email);
    });

    it('should allow user to update their own profile', async () => {
      const updateData = {
        name: 'Self Updated Name',
      };

      const user = await userService.updateUser(
        testUser.id,
        updateData,
        testUser.id
      );

      expect(user).toBeDefined();
      expect(user.name).toBe(updateData.name);
    });

    it('should throw ValidationError for duplicate email', async () => {
      const updateData = {
        email: 'instructor@test-org.com', // Same as existing user
      };

      await expect(
        userService.updateUser(testUser.id, updateData, adminUser.id)
      ).rejects.toThrow(ValidationError);
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
          role: UserRole.STUDENT,
          organizationId: otherOrg.id,
        },
      });

      const updateData = {
        name: 'Unauthorized Update',
      };

      await expect(
        userService.updateUser(testUser.id, updateData, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const result = await userService.deleteUser(testUser.id, adminUser.id);

      expect(result.success).toBe(true);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should throw ValidationError for self-deletion', async () => {
      await expect(
        userService.deleteUser(testUser.id, testUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError for unauthorized deletion', async () => {
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
        userService.deleteUser(testUser.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock bcrypt.compare to return true for current password
      const bcrypt = require('bcryptjs');
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await userService.changePassword(
        testUser.id,
        'currentPassword',
        'newPassword123'
      );

      expect(result.success).toBe(true);

      // Restore original function
      bcrypt.compare = originalCompare;
    });

    it('should throw ValidationError for incorrect current password', async () => {
      // Mock bcrypt.compare to return false for current password
      const bcrypt = require('bcryptjs');
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        userService.changePassword(testUser.id, 'wrongPassword', 'newPassword123')
      ).rejects.toThrow(ValidationError);

      // Restore original function
      bcrypt.compare = originalCompare;
    });

    it('should throw ValidationError for user without password', async () => {
      // Create user without password
      const userWithoutPassword = await prisma.user.create({
        data: {
          email: 'nopassword@test-org.com',
          name: 'No Password User',
          role: UserRole.STUDENT,
          organizationId: testOrganization.id,
        },
      });

      await expect(
        userService.changePassword(userWithoutPassword.id, 'currentPassword', 'newPassword123')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics successfully', async () => {
      const stats = await userService.getUserStats(testUser.id, testUser.id);

      expect(stats).toBeDefined();
      expect(stats.totalEnrollments).toBe(0);
      expect(stats.completedCourses).toBe(0);
      expect(stats.totalProgress).toBe(0);
      expect(stats.averageQuizScore).toBe(0);
      expect(stats.totalQuizAttempts).toBe(0);
    });

    it('should allow admin to view any user stats', async () => {
      const stats = await userService.getUserStats(testUser.id, adminUser.id);

      expect(stats).toBeDefined();
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
        userService.getUserStats(testUser.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const result = await userService.searchUsers(
        'Test',
        testOrganization.id,
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
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
        userService.searchUsers('Test', testOrganization.id, otherUser.id, 1, 10)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await userService.searchUsers(
        'NonExistentUser',
        testOrganization.id,
        adminUser.id,
        1,
        10
      );

      expect(result).toBeDefined();
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
