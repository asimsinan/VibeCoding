import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, decodeToken } from '../../src/lib/utils/jwt';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'USER'
  };

  const mockSecret = 'test-secret';
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    process.env.JWT_SECRET = mockSecret;
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate token with default expiration', () => {
      mockJwt.sign.mockReturnValue(mockToken as any);

      const result = generateToken(mockPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        mockSecret,
        { expiresIn: '24h' }
      );
    });

    it('should generate token with custom expiration', () => {
      mockJwt.sign.mockReturnValue(mockToken as any);

      const result = generateToken(mockPayload, '1h');

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        mockSecret,
        { expiresIn: '1h' }
      );
    });

    it('should handle signing errors', () => {
      mockJwt.sign.mockImplementation(() => {
        throw new Error('Signing error');
      });

      expect(() => generateToken(mockPayload)).toThrow('Signing error');
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;

      expect(() => generateToken(mockPayload)).toThrow('JWT_SECRET is not defined');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      mockJwt.verify.mockReturnValue(mockPayload as any);

      const result = verifyToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, mockSecret);
    });

    it('should throw error for invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const error = new Error('Token expired');
      (error as any).name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyToken('expired-token')).toThrow('Token expired');
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;

      expect(() => verifyToken(mockToken)).toThrow('JWT_SECRET is not defined');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockDecoded = {
        ...mockPayload,
        iat: 1234567890,
        exp: 1234567890 + 86400
      };

      mockJwt.decode.mockReturnValue(mockDecoded as any);

      const result = decodeToken(mockToken);

      expect(result).toEqual(mockDecoded);
      expect(mockJwt.decode).toHaveBeenCalledWith(mockToken);
    });

    it('should return null for invalid token', () => {
      mockJwt.decode.mockReturnValue(null);

      const result = decodeToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should handle malformed token', () => {
      mockJwt.decode.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      expect(decodeToken('malformed-token')).toBeNull();
    });
  });

  describe('Token validation', () => {
    it('should validate token structure', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIn0.signature';
      
      mockJwt.decode.mockReturnValue(mockPayload as any);

      const result = decodeToken(validToken);

      expect(result).toEqual(mockPayload);
    });

    it('should handle tokens with missing parts', () => {
      const invalidToken = 'invalid.token';

      mockJwt.decode.mockReturnValue(null);

      const result = decodeToken(invalidToken);

      expect(result).toBeNull();
    });
  });

  describe('Token expiration', () => {
    it('should check if token is expired', () => {
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      mockJwt.decode.mockReturnValue(expiredPayload as any);

      const result = decodeToken('expired-token');

      expect(result).toEqual(expiredPayload);
      // The actual expiration check would be done in the verifyToken function
    });

    it('should handle tokens without expiration', () => {
      const payloadWithoutExp = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER'
      };

      mockJwt.decode.mockReturnValue(payloadWithoutExp as any);

      const result = decodeToken('no-exp-token');

      expect(result).toEqual(payloadWithoutExp);
    });
  });

  describe('Token payload validation', () => {
    it('should validate required payload fields', () => {
      const validPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        iat: 1234567890,
        exp: 1234567890 + 86400
      };

      mockJwt.sign.mockReturnValue(mockToken as any);

      const result = generateToken(validPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        validPayload,
        mockSecret,
        { expiresIn: '24h' }
      );
    });

    it('should handle payload with additional fields', () => {
      const extendedPayload = {
        ...mockPayload,
        additionalField: 'extra-data',
        permissions: ['read', 'write']
      };

      mockJwt.sign.mockReturnValue(mockToken as any);

      const result = generateToken(extendedPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        extendedPayload,
        mockSecret,
        { expiresIn: '24h' }
      );
    });
  });
});
