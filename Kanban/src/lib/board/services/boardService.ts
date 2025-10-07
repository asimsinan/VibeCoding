/**
 * Board service
 * Handles all board business logic and Supabase integration
 */

import { createClient } from '@supabase/supabase-js';
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

export class BoardService {
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
   * Create a new board
   */
  async createBoard(data: CreateBoardData): Promise<BoardResponse> {
    try {
      // Validate input data
      if (!data.title || data.title.trim().length === 0) {
        return {
          success: false,
          data: null,
          error: 'Board title is required',
        };
      }

      if (data.title.length > 100) {
        return {
          success: false,
          data: null,
          error: 'Board title must be less than 100 characters',
        };
      }

      if (data.description && data.description.length > 500) {
        return {
          success: false,
          data: null,
          error: 'Description must be less than 500 characters',
        };
      }

      const { data: board, error } = await this.supabase
        .from('boards')
        .insert({
          title: data.title.trim(),
          description: data.description?.trim() || null,
          workspace_id: data.workspace_id,
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
        data: board,
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
   * Get board by ID
   */
  async getBoard(id: string): Promise<BoardResponse> {
    try {
      const { data: board, error } = await this.supabase
        .from('boards')
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
        data: board,
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
   * Get boards by workspace ID
   */
  async getBoardsByWorkspace(workspaceId: string, limit: number = 50): Promise<BoardResponse> {
    try {
      const { data: boards, error } = await this.supabase
        .from('boards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
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
        data: boards,
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
   * Update board
   */
  async updateBoard(id: string, data: UpdateBoardData): Promise<BoardResponse> {
    try {
      // Validate input data
      if (data.title !== undefined) {
        if (!data.title || data.title.trim().length === 0) {
          return {
            success: false,
            data: null,
            error: 'Board title is required',
          };
        }

        if (data.title.length > 100) {
          return {
            success: false,
            data: null,
            error: 'Board title must be less than 100 characters',
          };
        }
      }

      if (data.description !== undefined && data.description && data.description.length > 500) {
        return {
          success: false,
          data: null,
          error: 'Description must be less than 500 characters',
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

      const { data: board, error } = await this.supabase
        .from('boards')
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
        data: board,
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
   * Delete board
   */
  async deleteBoard(id: string): Promise<BoardResponse> {
    try {
      const { error } = await this.supabase
        .from('boards')
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
   * Create column
   */
  async createColumn(data: CreateColumnData): Promise<ColumnResponse> {
    try {
      // Validate input data
      if (!data.title || data.title.trim().length === 0) {
        return {
          success: false,
          data: null,
          error: 'Column title is required',
        };
      }

      if (data.title.length > 100) {
        return {
          success: false,
          data: null,
          error: 'Column title must be less than 100 characters',
        };
      }

      if (data.position < 0) {
        return {
          success: false,
          data: null,
          error: 'Column position must be non-negative',
        };
      }

      const { data: column, error } = await this.supabase
        .from('columns')
        .insert({
          title: data.title.trim(),
          position: data.position,
          board_id: data.board_id,
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
        data: column,
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
   * Get columns by board ID
   */
  async getColumnsByBoard(boardId: string): Promise<ColumnResponse> {
    try {
      const { data: columns, error } = await this.supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: columns,
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
   * Update column
   */
  async updateColumn(id: string, data: UpdateColumnData): Promise<ColumnResponse> {
    try {
      // Validate input data
      if (data.title !== undefined) {
        if (!data.title || data.title.trim().length === 0) {
          return {
            success: false,
            data: null,
            error: 'Column title is required',
          };
        }

        if (data.title.length > 100) {
          return {
            success: false,
            data: null,
            error: 'Column title must be less than 100 characters',
          };
        }
      }

      if (data.position !== undefined && data.position < 0) {
        return {
          success: false,
          data: null,
          error: 'Column position must be non-negative',
        };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) {
        updateData.title = data.title.trim();
      }

      if (data.position !== undefined) {
        updateData.position = data.position;
      }

      const { data: column, error } = await this.supabase
        .from('columns')
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
        data: column,
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
   * Delete column
   */
  async deleteColumn(id: string): Promise<ColumnResponse> {
    try {
      const { error } = await this.supabase
        .from('columns')
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
   * Reorder columns
   */
  async reorderColumns(boardId: string, columnIds: string[]): Promise<ColumnResponse> {
    try {
      if (!columnIds || columnIds.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Column IDs are required',
        };
      }

      // Update positions for all columns
      const updates = columnIds.map((columnId, index) => ({
        id: columnId,
        position: index,
        updated_at: new Date().toISOString(),
      }));

      const { data: columns, error } = await this.supabase
        .from('columns')
        .upsert(updates)
        .eq('board_id', boardId)
        .select();

      if (error) {
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: columns,
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
