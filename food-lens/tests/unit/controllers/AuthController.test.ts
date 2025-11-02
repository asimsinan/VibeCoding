import { AuthController } from '../../../src/lib/food-label-scanner/services/controllers/AuthController';
import { authService } from '../../../src/lib/food-label-scanner/services/api/AuthService';
import { ValidationError, AuthenticationError } from '../../../src/lib/food-label-scanner/utils/errors';
import { User } from '../../../src/lib/food-label-scanner/models/User';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../../../src/lib/food-label-scanner/services/api/AuthService');

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    controller = new AuthController();
    jest.clearAllMocks();
  });

  describe('Request Handling', () => {
    it('should handle registration request with valid data', async () => {
      const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: '3600',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
    });

    it('should handle login request with valid credentials', async () => {
      const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: '3600',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
    });

    it('should handle logout request', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle concurrent registration requests', async () => {
      const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: '3600',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const requests = [
        controller.register({ email: 'test1@example.com', password: 'pass1', displayName: 'User 1' }),
        controller.register({ email: 'test2@example.com', password: 'pass2', displayName: 'User 2' }),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Response Formatting', () => {
    it('should format successful registration response', async () => {
      const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: '3600',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.user).toEqual(mockUser);
      expect(result.data?.token).toBe('mock-token');
      expect(result.data?.expiresIn).toBe('3600');
      expect(result.error).toBeUndefined();
    });

    it('should format successful login response', async () => {
      const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: '3600',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.token).toBe('mock-token');
    });

    it('should format logout response', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout();

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('Error Management', () => {
    it('should format validation error response', async () => {
      mockAuthService.register.mockRejectedValue(
        new ValidationError('Invalid email format')
      );

      const result = await controller.register({
        email: 'invalid-email',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Invalid email format');
      expect(result.data).toBeUndefined();
    });

    it('should format authentication error response', async () => {
      mockAuthService.login.mockRejectedValue(
        new AuthenticationError('Invalid credentials')
      );

      const result = await controller.login({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('AUTHENTICATION_ERROR');
      expect(result.error?.message).toContain('Invalid credentials');
    });

    it('should format unknown error response', async () => {
      mockAuthService.register.mockRejectedValue(
        new Error('Network error')
      );

      const result = await controller.register({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle service unavailable errors', async () => {
      mockAuthService.login.mockRejectedValue(
        new Error('Service unavailable')
      );

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Service unavailable');
    });

    it('should preserve error details in response', async () => {
      const validationError = new ValidationError('Email already in use');
      mockAuthService.register.mockRejectedValue(validationError);

      const result = await controller.register({
        email: 'existing@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.statusCode).toBe(400);
      expect(result.error?.message).toBe('Email already in use');
    });
  });
});
