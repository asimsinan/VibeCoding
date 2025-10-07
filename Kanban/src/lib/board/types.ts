/**
 * Board types
 * TypeScript types and Zod schemas for board-related data
 */

import { z } from 'zod';

// Board schema
export const BoardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  workspace_id: z.string().uuid(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export type Board = z.infer<typeof BoardSchema>;

// Column schema
export const ColumnSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  position: z.number().int().min(0),
  board_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export type Column = z.infer<typeof ColumnSchema>;

// Create board data
export const CreateBoardDataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workspace_id: z.string().uuid(),
  created_by: z.string().uuid(),
});

export type CreateBoardData = z.infer<typeof CreateBoardDataSchema>;

// Update board data
export const UpdateBoardDataSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateBoardData = z.infer<typeof UpdateBoardDataSchema>;

// Create column data
export const CreateColumnDataSchema = z.object({
  title: z.string().min(1).max(100),
  position: z.number().int().min(0),
  board_id: z.string().uuid(),
});

export type CreateColumnData = z.infer<typeof CreateColumnDataSchema>;

// Update column data
export const UpdateColumnDataSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

export type UpdateColumnData = z.infer<typeof UpdateColumnDataSchema>;

// Board response
export interface BoardResponse {
  success: boolean;
  data: Board | Board[] | null;
  error: string | null;
}

// Column response
export interface ColumnResponse {
  success: boolean;
  data: Column | Column[] | null;
  error: string | null;
}
