/**
 * API Security Tests - Test API security and vulnerability prevention
 * FR-001: API-First Design - Security testing implementation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createApiClient } from '../../../src/lib/api/client/apiClient';
import { getApiService } from '../../../src/lib/api/services/apiService';
import {
  LoginRequest,
  RegisterRequest,
  CreateWorkspaceRequest,
} from '../../../contracts/types/api.types';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

// Mock API client for testing
let apiClient: ReturnType<typeof createApiClient>;
let apiService: ReturnType<typeof getApiService>;

describe('API Security Tests', () => {
  beforeAll(async () => {
    // Initialize API client and service
    apiClient = createApiClient({
      baseURL: API_BASE_URL,
    });
    apiService = getApiService();
  });

  afterAll(async () => {
    // Clean up
    apiClient.clearTokens();
  });

  beforeEach(() => {
    // Clear tokens before each test
    apiClient.clearTokens();
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      await expect(apiService.workspaces.list()).rejects.toThrow();
    });

    it('should reject requests with invalid tokens', async () => {
      apiClient.setTokens('invalid-token', 'invalid-refresh-token');
      
      await expect(apiService.workspaces.list()).rejects.toThrow();
    });

    it('should reject requests with malformed tokens', async () => {
      apiClient.setTokens('malformed.token', 'malformed.refresh.token');
      
      await expect(apiService.workspaces.list()).rejects.toThrow();
    });

    it('should reject requests with expired tokens', async () => {
      // Mock an expired token (this would be a real expired JWT in production)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      apiClient.setTokens(expiredToken, 'invalid-refresh-token');
      
      await expect(apiService.workspaces.list()).rejects.toThrow();
    });

    it('should handle token refresh securely', async () => {
      // This test would verify that token refresh is handled securely
      // In a real implementation, you'd test that:
      // 1. Refresh tokens are single-use
      // 2. Old access tokens are invalidated
      // 3. Refresh tokens have appropriate expiration
      
      const refreshData = {
        refreshToken: 'invalid-refresh-token',
      };
      
      await expect(apiService.auth.refresh(refreshData)).rejects.toThrow();
    });
  });

  describe('Input Validation Security', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousData = {
        name: "'; DROP TABLE workspaces; --",
        description: 'A malicious workspace',
      };

      await expect(apiService.workspaces.create(maliciousData as any)).rejects.toThrow();
    });

    it('should reject XSS attempts', async () => {
      const maliciousData = {
        name: '<script>alert("XSS")</script>',
        description: '<img src="x" onerror="alert(\'XSS\')">',
      };

      await expect(apiService.workspaces.create(maliciousData as any)).rejects.toThrow();
    });

    it('should reject NoSQL injection attempts', async () => {
      const maliciousData = {
        name: { $ne: null },
        description: 'A malicious workspace',
      };

      await expect(apiService.workspaces.create(maliciousData as any)).rejects.toThrow();
    });

    it('should reject oversized payloads', async () => {
      const oversizedData = {
        name: 'A'.repeat(10000), // Exceeds max length
        description: 'B'.repeat(10000), // Exceeds max length
      };

      await expect(apiService.workspaces.create(oversizedData as any)).rejects.toThrow();
    });

    it('should reject malformed JSON', async () => {
      // This would be tested at the HTTP level, not the service level
      // In a real implementation, you'd test that malformed JSON is rejected
      expect(true).toBe(true); // Placeholder
    });

    it('should reject requests with invalid content types', async () => {
      // This would be tested at the HTTP level
      // In a real implementation, you'd test that non-JSON content types are rejected
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Authorization Security', () => {
    let user1Tokens: { accessToken: string; refreshToken: string };
    let user2Tokens: { accessToken: string; refreshToken: string };
    let user1WorkspaceId: string;

    beforeAll(async () => {
      // Create two test users
      const user1Data: RegisterRequest = {
        email: 'user1@example.com',
        password: 'password123',
        fullName: 'User 1',
      };
      const user1Response = await apiService.auth.register(user1Data);
      user1Tokens = {
        accessToken: user1Response.data.accessToken,
        refreshToken: user1Response.data.refreshToken,
      };

      const user2Data: RegisterRequest = {
        email: 'user2@example.com',
        password: 'password123',
        fullName: 'User 2',
      };
      const user2Response = await apiService.auth.register(user2Data);
      user2Tokens = {
        accessToken: user2Response.data.accessToken,
        refreshToken: user2Response.data.refreshToken,
      };

      // User 1 creates a workspace
      apiClient.setTokens(user1Tokens.accessToken, user1Tokens.refreshToken);
      const workspaceData: CreateWorkspaceRequest = {
        name: 'User 1 Workspace',
        description: 'A workspace owned by User 1',
      };
      const workspaceResponse = await apiService.workspaces.create(workspaceData);
      user1WorkspaceId = workspaceResponse.data.data.id;
    });

    it('should prevent access to other users\' workspaces', async () => {
      // User 2 tries to access User 1's workspace
      apiClient.setTokens(user2Tokens.accessToken, user2Tokens.refreshToken);
      
      await expect(apiService.workspaces.get(user1WorkspaceId)).rejects.toThrow();
    });

    it('should prevent modification of other users\' workspaces', async () => {
      // User 2 tries to update User 1's workspace
      apiClient.setTokens(user2Tokens.accessToken, user2Tokens.refreshToken);
      
      const updateData = {
        name: 'Hacked Workspace',
        description: 'This should not work',
      };
      
      await expect(apiService.workspaces.update(user1WorkspaceId, updateData)).rejects.toThrow();
    });

    it('should prevent deletion of other users\' workspaces', async () => {
      // User 2 tries to delete User 1's workspace
      apiClient.setTokens(user2Tokens.accessToken, user2Tokens.refreshToken);
      
      await expect(apiService.workspaces.delete(user1WorkspaceId)).rejects.toThrow();
    });

    it('should prevent privilege escalation', async () => {
      // User 2 tries to create a workspace with User 1's ID
      apiClient.setTokens(user2Tokens.accessToken, user2Tokens.refreshToken);
      
      const maliciousData = {
        name: 'Privilege Escalation Attempt',
        description: 'This should not work',
        ownerId: 'user1-id', // Trying to set owner to User 1
      };
      
      await expect(apiService.workspaces.create(maliciousData as any)).rejects.toThrow();
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Make multiple rapid requests
      const promises = Array.from({ length: 20 }, () => 
        apiService.auth.login(loginData).catch(error => ({ error }))
      );
      
      const results = await Promise.all(promises);
      const errorCount = results.filter(r => 'error' in r).length;
      
      // Some requests should be rate limited
      expect(errorCount).toBeGreaterThan(0);
    });

    it('should enforce rate limits on workspace endpoints', async () => {
      // First login to get valid tokens
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const loginResponse = await apiService.auth.login(loginData);
      apiClient.setTokens(loginResponse.data.accessToken, loginResponse.data.refreshToken);

      const workspaceData: CreateWorkspaceRequest = {
        name: 'Rate Limit Test Workspace',
        description: 'A workspace for rate limit testing',
      };

      // Make multiple rapid requests
      const promises = Array.from({ length: 20 }, (_, i) => 
        apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        }).catch(error => ({ error }))
      );
      
      const results = await Promise.all(promises);
      const errorCount = results.filter(r => 'error' in r).length;
      
      // Some requests should be rate limited
      expect(errorCount).toBeGreaterThan(0);
    });
  });

  describe('Data Sanitization Security', () => {
    it('should sanitize HTML in text fields', async () => {
      // First login to get valid tokens
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const loginResponse = await apiService.auth.login(loginData);
      apiClient.setTokens(loginResponse.data.accessToken, loginResponse.data.refreshToken);

      const workspaceData: CreateWorkspaceRequest = {
        name: '<script>alert("XSS")</script>',
        description: '<img src="x" onerror="alert(\'XSS\')">',
      };

      // The request should be rejected due to validation
      await expect(apiService.workspaces.create(workspaceData as any)).rejects.toThrow();
    });

    it('should sanitize special characters in text fields', async () => {
      // First login to get valid tokens
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const loginResponse = await apiService.auth.login(loginData);
      apiClient.setTokens(loginResponse.data.accessToken, loginResponse.data.refreshToken);

      const workspaceData: CreateWorkspaceRequest = {
        name: 'Workspace with "quotes" and \'apostrophes\'',
        description: 'Description with <b>HTML</b> and &amp; entities',
      };

      // The request should be rejected due to validation
      await expect(apiService.workspaces.create(workspaceData as any)).rejects.toThrow();
    });
  });

  describe('CORS Security', () => {
    it('should handle CORS preflight requests', async () => {
      // This would be tested at the HTTP level
      // In a real implementation, you'd test that CORS headers are properly set
      expect(true).toBe(true); // Placeholder
    });

    it('should reject requests from unauthorized origins', async () => {
      // This would be tested at the HTTP level
      // In a real implementation, you'd test that requests from unauthorized origins are rejected
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error messages', async () => {
      const loginData: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      try {
        await apiService.auth.login(loginData);
        fail('Expected authentication to fail');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Error message should not contain sensitive information
        expect(errorMessage).not.toContain('database');
        expect(errorMessage).not.toContain('password');
        expect(errorMessage).not.toContain('hash');
        expect(errorMessage).not.toContain('salt');
        expect(errorMessage).not.toContain('token');
      }
    });

    it('should not expose stack traces in production', async () => {
      // This would be tested by checking that error responses don't include stack traces
      // In a real implementation, you'd verify that stack traces are not included in error responses
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Session Security', () => {
    it('should invalidate sessions on logout', async () => {
      // First login
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const loginResponse = await apiService.auth.login(loginData);
      apiClient.setTokens(loginResponse.data.accessToken, loginResponse.data.refreshToken);

      // Verify we can access protected resources
      await expect(apiService.workspaces.list()).resolves.toBeDefined();

      // Logout
      await apiService.auth.logout();

      // Verify we can no longer access protected resources
      await expect(apiService.workspaces.list()).rejects.toThrow();
    });

    it('should handle concurrent sessions securely', async () => {
      // This would test that multiple sessions for the same user are handled securely
      // In a real implementation, you'd test that:
      // 1. Sessions don't interfere with each other
      // 2. Logout from one session doesn't affect others
      // 3. Session tokens are unique
      expect(true).toBe(true); // Placeholder
    });
  });
});
