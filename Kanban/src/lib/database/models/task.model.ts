// Task data model for Kanban application
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Task schema
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  board_id: z.string().uuid(),
  column_id: z.string().uuid(),
  position: z.number().int().min(0),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Task with assignee info
export const TaskWithAssigneeSchema = TaskSchema.extend({
  assignee: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    avatar_url: z.string().url().optional(),
  }).optional(),
});

// Task comment schema
export const TaskCommentSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().url().optional(),
  }),
});

// Task filter schema
export const TaskFilterSchema = z.object({
  column_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskWithAssignee = z.infer<typeof TaskWithAssigneeSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type TaskFilter = z.infer<typeof TaskFilterSchema>;

// Task model class
export class TaskModel {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get tasks for a board with filtering
   */
  async getBoardTasks(boardId: string, filter: TaskFilter = { limit: 100, offset: 0 }): Promise<TaskWithAssignee[]> {
    let query = this.supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, email, avatar_url)
      `)
      .eq('board_id', boardId);

    // Apply filters
    if (filter.column_id) {
      query = query.eq('column_id', filter.column_id);
    }
    if (filter.assignee_id) {
      query = query.eq('assignee_id', filter.assignee_id);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.priority) {
      query = query.eq('priority', filter.priority);
    }
    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('position', { ascending: true })
      .range(filter.offset, filter.offset + filter.limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get board tasks: ${error.message}`);
    }

    return data.map((task: any) => TaskWithAssigneeSchema.parse(task));
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<TaskWithAssignee | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!assignee_id(id, name, email, avatar_url)
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Task not found
      }
      throw new Error(`Failed to get task: ${error.message}`);
    }

    return TaskWithAssigneeSchema.parse(data);
  }

  /**
   * Create new task
   */
  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return TaskSchema.parse(data);
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return TaskSchema.parse(data);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  /**
   * Move task to different column and position
   */
  async moveTask(taskId: string, newColumnId: string, newPosition: number): Promise<Task> {
    // Get current task
    const { data: currentTask, error: getError } = await this.supabase
      .from('tasks')
      .select('column_id, position')
      .eq('id', taskId)
      .single();

    if (getError) {
      throw new Error(`Failed to get task: ${getError.error.message}`);
    }

    const oldColumnId = currentTask.column_id;
    const oldPosition = currentTask.position;

    // If moving to different column, update positions in both columns
    if (oldColumnId !== newColumnId) {
      // Shift tasks in old column
      await this.supabase
        .from('tasks')
        .update({ position: this.supabase.raw('position - 1') })
        .eq('column_id', oldColumnId)
        .gt('position', oldPosition);

      // Shift tasks in new column
      await this.supabase
        .from('tasks')
        .update({ position: this.supabase.raw('position + 1') })
        .eq('column_id', newColumnId)
        .gte('position', newPosition);
    } else {
      // Moving within same column
      if (newPosition > oldPosition) {
        // Moving down - shift tasks up
        await this.supabase
          .from('tasks')
          .update({ position: this.supabase.raw('position - 1') })
          .eq('column_id', newColumnId)
          .gt('position', oldPosition)
          .lte('position', newPosition);
      } else if (newPosition < oldPosition) {
        // Moving up - shift tasks down
        await this.supabase
          .from('tasks')
          .update({ position: this.supabase.raw('position + 1') })
          .eq('column_id', newColumnId)
          .gte('position', newPosition)
          .lt('position', oldPosition);
      }
    }

    // Update the moved task
    const { data, error } = await this.supabase
      .from('tasks')
      .update({ 
        column_id: newColumnId, 
        position: newPosition 
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to move task: ${error.message}`);
    }

    return TaskSchema.parse(data);
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({ assignee_id: assigneeId })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign task: ${error.message}`);
    }

    return TaskSchema.parse(data);
  }

  /**
   * Unassign task
   */
  async unassignTask(taskId: string): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({ assignee_id: null })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to unassign task: ${error.message}`);
    }

    return TaskSchema.parse(data);
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get task comments: ${error.message}`);
    }

    return data.map((comment: any) => TaskCommentSchema.parse(comment));
  }

  /**
   * Add comment to task
   */
  async addComment(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        content,
      })
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    return TaskCommentSchema.parse(data);
  }

  /**
   * Update comment
   */
  async updateComment(commentId: string, content: string): Promise<TaskComment> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId)
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    return TaskCommentSchema.parse(data);
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  /**
   * Check if user has access to task
   */
  async hasAccess(taskId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        id,
        board:boards!inner(
          workspace:workspaces!inner(
            workspace_members!inner(user_id)
          )
        )
      `)
      .eq('id', taskId)
      .eq('board.workspace.workspace_members.user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No access
      }
      throw new Error(`Failed to check task access: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get task statistics for a board
   */
  async getBoardTaskStats(boardId: string): Promise<{
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    overdue_tasks: number;
    tasks_by_priority: Record<string, number>;
  }> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('status, priority, due_date')
      .eq('board_id', boardId);

    if (error) {
      throw new Error(`Failed to get task stats: ${error.message}`);
    }

    const tasks = data || [];
    const now = new Date();

    const stats = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((task: any) => task.status === 'done').length,
      in_progress_tasks: tasks.filter((task: any) => task.status === 'in_progress').length,
      todo_tasks: tasks.filter((task: any) => task.status === 'todo').length,
      overdue_tasks: tasks.filter((task: any) => 
        task.due_date && new Date(task.due_date) < now && task.status !== 'done'
      ).length,
      tasks_by_priority: tasks.reduce((acc: any, task: any) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  }
}
