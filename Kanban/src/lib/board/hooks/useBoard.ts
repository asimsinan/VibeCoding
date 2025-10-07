/**
 * Board hook
 * Provides board state management and actions
 */

'use client';

import { useState, useCallback } from 'react';
import { BoardService } from '../services/boardService';
import { 
  Board, 
  Column, 
  CreateBoardData, 
  UpdateBoardData, 
  CreateColumnData, 
  UpdateColumnData, 
  BoardResponse, 
  ColumnResponse 
} from '../types';

export interface UseBoardReturn {
  // State
  boards: Board[] | null;
  currentBoard: Board | null;
  columns: Column[] | null;
  loading: boolean;
  error: string | null;

  // Actions
  createBoard: (data: CreateBoardData) => Promise<BoardResponse>;
  getBoard: (id: string) => Promise<BoardResponse>;
  getBoardsByWorkspace: (workspaceId: string, limit?: number) => Promise<BoardResponse>;
  updateBoard: (id: string, data: UpdateBoardData) => Promise<BoardResponse>;
  deleteBoard: (id: string) => Promise<BoardResponse>;
  createColumn: (data: CreateColumnData) => Promise<ColumnResponse>;
  getColumnsByBoard: (boardId: string) => Promise<ColumnResponse>;
  updateColumn: (id: string, data: UpdateColumnData) => Promise<ColumnResponse>;
  deleteColumn: (id: string) => Promise<ColumnResponse>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<ColumnResponse>;
  setCurrentBoard: (board: Board | null) => void;
  clearError: () => void;
}

export const useBoard = (): UseBoardReturn => {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boardService = new BoardService();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createBoard = useCallback(async (data: CreateBoardData): Promise<BoardResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.createBoard(data);
      
      if (response.data) {
        setBoards(prev => prev ? [...prev, response.data as any] : [response.data as any]);
        setCurrentBoard(response.data as any);
      } else {
        setError('Failed to create board');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const getBoard = useCallback(async (id: string): Promise<BoardResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.getBoard(id);
      
      if (response.success && response.data) {
        setCurrentBoard(response.data as any);
      } else {
        setError(response.error || 'Failed to get board');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const getBoardsByWorkspace = useCallback(async (workspaceId: string, limit: number = 50): Promise<BoardResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.getBoardsByWorkspace(workspaceId, limit);
      
      if (response.success && response.data) {
        setBoards(response.data as any);
      } else {
        setError(response.error || 'Failed to get boards');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const updateBoard = useCallback(async (id: string, data: UpdateBoardData): Promise<BoardResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.updateBoard(id, data);
      
      if (response.success && response.data) {
        setBoards(prev => 
          prev ? prev.map(b => b.id === id ? response.data as any : b) : null
        );
        setCurrentBoard(prev => prev?.id === id ? response.data as any : prev);
      } else {
        setError(response.error || 'Failed to update board');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const deleteBoard = useCallback(async (id: string): Promise<BoardResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.deleteBoard(id);
      
      if (response.success) {
        setBoards(prev => prev ? prev.filter(b => b.id !== id) : null);
        setCurrentBoard(prev => prev?.id === id ? null : prev);
      } else {
        setError(response.error || 'Failed to delete board');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const createColumn = useCallback(async (data: CreateColumnData): Promise<ColumnResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.createColumn(data);
      
      if (response.success && response.data) {
        setColumns(prev => prev ? [...prev, response.data as any] : [response.data as any]);
      } else {
        setError(response.error || 'Failed to create column');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const getColumnsByBoard = useCallback(async (boardId: string): Promise<ColumnResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.getColumnsByBoard(boardId);
      
      if (response.success && response.data) {
        setColumns(response.data as any);
      } else {
        setError(response.error || 'Failed to get columns');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const updateColumn = useCallback(async (id: string, data: UpdateColumnData): Promise<ColumnResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.updateColumn(id, data);
      
      if (response.data) {
        setColumns(prev => 
          prev ? prev.map(c => c.id === id ? response.data as any : c) : null
        );
      } else {
        setError('Failed to update column');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const deleteColumn = useCallback(async (id: string): Promise<ColumnResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.deleteColumn(id);
      
      if (response.success) {
        setColumns(prev => prev ? prev.filter(c => c.id !== id) : null);
      } else {
        setError(response.error || 'Failed to delete column');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  const reorderColumns = useCallback(async (boardId: string, columnIds: string[]): Promise<ColumnResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await boardService.reorderColumns(boardId, columnIds);
      
      if (response.success && response.data) {
        setColumns(response.data as any);
      } else {
        setError(response.error || 'Failed to reorder columns');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [boardService]);

  return {
    // State
    boards,
    currentBoard,
    columns,
    loading,
    error,

    // Actions
    createBoard,
    getBoard,
    getBoardsByWorkspace,
    updateBoard,
    deleteBoard,
    createColumn,
    getColumnsByBoard,
    updateColumn,
    deleteColumn,
    reorderColumns,
    setCurrentBoard,
    clearError,
  };
};
