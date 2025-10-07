/**
 * Unit tests for useBoard hook
 * Tests board state management and Supabase integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { useBoard } from '../../../src/lib/board/hooks/useBoard';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      order: jest.fn(() => ({
        limit: jest.fn(),
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

describe('useBoard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useBoard('board-123'));
      
      expect(result.current.board).toBeNull();
      expect(result.current.columns).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Board Loading', () => {
    it('should load board successfully', async () => {
      const mockBoard = {
        id: 'board-123',
        title: 'Test Board',
        description: 'A test board',
        workspace_id: 'workspace-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockBoard,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.board).toEqual(mockBoard);
      expect(result.current.error).toBeNull();
    });

    it('should handle board loading error', async () => {
      const mockError = { message: 'Board not found' };

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

      const { result } = renderHook(() => useBoard('board-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.board).toBeNull();
      expect(result.current.error).toBe('Board not found');
    });
  });

  describe('Column Management', () => {
    it('should load board columns', async () => {
      const mockColumns = [
        {
          id: 'column-123',
          title: 'To Do',
          position: 0,
          board_id: 'board-123',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'column-456',
          title: 'In Progress',
          position: 1,
          board_id: 'board-123',
          created_at: '2023-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockColumns,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.columns).toEqual(mockColumns);
    });

    it('should add new column', async () => {
      const mockColumn = {
        id: 'column-789',
        title: 'Done',
        position: 2,
        board_id: 'board-123',
        created_at: '2023-01-01T00:00:00Z',
      };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockColumn,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.addColumn('Done', 2);
      });

      expect(mockQuery.insert).toHaveBeenCalledWith({
        title: 'Done',
        position: 2,
        board_id: 'board-123',
      });

      expect(result.current.error).toBeNull();
    });

    it('should update column title', async () => {
      const mockColumn = {
        id: 'column-123',
        title: 'Updated Column',
        position: 0,
        board_id: 'board-123',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockColumn,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.updateColumn('column-123', { title: 'Updated Column' });
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Column',
        updated_at: expect.any(String),
      });

      expect(result.current.error).toBeNull();
    });

    it('should delete column', async () => {
      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.deleteColumn('column-123');
      });

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should reorder columns', async () => {
      const mockColumns = [
        { id: 'column-123', title: 'To Do', position: 0 },
        { id: 'column-456', title: 'In Progress', position: 1 },
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

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.reorderColumns(['column-456', 'column-123']);
      });

      expect(mockQuery.update).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Board Updates', () => {
    it('should update board successfully', async () => {
      const mockBoard = {
        id: 'board-123',
        title: 'Updated Board',
        description: 'Updated description',
        workspace_id: 'workspace-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        created_by: 'user-123',
      };

      const mockQuery = {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockBoard,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.updateBoard({
          title: 'Updated Board',
          description: 'Updated description',
        });
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Board',
        description: 'Updated description',
        updated_at: expect.any(String),
      });

      expect(result.current.board).toEqual(mockBoard);
      expect(result.current.error).toBeNull();
    });

    it('should handle board update error', async () => {
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

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.updateBoard({
          title: 'Updated Board',
        });
      });

      expect(result.current.error).toBe('Update failed');
    });

    it('should validate board title before update', async () => {
      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.updateBoard({
          title: '',
        });
      });

      expect(result.current.error).toContain('Board title is required');
    });
  });

  describe('Board Deletion', () => {
    it('should delete board successfully', async () => {
      const mockQuery = {
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.deleteBoard();
      });

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(result.current.board).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle board deletion error', async () => {
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

      const { result } = renderHook(() => useBoard('board-123'));

      await act(async () => {
        await result.current.deleteBoard();
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new operation starts', async () => {
      const { result } = renderHook(() => useBoard('board-123'));

      // Set an error first
      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      // Start new operation
      act(() => {
        result.current.updateBoard({ title: 'New Title' });
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

      const { result } = renderHook(() => useBoard('board-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
    });
  });
});
