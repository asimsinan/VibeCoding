import { describe, it, expect } from 'vitest';
import type { User, CreateUserInput } from '../../../apps/api/src/lib/models/User';

describe('User Model', () => {
  describe('User Type', () => {
    it('should have required fields', () => {
      const user: Partial<User> = {
        id: 'test-id',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'user',
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
    });
  });

  describe('CreateUserInput validation', () => {
    it('should validate email format', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      expect(input.email).toContain('@');
      expect(input.password.length).toBeGreaterThanOrEqual(8);
    });

    it('should have valid role', () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user',
      };

      expect(['user', 'admin']).toContain(input.role);
    });
  });
});

