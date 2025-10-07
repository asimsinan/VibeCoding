/**
 * API Integration Tests - Test API endpoints with real HTTP requests
 * FR-001: API-First Design - Integration testing implementation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createApiClient } from '../../../src/lib/api/client/apiClient';
import { getApiService } from '../../../src/lib/api/services/apiService';
import {
  LoginRequest,
  RegisterRequest,
  CreateWorkspaceRequest,
  CreateBoardRequest,
  CreateTaskRequest,
} from '../../../contracts/types/api.types';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User',
};

// Mock API client for testing
let apiClient: ReturnType<typeof createApiClient>;
let apiService: ReturnType<typeof getApiService>;
let authTokens: { accessToken: string; refreshToken: string } | null = null;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize API client and service
    apiClient = createApiClient({
      baseURL: API_BASE_URL,
    });
    apiService = getApiService();
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

  beforeEach(() => {
    // Clear tokens before each test
    apiClient.clearTokens();
    authTokens = null;
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const registerData: RegisterRequest = {
        email: TEST_USER.email,
        password: TEST_USER.password,
        fullName: TEST_USER.fullName,
      };

      const response = await apiService.auth.register(registerData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('expiresIn');
      expect(response.data.user.email).toBe(TEST_USER.email);
      expect(response.data.user.fullName).toBe(TEST_USER.fullName);
      
      // Store tokens for other tests
      authTokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    });

    it('should login with existing user', async () => {
      const loginData: LoginRequest = {
        email: TEST_USER.email,
        password: TEST_USER.password,
      };

      const response = await apiService.auth.login(loginData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('expiresIn');
      expect(response.data.user.email).toBe(TEST_USER.email);
      
      // Store tokens for other tests
      authTokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    });

    it('should refresh access token', async () => {
      if (!authTokens) {
        // Login first if no tokens
        const loginData: LoginRequest = {
          email: TEST_USER.email,
          password: TEST_USER.password,
        };
        const loginResponse = await apiService.auth.login(loginData);
        authTokens = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken,
        };
      }

      const response = await apiService.auth.refresh({
        refreshToken: authTokens.refreshToken,
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('expiresIn');
      
      // Update tokens
      authTokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    });
  });

  describe('Workspace Management', () => {
    beforeEach(async () => {
      // Ensure we have valid tokens
      if (!authTokens) {
        const loginData: LoginRequest = {
          email: TEST_USER.email,
          password: TEST_USER.password,
        };
        const loginResponse = await apiService.auth.login(loginData);
        authTokens = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken,
        };
      }
      
      // Set tokens in API client
      apiClient.setTokens(authTokens.accessToken, authTokens.refreshToken);
    });

    it('should create a new workspace', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace',
        description: 'A test workspace for integration testing',
      };

      const response = await apiService.workspaces.create(workspaceData);
      
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('description');
      expect(response.data.data).toHaveProperty('ownerId');
      expect(response.data.data).toHaveProperty('memberCount');
      expect(response.data.data).toHaveProperty('boardCount');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      expect(response.data.data.name).toBe(workspaceData.name);
      expect(response.data.data.description).toBe(workspaceData.description);
    });

    it('should list user workspaces', async () => {
      const response = await apiService.workspaces.list();
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('meta');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.meta).toHaveProperty('pagination');
    });

    it('should get a specific workspace', async () => {
      // First create a workspace
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace for Get',
        description: 'A test workspace for get testing',
      };
      const createResponse = await apiService.workspaces.create(workspaceData);
      const workspaceId = createResponse.data.data.id;

      // Then get it
      const response = await apiService.workspaces.get(workspaceId);
      
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data.id).toBe(workspaceId);
      expect(response.data.data.name).toBe(workspaceData.name);
    });

    it('should update a workspace', async () => {
      // First create a workspace
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace for Update',
        description: 'A test workspace for update testing',
      };
      const createResponse = await apiService.workspaces.create(workspaceData);
      const workspaceId = createResponse.data.data.id;

      // Then update it
      const updateData = {
        name: 'Updated Workspace Name',
        description: 'Updated description',
      };
      const response = await apiService.workspaces.update(workspaceId, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data.id).toBe(workspaceId);
      expect(response.data.data.name).toBe(updateData.name);
      expect(response.data.data.description).toBe(updateData.description);
    });

    it('should delete a workspace', async () => {
      // First create a workspace
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace for Delete',
        description: 'A test workspace for delete testing',
      };
      const createResponse = await apiService.workspaces.create(workspaceData);
      const workspaceId = createResponse.data.data.id;

      // Then delete it
      const response = await apiService.workspaces.delete(workspaceId);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Board Management', () => {
    let workspaceId: string;

    beforeEach(async () => {
      // Ensure we have valid tokens
      if (!authTokens) {
        const loginData: LoginRequest = {
          email: TEST_USER.email,
          password: TEST_USER.password,
        };
        const loginResponse = await apiService.auth.login(loginData);
        authTokens = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken,
        };
      }
      
      // Set tokens in API client
      apiClient.setTokens(authTokens.accessToken, authTokens.refreshToken);

      // Create a workspace for board tests
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace for Boards',
        description: 'A test workspace for board testing',
      };
      const createResponse = await apiService.workspaces.create(workspaceData);
      workspaceId = createResponse.data.data.id;
    });

    it('should create a new board', async () => {
      const boardData: CreateBoardRequest = {
        name: 'Test Board',
        description: 'A test board for integration testing',
        columns: [
          {
            name: 'To Do',
            color: '#3B82F6',
            taskLimit: 10,
          },
          {
            name: 'In Progress',
            color: '#F59E0B',
            taskLimit: 5,
          },
          {
            name: 'Done',
            color: '#10B981',
            taskLimit: 20,
          },
        ],
      };

      const response = await apiService.boards.create(workspaceId, boardData);
      
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('description');
      expect(response.data.data).toHaveProperty('workspaceId');
      expect(response.data.data).toHaveProperty('columns');
      expect(response.data.data).toHaveProperty('taskCount');
      expect(response.data.data.name).toBe(boardData.name);
      expect(response.data.data.description).toBe(boardData.description);
      expect(response.data.data.workspaceId).toBe(workspaceId);
      expect(Array.isArray(response.data.data.columns)).toBe(true);
      expect(response.data.data.columns.length).toBe(3);
    });

    it('should list boards in a workspace', async () => {
      const response = await apiService.boards.list(workspaceId);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('meta');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.meta).toHaveProperty('pagination');
    });
  });

  describe('Task Management', () => {
    let workspaceId: string;
    let boardId: string;

    beforeEach(async () => {
      // Ensure we have valid tokens
      if (!authTokens) {
        const loginData: LoginRequest = {
          email: TEST_USER.email,
          password: TEST_USER.password,
        };
        const loginResponse = await apiService.auth.login(loginData);
        authTokens = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken,
        };
      }
      
      // Set tokens in API client
      apiClient.setTokens(authTokens.accessToken, authTokens.refreshToken);

      // Create a workspace and board for task tests
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace for Tasks',
        description: 'A test workspace for task testing',
      };
      const workspaceResponse = await apiService.workspaces.create(workspaceData);
      workspaceId = workspaceResponse.data.data.id;

      const boardData: CreateBoardRequest = {
        name: 'Test Board for Tasks',
        description: 'A test board for task testing',
        columns: [
          {
            name: 'To Do',
            color: '#3B82F6',
            taskLimit: 10,
          },
          {
            name: 'In Progress',
            color: '#F59E0B',
            taskLimit: 5,
          },
          {
            name: 'Done',
            color: '#10B981',
            taskLimit: 20,
          },
        ],
      };
      const boardResponse = await apiService.boards.create(workspaceId, boardData);
      boardId = boardResponse.data.data.id;
    });

    it('should create a new task', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Test Task',
        description: 'A test task for integration testing',
        priority: 'medium',
        dueDate: '2023-12-31T23:59:59.000Z',
        tags: ['urgent', 'frontend'],
        columnId: boardId, // Using boardId as columnId for simplicity
      };

      const response = await apiService.tasks.create(boardId, taskData);
      
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('title');
      expect(response.data.data).toHaveProperty('description');
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('priority');
      expect(response.data.data).toHaveProperty('boardId');
      expect(response.data.data).toHaveProperty('columnId');
      expect(response.data.data).toHaveProperty('position');
      expect(response.data.data).toHaveProperty('tags');
      expect(response.data.data.title).toBe(taskData.title);
      expect(response.data.data.description).toBe(taskData.description);
      expect(response.data.data.priority).toBe(taskData.priority);
      expect(response.data.data.boardId).toBe(boardId);
      expect(Array.isArray(response.data.data.tags)).toBe(true);
    });

    it('should list tasks in a board', async () => {
      const response = await apiService.tasks.list(boardId);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('meta');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.meta).toHaveProperty('pagination');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const invalidLoginData: LoginRequest = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      await expect(apiService.auth.login(invalidLoginData)).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const invalidWorkspaceData = {
        name: '', // Empty name should fail validation
        description: 'A test workspace',
      };

      await expect(apiService.workspaces.create(invalidWorkspaceData as any)).rejects.toThrow();
    });

    it('should handle unauthorized access', async () => {
      // Clear tokens to simulate unauthorized access
      apiClient.clearTokens();

      await expect(apiService.workspaces.list()).rejects.toThrow();
    });
  });
});
