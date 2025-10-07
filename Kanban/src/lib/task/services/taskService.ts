/**
 * Task service
 * Handles all task business logic and Supabase integration
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Task, 
  CreateTaskData, 
  UpdateTaskData, 
  TaskResponse, 
  TaskFilterOptions, 
  TaskSortOptions 
} from '../types';

export class TaskService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskData): Promise<TaskResponse> {
    try {
      // Validate input data
      if (!data.title || data.title.trim().length === 0) {
        return {
          success: false,
          data: null,
          error: 'Task title is required',
        };
      }

      if (data.title.length > 200) {
        return {
          success: false,
          data: null,
          error: 'Task title must be less than 200 characters',
        };
      }

      if (data.description && data.description.length > 1000) {
        return {
          success: false,
          data: null,
          error: 'Description must be less than 1000 characters',
        };
      }

      if (data.position < 0) {
        return {
          success: false,
          data: null,
          error: 'Position must be non-negative',
        };
      }

      const { data: task, error } = await this.supabase
        .from('tasks')
        .insert({
          title: data.title.trim(),
          description: data.description?.trim() || null,
          board_id: data.board_id,
          column_id: data.column_id,
          position: data.position,
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          assignee_id: data.assignee_id || null,
          due_date: data.due_date || null,
          created_by: data.created_by,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get task by ID
   */
  async getTask(id: string): Promise<TaskResponse> {
    try {
      const { data: task, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get tasks by board ID
   */
  async getTasksByBoard(boardId: string, limit: number = 100): Promise<TaskResponse> {
    try {
      const { data: tasks, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })
        .limit(limit);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: tasks,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get tasks by column ID
   */
  async getTasksByColumn(columnId: string, limit: number = 100): Promise<TaskResponse> {
    try {
      const { data: tasks, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('column_id', columnId)
        .order('position', { ascending: true })
        .limit(limit);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: tasks,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update task
   */
  async updateTask(id: string, data: UpdateTaskData): Promise<TaskResponse> {
    try {
      // Validate input data
      if (data.title !== undefined) {
        if (!data.title || data.title.trim().length === 0) {
          return {
            success: false,
            data: null,
            error: 'Task title is required',
          };
        }

        if (data.title.length > 200) {
          return {
            success: false,
            data: null,
            error: 'Task title must be less than 200 characters',
          };
        }
      }

      if (data.description !== undefined && data.description && data.description.length > 1000) {
        return {
          success: false,
          data: null,
          error: 'Description must be less than 1000 characters',
        };
      }

      if (data.position !== undefined && data.position < 0) {
        return {
          success: false,
          data: null,
          error: 'Position must be non-negative',
        };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) {
        updateData.title = data.title.trim();
      }

      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }

      if (data.column_id !== undefined) {
        updateData.column_id = data.column_id;
      }

      if (data.position !== undefined) {
        updateData.position = data.position;
      }

      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      if (data.priority !== undefined) {
        updateData.priority = data.priority;
      }

      if (data.assignee_id !== undefined) {
        updateData.assignee_id = data.assignee_id;
      }

      if (data.due_date !== undefined) {
        updateData.due_date = data.due_date;
      }

      const { data: task, error } = await this.supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<TaskResponse> {
    try {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Move task to different column
   */
  async moveTask(taskId: string, columnId: string, position: number): Promise<TaskResponse> {
    try {
      if (position < 0) {
        return {
          success: false,
          data: null,
          error: 'Position must be non-negative',
        };
      }

      const { data: task, error } = await this.supabase
        .from('tasks')
        .update({
          column_id: columnId,
          position: position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: task,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Filter tasks
   */
  async filterTasks(boardId: string, filters: TaskFilterOptions, limit: number = 100): Promise<TaskResponse> {
    try {
      let query = this.supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId);

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters.assignee_id) {
        query = query.eq('assignee_id', filters.assignee_id);
      }

      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: tasks, error } = await query
        .order('position', { ascending: true })
        .limit(limit);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: tasks,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Search tasks
   */
  async searchTasks(boardId: string, searchTerm: string, limit: number = 100): Promise<TaskResponse> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return {
          success: false,
          data: null,
          error: 'Search term is required',
        };
      }

      const { data: tasks, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('position', { ascending: true })
        .limit(limit);

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: tasks,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
