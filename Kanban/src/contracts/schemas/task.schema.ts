import { z } from 'zod';

// Task schemas
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
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
});

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  column_id: z.string().uuid('Invalid column ID'),
  assignee_id: z.string().uuid('Invalid assignee ID').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional(),
});

export const UpdateTaskRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  assignee_id: z.string().uuid('Invalid assignee ID').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().optional(),
});

export const MoveTaskRequestSchema = z.object({
  column_id: z.string().uuid('Invalid column ID'),
  position: z.number().int().min(0, 'Position must be non-negative'),
});

export const TaskListResponseSchema = z.object({
  data: z.array(TaskSchema),
  meta: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    has_more: z.boolean(),
  }),
});

export const TaskResponseSchema = z.object({
  data: TaskSchema,
  meta: z.object({
    total: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    has_more: z.boolean().optional(),
  }),
});

// Task filter schemas
export const TaskFilterSchema = z.object({
  column_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Task assignment schemas
export const AssignTaskRequestSchema = z.object({
  assignee_id: z.string().uuid('Invalid assignee ID'),
});

export const UnassignTaskRequestSchema = z.object({
  assignee_id: z.string().uuid('Invalid assignee ID'),
});

// Task comment schemas
export const TaskCommentSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatar_url: z.string().url().optional(),
  }),
});

export const CreateTaskCommentRequestSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

export const UpdateTaskCommentRequestSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

// Type exports
export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
export type MoveTaskRequest = z.infer<typeof MoveTaskRequestSchema>;
export type TaskListResponse = z.infer<typeof TaskListResponseSchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type TaskFilter = z.infer<typeof TaskFilterSchema>;
export type AssignTaskRequest = z.infer<typeof AssignTaskRequestSchema>;
export type UnassignTaskRequest = z.infer<typeof UnassignTaskRequestSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type CreateTaskCommentRequest = z.infer<typeof CreateTaskCommentRequestSchema>;
export type UpdateTaskCommentRequest = z.infer<typeof UpdateTaskCommentRequestSchema>;
