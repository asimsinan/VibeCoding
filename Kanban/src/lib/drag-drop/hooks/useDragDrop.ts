/**
 * Drag and drop hook
 * Provides drag and drop state management and actions
 */

'use client';

import { useState, useCallback } from 'react';
import { DragDropService } from '../services/dragDropService';
import { DragItem, DropResult, DragDropContext, DragDropOptions, DragDropCallbacks } from '../types';

export interface UseDragDropReturn {
  // State
  context: DragDropContext;
  loading: boolean;
  error: string | null;

  // Actions
  onDragStart: (active: DragItem) => void;
  onDragOver: (active: DragItem, over: DragItem | null) => void;
  onDragEnd: (result: DropResult) => Promise<{ success: boolean; error?: string }>;
  onDragCancel: () => void;
  reorderTasks: (columnId: string, taskIds: string[]) => Promise<{ success: boolean; error?: string }>;
  moveTaskToColumn: (taskId: string, columnId: string, position: number) => Promise<{ success: boolean; error?: string }>;
  moveTask: (taskId: string, columnId: string, position: number) => Promise<{ success: boolean; error?: string }>;
  moveTasks: (taskIds: string[], columnId: string) => Promise<{ success: boolean; error?: string }>;
  updateTaskStatus: (taskId: string, columnId: string) => Promise<{ success: boolean; error?: string }>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useDragDrop = (
  options: DragDropOptions = {},
  callbacks: DragDropCallbacks = {}
): UseDragDropReturn => {
  const [context, setContext] = useState<DragDropContext>({
    activeId: null,
    overId: null,
    delta: { x: 0, y: 0 },
    isDragging: false,
    isOver: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragDropService = new DragDropService();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const onDragStart = useCallback((active: DragItem) => {
    setContext(prev => ({
      ...prev,
      activeId: active.id,
      isDragging: true,
    }));
    setError(null);
    callbacks.onDragStart?.(active);
  }, [callbacks]);

  const onDragOver = useCallback((active: DragItem, over: DragItem | null) => {
    setContext(prev => ({
      ...prev,
      overId: over?.id || null,
      isOver: !!over,
    }));
    callbacks.onDragOver?.(active, over);
  }, [callbacks]);

  const onDragEnd = useCallback(async (result: DropResult): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (result.active.type === 'task') {
        response = await dragDropService.handleTaskDrop(result);
      } else if (result.active.type === 'column') {
        response = await dragDropService.handleColumnDrop(result);
      } else {
        response = {
          success: false,
          error: 'Invalid drag item type',
        };
      }

      if (!response.success) {
        setError(response.error || 'Drag and drop operation failed');
      }

      setContext(prev => ({
        ...prev,
        activeId: null,
        overId: null,
        isDragging: false,
        isOver: false,
      }));

      callbacks.onDragEnd?.(result);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService, callbacks]);

  const onDragCancel = useCallback(() => {
    setContext(prev => ({
      ...prev,
      activeId: null,
      overId: null,
      isDragging: false,
      isOver: false,
    }));
    setError(null);
    callbacks.onDragCancel?.();
  }, [callbacks]);

  const reorderTasks = useCallback(async (columnId: string, taskIds: string[]): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dragDropService.reorderTasks(columnId, taskIds);
      
      if (!response.success) {
        setError(response.error || 'Failed to reorder tasks');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService]);

  const moveTaskToColumn = useCallback(async (taskId: string, columnId: string, position: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dragDropService.moveTaskToColumn(taskId, columnId, position);
      
      if (!response.success) {
        setError(response.error || 'Failed to move task');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService]);

  const moveTask = useCallback(async (taskId: string, columnId: string, position: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dragDropService.moveTask(taskId, columnId, position);
      
      if (!response.success) {
        setError(response.error || 'Failed to move task');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService]);

  const moveTasks = useCallback(async (taskIds: string[], columnId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dragDropService.moveTasks(taskIds, columnId);
      
      if (!response.success) {
        setError(response.error || 'Failed to move tasks');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService]);

  const updateTaskStatus = useCallback(async (taskId: string, columnId: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dragDropService.updateTaskStatus(taskId, columnId);
      
      if (!response.success) {
        setError(response.error || 'Failed to update task status');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService]);

  const reorderColumns = useCallback(async (boardId: string, columnIds: string[]): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dragDropService.reorderColumns(boardId, columnIds);
      
      if (!response.success) {
        setError(response.error || 'Failed to reorder columns');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [dragDropService]);

  return {
    // State
    context,
    loading,
    error,

    // Actions
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    reorderTasks,
    moveTaskToColumn,
    moveTask,
    moveTasks,
    updateTaskStatus,
    reorderColumns,
    clearError,
  };
};
