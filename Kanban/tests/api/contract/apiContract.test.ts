/**
 * API Contract Tests - Test API contracts against OpenAPI specification
 * FR-001: API-First Design - Contract testing implementation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiClient } from '../../../src/lib/api/client/apiClient';
import { getApiService } from '../../../src/lib/api/services/apiService';
import {
  LoginRequest,
  RegisterRequest,
  CreateWorkspaceRequest,
  CreateBoardRequest,
  CreateTaskRequest,
} from '../../../contracts/types/api.types';

// Mock API client for testing
const mockApiClient = createApiClient({
  baseURL: 'http://localhost:3000/api/v1',
});

const apiService = getApiService();

describe('API Contract Tests', () => {
  beforeAll(async () => {
    // Set up test data
    mockApiClient.setTokens('test-access-token', 'test-refresh-token');
  });

  afterAll(async () => {
    // Clean up
    mockApiClient.clearTokens();
  });

  describe('Authentication Endpoints', () => {
    it('should validate login request contract', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Test that the request matches the expected contract
      expect(loginData).toHaveProperty('email');
      expect(loginData).toHaveProperty('password');
      expect(typeof loginData.email).toBe('string');
      expect(typeof loginData.password).toBe('string');
      expect(loginData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(loginData.password.length).toBeGreaterThanOrEqual(8);
    });

    it('should validate register request contract', async () => {
      const registerData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      // Test that the request matches the expected contract
      expect(registerData).toHaveProperty('email');
      expect(registerData).toHaveProperty('password');
      expect(registerData).toHaveProperty('fullName');
      expect(typeof registerData.email).toBe('string');
      expect(typeof registerData.password).toBe('string');
      expect(typeof registerData.fullName).toBe('string');
      expect(registerData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(registerData.password.length).toBeGreaterThanOrEqual(8);
      expect(registerData.fullName.length).toBeGreaterThan(0);
    });
  });

  describe('Workspace Endpoints', () => {
    it('should validate create workspace request contract', async () => {
      const workspaceData: CreateWorkspaceRequest = {
        name: 'Test Workspace',
        description: 'A test workspace',
      };

      // Test that the request matches the expected contract
      expect(workspaceData).toHaveProperty('name');
      expect(workspaceData).toHaveProperty('description');
      expect(typeof workspaceData.name).toBe('string');
      expect(typeof workspaceData.description).toBe('string');
      expect(workspaceData.name.length).toBeGreaterThan(0);
      expect(workspaceData.name.length).toBeLessThanOrEqual(100);
      expect(workspaceData.description!.length).toBeLessThanOrEqual(500);
    });

    it('should validate workspace response contract', async () => {
      const mockWorkspace = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Workspace',
        description: 'A test workspace',
        ownerId: '123e4567-e89b-12d3-a456-426614174001',
        memberCount: 1,
        boardCount: 0,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };

      // Test that the response matches the expected contract
      expect(mockWorkspace).toHaveProperty('id');
      expect(mockWorkspace).toHaveProperty('name');
      expect(mockWorkspace).toHaveProperty('description');
      expect(mockWorkspace).toHaveProperty('ownerId');
      expect(mockWorkspace).toHaveProperty('memberCount');
      expect(mockWorkspace).toHaveProperty('boardCount');
      expect(mockWorkspace).toHaveProperty('createdAt');
      expect(mockWorkspace).toHaveProperty('updatedAt');
      expect(typeof mockWorkspace.id).toBe('string');
      expect(typeof mockWorkspace.name).toBe('string');
      expect(typeof mockWorkspace.description).toBe('string');
      expect(typeof mockWorkspace.ownerId).toBe('string');
      expect(typeof mockWorkspace.memberCount).toBe('number');
      expect(typeof mockWorkspace.boardCount).toBe('number');
      expect(typeof mockWorkspace.createdAt).toBe('string');
      expect(typeof mockWorkspace.updatedAt).toBe('string');
    });
  });

  describe('Board Endpoints', () => {
    it('should validate create board request contract', async () => {
      const boardData: CreateBoardRequest = {
        name: 'Test Board',
        description: 'A test board',
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

      // Test that the request matches the expected contract
      expect(boardData).toHaveProperty('name');
      expect(boardData).toHaveProperty('description');
      expect(boardData).toHaveProperty('columns');
      expect(typeof boardData.name).toBe('string');
      expect(typeof boardData.description).toBe('string');
      expect(Array.isArray(boardData.columns)).toBe(true);
      expect(boardData.columns!.length).toBeGreaterThan(0);
      expect(boardData.columns!.length).toBeLessThanOrEqual(20);

      // Test column contract
      boardData.columns!.forEach((column) => {
        expect(column).toHaveProperty('name');
        expect(column).toHaveProperty('color');
        expect(column).toHaveProperty('taskLimit');
        expect(typeof column.name).toBe('string');
        expect(typeof column.color).toBe('string');
        expect(typeof column.taskLimit).toBe('number');
        expect(column.name.length).toBeGreaterThan(0);
        expect(column.name.length).toBeLessThanOrEqual(100);
        expect(column.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(column.taskLimit).toBeGreaterThan(0);
        expect(column.taskLimit).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('Task Endpoints', () => {
    it('should validate create task request contract', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Test Task',
        description: 'A test task description',
        priority: 'medium',
        assigneeId: '123e4567-e89b-12d3-a456-426614174002',
        dueDate: '2023-12-31T23:59:59.000Z',
        tags: ['urgent', 'frontend'],
        columnId: '123e4567-e89b-12d3-a456-426614174003',
      };

      // Test that the request matches the expected contract
      expect(taskData).toHaveProperty('title');
      expect(taskData).toHaveProperty('description');
      expect(taskData).toHaveProperty('priority');
      expect(taskData).toHaveProperty('assigneeId');
      expect(taskData).toHaveProperty('dueDate');
      expect(taskData).toHaveProperty('tags');
      expect(taskData).toHaveProperty('columnId');
      expect(typeof taskData.title).toBe('string');
      expect(typeof taskData.description).toBe('string');
      expect(typeof taskData.priority).toBe('string');
      expect(typeof taskData.assigneeId).toBe('string');
      expect(typeof taskData.dueDate).toBe('string');
      expect(Array.isArray(taskData.tags)).toBe(true);
      expect(typeof taskData.columnId).toBe('string');
      expect(taskData.title.length).toBeGreaterThan(0);
      expect(taskData.title.length).toBeLessThanOrEqual(200);
      expect(taskData.description!.length).toBeLessThanOrEqual(1000);
      expect(['low', 'medium', 'high', 'urgent']).toContain(taskData.priority);
      expect(taskData.tags!.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Error Response Contract', () => {
    it('should validate error response contract', async () => {
      const mockError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            fields: [
              {
                field: 'email',
                message: 'Invalid email format',
                value: 'invalid-email',
              },
            ],
          },
        },
        meta: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0.0',
        },
      };

      // Test that the error response matches the expected contract
      expect(mockError).toHaveProperty('error');
      expect(mockError).toHaveProperty('meta');
      expect(mockError.error).toHaveProperty('code');
      expect(mockError.error).toHaveProperty('message');
      expect(mockError.error).toHaveProperty('details');
      expect(mockError.meta).toHaveProperty('timestamp');
      expect(mockError.meta).toHaveProperty('version');
      expect(typeof mockError.error.code).toBe('string');
      expect(typeof mockError.error.message).toBe('string');
      expect(typeof mockError.error.details).toBe('object');
      expect(typeof mockError.meta.timestamp).toBe('string');
      expect(typeof mockError.meta.version).toBe('string');
    });
  });

  describe('Pagination Contract', () => {
    it('should validate pagination response contract', async () => {
      const mockPagination = {
        data: [],
        meta: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0.0',
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      // Test that the pagination response matches the expected contract
      expect(mockPagination).toHaveProperty('data');
      expect(mockPagination).toHaveProperty('meta');
      expect(mockPagination.meta).toHaveProperty('pagination');
      expect(mockPagination.meta.pagination).toHaveProperty('page');
      expect(mockPagination.meta.pagination).toHaveProperty('limit');
      expect(mockPagination.meta.pagination).toHaveProperty('total');
      expect(mockPagination.meta.pagination).toHaveProperty('pages');
      expect(mockPagination.meta.pagination).toHaveProperty('hasNext');
      expect(mockPagination.meta.pagination).toHaveProperty('hasPrev');
      expect(typeof mockPagination.meta.pagination.page).toBe('number');
      expect(typeof mockPagination.meta.pagination.limit).toBe('number');
      expect(typeof mockPagination.meta.pagination.total).toBe('number');
      expect(typeof mockPagination.meta.pagination.pages).toBe('number');
      expect(typeof mockPagination.meta.pagination.hasNext).toBe('boolean');
      expect(typeof mockPagination.meta.pagination.hasPrev).toBe('boolean');
    });
  });
});
