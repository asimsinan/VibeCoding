/**
 * API Validation - Request validation and sanitization
 * FR-001: API-First Design - API validation utilities
 */

import { z } from 'zod';
import {
  LoginRequest,
  SignupRequest,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  PaginationParams,
  BaseFilter,
} from '../../../contracts/types/api.types';

// Base schemas
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email().min(1).max(255);
const passwordSchema = z.string().min(8).max(128);
const nameSchema = z.string().min(1).max(100).trim();
const descriptionSchema = z.string().max(500).trim().optional();
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional();
const dateSchema = z.string().datetime().optional();

// Enum schemas
const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Authentication schemas
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
}) satisfies z.ZodType<LoginRequest>;

export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
}) satisfies z.ZodType<SignupRequest>;

// Workspace schemas
export const createWorkspaceRequestSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
}) satisfies z.ZodType<CreateWorkspaceRequest>;

export const updateWorkspaceRequestSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
}) satisfies z.ZodType<UpdateWorkspaceRequest>;

// Board schemas
export const createColumnRequestSchema = z.object({
  name: nameSchema,
  color: colorSchema,
  taskLimit: z.number().int().min(1).max(1000).optional(),
});

export const createBoardRequestSchema = z.object({
  title: nameSchema,
  description: descriptionSchema,
  columns: z.array(createColumnRequestSchema).min(1).max(20).optional(),
}) satisfies z.ZodType<CreateBoardRequest>;

export const updateColumnRequestSchema = z.object({
  id: uuidSchema.optional(),
  name: nameSchema.optional(),
  color: colorSchema,
  position: z.number().int().min(0).optional(),
  taskLimit: z.number().int().min(1).max(1000).optional(),
});

export const updateBoardRequestSchema = z.object({
  title: nameSchema.optional(),
  description: descriptionSchema,
  columns: z.array(updateColumnRequestSchema).min(1).max(20).optional(),
}) satisfies z.ZodType<UpdateBoardRequest>;

// Task schemas
export const createTaskRequestSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  priority: taskPrioritySchema.optional(),
  assignee_id: uuidSchema.optional(),
  due_date: dateSchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  column_id: uuidSchema.optional(),
});

export const updateTaskRequestSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignee_id: uuidSchema.optional(),
  due_date: dateSchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
}) satisfies z.ZodType<UpdateTaskRequest>;

export const moveTaskRequestSchema = z.object({
  column_id: uuidSchema,
  position: z.number().int().min(0),
}) satisfies z.ZodType<MoveTaskRequest>;

// Query parameter schemas
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
}) satisfies z.ZodType<PaginationParams>;

export const taskFilterParamsSchema = z.object({
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  columnId: uuidSchema.optional(),
  assigneeId: uuidSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  search: z.string().min(1).max(100).trim().optional(),
}) satisfies z.ZodType<BaseFilter>;

export const userSearchParamsSchema = z.object({
  q: z.string().min(1).max(100).trim(),
  limit: z.number().int().min(1).max(50).optional(),
}) satisfies z.ZodType<BaseFilter>;

// Validation functions
export function validateLoginRequest(data: unknown): LoginRequest {
  return loginRequestSchema.parse(data);
}

export function validateRegisterRequest(data: unknown): SignupRequest {
  return signupRequestSchema.parse(data);
}

export function validateCreateWorkspaceRequest(data: unknown): CreateWorkspaceRequest {
  return createWorkspaceRequestSchema.parse(data);
}

export function validateUpdateWorkspaceRequest(data: unknown): UpdateWorkspaceRequest {
  return updateWorkspaceRequestSchema.parse(data);
}

export function validateCreateBoardRequest(data: unknown): CreateBoardRequest {
  return createBoardRequestSchema.parse(data);
}

export function validateUpdateBoardRequest(data: unknown): UpdateBoardRequest {
  return updateBoardRequestSchema.parse(data);
}

export function validateCreateTaskRequest(data: unknown): CreateTaskRequest {
  return createTaskRequestSchema.parse(data) as CreateTaskRequest;
}

export function validateUpdateTaskRequest(data: unknown): UpdateTaskRequest {
  return updateTaskRequestSchema.parse(data);
}

export function validateMoveTaskRequest(data: unknown): MoveTaskRequest {
  return moveTaskRequestSchema.parse(data);
}

export function validatePaginationParams(data: unknown): PaginationParams {
  return paginationParamsSchema.parse(data);
}

export function validateTaskFilterParams(data: unknown): BaseFilter {
  return taskFilterParamsSchema.parse(data);
}

export function validateUserSearchParams(data: unknown): BaseFilter {
  return userSearchParamsSchema.parse(data);
}

// Sanitization functions
export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => sanitizeString(tag))
    .filter(tag => tag.length > 0)
    .slice(0, 10); // Limit to 10 tags
}

export function sanitizeDescription(description: string): string {
  return sanitizeString(description).slice(0, 500); // Limit to 500 characters
}

// Type guards
export function isValidTaskStatus(value: any): value is 'todo' | 'in_progress' | 'done' | 'archived' {
  return taskStatusSchema.safeParse(value).success;
}

export function isValidTaskPriority(value: any): value is 'low' | 'medium' | 'high' | 'urgent' {
  return taskPrioritySchema.safeParse(value).success;
}

export function isValidUUID(value: any): boolean {
  return uuidSchema.safeParse(value).success;
}

export function isValidEmail(value: any): boolean {
  return emailSchema.safeParse(value).success;
}

// Validation error formatter
export function formatValidationError(error: z.ZodError): {
  field: string;
  message: string;
  value?: string;
}[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: undefined,
  }));
}

// Request sanitizer
export function sanitizeRequest<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };

  // Sanitize string fields
  if ('name' in sanitized && typeof (sanitized as any).name === 'string') {
    (sanitized as any).name = sanitizeString((sanitized as any).name);
  }
  if ('description' in sanitized && typeof (sanitized as any).description === 'string') {
    (sanitized as any).description = sanitizeDescription((sanitized as any).description);
  }
  if ('email' in sanitized && typeof (sanitized as any).email === 'string') {
    (sanitized as any).email = sanitizeEmail((sanitized as any).email);
  }
  if (Array.isArray((sanitized as any).tags)) {
    (sanitized as any).tags = sanitizeTags((sanitized as any).tags);
  }

  return sanitized;
}
