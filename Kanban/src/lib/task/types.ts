/**
 * Task types
 * TypeScript types and Zod schemas for task-related data
 */

import { z } from 'zod';

// Task schema
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable(),
  board_id: z.string().uuid(),
  column_id: z.string().uuid(),
  position: z.number().int().min(0),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_id: z.string().uuid().nullable(),
  due_date: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export type Task = z.infer<typeof TaskSchema>;

// Create task data
export const CreateTaskDataSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  board_id: z.string().uuid(),
  column_id: z.string().uuid(),
  position: z.number().int().min(0),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  created_by: z.string().uuid(),
});

export type CreateTaskData = z.infer<typeof CreateTaskDataSchema>;

// Update task data
export const UpdateTaskDataSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  column_id: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
});

export type UpdateTaskData = z.infer<typeof UpdateTaskDataSchema>;

// Task response
export interface TaskResponse {
  success: boolean;
  data: Task | Task[] | null;
  error: string | null;
}

// Task filter options
export interface TaskFilterOptions {
  status?: string[];
  priority?: string[];
  assignee_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

// Task sort options
export interface TaskSortOptions {
  field: 'title' | 'priority' | 'due_date' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}
