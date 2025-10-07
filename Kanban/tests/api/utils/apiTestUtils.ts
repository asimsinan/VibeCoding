/**
 * API Test Utilities - Common utilities for API testing
 * FR-001: API-First Design - API testing utilities
 */

import { createApiClient } from '../../../src/lib/api/client/apiClient';
import { getApiService } from '../../../src/lib/api/services/apiService';
import { ApiClientConfig, LoginRequest, RegisterRequest } from '../../../contracts/types/api.types';

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface TestWorkspace {
  id: string;
  name: string;
  description: string;
}

export interface TestBoard {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
}

export interface TestTask {
  id: string;
  title: string;
  description: string;
  boardId: string;
  columnId: string;
}

export class ApiTestUtils {
  private static instance: ApiTestUtils;
  private apiClient: ReturnType<typeof createApiClient>;
  private apiService: ReturnType<typeof getApiService>;
  private testUsers: Map<string, TestUser> = new Map();
  private testWorkspaces: Map<string, TestWorkspace> = new Map();
  private testBoards: Map<string, TestBoard> = new Map();
  private testTasks: Map<string, TestTask> = new Map();

  constructor(config: ApiClientConfig) {
    this.apiClient = createApiClient(config);
    this.apiService = getApiService();
  }

  public static getInstance(config: ApiClientConfig): ApiTestUtils {
    if (!ApiTestUtils.instance) {
      ApiTestUtils.instance = new ApiTestUtils(config);
    }
    return ApiTestUtils.instance;
  }

