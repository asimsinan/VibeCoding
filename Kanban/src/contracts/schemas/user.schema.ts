import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  avatar_url: z.string().url().optional(),
  created_at: z.string().datetime(),
});

export const UserProfileSchema = UserSchema.extend({
  updated_at: z.string().datetime(),
  last_login: z.string().datetime().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      task_assigned: z.boolean().default(true),
      task_due: z.boolean().default(true),
      task_completed: z.boolean().default(false),
    }),
  }),
});

export const UpdateUserProfileRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  avatar_url: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      task_assigned: z.boolean().optional(),
      task_due: z.boolean().optional(),
      task_completed: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

export const SearchUsersRequestSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  limit: z.number().int().min(1).max(50).default(20),
});

export const UserSearchResponseSchema = z.object({
  data: z.array(UserSchema),
  meta: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    has_more: z.boolean(),
  }),
});

export const UserResponseSchema = z.object({
  data: UserSchema,
  meta: z.object({
    total: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    has_more: z.boolean().optional(),
  }),
});

export const UserProfileResponseSchema = z.object({
  data: UserProfileSchema,
  meta: z.object({
    total: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    has_more: z.boolean().optional(),
  }),
});

// User activity schemas
export const UserActivitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.enum([
    'task_created',
    'task_updated',
    'task_moved',
    'task_assigned',
    'task_completed',
    'board_created',
    'board_updated',
    'workspace_joined',
    'workspace_left',
  ]),
  entity_type: z.enum(['task', 'board', 'workspace', 'user']),
  entity_id: z.string().uuid(),
  details: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

export const UserActivityResponseSchema = z.object({
  data: z.array(UserActivitySchema),
  meta: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    has_more: z.boolean(),
  }),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileRequestSchema>;
export type SearchUsersRequest = z.infer<typeof SearchUsersRequestSchema>;
export type UserSearchResponse = z.infer<typeof UserSearchResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UserActivity = z.infer<typeof UserActivitySchema>;
export type UserActivityResponse = z.infer<typeof UserActivityResponseSchema>;
