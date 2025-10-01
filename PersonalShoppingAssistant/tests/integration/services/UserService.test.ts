import { UserService } from '@/lib/services/UserService';
import { DatabaseService } from '@/backend/src/services/DatabaseService';
import { UserRegisterData, UserLoginData, UserUpdateData } from '@/lib/recommendation-engine/models/User';
import { UserPreferencesUpdateData } from '@/lib/recommendation-engine/models/UserPreferences';

describe('UserService Integration Tests', () => {
  let userService: UserService;
  let db: DatabaseService;
  let testUserId: number;

  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
    userService = new UserService(db);
  });

  afterAll(async () => {
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test%']);
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData: UserRegisterData = {
        email: 'test@example.com',
        password: 'password123',
        preferences: {
          categories: ['Electronics', 'Books'],
          priceRange: { min: 10, max: 500 },
          brands: ['Apple', 'Samsung'],
          stylePreferences: ['Modern', 'Minimalist']
        }
      };

      const result = await userService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.preferences).toBeDefined();
      expect(result.user.preferences!.categories).toEqual(userData.preferences.categories);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      testUserId = result.user.id;
    });

    it('should fail to register user with existing email', async () => {
      const userData: UserRegisterData = {
        email: 'test@example.com',
        password: 'password123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 10, max: 100 },
          brands: ['Apple'],
          stylePreferences: ['Modern']
        }
      };

      await expect(userService.register(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should fail to register user with invalid data', async () => {
      const userData: UserRegisterData = {
        email: 'invalid-email',
        password: '123', // Too short
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 10, max: 100 },
          brands: ['Apple'],
          stylePreferences: ['Modern']
        }
      };

      await expect(userService.register(userData)).rejects.toThrow('Validation failed');
    });
  });

  describe('User Login', () => {
    it('should login user with correct credentials', async () => {
      const loginData: UserLoginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await userService.login(loginData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should fail to login with incorrect password', async () => {
      const loginData: UserLoginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(userService.login(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should fail to login with non-existent email', async () => {
      const loginData: UserLoginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(userService.login(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('User Profile Management', () => {
    it('should get user profile with interaction stats', async () => {
      const profile = await userService.getProfile(testUserId);

      expect(profile).toBeDefined();
      expect(profile.email).toBe('test@example.com');
      expect(profile.preferences).toBeDefined();
      expect(profile.interactionStats).toBeDefined();
      expect(profile.interactionStats.totalInteractions).toBe(0); // No interactions yet
    });

    it('should update user profile', async () => {
      const updateData: UserUpdateData = {
        email: 'updated@example.com'
      };

      const updatedUser = await userService.updateProfile(testUserId, updateData);

      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.id).toBe(testUserId);
    });

    it('should fail to update with existing email', async () => {
      // Create another user
      const anotherUserData: UserRegisterData = {
        email: 'another@example.com',
        password: 'password123',
        preferences: {
          categories: ['Electronics'],
          priceRange: { min: 10, max: 100 },
          brands: ['Apple'],
          stylePreferences: ['Modern']
        }
      };

      const anotherUser = await userService.register(anotherUserData);

      const updateData: UserUpdateData = {
        email: 'another@example.com'
      };

      await expect(userService.updateProfile(testUserId, updateData)).rejects.toThrow('Email already in use');

      // Clean up
      await userService.deleteUser(anotherUser.user.id);
    });
  });

  describe('User Preferences Management', () => {
    it('should update user preferences', async () => {
      const preferencesData: UserPreferencesUpdateData = {
        categories: ['Electronics', 'Books', 'Clothing'],
        priceRange: { min: 50, max: 1000 },
        brands: ['Apple', 'Samsung', 'Nike'],
        stylePreferences: ['Modern', 'Classic']
      };

      const updatedPreferences = await userService.updatePreferences(testUserId, preferencesData);

      expect(updatedPreferences.categories).toEqual(preferencesData.categories);
      expect(updatedPreferences.priceRange).toEqual(preferencesData.priceRange);
      expect(updatedPreferences.brands).toEqual(preferencesData.brands);
      expect(updatedPreferences.stylePreferences).toEqual(preferencesData.stylePreferences);
    });

    it('should fail to update preferences with invalid data', async () => {
      const preferencesData: UserPreferencesUpdateData = {
        categories: new Array(25).fill('Category'), // Too many categories
        priceRange: { min: 100, max: 50 }, // Invalid range
        brands: ['Apple'],
        stylePreferences: ['Modern']
      };

      await expect(userService.updatePreferences(testUserId, preferencesData)).rejects.toThrow('Validation failed');
    });
  });

  describe('Token Management', () => {
    it('should validate valid token', async () => {
      const loginData: UserLoginData = {
        email: 'updated@example.com',
        password: 'password123'
      };

      const { token } = await userService.login(loginData);
      const decoded = await userService.validateToken(token);

      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe('updated@example.com');
    });

    it('should fail to validate invalid token', async () => {
      await expect(userService.validateToken('invalid-token')).rejects.toThrow('Invalid or expired token');
    });

    it('should refresh token', async () => {
      const newToken = await userService.refreshToken(testUserId);

      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');

      const decoded = await userService.validateToken(newToken);
      expect(decoded.userId).toBe(testUserId);
    });
  });

  describe('User Deletion', () => {
    it('should delete user and all related data', async () => {
      const deleteResult = await userService.deleteUser(testUserId);

      expect(deleteResult).toBe(true);

      // Verify user is deleted
      await expect(userService.getProfile(testUserId)).rejects.toThrow('User not found');
    });
  });
});
