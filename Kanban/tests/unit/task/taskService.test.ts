/**
 * Unit tests for task service
 * Tests task business logic and Supabase integration
 */

import { TaskService } from '../../../src/lib/task/services/taskService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    taskService = new TaskService();
  });

  describe('Task Creation', () => {
    it('should create task with valid data', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        assignee_id: 'user-123',
        due_date: '2023-12-31T23:59:59Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockTask,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        assignee_id: 'user-123',
        due_date: '2023-12-31T23:59:59Z',
        created_by: 'user-123',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        assignee_id: 'user-123',
        due_date: '2023-12-31T23:59:59Z',
        created_by: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle task creation error', async () => {
      const mockError = { message: 'Creation failed' };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        created_by: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Creation failed');
    });

    it('should validate task title before creation', async () => {
      const result = await taskService.createTask({
        title: '',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task title is required');
    });

    it('should validate task title length', async () => {
      const longTitle = 'a'.repeat(201);

      const result = await taskService.createTask({
        title: longTitle,
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task title must be less than 200 characters');
    });

    it('should validate task status', async () => {
      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'invalid_status',
        priority: 'medium',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task status');
    });

    it('should validate task priority', async () => {
      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'invalid_priority',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid task priority');
    });
  });

  describe('Task Retrieval', () => {
    it('should get task by ID', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        description: 'A test task',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'todo',
        priority: 'medium',
        assignee_id: 'user-123',
        due_date: '2023-12-31T23:59:59Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockTask,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.getTask('task-123');

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle task not found error', async () => {
      const mockError = { message: 'Task not found' };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.getTask('task-123');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Task not found');
    });

    it('should get board tasks', async () => {
      const mockTasks = [
        {
          id: 'task-123',
          title: 'Test Task 1',
          description: 'A test task',
          board_id: 'board-123',
          column_id: 'column-123',
          position: 0,
          status: 'todo',
          priority: 'medium',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          created_by: 'user-123',
        },
        {
          id: 'task-456',
          title: 'Test Task 2',
          description: 'Another test task',
          board_id: 'board-123',
          column_id: 'column-456',
          position: 0,
          status: 'in_progress',
          priority: 'high',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          created_by: 'user-123',
        },
      ];

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockTasks,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.getBoardTasks('board-123', 10);

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('board_id', 'board-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
      expect(result.error).toBeNull();
    });

    it('should get column tasks', async () => {
      const mockTasks = [
        {
          id: 'task-123',
          title: 'Test Task 1',
          description: 'A test task',
          board_id: 'board-123',
          column_id: 'column-123',
          position: 0,
          status: 'todo',
          priority: 'medium',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          created_by: 'user-123',
        },
      ];

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockTasks,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.getColumnTasks('column-123', 10);

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('column_id', 'column-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
      expect(result.error).toBeNull();
    });
  });

  describe('Task Updates', () => {
    it('should update task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Updated Task',
        description: 'Updated description',
        board_id: 'board-123',
        column_id: 'column-123',
        position: 0,
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'user-456',
        due_date: '2023-12-31T23:59:59Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockTask,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.updateTask('task-123', {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'user-456',
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'user-456',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle task update error', async () => {
      const mockError = { message: 'Update failed' };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.updateTask('task-123', {
        title: 'Updated Task',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('Task Movement', () => {
    it('should move task to different column', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        board_id: 'board-123',
        column_id: 'column-456',
        position: 1,
        status: 'in_progress',
        priority: 'medium',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockTask,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.moveTask('task-123', 'column-456', 1);

      expect(mockQuery.update).toHaveBeenCalledWith({
        column_id: 'column-456',
        position: 1,
        status: 'in_progress',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle task movement error', async () => {
      const mockError = { message: 'Move failed' };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.moveTask('task-123', 'column-456', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Move failed');
    });
  });

  describe('Task Assignment', () => {
    it('should assign task to user', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assignee_id: 'user-456',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockTask,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.assignTask('task-123', 'user-456');

      expect(mockQuery.update).toHaveBeenCalledWith({
        assignee_id: 'user-456',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should unassign task', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        assignee_id: null,
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockTask,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.unassignTask('task-123');

      expect(mockQuery.update).toHaveBeenCalledWith({
        assignee_id: null,
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });
  });

  describe('Task Deletion', () => {
    it('should delete task successfully', async () => {
      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.deleteTask('task-123');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle task deletion error', async () => {
      const mockError = { message: 'Delete failed' };

      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.deleteTask('task-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.getTask('task-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle unexpected errors', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue('Unexpected error'),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await taskService.getTask('task-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('An unexpected error occurred');
    });
  });
});
