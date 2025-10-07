/**
 * Auth types
 * TypeScript types and Zod schemas for authentication-related data
 */

import { z } from 'zod';

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Auth error schema
export const AuthErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number().optional(),
});

export type AuthError = z.infer<typeof AuthErrorSchema>;