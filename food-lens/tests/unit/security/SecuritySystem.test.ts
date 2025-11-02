/**
 * Security System Tests
 * Comprehensive tests for authentication, authorization, and security features
 */

import { sessionManager, SessionData } from '../../../src/lib/food-label-scanner/services/security/SessionManager';
import { roleBasedAccess, Permission, UserRole } from '../../../src/lib/food-label-scanner/services/security/RoleBasedAccess';
import { securityMiddleware } from '../../../src/lib/food-label-scanner/services/security/SecurityMiddleware';
import { Sanitizers } from '../../../src/lib/food-label-scanner/utils/sanitization';
import { User } from '../../../src/lib/food-label-scanner/models/User';
import { AuthorizationError, SanitizationError } from '../../../src/lib/food-label-scanner/utils/errors';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../../src/lib/food-label-scanner/services/database/FirestoreService', () => ({
  firestoreService: {
    initialize: jest.fn(() => Promise.resolve()),
    getUser: jest.fn(() => Promise.resolve(null)),
  },
}));

describe('Security System - Session Management', () => {
  beforeEach(() => {
    sessionManager.clearSession();
  });

  it('should initialize session from authenticated user', async () => {
    const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
    
    // Mock Firestore
    const { firestoreService } = require('../../../src/lib/food-label-scanner/services/database/FirestoreService');
    firestoreService.getUser.mockResolvedValue(mockUser);

    // Mock Firebase Auth
    const { getAuth } = require('firebase/auth');
    const mockFirebaseUser = {
      uid: 'uid123',
      getIdToken: jest.fn(() => Promise.resolve('mock-token')),
      refreshToken: 'mock-refresh-token',
    };
    getAuth.mockReturnValue({
      currentUser: mockFirebaseUser,
    });

    const session = await sessionManager.initializeSession();

    expect(session).toBeDefined();
    expect(session?.user.uid).toBe('uid123');
    expect(session?.token).toBe('mock-token');
  });

  it('should return null session when user is not authenticated', async () => {
    const session = await sessionManager.initializeSession();
    expect(session).toBeNull();
  });

  it('should validate session expiration', async () => {
    const mockSession: SessionData = {
      user: new User('uid123', 'test@example.com', 'Test User', 'en'),
      token: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() - 1000), // Expired
    };

    sessionManager['currentSession'] = mockSession;

    const isValid = await sessionManager.validateSession();
    expect(isValid).toBe(false);
  });

  it('should check if user is authenticated', () => {
    expect(sessionManager.isAuthenticated()).toBe(false);

    const mockSession: SessionData = {
      user: new User('uid123', 'test@example.com', 'Test User', 'en'),
      token: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() + 3600000),
    };

    sessionManager['currentSession'] = mockSession;
    expect(sessionManager.isAuthenticated()).toBe(true);
  });
});

describe('Security System - Role-Based Access Control', () => {
  it('should return default role "user"', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en');
    const role = roleBasedAccess.getUserRole(user);
    expect(role).toBe('user');
  });

  it('should return "admin" role for admin users', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en', [], undefined, undefined, {
      isAdmin: true,
    });
    const role = roleBasedAccess.getUserRole(user);
    expect(role).toBe('admin');
  });

  it('should return "premium" role for premium users', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en', [], undefined, undefined, {
      isPremium: true,
    });
    const role = roleBasedAccess.getUserRole(user);
    expect(role).toBe('premium');
  });

  it('should return correct permissions for user role', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en');
    const permissions = roleBasedAccess.getUserPermissions(user);
    
    expect(permissions).toContain('scan:create');
    expect(permissions).toContain('scan:read');
    expect(permissions).not.toContain('admin:users');
  });

  it('should return admin permissions for admin role', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en', [], undefined, undefined, {
      isAdmin: true,
    });
    const permissions = roleBasedAccess.getUserPermissions(user);
    
    expect(permissions).toContain('admin:users');
    expect(permissions).toContain('admin:scans');
  });

  it('should check if user has specific permission', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en');
    expect(roleBasedAccess.hasPermission(user, 'scan:create')).toBe(true);
    expect(roleBasedAccess.hasPermission(user, 'admin:users')).toBe(false);
  });

  it('should require permission and throw if missing', () => {
    const user = new User('uid123', 'test@example.com', 'Test User', 'en');
    
    expect(() => roleBasedAccess.requirePermission(user, 'scan:create')).not.toThrow();
    expect(() => roleBasedAccess.requirePermission(user, 'admin:users')).toThrow();
  });
});

