// Integration tests for workspace functionality
import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import { TestDataFactory, TestUtils, setupTestEnvironment, teardownTestEnvironment } from './setup';
import { WorkspaceListResponseSchema, WorkspaceResponseSchema } from '@/contracts/schemas/workspace.schema';

describe('Workspace Integration Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clean up before each test
    await TestDataFactory.cleanup();
  });

  describe('GET /api/v1/workspaces', () => {
    it('should return empty list when user has no workspaces', async () => {
      // Create test user but no workspaces
      await TestDataFactory.createTestUser();
      
      const response = await TestUtils.makeAuthenticatedRequest('/api/v1/workspaces');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      const validatedData = WorkspaceListResponseSchema.parse(data);
      
      expect(validatedData.data).toHaveLength(0);
      expect(validatedData.meta.total).toBe(0);
    });

    it('should return user workspaces when they exist', async () => {
      // Create test user and workspace
      await TestDataFactory.createTestUser();
      const workspace = await TestDataFactory.createTestWorkspace();
      
      const response = await TestUtils.makeAuthenticatedRequest('/api/v1/workspaces');
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      const validatedData = WorkspaceListResponseSchema.parse(data);
      
      expect(validatedData.data).toHaveLength(1);
      expect(validatedData.data[0].id).toBe(workspace.id);
      expect(validatedData.data[0].name).toBe(workspace.name);
      expect(validatedData.meta.total).toBe(1);
    });

    it('should require authentication', async () => {
      const response = await TestUtils.makeApiRequest('/api/v1/workspaces');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/workspaces', () => {
    it('should create a new workspace', async () => {
      await TestDataFactory.createTestUser();
      
      const workspaceData = {
        name: 'New Test Workspace',
        description: 'A new test workspace',
      };
      
      const response = await TestUtils.makeAuthenticatedRequest('/api/v1/workspaces', {
        method: 'POST',
        body: JSON.stringify(workspaceData),
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      const validatedData = WorkspaceResponseSchema.parse(data);
      
      expect(validatedData.data.name).toBe(workspaceData.name);
      expect(validatedData.data.description).toBe(workspaceData.description);
      expect(validatedData.data.id).toBeDefined();
      expect(validatedData.data.created_at).toBeDefined();
    });

    it('should validate required fields', async () => {
      await TestDataFactory.createTestUser();
      
      const response = await TestUtils.makeAuthenticatedRequest('/api/v1/workspaces', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect(response.status).toBe(400);
    });

    it('should validate field lengths', async () => {
      await TestDataFactory.createTestUser();
      
      const workspaceData = {
        name: 'a'.repeat(101), // Too long
        description: 'b'.repeat(501), // Too long
      };
      
      const response = await TestUtils.makeAuthenticatedRequest('/api/v1/workspaces', {
        method: 'POST',
        body: JSON.stringify(workspaceData),
      });
      
      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const workspaceData = {
        name: 'New Test Workspace',
        description: 'A new test workspace',
      };
      
      const response = await TestUtils.makeApiRequest('/api/v1/workspaces', {
        method: 'POST',
        body: JSON.stringify(workspaceData),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/workspaces/{id}/boards', () => {
    it('should return workspace boards', async () => {
      await TestDataFactory.createTestUser();
      const workspace = await TestDataFactory.createTestWorkspace();
      const board = await TestDataFactory.createTestBoard();
      
      const response = await TestUtils.makeAuthenticatedRequest(`/api/v1/workspaces/${workspace.id}/boards`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe(board.id);
      expect(data.data[0].title).toBe(board.title);
    });

    it('should return 404 for non-existent workspace', async () => {
      await TestDataFactory.createTestUser();
      
      const fakeWorkspaceId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await TestUtils.makeAuthenticatedRequest(`/api/v1/workspaces/${fakeWorkspaceId}/boards`);
      
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const fakeWorkspaceId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await TestUtils.makeApiRequest(`/api/v1/workspaces/${fakeWorkspaceId}/boards`);
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/workspaces/{id}/boards', () => {
    it('should create a new board in workspace', async () => {
      await TestDataFactory.createTestUser();
      const workspace = await TestDataFactory.createTestWorkspace();
      
      const boardData = {
        title: 'New Test Board',
        description: 'A new test board',
      };
      
      const response = await TestUtils.makeAuthenticatedRequest(`/api/v1/workspaces/${workspace.id}/boards`, {
        method: 'POST',
        body: JSON.stringify(boardData),
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.data.title).toBe(boardData.title);
      expect(data.data.description).toBe(boardData.description);
      expect(data.data.workspace_id).toBe(workspace.id);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      await TestDataFactory.createTestUser();
      const workspace = await TestDataFactory.createTestWorkspace();
      
      const response = await TestUtils.makeAuthenticatedRequest(`/api/v1/workspaces/${workspace.id}/boards`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent workspace', async () => {
      await TestDataFactory.createTestUser();
      
      const fakeWorkspaceId = '550e8400-e29b-41d4-a716-446655440999';
      const boardData = {
        title: 'New Test Board',
        description: 'A new test board',
      };
      
      const response = await TestUtils.makeAuthenticatedRequest(`/api/v1/workspaces/${fakeWorkspaceId}/boards`, {
        method: 'POST',
        body: JSON.stringify(boardData),
      });
      
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const fakeWorkspaceId = '550e8400-e29b-41d4-a716-446655440999';
      const boardData = {
        title: 'New Test Board',
        description: 'A new test board',
      };
      
      const response = await TestUtils.makeApiRequest(`/api/v1/workspaces/${fakeWorkspaceId}/boards`, {
        method: 'POST',
        body: JSON.stringify(boardData),
      });
      
      expect(response.status).toBe(401);
    });
  });
});
