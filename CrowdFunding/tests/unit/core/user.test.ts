import { UserCore } from '../../../src/lib/core/user';

describe('UserCore', () => {
  let userCore: UserCore;

  beforeEach(() => {
    userCore = new UserCore();
  });

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      const email = 'user@example.com';
      
      const isValid = userCore.validateEmail(email);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.example.com',
        ''
      ];
      
      invalidEmails.forEach(email => {
        const isValid = userCore.validateEmail(email);
        expect(isValid).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        'user+tag@example.com',
        'user.name@example.co.uk',
        'user123@subdomain.example.com'
      ];
      
      edgeCases.forEach(email => {
        const isValid = userCore.validateEmail(email);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      const password = 'SecurePass123!';
      
      const isValid = userCore.validatePassword(password);
      
      expect(isValid).toBe(true);
    });

    it('should return false for password too short', () => {
      const password = 'Short1!';
      
      const isValid = userCore.validatePassword(password);
      
      expect(isValid).toBe(false);
    });

    it('should return false for password without uppercase', () => {
      const password = 'password123!';
      
      const isValid = userCore.validatePassword(password);
      
      expect(isValid).toBe(false);
    });

    it('should return false for password without lowercase', () => {
      const password = 'PASSWORD123!';
      
      const isValid = userCore.validatePassword(password);
      
      expect(isValid).toBe(false);
    });

    it('should return false for password without number', () => {
      const password = 'Password!';
      
      const isValid = userCore.validatePassword(password);
      
      expect(isValid).toBe(false);
    });

    it('should return false for password without special character', () => {
      const password = 'Password123';
      
      const isValid = userCore.validatePassword(password);
      
      expect(isValid).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash password securely', async () => {
      const password = 'SecurePass123!';
      
      const hashedPassword = await userCore.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SecurePass123!';
      
      const hash1 = await userCore.hashPassword(password);
      const hash2 = await userCore.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await userCore.hashPassword(password);
      
      const isValid = await userCore.verifyPassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePass123!';
      const wrongPassword = 'WrongPass123!';
      const hashedPassword = await userCore.hashPassword(password);
      
      const isValid = await userCore.verifyPassword(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });

  describe('validateUserProfile', () => {
    it('should return true for valid profile', () => {
      const profile = {
        name: 'John Doe',
        bio: 'Software developer passionate about crowdfunding',
        avatar: 'https://example.com/avatar.jpg',
        location: 'San Francisco, CA'
      };
      
      const isValid = userCore.validateUserProfile(profile);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid name', () => {
      const profile = {
        name: '', // Empty name
        bio: 'Valid bio',
        avatar: 'https://example.com/avatar.jpg',
        location: 'San Francisco, CA'
      };
      
      const isValid = userCore.validateUserProfile(profile);
      
      expect(isValid).toBe(false);
    });

    it('should return false for bio too long', () => {
      const profile = {
        name: 'John Doe',
        bio: 'A'.repeat(501), // Exceeds 500 character limit
        avatar: 'https://example.com/avatar.jpg',
        location: 'San Francisco, CA'
      };
      
      const isValid = userCore.validateUserProfile(profile);
      
      expect(isValid).toBe(false);
    });

    it('should return false for invalid avatar URL', () => {
      const profile = {
        name: 'John Doe',
        bio: 'Valid bio',
        avatar: 'not-a-url',
        location: 'San Francisco, CA'
      };
      
      const isValid = userCore.validateUserProfile(profile);
      
      expect(isValid).toBe(false);
    });
  });

  describe('calculateUserStats', () => {
    it('should calculate user statistics correctly', () => {
      const userData = {
        campaigns: [
          { goal: 10000, current: 5000 },
          { goal: 5000, current: 5000 },
          { goal: 2000, current: 1000 }
        ],
        donations: [
          { amount: 100 },
          { amount: 200 },
          { amount: 50 }
        ]
      };
      
      const stats = userCore.calculateUserStats(userData);
      
      expect(stats.totalCampaigns).toBe(3);
      expect(stats.successfulCampaigns).toBe(1);
      expect(stats.totalRaised).toBe(11000);
      expect(stats.totalDonated).toBe(350);
      expect(stats.averageCampaignGoal).toBeCloseTo(5666.67, 2);
    });

    it('should handle empty data', () => {
      const userData = {
        campaigns: [],
        donations: []
      };
      
      const stats = userCore.calculateUserStats(userData);
      
      expect(stats.totalCampaigns).toBe(0);
      expect(stats.successfulCampaigns).toBe(0);
      expect(stats.totalRaised).toBe(0);
      expect(stats.totalDonated).toBe(0);
      expect(stats.averageCampaignGoal).toBe(0);
    });
  });

  describe('generateUserSlug', () => {
    it('should generate slug from name', () => {
      const name = 'John Doe';
      
      const slug = userCore.generateUserSlug(name);
      
      expect(slug).toBe('john-doe');
    });

    it('should handle special characters', () => {
      const name = 'John O\'Connor-Smith';
      
      const slug = userCore.generateUserSlug(name);
      
      expect(slug).toBe('john-oconnor-smith');
    });

    it('should handle duplicate names with ID', () => {
      const name = 'John Doe';
      const userId = 'user-123';
      
      const slug = userCore.generateUserSlug(name, userId);
      
      expect(slug).toBe('john-doe-user-123');
    });
  });

  describe('validateUserRole', () => {
    it('should return true for valid roles', () => {
      const validRoles = ['USER', 'ADMIN', 'MODERATOR'];
      
      validRoles.forEach(role => {
        const isValid = userCore.validateUserRole(role);
        expect(isValid).toBe(true);
      });
    });

    it('should return false for invalid role', () => {
      const invalidRole = 'INVALID_ROLE';
      
      const isValid = userCore.validateUserRole(invalidRole);
      
      expect(isValid).toBe(false);
    });
  });

  describe('checkUserPermissions', () => {
    it('should allow admin to perform admin actions', () => {
      const user = { role: 'ADMIN' };
      const action = 'DELETE_CAMPAIGN';
      
      const hasPermission = userCore.checkUserPermissions(user, action);
      
      expect(hasPermission).toBe(true);
    });

    it('should deny user from performing admin actions', () => {
      const user = { role: 'USER' };
      const action = 'DELETE_CAMPAIGN';
      
      const hasPermission = userCore.checkUserPermissions(user, action);
      
      expect(hasPermission).toBe(false);
    });

    it('should allow user to perform user actions', () => {
      const user = { role: 'USER' };
      const action = 'CREATE_CAMPAIGN';
      
      const hasPermission = userCore.checkUserPermissions(user, action);
      
      expect(hasPermission).toBe(true);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should sanitize user input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      
      const sanitized = userCore.sanitizeUserInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should handle empty input', () => {
      const input = '';
      
      const sanitized = userCore.sanitizeUserInput(input);
      
      expect(sanitized).toBe('');
    });

    it('should preserve safe content', () => {
      const input = 'This is safe content with numbers 123 and symbols !@#';
      
      const sanitized = userCore.sanitizeUserInput(input);
      
      expect(sanitized).toBe(input);
    });
  });
});
