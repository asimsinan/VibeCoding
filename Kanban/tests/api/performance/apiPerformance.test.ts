/**
 * API Performance Tests - Test API performance and load handling
 * FR-001: API-First Design - Performance testing implementation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createApiClient } from '../../../src/lib/api/client/apiClient';
import { getApiService } from '../../../src/lib/api/services/apiService';
import {
  LoginRequest,
  CreateWorkspaceRequest,
  CreateBoardRequest,
  CreateTaskRequest,
} from '../../../contracts/types/api.types';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const PERFORMANCE_THRESHOLDS = {
  responseTime: 1000, // 1 second
  throughput: 100, // 100 requests per second
  errorRate: 0.01, // 1% error rate
  memoryUsage: 100 * 1024 * 1024, // 100MB
};

// Mock API client for testing
let apiClient: ReturnType<typeof createApiClient>;
let apiService: ReturnType<typeof getApiService>;
let authTokens: { accessToken: string; refreshToken: string } | null = null;

// Performance measurement utilities
function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  return fn().then(result => ({
    result,
    duration: performance.now() - start,
  }));
}

function measureMemory(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('API Performance Tests', () => {
  beforeAll(async () => {
    // Initialize API client and service
    apiClient = createApiClient({
      baseURL: API_BASE_URL,
    });
    apiService = getApiService();

    // Login for authenticated tests
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await apiService.auth.login(loginData);
    authTokens = {
      accessToken: loginResponse.data.accessToken,
      refreshToken: loginResponse.data.refreshToken,
    };
    apiClient.setTokens(authTokens.accessToken, authTokens.refreshToken);
  });

  afterAll(async () => {
    // Clean up
    if (authTokens) {
      try {
        await apiService.auth.logout();
      } catch (error) {
        // Ignore logout errors in cleanup
      }
    }
    apiClient.clearTokens();
  });

  describe('Response Time Tests', () => {
    it('should respond to authentication requests within threshold', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { duration } = await measureTime(() => apiService.auth.login(loginData));
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.responseTime);
    });

    it('should respond to workspace requests within threshold', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Performance Test Workspace',
        description: 'A workspace for performance testing',
      };

      const { duration } = await measureTime(() => apiService.workspaces.create(workspaceData));
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.responseTime);
    });

    it('should respond to board requests within threshold', async () => {
      // First create a workspace
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Performance Test Workspace for Boards',
        description: 'A workspace for board performance testing',
      };
      const workspaceResponse = await apiService.workspaces.create(workspaceData);
      const workspaceId = workspaceResponse.data.data.id;

      const boardData: CreateBoardRequest = {
        name: 'Performance Test Board',
        description: 'A board for performance testing',
        columns: [
          { name: 'To Do', color: '#3B82F6' },
          { name: 'In Progress', color: '#F59E0B' },
          { name: 'Done', color: '#10B981' },
        ],
      };

      const { duration } = await measureTime(() => apiService.boards.create(workspaceId, boardData));
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.responseTime);
    });

    it('should respond to task requests within threshold', async () => {
      // First create a workspace and board
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Performance Test Workspace for Tasks',
        description: 'A workspace for task performance testing',
      };
      const workspaceResponse = await apiService.workspaces.create(workspaceData);
      const workspaceId = workspaceResponse.data.data.id;

      const boardData: CreateBoardRequest = {
        name: 'Performance Test Board for Tasks',
        description: 'A board for task performance testing',
        columns: [
          { name: 'To Do', color: '#3B82F6' },
          { name: 'In Progress', color: '#F59E0B' },
          { name: 'Done', color: '#10B981' },
        ],
      };
      const boardResponse = await apiService.boards.create(workspaceId, boardData);
      const boardId = boardResponse.data.data.id;

      const taskData: CreateTaskRequest = {
        title: 'Performance Test Task',
        description: 'A task for performance testing',
        priority: 'medium',
        columnId: boardId, // Using boardId as columnId for simplicity
      };

      const { duration } = await measureTime(() => apiService.tasks.create(boardId, taskData));
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.responseTime);
    });
  });

  describe('Throughput Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Concurrent Test Workspace',
        description: 'A workspace for concurrent testing',
      };

      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, (_, i) => 
        apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        })
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = (results.length / duration) * 1000; // requests per second

      expect(results).toHaveLength(10);
      expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.throughput);
    });

    it('should handle rapid sequential requests', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Sequential Test Workspace',
        description: 'A workspace for sequential testing',
      };

      const startTime = performance.now();
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const result = await apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        });
        results.push(result);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = (results.length / duration) * 1000; // requests per second

      expect(results).toHaveLength(5);
      expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.throughput);
    });
  });

  describe('Load Tests', () => {
    it('should handle high load without errors', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Load Test Workspace',
        description: 'A workspace for load testing',
      };

      const startTime = performance.now();
      const promises = Array.from({ length: 50 }, (_, i) => 
        apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        }).catch(error => ({ error }))
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const errorCount = results.filter(r => 'error' in r).length;
      const errorRate = errorCount / results.length;

      expect(errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.errorRate);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should maintain performance under sustained load', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Sustained Load Test Workspace',
        description: 'A workspace for sustained load testing',
      };

      const startTime = performance.now();
      const results = [];
      const errors = [];
      
      // Run for 30 seconds
      while (performance.now() - startTime < 30000) {
        try {
          const result = await apiService.workspaces.create({
            ...workspaceData,
            name: `${workspaceData.name} ${Date.now()}`,
          });
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
        
        // Small delay to prevent overwhelming the server
        await sleep(100);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = (results.length / duration) * 1000;
      const errorRate = errors.length / (results.length + errors.length);

      expect(errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.errorRate);
      expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.throughput);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not exceed memory threshold during operations', async () => {
      const initialMemory = measureMemory();
      
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Memory Test Workspace',
        description: 'A workspace for memory testing',
      };

      // Create multiple workspaces to test memory usage
      const promises = Array.from({ length: 20 }, (_, i) => 
        apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        })
      );
      
      await Promise.all(promises);
      
      const finalMemory = measureMemory();
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
    });

    it('should clean up memory after operations', async () => {
      const initialMemory = measureMemory();
      
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Memory Cleanup Test Workspace',
        description: 'A workspace for memory cleanup testing',
      };

      // Create and then delete workspaces
      const createPromises = Array.from({ length: 10 }, (_, i) => 
        apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        })
      );
      
      const workspaces = await Promise.all(createPromises);
      
      // Delete all workspaces
      const deletePromises = workspaces.map(w => 
        apiService.workspaces.delete(w.data.data.id)
      );
      
      await Promise.all(deletePromises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = measureMemory();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory should be close to initial level after cleanup
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage / 2);
    });
  });

  describe('Error Rate Tests', () => {
    it('should maintain low error rate under normal load', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Error Rate Test Workspace',
        description: 'A workspace for error rate testing',
      };

      const startTime = performance.now();
      const promises = Array.from({ length: 100 }, (_, i) => 
        apiService.workspaces.create({
          ...workspaceData,
          name: `${workspaceData.name} ${i + 1}`,
        }).catch(error => ({ error }))
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const errorCount = results.filter(r => 'error' in r).length;
      const errorRate = errorCount / results.length;

      expect(errorRate).toBeLessThan(PERFORMANCE_THRESHOLDS.errorRate);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle invalid requests gracefully', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        description: 'A workspace with invalid data',
      };

      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, () => 
        apiService.workspaces.create(invalidData as any).catch(error => ({ error }))
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const errorCount = results.filter(r => 'error' in r).length;

      // All requests should fail with validation errors
      expect(errorCount).toBe(10);
      expect(duration).toBeLessThan(2000); // Should fail quickly
    });
  });
});
