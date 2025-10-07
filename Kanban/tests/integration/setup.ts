// Integration test setup and utilities
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Test configuration
export const TEST_CONFIG = {
  supabaseUrl: 'https://rnugtlgygqbvtbklnmhn.supabase.co',
  supabaseKey: 'sb_publishable_TkyJdjZ2UppYRodIEvNioA_Y4qcekX4',
  testUserEmail: 'test@example.com',
  testUserPassword: 'testpassword123',
  testWorkspaceName: 'Test Workspace',
  testBoardTitle: 'Test Board',
  testTaskTitle: 'Test Task',
};

// Create Supabase client for testing
export const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

// Test data schemas
export const TestUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.string().datetime(),
});

export const TestWorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TestBoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  workspace_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TestTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  board_id: z.string().uuid(),
  column_id: z.string().uuid(),
  position: z.number().int().min(0),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
});

// Test data factory
export class TestDataFactory {
  private static userId: string | null = null;
  private static workspaceId: string | null = null;
  private static boardId: string | null = null;
  private static columnId: string | null = null;

  static async createTestUser(): Promise<{ user: any; session: any }> {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_CONFIG.testUserEmail,
      password: TEST_CONFIG.testUserPassword,
      options: {
        data: {
          name: 'Test User',
        },
      },
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    this.userId = data.user?.id || null;
    return data;
  }

  static async createTestWorkspace(): Promise<any> {
    if (!this.userId) {
      throw new Error('Test user must be created first');
    }

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        name: TEST_CONFIG.testWorkspaceName,
        description: 'A test workspace for integration testing',
        created_by: this.userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test workspace: ${error.message}`);
    }

    this.workspaceId = data.id;
    return data;
  }

  static async createTestBoard(): Promise<any> {
    if (!this.workspaceId) {
      throw new Error('Test workspace must be created first');
    }

    const { data, error } = await supabase
      .from('boards')
      .insert({
        title: TEST_CONFIG.testBoardTitle,
        description: 'A test board for integration testing',
        workspace_id: this.workspaceId,
        created_by: this.userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test board: ${error.message}`);
    }

    this.boardId = data.id;
    return data;
  }

  static async createTestColumns(): Promise<any[]> {
    if (!this.boardId) {
      throw new Error('Test board must be created first');
    }

    const columns = [
      { title: 'To Do', position: 0 },
      { title: 'In Progress', position: 1 },
      { title: 'Done', position: 2 },
    ];

    const { data, error } = await supabase
      .from('columns')
      .insert(
        columns.map(col => ({
          ...col,
          board_id: this.boardId,
        }))
      )
      .select();

    if (error) {
      throw new Error(`Failed to create test columns: ${error.message}`);
    }

    this.columnId = data[0].id;
    return data;
  }

  static async createTestTask(): Promise<any> {
    if (!this.boardId || !this.columnId) {
      throw new Error('Test board and columns must be created first');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: TEST_CONFIG.testTaskTitle,
        description: 'A test task for integration testing',
        board_id: this.boardId,
        column_id: this.columnId,
        position: 0,
        status: 'todo',
        priority: 'medium',
        assignee_id: this.userId,
        created_by: this.userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test task: ${error.message}`);
    }

    return data;
  }

  static async cleanup(): Promise<void> {
    try {
      // Clean up in reverse order of creation
      if (this.boardId) {
        await supabase.from('boards').delete().eq('id', this.boardId);
      }
      if (this.workspaceId) {
        await supabase.from('workspaces').delete().eq('id', this.workspaceId);
      }
      if (this.userId) {
        await supabase.auth.admin.deleteUser(this.userId);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    } finally {
      // Reset IDs
      this.userId = null;
      this.workspaceId = null;
      this.boardId = null;
      this.columnId = null;
    }
  }

  static getIds() {
    return {
      userId: this.userId,
      workspaceId: this.workspaceId,
      boardId: this.boardId,
      columnId: this.columnId,
    };
  }
}

// Test utilities
export class TestUtils {
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateTestEmail(): string {
    return `test-${this.generateRandomString(8)}@example.com`;
  }

  static async makeApiRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    return fetch(url, { ...defaultOptions, ...options });
  }

  static async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  static async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    return this.makeApiRequest(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

// Test environment setup
export async function setupTestEnvironment(): Promise<void> {
  console.log('Setting up test environment...');
  
  // Verify Supabase connection
  const { data, error } = await supabase.from('workspaces').select('count').limit(1);
  if (error) {
    throw new Error(`Failed to connect to Supabase: ${error.message}`);
  }
  
  console.log('Test environment setup complete');
}

export async function teardownTestEnvironment(): Promise<void> {
  console.log('Tearing down test environment...');
  await TestDataFactory.cleanup();
  console.log('Test environment teardown complete');
}
