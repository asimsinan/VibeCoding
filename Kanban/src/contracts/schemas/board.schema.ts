import { z } from 'zod';

// Board schemas
export const BoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  workspace_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  task_count: z.number().int().min(0),
});

export const BoardDetailSchema = BoardSchema.extend({
  columns: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(50),
    board_id: z.string().uuid(),
    position: z.number().int().min(0),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    task_count: z.number().int().min(0),
  })),
  tasks: z.array(z.object({
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
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    created_by: z.string().uuid(),
  })),
});

export const CreateBoardRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const UpdateBoardRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export const BoardListResponseSchema = z.object({
  data: z.array(BoardSchema),
  meta: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    has_more: z.boolean(),
  }),
});

export const BoardResponseSchema = z.object({
  data: BoardSchema,
  meta: z.object({
    total: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    has_more: z.boolean().optional(),
  }),
});

export const BoardDetailResponseSchema = z.object({
  data: BoardDetailSchema,
  meta: z.object({
    total: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    has_more: z.boolean().optional(),
  }),
});

// Column schemas
export const ColumnSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(50, 'Title too long'),
  board_id: z.string().uuid(),
  position: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  task_count: z.number().int().min(0),
});

export const CreateColumnRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title too long'),
  position: z.number().int().min(0).optional(),
});

export const UpdateColumnRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title too long').optional(),
  position: z.number().int().min(0).optional(),
});

export const MoveColumnRequestSchema = z.object({
  position: z.number().int().min(0),
});

// Type exports
export type Board = z.infer<typeof BoardSchema>;
export type BoardDetail = z.infer<typeof BoardDetailSchema>;
export type CreateBoardRequest = z.infer<typeof CreateBoardRequestSchema>;
export type UpdateBoardRequest = z.infer<typeof UpdateBoardRequestSchema>;
export type BoardListResponse = z.infer<typeof BoardListResponseSchema>;
export type BoardResponse = z.infer<typeof BoardResponseSchema>;
export type BoardDetailResponse = z.infer<typeof BoardDetailResponseSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type CreateColumnRequest = z.infer<typeof CreateColumnRequestSchema>;
export type UpdateColumnRequest = z.infer<typeof UpdateColumnRequestSchema>;
export type MoveColumnRequest = z.infer<typeof MoveColumnRequestSchema>;
