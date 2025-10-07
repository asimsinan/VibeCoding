// Board data model for Kanban application
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Board schema
export const BoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workspace_id: z.string().uuid(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Board with task count
export const BoardWithStatsSchema = BoardSchema.extend({
  task_count: z.number().int().min(0),
});

// Column schema
export const ColumnSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(50),
  board_id: z.string().uuid(),
  position: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Column with task count
export const ColumnWithStatsSchema = ColumnSchema.extend({
  task_count: z.number().int().min(0),
});

// Board with columns
export const BoardWithColumnsSchema = BoardWithStatsSchema.extend({
  columns: z.array(ColumnWithStatsSchema),
});

export type Board = z.infer<typeof BoardSchema>;
export type BoardWithStats = z.infer<typeof BoardWithStatsSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type ColumnWithStats = z.infer<typeof ColumnWithStatsSchema>;
export type BoardWithColumns = z.infer<typeof BoardWithColumnsSchema>;

// Board model class
export class BoardModel {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all boards in a workspace
   */
  async getWorkspaceBoards(workspaceId: string): Promise<BoardWithStats[]> {
    const { data, error } = await this.supabase
      .from('boards')
      .select(`
        *,
        task_count:tasks(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get workspace boards: ${error.message}`);
    }

    return data.map((board: any) => BoardWithStatsSchema.parse({
      ...board,
      task_count: board.task_count || 0,
    }));
  }

  /**
   * Get board by ID
   */
  async getBoard(boardId: string): Promise<Board | null> {
    const { data, error } = await this.supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Board not found
      }
      throw new Error(`Failed to get board: ${error.message}`);
    }

    return BoardSchema.parse(data);
  }

  /**
   * Get board with columns
   */
  async getBoardWithColumns(boardId: string): Promise<BoardWithColumns | null> {
    const { data, error } = await this.supabase
      .from('boards')
      .select(`
        *,
        task_count:tasks(count),
        columns(
          *,
          task_count:tasks(count)
        )
      `)
      .eq('id', boardId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Board not found
      }
      throw new Error(`Failed to get board with columns: ${error.message}`);
    }

    return BoardWithColumnsSchema.parse({
      ...data,
      task_count: data.task_count || 0,
      columns: data.columns.map((column: any) => ({
        ...column,
        task_count: column.task_count || 0,
      })),
    });
  }

  /**
   * Create new board
   */
  async createBoard(boardData: Omit<Board, 'id' | 'created_at' | 'updated_at'>): Promise<Board> {
    const { data, error } = await this.supabase
      .from('boards')
      .insert(boardData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create board: ${error.message}`);
    }

    return BoardSchema.parse(data);
  }

  /**
   * Update board
   */
  async updateBoard(boardId: string, updates: Partial<Omit<Board, 'id' | 'created_at' | 'updated_at'>>): Promise<Board> {
    const { data, error } = await this.supabase
      .from('boards')
      .update(updates)
      .eq('id', boardId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update board: ${error.message}`);
    }

    return BoardSchema.parse(data);
  }

  /**
   * Delete board
   */
  async deleteBoard(boardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('boards')
      .delete()
      .eq('id', boardId);

    if (error) {
      throw new Error(`Failed to delete board: ${error.message}`);
    }
  }

  /**
   * Get board columns
   */
  async getBoardColumns(boardId: string): Promise<ColumnWithStats[]> {
    const { data, error } = await this.supabase
      .from('columns')
      .select(`
        *,
        task_count:tasks(count)
      `)
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to get board columns: ${error.message}`);
    }

    return data.map((column: any) => ColumnWithStatsSchema.parse({
      ...column,
      task_count: column.task_count || 0,
    }));
  }

  /**
   * Create column
   */
  async createColumn(columnData: Omit<Column, 'id' | 'created_at' | 'updated_at'>): Promise<Column> {
    const { data, error } = await this.supabase
      .from('columns')
      .insert(columnData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create column: ${error.message}`);
    }

    return ColumnSchema.parse(data);
  }

  /**
   * Update column
   */
  async updateColumn(columnId: string, updates: Partial<Omit<Column, 'id' | 'created_at' | 'updated_at'>>): Promise<Column> {
    const { data, error } = await this.supabase
      .from('columns')
      .update(updates)
      .eq('id', columnId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update column: ${error.message}`);
    }

    return ColumnSchema.parse(data);
  }

  /**
   * Delete column
   */
  async deleteColumn(columnId: string): Promise<void> {
    const { error } = await this.supabase
      .from('columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      throw new Error(`Failed to delete column: ${error.message}`);
    }
  }

  /**
   * Move column to new position
   */
  async moveColumn(columnId: string, newPosition: number): Promise<Column> {
    // Get current column
    const { data: currentColumn, error: getError } = await this.supabase
      .from('columns')
      .select('board_id, position')
      .eq('id', columnId)
      .single();

    if (getError) {
      throw new Error(`Failed to get column: ${getError.message}`);
    }

    const boardId = currentColumn.board_id;
    const oldPosition = currentColumn.position;

    // Update positions of other columns
    if (newPosition > oldPosition) {
      // Moving right - shift columns left
      await this.supabase
        .from('columns')
        .update({ position: this.supabase.raw('position - 1') })
        .eq('board_id', boardId)
        .gt('position', oldPosition)
        .lte('position', newPosition);
    } else if (newPosition < oldPosition) {
      // Moving left - shift columns right
      await this.supabase
        .from('columns')
        .update({ position: this.supabase.raw('position + 1') })
        .eq('board_id', boardId)
        .gte('position', newPosition)
        .lt('position', oldPosition);
    }

    // Update the moved column
    const { data, error } = await this.supabase
      .from('columns')
      .update({ position: newPosition })
      .eq('id', columnId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to move column: ${error.message}`);
    }

    return ColumnSchema.parse(data);
  }

  /**
   * Check if user has access to board
   */
  async hasAccess(boardId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('boards')
      .select(`
        id,
        workspace:workspaces!inner(
          workspace_members!inner(user_id)
        )
      `)
      .eq('id', boardId)
      .eq('workspace.workspace_members.user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No access
      }
      throw new Error(`Failed to check board access: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get board statistics
   */
  async getBoardStats(boardId: string): Promise<{
    task_count: number;
    column_count: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
  }> {
    const [tasksResult, columnsResult] = await Promise.all([
      this.supabase
        .from('tasks')
        .select('status', { count: 'exact' })
        .eq('board_id', boardId),
      this.supabase
        .from('columns')
        .select('id', { count: 'exact' })
        .eq('board_id', boardId),
    ]);

    if (tasksResult.error) {
      throw new Error(`Failed to get task stats: ${tasksResult.error.message}`);
    }
    if (columnsResult.error) {
      throw new Error(`Failed to get column stats: ${columnsResult.error.message}`);
    }

    const tasks = tasksResult.data || [];
    const completed_tasks = tasks.filter((task: any) => task.status === 'done').length;
    const in_progress_tasks = tasks.filter((task: any) => task.status === 'in_progress').length;
    const todo_tasks = tasks.filter((task: any) => task.status === 'todo').length;

    return {
      task_count: tasks.length,
      column_count: columnsResult.count || 0,
      completed_tasks,
      in_progress_tasks,
      todo_tasks,
    };
  }
}
