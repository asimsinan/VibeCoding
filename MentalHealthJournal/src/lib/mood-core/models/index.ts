/**
 * Core data models and validation schemas for Mental Health Journal App
 * Implements single domain model approach (Anti-Abstraction Gate)
 * All models trace to functional requirements FR-001 through FR-007
 */

import { z } from 'zod';

// Enums and Constants
export enum MoodEntryStatus {
  Active = 'active',
  Deleted = 'deleted',
  Archived = 'archived',
}

export enum TimePeriod {
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
}

// Zod Schemas for validation

// MoodEntry Schema (FR-001, FR-002, FR-005)
export const MoodEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date format
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Also provide entryDate for compatibility
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.nativeEnum(MoodEntryStatus),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// User Preferences Schema (FR-006)
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  weekStartsOn: z.number().int().min(0).max(6),
  defaultChartPeriod: z.nativeEnum(TimePeriod),
  enableNotifications: z.boolean(),
  notificationTime: z.string().optional(),
  dataRetentionDays: z.number().int().positive(),
  exportFormat: z.enum(['json', 'csv', 'pdf']),
});

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  preferences: UserPreferencesSchema,
});

// Mood Statistics Schema (FR-004)
export const MoodStatisticsSchema = z.object({
  averageMood: z.number(),
  lowestMood: z.number().int().min(1).max(10),
  highestMood: z.number().int().min(1).max(10),
  moodVariance: z.number(),
  totalEntries: z.number().int().min(0),
  completionRate: z.number().min(0).max(1),
  trendDirection: z.enum(['improving', 'declining', 'stable']),
  moodDistribution: z.record(z.number()),
});

// Mood Trend Schema (FR-004)
export const MoodTrendSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  period: z.nativeEnum(TimePeriod),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statistics: MoodStatisticsSchema,
  dataPoints: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      value: z.number().int().min(1).max(10),
      entryId: z.string(),
    })
  ),
  insights: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
});

// Chart Display Schema
export const ChartDisplaySchema = z.object({
  showTrendLine: z.boolean(),
  showDataPoints: z.boolean(),
  showAverage: z.boolean(),
  animateTransitions: z.boolean(),
  colorScheme: z.string(),
});

// Data Retention Schema (FR-007)
export const DataRetentionSchema = z.object({
  autoDeleteAfterDays: z.number().int().min(0),
  exportBeforeDelete: z.boolean(),
  archiveLocation: z.enum(['local', 'cloud', 'both']),
});

// Privacy Settings Schema
export const PrivacySettingsSchema = z.object({
  shareAnonymousData: z.boolean(),
  allowDataExport: z.boolean(),
  encryptLocalData: z.boolean(),
  require2FA: z.boolean(),
});

// Notification Settings Schema
export const NotificationSettingsSchema = z.object({
  dailyReminder: z.boolean(),
  reminderTime: z.string(),
  weeklyReport: z.boolean(),
  monthlyReport: z.boolean(),
  insightNotifications: z.boolean(),
});

// App Settings Schema
export const AppSettingsSchema = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  chartDisplay: ChartDisplaySchema,
  dataRetention: DataRetentionSchema,
  privacy: PrivacySettingsSchema,
  notifications: NotificationSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// API Response Schemas
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.string().datetime(),
  });

// Error Detail Schema
export const ErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

// API Error Schema
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  timestamp: z.string().datetime(),
});

// Validation Error Schema
export const ValidationErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal('VALIDATION_ERROR'),
    message: z.string(),
    details: z.object({
      errors: z.array(ErrorDetailSchema),
    }),
  }),
  timestamp: z.string().datetime(),
});

// TypeScript Types (inferred from Zod schemas)
export type MoodEntry = z.infer<typeof MoodEntrySchema>;
export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type MoodTrend = z.infer<typeof MoodTrendSchema>;
export type MoodStatistics = z.infer<typeof MoodStatisticsSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type ChartDisplay = z.infer<typeof ChartDisplaySchema>;
export type DataRetention = z.infer<typeof DataRetentionSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type ApiResponse<T = any> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

// Export all for convenience
export default {
  // Schemas
  MoodEntrySchema,
  UserSchema,
  UserPreferencesSchema,
  MoodTrendSchema,
  MoodStatisticsSchema,
  AppSettingsSchema,
  ChartDisplaySchema,
  DataRetentionSchema,
  PrivacySettingsSchema,
  NotificationSettingsSchema,
  ApiResponseSchema,
  ApiErrorSchema,
  ValidationErrorSchema,
  ErrorDetailSchema,
  // Enums
  MoodEntryStatus,
  TimePeriod,
};
