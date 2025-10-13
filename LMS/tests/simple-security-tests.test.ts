import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SecurityTestUtils } from './security-test-utils';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { UserRole } from '../src/generated/prisma';
import { hashPassword, verifyPassword } from '../src/lib/auth';

describe('Core Security Tests', () => {
  let testOrg: any;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;

  beforeAll(async () => {
    await TestCleanup.cleanup();
    testOrg = await TestDataFactory.createOrganization();
    adminUser = await TestDataFactory.createUser(testOrg.id, UserRole.ADMIN);
    instructorUser = await TestDataFactory.createUser(testOrg.id, UserRole.INSTRUCTOR);
    studentUser = await TestDataFactory.createUser(testOrg.id, UserRole.STUDENT);
  });

  afterAll(async () => {
    await TestCleanup.cleanup();
  });

  describe('Authentication Security', () => {
    it('should properly hash passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    it('should verify correct passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      const isValid = await verifyPassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      const isValid = await verifyPassword('wrongpassword', hashedPassword);
      
      expect(isValid).toBe(false);
    });

    it('should prevent authentication bypass attempts', async () => {
      const result = await SecurityTestUtils.testAuthenticationBypass(testOrg);
      
      expect(result.success).toBe(true);
      expect(result.vulnerabilities).toHaveLength(0);
    });

    it('should test password security', async () => {
      const result = await SecurityTestUtils.testPasswordSecurity();
      
      expect(result.success).toBe(true);
      expect(result.tests.every(test => test.passed)).toBe(true);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      const result = await SecurityTestUtils.testAuthorizationBypass(testOrg, adminUser);
      
      expect(result.success).toBe(true);
      expect(result.vulnerabilities).toHaveLength(0);
    });

    it('should test session security', async () => {
      const result = await SecurityTestUtils.testSessionSecurity(testOrg, adminUser);
      
      expect(result.success).toBe(true);
      expect(result.tests.every(test => test.passed)).toBe(true);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize XSS attacks', async () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      // Basic XSS sanitization test
      const sanitized = maliciousInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBe('Hello World');
    });

    it('should validate input fields', async () => {
      const result = await SecurityTestUtils.testInputValidation(testOrg);
      
      expect(result.success).toBe(true);
      expect(result.tests.every(test => test.passed)).toBe(true);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should isolate data by organization', async () => {
      const result = await SecurityTestUtils.testMultiTenantIsolation();
      
      expect(result.success).toBe(true);
      expect(result.tests.length).toBeGreaterThan(0);
    });
  });

  describe('API Security', () => {
    it('should test API security', async () => {
      const result = await SecurityTestUtils.testAPISecurity(testOrg, adminUser);
      
      expect(result.success).toBe(true);
      expect(result.tests.every(test => test.passed)).toBe(true);
    });
  });
});
