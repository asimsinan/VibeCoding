/**
 * Unit tests for drag-drop service
 * Tests drag and drop business logic and @dnd-kit integration
 */

import { DragDropService } from '../../../src/lib/drag-drop/services/dragDropService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('DragDropService', () => {
  let dragDropService: DragDropService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    dragDropService = new DragDropService();
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

      const result = await dragDropService.moveTask('task-123', 'column-456', 1);

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

      const result = await dragDropService.moveTask('task-123', 'column-456', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Move failed');
    });

    it('should validate task ID before movement', async () => {
      const result = await dragDropService.moveTask('', 'column-456', 1);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task ID is required');
    });

    it('should validate column ID before movement', async () => {
      const result = await dragDropService.moveTask('task-123', '', 1);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Column ID is required');
    });

    it('should validate position before movement', async () => {
      const result = await dragDropService.moveTask('task-123', 'column-456', -1);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Position must be non-negative');
    });
  });

  describe('Task Reordering', () => {
    it('should reorder tasks within column', async () => {
      const mockTasks = [
        { id: 'task-123', position: 0 },
        { id: 'task-456', position: 1 },
        { id: 'task-789', position: 2 },
      ];

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockTasks[0],
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await dragDropService.reorderTasks('column-123', ['task-456', 'task-123', 'task-789']);

      expect(mockQuery.update).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle task reordering error', async () => {
      const mockError = { message: 'Reorder failed' };

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

      const result = await dragDropService.reorderTasks('column-123', ['task-456', 'task-123']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Reorder failed');
    });

    it('should validate column ID before reordering', async () => {
      const result = await dragDropService.reorderTasks('', ['task-456', 'task-123']);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Column ID is required');
    });

    it('should validate task IDs before reordering', async () => {
      const result = await dragDropService.reorderTasks('column-123', []);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task IDs are required');
    });
  });

  describe('Column Reordering', () => {
    it('should reorder columns within board', async () => {
      const mockColumns = [
        { id: 'column-123', position: 0 },
        { id: 'column-456', position: 1 },
        { id: 'column-789', position: 2 },
      ];

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockColumns[0],
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await dragDropService.reorderColumns('board-123', ['column-456', 'column-123', 'column-789']);

      expect(mockQuery.update).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle column reordering error', async () => {
      const mockError = { message: 'Reorder failed' };

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

      const result = await dragDropService.reorderColumns('board-123', ['column-456', 'column-123']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Reorder failed');
    });

    it('should validate board ID before reordering', async () => {
      const result = await dragDropService.reorderColumns('', ['column-456', 'column-123']);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Board ID is required');
    });

    it('should validate column IDs before reordering', async () => {
      const result = await dragDropService.reorderColumns('board-123', []);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Column IDs are required');
    });
  });

  describe('Bulk Operations', () => {
    it('should move multiple tasks to different column', async () => {
      const mockTasks = [
        { id: 'task-123', position: 0 },
        { id: 'task-456', position: 1 },
      ];

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockTasks[0],
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await dragDropService.moveTasks(['task-123', 'task-456'], 'column-456');

      expect(mockQuery.update).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle bulk task movement error', async () => {
      const mockError = { message: 'Bulk move failed' };

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

      const result = await dragDropService.moveTasks(['task-123', 'task-456'], 'column-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bulk move failed');
    });

    it('should validate task IDs before bulk movement', async () => {
      const result = await dragDropService.moveTasks([], 'column-456');

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task IDs are required');
    });

    it('should validate column ID before bulk movement', async () => {
      const result = await dragDropService.moveTasks(['task-123'], '');

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Column ID is required');
    });
  });

  describe('Status Updates', () => {
    it('should update task status based on column', async () => {
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

      const result = await dragDropService.updateTaskStatus('task-123', 'column-456');

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'in_progress',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(result.error).toBeNull();
    });

    it('should handle status update error', async () => {
      const mockError = { message: 'Status update failed' };

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

      const result = await dragDropService.updateTaskStatus('task-123', 'column-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Status update failed');
    });

    it('should map column to correct status', () => {
      expect(dragDropService.getStatusFromColumn('column-todo')).toBe('todo');
      expect(dragDropService.getStatusFromColumn('column-in-progress')).toBe('in_progress');
      expect(dragDropService.getStatusFromColumn('column-done')).toBe('done');
      expect(dragDropService.getStatusFromColumn('column-archived')).toBe('archived');
      expect(dragDropService.getStatusFromColumn('unknown-column')).toBe('todo');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockRejectedValue(new Error('Network error')),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await dragDropService.moveTask('task-123', 'column-456', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle unexpected errors', async () => {
      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockRejectedValue('Unexpected error'),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await dragDropService.moveTask('task-123', 'column-456', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('An unexpected error occurred');
    });
  });
});
