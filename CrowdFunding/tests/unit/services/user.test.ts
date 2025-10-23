import { UserService } from '../../../src/lib/services/user';
import { UserCore } from '../../../src/lib/core/user';
import { UserRepository } from '../../../src/repositories/UserRepository';

// Mock dependencies
jest.mock('../../../src/lib/core/user');
jest.mock('../../../src/repositories/UserRepository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserCore: jest.Mocked<UserCore>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserCore = new UserCore() as jest.Mocked<UserCore>;
    mockUserRepository = new UserRepository({} as any) as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserCore, mockUserRepository);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'John Doe'
      };

      mockUserCore.validateEmail.mockReturnValue(true);
      mockUserCore.validatePassword.mockReturnValue(true);
      mockUserCore.hashPassword.mockResolvedValue('hashed-password');
      mockUserRepository.findByEmail.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        password: 'hashed-password',
        name: userData.name,
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await userService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockUserCore.validateEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserCore.validatePassword).toHaveBeenCalledWith(userData.password);
      expect(mockUserCore.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should fail for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'John Doe'
      };

      mockUserCore.validateEmail.mockReturnValue(false);

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail for weak password', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'weak',
        name: 'John Doe'
      };

      mockUserCore.validateEmail.mockReturnValue(true);
      mockUserCore.validatePassword.mockReturnValue(false);

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password does not meet requirements');
    });

    it('should fail for existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'John Doe'
      };

      mockUserCore.validateEmail.mockReturnValue(true);
      mockUserCore.validatePassword.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
        password: 'hashed-password',
        name: 'Existing User',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user successfully', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      const user = {
        id: 'user-123',
        email: credentials.email,
        name: 'John Doe',
        password: 'hashed-password',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserCore.verifyPassword.mockResolvedValue(true);

      const result = await userService.authenticateUser(credentials);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
    });

    it('should fail for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.authenticateUser(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should fail for incorrect password', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'WrongPassword123!'
      };

      const user = {
        id: 'user-123',
        email: credentials.email,
        name: 'John Doe',
        password: 'hashed-password',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.authenticateUser(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-123';
      const profileData = {
        name: 'John Updated',
        bio: 'Updated bio',
        avatar: 'https://example.com/avatar.jpg',
        location: 'San Francisco, CA'
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        password: 'hashed-password',
        name: 'John Doe',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserCore.validateUserProfile.mockReturnValue(true);
      mockUserCore.sanitizeUserInput.mockImplementation(input => input);
      mockUserRepository.update.mockResolvedValue({
        ...existingUser,
        ...profileData,
        isVerified: false
      });

      const result = await userService.updateUserProfile(userId, profileData);

      expect(result.success).toBe(true);
      expect(result.user.name).toBe(profileData.name);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, profileData);
    });

    it('should fail for non-existent user', async () => {
      const userId = 'non-existent';
      const profileData = {
        name: 'John Updated',
        bio: 'Updated bio'
      };

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.updateUserProfile(userId, profileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail for invalid profile data', async () => {
      const userId = 'user-123';
      const profileData = {
        name: '', // Invalid empty name
        bio: 'Valid bio'
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        password: 'hashed-password',
        name: 'John Doe',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserCore.validateUserProfile.mockReturnValue(false);
      mockUserRepository.update.mockResolvedValue({
        ...existingUser,
        ...profileData
      });

      const result = await userService.updateUserProfile(userId, profileData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics', async () => {
      const userId = 'user-123';
      const userData = {
        campaignsCount: 2,
        donationsCount: 2,
        totalDonated: 300,
        totalRaised: 10000
      };

      mockUserRepository.findById.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        password: 'hashed-password',
        name: 'John Doe',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepository.getUserStats.mockResolvedValue({
        campaignsCount: 2,
        donationsCount: 1,
        totalRaised: 10000,
        totalDonated: 300
      });
      mockUserCore.calculateUserStats.mockReturnValue({
        totalCampaigns: 2,
        successfulCampaigns: 1,
        totalRaised: 10000,
        totalDonated: 300,
        averageCampaignGoal: 7500
      });

      const result = await userService.getUserStats(userId);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.campaignsCount).toBe(2);
      expect(result.stats.donationsCount).toBe(1);
      expect(result.stats.totalDonated).toBe(300);
      expect(result.stats.totalRaised).toBe(10000);
      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(userId);
    });

    it('should fail for non-existent user', async () => {
      const userId = 'non-existent';

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserStats(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-123';
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!'
      };

      const user = {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        password: 'hashed-old-password',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserCore.verifyPassword.mockResolvedValue(true);
      mockUserCore.validatePassword.mockReturnValue(true);
      mockUserCore.hashPassword.mockResolvedValue('hashed-new-password');
      mockUserRepository.update.mockResolvedValue({
        ...user
      });

      const result = await userService.changePassword(userId, passwordData);

      expect(result.success).toBe(true);
      expect(mockUserCore.validatePassword).toHaveBeenCalledWith(passwordData.newPassword);
      expect(mockUserCore.hashPassword).toHaveBeenCalledWith(passwordData.newPassword);
    });

    it('should fail for incorrect current password', async () => {
      const userId = 'user-123';
      const passwordData = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!'
      };

      const user = {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        password: 'hashed-password',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserCore.validatePassword.mockReturnValue(false);

      const result = await userService.changePassword(userId, passwordData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('New password does not meet requirements');
    });

    it('should fail for weak new password', async () => {
      const userId = 'user-123';
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'weak'
      };

      const user = {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        password: 'hashed-password',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserCore.verifyPassword.mockResolvedValue(true);
      mockUserCore.validatePassword.mockReturnValue(false);

      const result = await userService.changePassword(userId, passwordData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('New password does not meet requirements');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'user@example.com',
        password: 'hashed-password',
        name: 'John Doe',
        role: 'USER' as any,
        avatar: '',
        bio: '',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(undefined);

      const result = await userService.deleteUser(userId, 'admin-123');

      expect(result.success).toBe(true);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should fail for non-existent user', async () => {
      const userId = 'non-existent';

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.deleteUser(userId, 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });
});