/**
 * Drag and drop service
 * Handles drag and drop business logic and API calls
 */

import { createClient } from '@supabase/supabase-js';
import { DragItem, DropResult } from '../types';

export class DragDropService {
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
   * Reorder tasks within a column
   */
  async reorderTasks(columnId: string, taskIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!taskIds || taskIds.length === 0) {
        return {
          success: false,
          error: 'Task IDs are required',
        };
      }

      // Update positions for all tasks in the column
      const updates = taskIds.map((taskId, index) => ({
        id: taskId,
        position: index,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('tasks')
        .upsert(updates)
        .eq('column_id', columnId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Move task to different column
   */
  async moveTaskToColumn(taskId: string, columnId: string, position: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (position < 0) {
        return {
          success: false,
          error: 'Position must be non-negative',
        };
      }

      const { error } = await this.supabase
        .from('tasks')
        .update({
          column_id: columnId,
          position: position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Reorder columns within a board
   */
  async reorderColumns(boardId: string, columnIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!columnIds || columnIds.length === 0) {
        return {
          success: false,
          error: 'Column IDs are required',
        };
      }

      // Update positions for all columns in the board
      const updates = columnIds.map((columnId, index) => ({
        id: columnId,
        position: index,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('columns')
        .upsert(updates)
        .eq('board_id', boardId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Handle task drag and drop
   */
  async handleTaskDrop(result: DropResult): Promise<{ success: boolean; error?: string }> {
    try {
      const { active, over } = result;

      if (!over) {
        return {
          success: false,
          error: 'No drop target found',
        };
      }

      // If dropping on a column, move the task to that column
      if (over.type === 'column') {
        return await this.moveTaskToColumn(active.id, over.id, 0);
      }

      // If dropping on another task, move to the same column at the specified position
      if (over.type === 'task') {
        // Get the target task to determine its column and position
        const { data: targetTask, error: targetError } = await this.supabase
          .from('tasks')
          .select('column_id, position')
          .eq('id', over.id)
          .single();

        if (targetError) {
          return {
            success: false,
            error: targetError.message,
          };
        }

        return await this.moveTaskToColumn(active.id, targetTask.column_id, targetTask.position);
      }

      return {
        success: false,
        error: 'Invalid drop target',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Move task to different column (alias for moveTaskToColumn)
   */
  async moveTask(taskId: string, columnId: string, position: number): Promise<{ success: boolean; error?: string }> {
    return this.moveTaskToColumn(taskId, columnId, position);
  }

  /**
   * Move multiple tasks to different column
   */
  async moveTasks(taskIds: string[], columnId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!taskIds || taskIds.length === 0) {
        return {
          success: false,
          error: 'Task IDs are required',
        };
      }

      if (!columnId) {
        return {
          success: false,
          error: 'Column ID is required',
        };
      }

      const updates = taskIds.map((taskId, index) => ({
        id: taskId,
        column_id: columnId,
        position: index,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('tasks')
        .upsert(updates);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update task status based on column
   */
  async updateTaskStatus(taskId: string, columnId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const status = this.getStatusFromColumn(columnId);
      
      const { error } = await this.supabase
        .from('tasks')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get status from column ID
   */
  getStatusFromColumn(columnId: string): string {
    if (columnId.includes('todo')) return 'todo';
    if (columnId.includes('in-progress')) return 'in_progress';
    if (columnId.includes('done')) return 'done';
    if (columnId.includes('archived')) return 'archived';
    return 'todo'; // default
  }

  /**
   * Handle column drag and drop
   */
  async handleColumnDrop(result: DropResult): Promise<{ success: boolean; error?: string }> {
    try {
      const { active, over } = result;

      if (!over) {
        return {
          success: false,
          error: 'No drop target found',
        };
      }

      // Get the board ID from the active column
      const { data: activeColumn, error: activeError } = await this.supabase
        .from('columns')
        .select('board_id')
        .eq('id', active.id)
        .single();

      if (activeError) {
        return {
          success: false,
          error: activeError.message,
        };
      }

      // Get all columns in the board to determine new order
      const { data: columns, error: columnsError } = await this.supabase
        .from('columns')
        .select('id, position')
        .eq('board_id', activeColumn.board_id)
        .order('position', { ascending: true });

      if (columnsError) {
        return {
          success: false,
          error: columnsError.message,
        };
      }

      // Reorder columns based on drop result
      const columnIds = columns.map(col => col.id);
      const activeIndex = columnIds.indexOf(active.id);
      const overIndex = columnIds.indexOf(over.id);

      if (activeIndex === -1 || overIndex === -1) {
        return {
          success: false,
          error: 'Invalid column IDs',
        };
      }

      // Move the active column to the new position
      const newOrder = [...columnIds];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, active.id);

      return await this.reorderColumns(activeColumn.board_id, newOrder);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