  public async createTestUser(prefix: string = 'test'): Promise<TestUser> {
    const timestamp = Date.now();
    const user: TestUser = {
      email: `${prefix}-${timestamp}@example.com`,
      password: 'TestPassword123!',
      fullName: `Test User ${timestamp}`,
    };

    try {
      const response = await this.apiService.auth.register({
        email: user.email,
        password: user.password,
        fullName: user.fullName,
      });

      user.tokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };

      this.apiClient.setTokens(user.tokens.accessToken, user.tokens.refreshToken);
      this.testUsers.set(user.email, user);

      return user;
    } catch (error) {
      throw new Error(`Failed to create test user: ${error}`);
    }
  }

  public async loginTestUser(email: string, password: string): Promise<TestUser> {
    try {
      const response = await this.apiService.auth.login({ email, password });
      
      const user: TestUser = {
        email,
        password,
        fullName: response.data.user.fullName,
        tokens: {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
      };

      this.apiClient.setTokens(user.tokens.accessToken, user.tokens.refreshToken);
      this.testUsers.set(email, user);

      return user;
    } catch (error) {
      throw new Error(`Failed to login test user: ${error}`);
    }
  }

  public async createTestWorkspace(user: TestUser, name?: string): Promise<TestWorkspace> {
    if (!user.tokens) {
      throw new Error('User must be authenticated to create workspace');
    }

    this.apiClient.setTokens(user.tokens.accessToken, user.tokens.refreshToken);

    const workspaceName = name || `Test Workspace ${Date.now()}`;
    const response = await this.apiService.workspaces.create({
      name: workspaceName,
      description: `A test workspace created at ${new Date().toISOString()}`,
    });

    const workspace: TestWorkspace = {
      id: response.data.data.id,
      name: response.data.data.name,
      description: response.data.data.description || '',
    };

    this.testWorkspaces.set(workspace.id, workspace);
    return workspace;
  }

  public async createTestBoard(user: TestUser, workspaceId: string, name?: string): Promise<TestBoard> {
    if (!user.tokens) {
      throw new Error('User must be authenticated to create board');
    }

    this.apiClient.setTokens(user.tokens.accessToken, user.tokens.refreshToken);

    const boardName = name || `Test Board ${Date.now()}`;
    const response = await this.apiService.boards.create(workspaceId, {
      name: boardName,
      description: `A test board created at ${new Date().toISOString()}`,
      columns: [
        { name: 'To Do', color: '#3B82F6' },
        { name: 'In Progress', color: '#F59E0B' },
        { name: 'Done', color: '#10B981' },
      ],
    });

    const board: TestBoard = {
      id: response.data.data.id,
      name: response.data.data.name,
      description: response.data.data.description || '',
      workspaceId,
    };

    this.testBoards.set(board.id, board);
    return board;
  }

  public async createTestTask(user: TestUser, boardId: string, title?: string): Promise<TestTask> {
    if (!user.tokens) {
      throw new Error('User must be authenticated to create task');
    }

    this.apiClient.setTokens(user.tokens.accessToken, user.tokens.refreshToken);

    const taskTitle = title || `Test Task ${Date.now()}`;
    const response = await this.apiService.tasks.create(boardId, {
      title: taskTitle,
      description: `A test task created at ${new Date().toISOString()}`,
      priority: 'medium',
      columnId: boardId, // Using boardId as columnId for simplicity
    });

    const task: TestTask = {
      id: response.data.data.id,
      title: response.data.data.title,
      description: response.data.data.description || '',
      boardId,
      columnId: response.data.data.columnId,
    };

    this.testTasks.set(task.id, task);
    return task;
  }

  public async cleanupTestData(): Promise<void> {
    // Clean up tasks
    for (const [taskId, task] of this.testTasks) {
      try {
        await this.apiService.tasks.delete(taskId);
      } catch (error) {
        console.warn(`Failed to delete test task ${taskId}:`, error);
      }
    }
    this.testTasks.clear();

    // Clean up boards
    for (const [boardId, board] of this.testBoards) {
      try {
        await this.apiService.boards.delete(boardId);
      } catch (error) {
        console.warn(`Failed to delete test board ${boardId}:`, error);
      }
    }
    this.testBoards.clear();

    // Clean up workspaces
    for (const [workspaceId, workspace] of this.testWorkspaces) {
      try {
        await this.apiService.workspaces.delete(workspaceId);
      } catch (error) {
        console.warn(`Failed to delete test workspace ${workspaceId}:`, error);
      }
    }
    this.testWorkspaces.clear();

    // Clean up users
    for (const [email, user] of this.testUsers) {
      try {
        if (user.tokens) {
          this.apiClient.setTokens(user.tokens.accessToken, user.tokens.refreshToken);
          await this.apiService.auth.logout();
        }
      } catch (error) {
        console.warn(`Failed to logout test user ${email}:`, error);
      }
    }
    this.testUsers.clear();
  }

  public getTestUser(email: string): TestUser | undefined {
    return this.testUsers.get(email);
  }

  public getTestWorkspace(id: string): TestWorkspace | undefined {
    return this.testWorkspaces.get(id);
  }

  public getTestBoard(id: string): TestBoard | undefined {
    return this.testBoards.get(id);
  }

  public getTestTask(id: string): TestTask | undefined {
    return this.testTasks.get(id);
  }

  public getAllTestUsers(): TestUser[] {
    return Array.from(this.testUsers.values());
  }

  public getAllTestWorkspaces(): TestWorkspace[] {
    return Array.from(this.testWorkspaces.values());
  }

  public getAllTestBoards(): TestBoard[] {
    return Array.from(this.testBoards.values());
  }

  public getAllTestTasks(): TestTask[] {
    return Array.from(this.testTasks.values());
  }

  public async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return false;
  }

  public async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  public generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public generateRandomEmail(domain: string = 'example.com'): string {
    return `${this.generateRandomString(8)}@${domain}`;
  }

  public generateRandomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public createMockRequest(overrides: any = {}): any {
    return {
      method: 'GET',
      url: '/api/v1/test',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Agent/1.0',
        ...overrides.headers,
      },
      body: {},
      query: {},
      params: {},
      ...overrides,
    };
  }

  public createMockResponse(): any {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      headers: {},
    };

    return res;
  }

  public createMockNext(): any {
    return jest.fn();
  }

  public async measureResponseTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    return { result, duration };
  }

  public async measureMemoryUsage<T>(operation: () => Promise<T>): Promise<{ result: T; memoryUsage: number }> {
    const startMemory = process.memoryUsage().heapUsed;
    const result = await operation();
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsage = endMemory - startMemory;
    return { result, memoryUsage };
  }

  public createTestSuite(name: string, tests: () => void): void {
    describe(name, () => {
      beforeEach(async () => {
        await this.cleanupTestData();
      });

      afterEach(async () => {
        await this.cleanupTestData();
      });

      tests();
    });
  }
}

// Export factory function
export function createApiTestUtils(config: ApiClientConfig): ApiTestUtils {
  return ApiTestUtils.getInstance(config);
}
