import { z } from 'zod';

// Workspace schemas
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  member_count: z.number().int().min(1),
  recent_activity: z.string().datetime().optional(),
});

export const CreateWorkspaceRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const UpdateWorkspaceRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export const WorkspaceListResponseSchema = z.object({
  data: z.array(WorkspaceSchema),
  meta: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    has_more: z.boolean(),
  }),
});

export const WorkspaceResponseSchema = z.object({
  data: WorkspaceSchema,
  meta: z.object({
    total: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    offset: z.number().int().min(0).optional(),
    has_more: z.boolean().optional(),
  }),
});

// Workspace member schemas
export const WorkspaceMemberSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  role: z.enum(['admin', 'member', 'viewer']),
  joined_at: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    avatar_url: z.string().url().optional(),
  }),
});

export const InviteUserRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export const UpdateMemberRoleRequestSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

// Type exports
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;
export type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceRequestSchema>;
export type WorkspaceListResponse = z.infer<typeof WorkspaceListResponseSchema>;
export type WorkspaceResponse = z.infer<typeof WorkspaceResponseSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
export type InviteUserRequest = z.infer<typeof InviteUserRequestSchema>;
export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleRequestSchema>;
