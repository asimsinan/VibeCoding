import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../src/middleware/auth';

// Mock the entire auth service module
jest.mock('../../src/lib/services/auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn()
  }))
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthServiceInstance: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Get the mocked AuthService instance
    const { AuthService } = require('../../src/lib/services/auth');
    mockAuthServiceInstance = new AuthService();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthServiceInstance.verifyToken.mockResolvedValue({
        success: true,
        user: mockUser
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthServiceInstance.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthServiceInstance.verifyToken.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token verification errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthServiceInstance.verifyToken.mockRejectedValue(new Error('Service error'));

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for user with required role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      };

      mockRequest.user = mockUser;

      await authorize(['ADMIN'])(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for user with one of multiple required roles', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      };

      mockRequest.user = mockUser;

      await authorize(['USER', 'MODERATOR'])(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without required role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      };

      mockRequest.user = mockUser;

      await authorize(['ADMIN'])(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', async () => {
      mockRequest.user = undefined;

      await authorize(['USER'])(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      };

      mockRequest.user = mockUser;

      await authorize([])(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('resource ownership authorization', () => {
    it('should allow access for resource owner', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'owner@example.com',
        name: 'Owner User',
        role: 'USER'
      };

      mockRequest.user = mockUser;
      mockRequest.params = { userId: 'user-123' };

      const authorizeOwner = authorize(['USER'], 'userId');
      await authorizeOwner(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow admin access to any resource', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      };

      mockRequest.user = mockUser;
      mockRequest.params = { userId: 'different-user-123' };

      const authorizeOwner = authorize(['ADMIN'], 'userId');
      await authorizeOwner(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-owner', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      };

      mockRequest.user = mockUser;
      mockRequest.params = { userId: 'different-user-123' };

      const authorizeOwner = authorize(['USER'], 'userId');
      await authorizeOwner(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied to this resource'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing resource ID parameter', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      };

      mockRequest.user = mockUser;
      mockRequest.params = {};

      const authorizeOwner = authorize(['USER'], 'userId');
      await authorizeOwner(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource ID not provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
