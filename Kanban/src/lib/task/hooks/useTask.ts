/**
 * Task hook
 * Provides task state management and actions
 */

'use client';

import { useState, useCallback } from 'react';
import { TaskService } from '../services/taskService';
import { 
  Task, 
  CreateTaskData, 
  UpdateTaskData, 
  TaskResponse, 
  TaskFilterOptions, 
  TaskSortOptions 
} from '../types';

export interface UseTaskReturn {
  // State
  tasks: Task[] | null;
  currentTask: Task | null;
  loading: boolean;
  error: string | null;

  // Actions
  createTask: (data: CreateTaskData) => Promise<TaskResponse>;
  getTask: (id: string) => Promise<TaskResponse>;
  getTasksByBoard: (boardId: string, limit?: number) => Promise<TaskResponse>;
  getTasksByColumn: (columnId: string, limit?: number) => Promise<TaskResponse>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<TaskResponse>;
  deleteTask: (id: string) => Promise<TaskResponse>;
  moveTask: (taskId: string, columnId: string, position: number) => Promise<TaskResponse>;
  filterTasks: (boardId: string, filters: TaskFilterOptions, limit?: number) => Promise<TaskResponse>;
  searchTasks: (boardId: string, searchTerm: string, limit?: number) => Promise<TaskResponse>;
  setCurrentTask: (task: Task | null) => void;
  clearError: () => void;
}

export const useTask = (): UseTaskReturn => {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taskService = new TaskService();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createTask = useCallback(async (data: CreateTaskData): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.createTask(data);
      
      if (response.success && response.data) {
        setTasks(prev => prev ? [...prev, response.data as any] : [response.data as any]);
        setCurrentTask(response.data as any);
      } else {
        setError(response.error || 'Failed to create task');
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
  }, [taskService]);

  const getTask = useCallback(async (id: string): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.getTask(id);
      
      if (response.success && response.data) {
        setCurrentTask(response.data as any);
      } else {
        setError(response.error || 'Failed to get task');
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
  }, [taskService]);

  const getTasksByBoard = useCallback(async (boardId: string, limit: number = 100): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.getTasksByBoard(boardId, limit);
      
      if (response.success && response.data) {
        setTasks(response.data as any);
      } else {
        setError(response.error || 'Failed to get tasks');
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
  }, [taskService]);

  const getTasksByColumn = useCallback(async (columnId: string, limit: number = 100): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.getTasksByColumn(columnId, limit);
      
      if (response.success && response.data) {
        setTasks(response.data as any);
      } else {
        setError(response.error || 'Failed to get tasks');
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
  }, [taskService]);

  const updateTask = useCallback(async (id: string, data: UpdateTaskData): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.updateTask(id, data);
      
      if (response.success && response.data) {
        setTasks(prev => 
          prev ? prev.map(t => t.id === id ? response.data as any : t) : null
        );
        setCurrentTask(prev => prev?.id === id ? response.data as any : prev);
      } else {
        setError(response.error || 'Failed to update task');
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
  }, [taskService]);

  const deleteTask = useCallback(async (id: string): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.deleteTask(id);
      
      if (response.success) {
        setTasks(prev => prev ? prev.filter(t => t.id !== id) : null);
        setCurrentTask(prev => prev?.id === id ? null : prev);
      } else {
        setError(response.error || 'Failed to delete task');
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
  }, [taskService]);

  const moveTask = useCallback(async (taskId: string, columnId: string, position: number): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.moveTask(taskId, columnId, position);
      
      if (response.success && response.data) {
        setTasks(prev => 
          prev ? prev.map(t => t.id === taskId ? response.data as any : t) : null
        );
        setCurrentTask(prev => prev?.id === taskId ? response.data as any : prev);
      } else {
        setError(response.error || 'Failed to move task');
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
  }, [taskService]);

  const filterTasks = useCallback(async (boardId: string, filters: TaskFilterOptions, limit: number = 100): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.filterTasks(boardId, filters, limit);
      
      if (response.success && response.data) {
        setTasks(response.data as any);
      } else {
        setError(response.error || 'Failed to filter tasks');
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
  }, [taskService]);

  const searchTasks = useCallback(async (boardId: string, searchTerm: string, limit: number = 100): Promise<TaskResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.searchTasks(boardId, searchTerm, limit);
      
      if (response.success && response.data) {
        setTasks(response.data as any);
      } else {
        setError(response.error || 'Failed to search tasks');
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
  }, [taskService]);

  return {
    // State
    tasks,
    currentTask,
    loading,
    error,

    // Actions
    createTask,
    getTask,
    getTasksByBoard,
    getTasksByColumn,
    updateTask,
    deleteTask,
    moveTask,
    filterTasks,
    searchTasks,
    setCurrentTask,
    clearError,
  };
};
