import { PrismaClient, UserRole } from '@prisma/client';
import { UserModel, CreateUserDto, UpdateUserDto } from '../../src/models/User';

// Mock Prisma client
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  campaign: {
    count: jest.fn(),
    aggregate: jest.fn()
  },
  donation: {
    count: jest.fn(),
    aggregate: jest.fn()
  }
} as any;

describe('UserModel', () => {
  let userModel: UserModel;

  beforeEach(() => {
    userModel = new UserModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with valid data', async () => {
      const userData: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'testpassword123',
        role: UserRole.USER,
        bio: 'Test bio'
      };

      const expectedUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        bio: userData.bio,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(expectedUser);

      const result = await userModel.create(userData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatar: undefined,
          bio: userData.bio,
          isVerified: false
        }
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if email already exists', async () => {
      const userData: CreateUserDto = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'testpassword123'
      };

      const existingUser = {
        id: 'existing-id',
        email: userData.email,
        name: 'Existing User'
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(userModel.create(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should use default values for optional fields', async () => {
      const userData: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'testpassword123'
      };

      const expectedUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        role: UserRole.USER,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(expectedUser);

      await userModel.create(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          role: UserRole.USER,
          avatar: undefined,
          bio: undefined,
          isVerified: false
        }
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userId = 'user-id';
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER
      };

      mockPrisma.user.findUnique.mockResolvedValue(expectedUser);

      const result = await userModel.findById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-id';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userModel.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: 'user-id',
        email: email,
        name: 'Test User',
        role: UserRole.USER
      };

      mockPrisma.user.findUnique.mockResolvedValue(expectedUser);

      const result = await userModel.findByEmail(email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: email }
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userModel.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user with valid data', async () => {
      const userId = 'user-id';
      const updateData: UpdateUserDto = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };

      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Original Name',
        bio: 'Original bio'
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userModel.update(userId, updateData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-id';
      const updateData: UpdateUserDto = {
        name: 'Updated Name'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userModel.update(userId, updateData)).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete user when found', async () => {
      const userId = 'user-id';
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.delete.mockResolvedValue(existingUser);

      await userModel.delete(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-id';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userModel.delete(userId)).rejects.toThrow('User not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const page = 2;
      const limit = 10;
      const users = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2' }
      ];
      const total = 25;

      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(total);

      const result = await userModel.findAll(page, limit);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 10, // (page - 1) * limit
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(result).toEqual({ users, total });
    });

    it('should use default pagination values', async () => {
      const users = [];
      const total = 0;

      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(total);

      const result = await userModel.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 0, // (1 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual({ users, total });
    });
  });

  describe('verifyUser', () => {
    it('should verify user when found', async () => {
      const userId = 'user-id';
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        isVerified: false
      };

      const verifiedUser = {
        ...existingUser,
        isVerified: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(verifiedUser);

      const result = await userModel.verifyUser(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isVerified: true }
      });
      expect(result).toEqual(verifiedUser);
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-id';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userModel.verifyUser(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const userId = 'user-id';
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };

      const campaignsCount = 5;
      const donationsCount = 10;
      const totalDonated = { _sum: { amount: 1000 } };
      const totalRaised = { _sum: { current: 5000 } };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.campaign.count.mockResolvedValue(campaignsCount);
      mockPrisma.donation.count.mockResolvedValue(donationsCount);
      mockPrisma.donation.aggregate.mockResolvedValue(totalDonated);
      mockPrisma.campaign.aggregate.mockResolvedValue(totalRaised);

      const result = await userModel.getUserStats(userId);

      expect(result).toEqual({
        campaignsCount: 5,
        donationsCount: 10,
        totalDonated: 1000,
        totalRaised: 5000
      });
    });

    it('should handle zero values in aggregates', async () => {
      const userId = 'user-id';
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };

      const campaignsCount = 0;
      const donationsCount = 0;
      const totalDonated = { _sum: { amount: null } };
      const totalRaised = { _sum: { current: null } };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.campaign.count.mockResolvedValue(campaignsCount);
      mockPrisma.donation.count.mockResolvedValue(donationsCount);
      mockPrisma.donation.aggregate.mockResolvedValue(totalDonated);
      mockPrisma.campaign.aggregate.mockResolvedValue(totalRaised);

      const result = await userModel.getUserStats(userId);

      expect(result).toEqual({
        campaignsCount: 0,
        donationsCount: 0,
        totalDonated: 0,
        totalRaised: 0
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-id';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userModel.getUserStats(userId)).rejects.toThrow('User not found');
    });
  });
});
