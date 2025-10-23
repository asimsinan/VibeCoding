import request from 'supertest';
import app from '../../../src/app';
import { UserService } from '../../../src/lib/services/user';

// Mock services
jest.mock('../../../src/lib/services/user');

describe('UserController', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = new UserService({} as any, {} as any) as jest.Mocked<UserService>;
    (UserService as jest.MockedClass<typeof UserService>).mockImplementation(() => mockUserService);
  });

  describe('GET /api/v1/users/profile', () => {
    it('should get user profile successfully', async () => {
      const userProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'USER',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.getUserStats.mockResolvedValue({
        success: true,
        stats: {
          totalCampaigns: 2,
          successfulCampaigns: 1,
          totalRaised: 10000,
          totalDonated: 500,
          averageCampaignGoal: 5000
        }
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.stats).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile successfully', async () => {
      const profileData = {
        name: 'John Updated',
        bio: 'Updated bio',
        avatar: 'https://example.com/new-avatar.jpg',
        location: 'San Francisco, CA'
      };

      mockUserService.updateUserProfile.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'John Updated',
          role: 'USER',
          avatar: 'https://example.com/new-avatar.jpg',
          bio: 'Updated bio',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', 'Bearer user-token')
        .send(profileData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe(profileData.name);
      expect(response.body.user.bio).toBe(profileData.bio);
    });

    it('should return 400 for invalid profile data', async () => {
      const invalidData = {
        name: '', // Invalid empty name
        bio: 'Valid bio'
      };

      mockUserService.updateUserProfile.mockResolvedValue({
        success: false,
        error: 'Invalid profile data'
      });

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', 'Bearer user-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const profileData = {
        name: 'John Updated',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .send(profileData);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/users/profile/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!'
      };

      mockUserService.changePassword.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .post('/api/v1/users/profile/change-password')
        .set('Authorization', 'Bearer user-token')
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        expect.any(String),
        passwordData
      );
    });

    it('should return 400 for invalid password data', async () => {
      const invalidData = {
        currentPassword: 'WrongPass123!',
        newPassword: 'weak' // Invalid weak password
      };

      mockUserService.changePassword.mockResolvedValue({
        success: false,
        error: 'Current password is incorrect'
      });

      const response = await request(app)
        .post('/api/v1/users/profile/change-password')
        .set('Authorization', 'Bearer user-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!'
      };

      const response = await request(app)
        .post('/api/v1/users/profile/change-password')
        .send(passwordData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/profile/stats', () => {
    it('should get user statistics', async () => {
      const userStats = {
        totalCampaigns: 3,
        successfulCampaigns: 2,
        totalRaised: 15000,
        totalDonated: 750,
        averageCampaignGoal: 7500
      };

      mockUserService.getUserStats.mockResolvedValue({
        success: true,
        stats: userStats
      });

      const response = await request(app)
        .get('/api/v1/users/profile/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toEqual(userStats);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/users/register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      };

      mockUserService.createUser.mockResolvedValue({
        success: true,
        user: {
          id: 'user-456',
          email: userData.email,
          name: userData.name,
          role: 'USER',
          avatar: '',
          bio: '',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
    });

    it('should return 400 for invalid registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        name: 'New User'
      };

      mockUserService.createUser.mockResolvedValue({
        success: false,
        error: 'Invalid email format'
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      };

      mockUserService.createUser.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      mockUserService.authenticateUser.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: credentials.email,
          name: 'John Doe',
          role: 'USER',
          avatar: '',
          bio: '',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(credentials.email);
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'WrongPassword123!'
      };

      mockUserService.authenticateUser.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
