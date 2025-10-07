/**
 * Unit tests for useTask hook
 * Tests task state management and Supabase integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { useTask } from '../../../src/lib/task/hooks/useTask';

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

describe('useTask Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useTask('task-123'));
      
      expect(result.current.task).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Task Loading', () => {
    it('should load task successfully', async () => {
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

      const { result } = renderHook(() => useTask('task-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.task).toEqual(mockTask);
      expect(result.current.error).toBeNull();
    });

    it('should handle task loading error', async () => {
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

      const { result } = renderHook(() => useTask('task-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.task).toBeNull();
      expect(result.current.error).toBe('Task not found');
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.updateTask({
          title: 'Updated Task',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high',
          assignee_id: 'user-456',
        });
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'user-456',
        updated_at: expect.any(String),
      });

      expect(result.current.task).toEqual(mockTask);
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.updateTask({
          title: 'Updated Task',
        });
      });

      expect(result.current.error).toBe('Update failed');
    });

    it('should validate task title before update', async () => {
      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.updateTask({
          title: '',
        });
      });

      expect(result.current.error).toContain('Task title is required');
    });

    it('should validate task status', async () => {
      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.updateTask({
          status: 'invalid_status',
        });
      });

      expect(result.current.error).toContain('Invalid task status');
    });

    it('should validate task priority', async () => {
      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.updateTask({
          priority: 'invalid_priority',
        });
      });

      expect(result.current.error).toContain('Invalid task priority');
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.moveTask('column-456', 1);
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        column_id: 'column-456',
        position: 1,
        status: 'in_progress',
        updated_at: expect.any(String),
      });

      expect(result.current.task).toEqual(mockTask);
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.moveTask('column-456', 1);
      });

      expect(result.current.error).toBe('Move failed');
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.assignTask('user-456');
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        assignee_id: 'user-456',
        updated_at: expect.any(String),
      });

      expect(result.current.task).toEqual(mockTask);
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.unassignTask();
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        assignee_id: null,
        updated_at: expect.any(String),
      });

      expect(result.current.task).toEqual(mockTask);
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.deleteTask();
      });

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(result.current.task).toBeNull();
      expect(result.current.error).toBeNull();
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

      const { result } = renderHook(() => useTask('task-123'));

      await act(async () => {
        await result.current.deleteTask();
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new operation starts', async () => {
      const { result } = renderHook(() => useTask('task-123'));

      // Set an error first
      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      // Start new operation
      act(() => {
        result.current.updateTask({ title: 'New Title' });
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useTask('task-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
    });
  });
});
