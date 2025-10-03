import { z } from 'zod'

// Base schemas for common patterns
export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const dateTimeSchema = z.string().datetime()
export const positiveIntSchema = z.number().int().positive()

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  startDate: dateTimeSchema,
  endDate: dateTimeSchema,
  capacity: z.number().int().min(1).max(10000),
  isPublic: z.boolean().default(true)
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
).refine(
  (data) => new Date(data.startDate) > new Date(),
  {
    message: "Start date must be in the future",
    path: ["startDate"]
  }
)

export const updateEventSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  startDate: dateTimeSchema.optional(),
  endDate: dateTimeSchema.optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  isPublic: z.boolean().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate)
    }
    return true
  },
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
)

export const eventRegistrationSchema = z.object({
  attendeeId: uuidSchema,
  notes: z.string().max(500).optional()
})

// Session schemas
export const createSessionSchema = z.object({
  eventId: uuidSchema,
  title: z.string().min(1).max(100),
  speaker: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startTime: dateTimeSchema,
  endTime: dateTimeSchema,
  capacity: z.number().int().min(1).optional()
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
)

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  speaker: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startTime: dateTimeSchema.optional(),
  endTime: dateTimeSchema.optional(),
  capacity: z.number().int().min(1).optional()
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.startTime) < new Date(data.endTime)
    }
    return true
  },
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
)

// Notification schemas
export const sendNotificationSchema = z.object({
  eventId: uuidSchema,
  type: z.enum(['announcement', 'schedule_change', 'networking', 'reminder']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  targetAudience: z.enum(['all', 'registered', 'checked_in']).default('all')
})

// Networking schemas
export const connectionRequestSchema = z.object({
  recipientId: uuidSchema,
  message: z.string().max(500).optional()
})

// Query parameter schemas
export const eventListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.enum(['draft', 'published', 'live', 'ended', 'cancelled']).optional(),
  organizerId: uuidSchema.optional()
})

export const attendeeListQuerySchema = z.object({
  includePrivate: z.boolean().default(false)
})

export const connectionListQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined']).optional(),
  type: z.enum(['sent', 'received']).optional()
})

// Response schemas
export const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string(),
  timestamp: dateTimeSchema
})

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  timestamp: dateTimeSchema
})

// Entity schemas for validation
export const eventSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  startDate: dateTimeSchema,
  endDate: dateTimeSchema,
  capacity: z.number().int().min(1).max(10000),
  attendeeCount: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'live', 'ended', 'cancelled']),
  organizerId: uuidSchema,
  isPublic: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

export const sessionSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  title: z.string().min(1).max(100),
  speaker: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startTime: dateTimeSchema,
  endTime: dateTimeSchema,
  capacity: z.number().int().min(1).optional(),
  attendeeCount: z.number().int().min(0),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

export const attendeeSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  eventId: uuidSchema,
  status: z.enum(['registered', 'confirmed', 'cancelled']),
  checkInStatus: z.enum(['not_checked_in', 'checked_in', 'checked_out']),
  notes: z.string().optional(),
  registeredAt: dateTimeSchema
})

export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

export const notificationSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  type: z.enum(['announcement', 'schedule_change', 'networking', 'reminder']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']),
  recipientsCount: z.number().int().min(0),
  createdAt: dateTimeSchema
})

export const connectionSchema = z.object({
  id: uuidSchema,
  requesterId: uuidSchema,
  recipientId: uuidSchema,
  status: z.enum(['pending', 'accepted', 'declined']),
  message: z.string().max(500).optional(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
})

// Type exports for TypeScript
export type CreateEventRequest = z.infer<typeof createEventSchema>
export type UpdateEventRequest = z.infer<typeof updateEventSchema>
export type EventRegistrationRequest = z.infer<typeof eventRegistrationSchema>
export type CreateSessionRequest = z.infer<typeof createSessionSchema>
export type UpdateSessionRequest = z.infer<typeof updateSessionSchema>
export type SendNotificationRequest = z.infer<typeof sendNotificationSchema>
export type ConnectionRequest = z.infer<typeof connectionRequestSchema>
export type EventListQuery = z.infer<typeof eventListQuerySchema>
export type AttendeeListQuery = z.infer<typeof attendeeListQuerySchema>
export type ConnectionListQuery = z.infer<typeof connectionListQuerySchema>
export type SuccessResponse<T = any> = z.infer<typeof successResponseSchema> & { data: T }
export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type Event = z.infer<typeof eventSchema>
export type Session = z.infer<typeof sessionSchema>
export type Attendee = z.infer<typeof attendeeSchema>
export type User = z.infer<typeof userSchema>
export type Notification = z.infer<typeof notificationSchema>
export type Connection = z.infer<typeof connectionSchema>
export type Pagination = z.infer<typeof paginationSchema>
