/**
 * Unit tests for board service
 * Tests board business logic and Supabase integration
 */

import { BoardService } from '../../../src/lib/board/services/boardService';
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

describe('BoardService', () => {
  let boardService: BoardService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    boardService = new BoardService();
  });

  describe('Board Creation', () => {
    it('should create board with valid data', async () => {
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
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockBoard,
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await boardService.createBoard({
        title: 'Test Board',
        description: 'A test board',
        workspace_id: 'workspace-123',
        created_by: 'user-123',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith({
        title: 'Test Board',
        description: 'A test board',
        workspace_id: 'workspace-123',
        created_by: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBoard);
      expect(result.error).toBeNull();
    });

    it('should handle board creation error', async () => {
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

      const result = await boardService.createBoard({
        title: 'Test Board',
        description: 'A test board',
        workspace_id: 'workspace-123',
        created_by: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Creation failed');
    });

    it('should validate board title before creation', async () => {
      const result = await boardService.createBoard({
        title: '',
        description: 'A test board',
        workspace_id: 'workspace-123',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Board title is required');
    });

    it('should validate board title length', async () => {
      const longTitle = 'a'.repeat(101);

      const result = await boardService.createBoard({
        title: longTitle,
        description: 'A test board',
        workspace_id: 'workspace-123',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Board title must be less than 100 characters');
    });

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(501);

      const result = await boardService.createBoard({
        title: 'Test Board',
        description: longDescription,
        workspace_id: 'workspace-123',
        created_by: 'user-123',
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Description must be less than 500 characters');
    });
  });

  describe('Board Retrieval', () => {
    it('should get board by ID', async () => {
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

      const result = await boardService.getBoard('board-123');

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'board-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBoard);
      expect(result.error).toBeNull();
    });

    it('should handle board not found error', async () => {
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

      const result = await boardService.getBoard('board-123');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Board not found');
    });

    it('should get workspace boards', async () => {
      const mockBoards = [
        {
          id: 'board-123',
          title: 'Test Board 1',
          description: 'A test board',
          workspace_id: 'workspace-123',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          created_by: 'user-123',
        },
        {
          id: 'board-456',
          title: 'Test Board 2',
          description: 'Another test board',
          workspace_id: 'workspace-123',
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
                data: mockBoards,
                error: null,
              }),
            })),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await boardService.getWorkspaceBoards('workspace-123', 10);

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('workspace_id', 'workspace-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBoards);
      expect(result.error).toBeNull();
    });
  });

  describe('Column Management', () => {
    it('should create default columns for new board', async () => {
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
        {
          id: 'column-789',
          title: 'Done',
          position: 2,
          board_id: 'board-123',
          created_at: '2023-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockColumns[0],
              error: null,
            }),
          })),
        })),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery as any);

      const result = await boardService.createDefaultColumns('board-123');

      expect(mockQuery.insert).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should add column to board', async () => {
      const mockColumn = {
        id: 'column-123',
        title: 'Review',
        position: 3,
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

      const result = await boardService.addColumn('board-123', 'Review', 3);

      expect(mockQuery.insert).toHaveBeenCalledWith({
        title: 'Review',
        position: 3,
        board_id: 'board-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockColumn);
      expect(result.error).toBeNull();
    });

    it('should update column', async () => {
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

      const result = await boardService.updateColumn('column-123', {
        title: 'Updated Column',
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Column',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockColumn);
      expect(result.error).toBeNull();
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

      const result = await boardService.deleteColumn('column-123');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'column-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
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

      const result = await boardService.reorderColumns(['column-456', 'column-123']);

      expect(mockQuery.update).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
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

      const result = await boardService.updateBoard('board-123', {
        title: 'Updated Board',
        description: 'Updated description',
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Board',
        description: 'Updated description',
        updated_at: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBoard);
      expect(result.error).toBeNull();
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

      const result = await boardService.updateBoard('board-123', {
        title: 'Updated Board',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
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

      const result = await boardService.deleteBoard('board-123');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'board-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
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

      const result = await boardService.deleteBoard('board-123');

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

      const result = await boardService.getBoard('board-123');

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

      const result = await boardService.getBoard('board-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('An unexpected error occurred');
    });
  });
});