describe('Security System - Security Middleware', () => {
  beforeEach(() => {
    sessionManager.clearSession();
  });

  it('should require authentication and throw if not authenticated', async () => {
    await expect(securityMiddleware.requireAuthentication()).rejects.toThrow(AuthorizationError);
  });

  it('should require permission and throw if missing', async () => {
    const mockUser = new User('uid123', 'test@example.com', 'Test User', 'en');
    const mockSession: SessionData = {
      user: mockUser,
      token: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() + 3600000),
    };

    sessionManager['currentSession'] = mockSession;
    sessionManager['auth'] = {
      currentUser: { getIdToken: () => Promise.resolve('token') },
    } as any;

    // User has scan:create but not admin:users
    await expect(
      securityMiddleware.requirePermission('scan:create')
    ).resolves.toBeDefined();

    await expect(
      securityMiddleware.requirePermission('admin:users')
    ).rejects.toThrow(AuthorizationError);
  });

  it('should require ownership and allow admin access', async () => {
    const adminUser = new User('admin123', 'admin@example.com', 'Admin', 'en', [], undefined, undefined, {
      isAdmin: true,
    });
    const mockSession: SessionData = {
      user: adminUser,
      token: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() + 3600000),
    };

    sessionManager['currentSession'] = mockSession;
    sessionManager['auth'] = {
      currentUser: { getIdToken: () => Promise.resolve('token') },
    } as any;

    // Admin can access any resource
    const context = await securityMiddleware.requireOwnership('other-user-id');
    expect(context.userRole).toBe('admin');
  });

  it('should require ownership and deny access to other users\' resources', async () => {
    const regularUser = new User('user123', 'user@example.com', 'User', 'en');
    const mockSession: SessionData = {
      user: regularUser,
      token: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date(Date.now() + 3600000),
    };

    sessionManager['currentSession'] = mockSession;
    sessionManager['auth'] = {
      currentUser: { getIdToken: () => Promise.resolve('token') },
    } as any;

    // Regular user cannot access another user's resource
    await expect(
      securityMiddleware.requireOwnership('other-user-id')
    ).rejects.toThrow(AuthorizationError);

    // Regular user can access their own resource
    await expect(
      securityMiddleware.requireOwnership('user123')
    ).resolves.toBeDefined();
  });
});

describe('Security System - Input Sanitization', () => {
  it('should sanitize string input', () => {
    const input = '  Test String  \0\x00';
    const sanitized = Sanitizers.string(input);
    
    expect(sanitized).toBe('Test String');
    expect(sanitized).not.toContain('\0');
  });

  it('should sanitize email input', () => {
    const email = '  TEST@EXAMPLE.COM  ';
    const sanitized = Sanitizers.email(email);
    
    expect(sanitized).toBe('test@example.com');
  });

  it('should reject invalid email format', () => {
    expect(() => Sanitizers.email('invalid-email')).toThrow(SanitizationError);
  });

  it('should sanitize display name', () => {
    const name = '  John Doe  ';
    const sanitized = Sanitizers.displayName(name);
    
    expect(sanitized).toBe('John Doe');
  });

  it('should reject display names with dangerous characters', () => {
    expect(() => Sanitizers.displayName('<script>alert("xss")</script>')).toThrow(SanitizationError);
  });

  it('should sanitize base64 image data', () => {
    const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const sanitized = Sanitizers.base64Image(base64);
    
    expect(sanitized).toBe(base64);
  });

  it('should reject invalid base64 image format', () => {
    expect(() => Sanitizers.base64Image('invalid-image')).toThrow(SanitizationError);
  });

  it('should sanitize number input with min/max', () => {
    expect(Sanitizers.number(5, 1, 10)).toBe(5);
    expect(() => Sanitizers.number(15, 1, 10)).toThrow(SanitizationError);
    expect(() => Sanitizers.number(0, 1, 10)).toThrow(SanitizationError);
  });

  it('should sanitize object recursively', () => {
    const obj = {
      name: '  Test  \0',
      email: '  TEST@EXAMPLE.COM  ',
      nested: {
        value: '  Nested  ',
      },
    };

    const sanitized = Sanitizers.object(obj);
    
    expect(sanitized.name).toBe('Test');
    expect(sanitized.email).toBe('TEST@EXAMPLE.COM');
    expect(sanitized.nested.value).toBe('Nested');
  });
});

