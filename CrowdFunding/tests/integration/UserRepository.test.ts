import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../src/repositories/UserRepository';
import { UserRole } from '@prisma/client';

describe('UserRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let userRepository: UserRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    userRepository = new UserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.donation.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('create', () => {
    it('should create a user in the database', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
        role: UserRole.USER,
        bio: 'Test bio'
      };

      const user = await userRepository.create(userData);

      expect(user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        bio: userData.bio,
        isVerified: false
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();

      // Verify user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(dbUser).toMatchObject(userData);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'testpassword123',
        name: 'Test User'
      };

      // Create first user
      await userRepository.create(userData);

      // Try to create second user with same email
      await expect(userRepository.create(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const userData = {
        email: 'find@example.com',
        name: 'Find User',
        password: 'testpassword123'
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findById(createdUser.id);

      expect(foundUser).toMatchObject(createdUser);
    });

    it('should return null if user not found', async () => {
      const foundUser = await userRepository.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'email@example.com',
        name: 'Email User',
        password: 'testpassword123'
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(userData.email);

      expect(foundUser).toMatchObject(createdUser);
    });

    it('should return null if email not found', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = {
        email: 'update@example.com',
        password: 'testpassword123',
        name: 'Update User',
        bio: 'Original bio'
      };

      const createdUser = await userRepository.create(userData);
      
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };

      const updatedUser = await userRepository.update(createdUser.id, updateData);

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.bio).toBe(updateData.bio);
      expect(updatedUser.email).toBe(userData.email); // Should remain unchanged
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(createdUser.updatedAt.getTime());

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(dbUser).toMatchObject(updateData);
    });

    it('should throw error if user not found', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      await expect(userRepository.update('non-existent-id', updateData)).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete user from database', async () => {
      const userData = {
        email: 'delete@example.com',
        password: 'testpassword123',
        name: 'Delete User'
      };

      const createdUser = await userRepository.create(userData);
      await userRepository.delete(createdUser.id);

      // Verify user is deleted
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(dbUser).toBeNull();
    });

    it('should throw error if user not found', async () => {
      await expect(userRepository.delete('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        const user = await userRepository.create({
          email: `user${i}@example.com`,
          name: `User ${i}`,
          password: 'testpassword123'
        });
        users.push(user);
      }

      const result = await userRepository.findAll(1, 3);

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.users[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.users[1].createdAt.getTime());
    });

    it('should handle empty results', async () => {
      const result = await userRepository.findAll();

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('verifyUser', () => {
    it('should verify user', async () => {
      const userData = {
        email: 'verify@example.com',
        name: 'Verify User',
        password: 'testpassword123'
      };

      const createdUser = await userRepository.create(userData);
      expect(createdUser.isVerified).toBe(false);

      const verifiedUser = await userRepository.verifyUser(createdUser.id);

      expect(verifiedUser.isVerified).toBe(true);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(dbUser?.isVerified).toBe(true);
    });

    it('should throw error if user not found', async () => {
      await expect(userRepository.verifyUser('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const userData = {
        email: 'stats@example.com',
        name: 'Stats User',
        password: 'testpassword123'
      };

      const user = await userRepository.create(userData);

      // Create some campaigns for the user
      const campaign1 = await prisma.campaign.create({
        data: {
          title: 'Campaign 1',
          description: 'Description 1',
          goal: 1000,
          current: 500,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: user.id,
          status: 'ACTIVE'
        }
      });

      const campaign2 = await prisma.campaign.create({
        data: {
          title: 'Campaign 2',
          description: 'Description 2',
          goal: 2000,
          current: 1000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'ART',
          ownerId: user.id,
          status: 'ACTIVE'
        }
      });

      // Create some donations
      const otherUser = await userRepository.create({
        email: 'donor@example.com',
        name: 'Donor User',
        password: 'testpassword123'
      });

      await prisma.donation.create({
        data: {
          amount: 100,
          campaignId: campaign1.id,
          donorId: otherUser.id,
          paymentMethod: 'CREDIT_CARD',
          status: 'COMPLETED'
        }
      });

      await prisma.donation.create({
        data: {
          amount: 200,
          campaignId: campaign2.id,
          donorId: user.id,
          paymentMethod: 'CREDIT_CARD',
          status: 'COMPLETED'
        }
      });

      const stats = await userRepository.getUserStats(user.id);

      expect(stats).toEqual({
        campaignsCount: 2,
        donationsCount: 1,
        totalDonated: 200,
        totalRaised: 1500
      });
    });

    it('should handle user with no activity', async () => {
      const userData = {
        email: 'noactivity@example.com',
        name: 'No Activity User',
        password: 'testpassword123'
      };

      const user = await userRepository.create(userData);
      const stats = await userRepository.getUserStats(user.id);

      expect(stats).toEqual({
        campaignsCount: 0,
        donationsCount: 0,
        totalDonated: 0,
        totalRaised: 0
      });
    });

    it('should throw error if user not found', async () => {
      await expect(userRepository.getUserStats('non-existent-id')).rejects.toThrow('User not found');
    });
  });
});
