import { Validator } from '../../lib/validation/validator';
import { Sanitizer } from '../../lib/validation/sanitizer';
import { AppErrorClass } from '../../lib/error/app.error';
import { z } from 'zod';

describe('Validator', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(Validator.validateEmail('test@example.com')).toBe(true);
      expect(Validator.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(Validator.validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(Validator.validateEmail('invalid-email')).toBe(false);
      expect(Validator.validateEmail('test@')).toBe(false);
      expect(Validator.validateEmail('@example.com')).toBe(false);
      expect(Validator.validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = Validator.validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = Validator.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should check for uppercase letter requirement', () => {
      const result = Validator.validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should check for lowercase letter requirement', () => {
      const result = Validator.validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should check for number requirement', () => {
      const result = Validator.validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should check for special character requirement', () => {
      const result = Validator.validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(Validator.validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(Validator.validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(Validator.validateUUID('invalid-uuid')).toBe(false);
      expect(Validator.validateUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(Validator.validateUUID('')).toBe(false);
    });
  });

  describe('validateRoomName', () => {
    it('should validate correct room names', () => {
      const result = Validator.validateRoomName('My Room');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty room names', () => {
      const result = Validator.validateRoomName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Room name is required');
    });

    it('should reject room names that are too short', () => {
      const result = Validator.validateRoomName('A');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Room name must be at least 2 characters long');
    });

    it('should reject room names that are too long', () => {
      const result = Validator.validateRoomName('A'.repeat(101));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Room name must be no more than 100 characters long');
    });

    it('should reject room names with harmful content', () => {
      const result = Validator.validateRoomName('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Room name contains potentially harmful content');
    });
  });

  describe('validateMessageContent', () => {
    it('should validate correct message content', () => {
      const result = Validator.validateMessageContent('Hello, world!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty message content', () => {
      const result = Validator.validateMessageContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content is required');
    });

    it('should reject message content that is too long', () => {
      const result = Validator.validateMessageContent('A'.repeat(1001));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content must be no more than 1000 characters long');
    });

    it('should reject message content with harmful content', () => {
      const result = Validator.validateMessageContent('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content contains potentially harmful content');
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(Validator.validateURL('https://example.com')).toBe(true);
      expect(Validator.validateURL('http://localhost:3000')).toBe(true);
      expect(Validator.validateURL('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(Validator.validateURL('not-a-url')).toBe(false);
      expect(Validator.validateURL('')).toBe(false);
      expect(Validator.validateURL('http://')).toBe(false);
    });
  });

  describe('validateWebSocketURL', () => {
    it('should validate correct WebSocket URLs', () => {
      expect(Validator.validateWebSocketURL('ws://localhost:3000')).toBe(true);
      expect(Validator.validateWebSocketURL('wss://example.com')).toBe(true);
    });

    it('should reject non-WebSocket URLs', () => {
      expect(Validator.validateWebSocketURL('https://example.com')).toBe(false);
      expect(Validator.validateWebSocketURL('http://example.com')).toBe(false);
    });
  });

  describe('validateWithZod', () => {
    it('should validate data with Zod schema', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      const data = { name: 'John', age: 25 };
      const result = Validator.validateWithZod(schema, data);
      
      expect(result).toEqual(data);
    });

    it('should throw AppError for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      const data = { name: '', age: -1 };

      expect(() => {
        Validator.validateWithZod(schema, data);
      }).toThrow(AppErrorClass);
    });
  });

  describe('safeValidateWithZod', () => {
    it('should return success for valid data', () => {
      const schema = z.object({
        name: z.string().min(1)
      });

      const data = { name: 'John' };
      const result = Validator.safeValidateWithZod(schema, data);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should return failure for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1)
      });

      const data = { name: '' };
      const result = Validator.safeValidateWithZod(schema, data);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});

describe('Sanitizer', () => {
  describe('sanitizeHTML', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = Sanitizer.sanitizeHTML(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags and dangerous content', () => {
      const input = '<script>alert("xss")</script>Hello <b>world</b>';
      const result = Sanitizer.sanitizeText(input);
      expect(result).toBe('alert("xss")Hello world');
    });
  });

  describe('sanitizeForDatabase', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00World\x01Test';
      const result = Sanitizer.sanitizeForDatabase(input);
      expect(result).toBe('HelloWorldTest');
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = Sanitizer.sanitizeFilename(input);
      expect(result).toBe('file_.txt');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize email format', () => {
      const input = '  TEST@EXAMPLE.COM  ';
      const result = Sanitizer.sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize object properties recursively', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        nested: {
          value: 'Hello <b>world</b>'
        }
      };
      const result = Sanitizer.sanitizeObject(input);
      expect(result.name).toBe('alert("xss")');
      expect(result.nested.value).toBe('Hello world');
    });
  });

  describe('removeSensitiveData', () => {
    it('should redact sensitive fields', () => {
      const input = {
        name: 'John Doe',
        password: 'secret123',
        token: 'abc123',
        email: 'john@example.com'
      };
      const result = Sanitizer.removeSensitiveData(input);
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });
  });
});

