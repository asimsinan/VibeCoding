import { z } from 'zod'

/**
 * Session Model - Event session entity for scheduled presentations
 * Traces to FR-005: Session scheduling with speakers and notifications
 */

// Session type enum
const SessionType = z.enum(['presentation', 'workshop', 'panel', 'keynote', 'networking', 'break', 'other'])
export type SessionType = z.infer<typeof SessionType>

// Session status enum
const SessionStatus = z.enum(['scheduled', 'live', 'ended', 'cancelled'])
export type SessionStatus = z.infer<typeof SessionStatus>

// Speaker schema
const SpeakerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  bio: z.string().max(1000).optional(),
  title: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  linkedinUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  isExternal: z.boolean().default(false)
})

export type Speaker = z.infer<typeof SpeakerSchema>

// Session metadata schema
const SessionMetadataSchema = z.object({
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().default('en'),
  recordingEnabled: z.boolean().default(true),
  chatEnabled: z.boolean().default(true),
  qaEnabled: z.boolean().default(true),
  pollsEnabled: z.boolean().default(false),
  breakoutRoomsEnabled: z.boolean().default(false),
  maxAttendees: z.number().int().min(1).max(1000).optional(),
  materials: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['pdf', 'video', 'link', 'other'])
  })).default([]),
  customFields: z.record(z.string(), z.any()).default({})
})

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>

// Base Session schema
const BaseSessionSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  speaker: SpeakerSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: SessionType.default('presentation'),
  status: SessionStatus.default('scheduled'),
  currentAttendees: z.number().int().min(0).default(0),
  meetingLink: z.string().url().optional(),
  meetingPassword: z.string().max(100).optional(),
  meetingId: z.string().max(100).optional(),
  materialsUrl: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  metadata: SessionMetadataSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const SessionSchema = BaseSessionSchema.refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"]
}).refine(data => {
  if (data.metadata.maxAttendees) {
    return data.currentAttendees <= data.metadata.maxAttendees
  }
  return true
}, {
  message: "Current attendees cannot exceed maximum attendees",
  path: ["currentAttendees"]
})

export type Session = z.infer<typeof SessionSchema>

// Create Session schema
const CreateSessionSchema = BaseSessionSchema.omit({
  id: true,
  currentAttendees: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSessionRequest = z.infer<typeof CreateSessionSchema>

// Update Session schema
const UpdateSessionSchema = BaseSessionSchema.partial().omit({
  id: true,
  eventId: true,
  currentAttendees: true,
  createdAt: true,
  updatedAt: true
}).refine(data => {
  if (data.startTime && data.endTime) {
    return new Date(data.endTime) > new Date(data.startTime)
  }
  return true
}, {
  message: "End time must be after start time",
  path: ["endTime"]
})

export type UpdateSessionRequest = z.infer<typeof UpdateSessionSchema>

// Session list query schema
const SessionListQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: SessionStatus.optional(),
  type: SessionType.optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  speakerName: z.string().max(255).optional(),
  sortBy: z.enum(['startTime', 'title', 'type']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type SessionListQuery = z.infer<typeof SessionListQuerySchema>

// Session attendance schema
const SessionAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  joinedAt: z.string().datetime().optional(),
  leftAt: z.string().datetime().optional(),
  attendanceDuration: z.number().int().min(0).default(0), // in minutes
  feedback: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional()
})

export type SessionAttendance = z.infer<typeof SessionAttendanceSchema>

// Session validation methods
export class SessionValidator {
  /**
   * Validate session duration
   */
  static validateDuration(startTime: string, endTime: string): { isValid: boolean; error?: string } {
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return { isValid: false, error: 'End time must be after start time' }
    }

    // Check if session duration is reasonable (not more than 8 hours)
    const durationMs = end.getTime() - start.getTime()
    const maxDurationMs = 8 * 60 * 60 * 1000 // 8 hours
    if (durationMs > maxDurationMs) {
      return { isValid: false, error: 'Session duration cannot exceed 8 hours' }
    }

    // Check if session duration is too short (less than 5 minutes)
    const minDurationMs = 5 * 60 * 1000 // 5 minutes
    if (durationMs < minDurationMs) {
      return { isValid: false, error: 'Session duration must be at least 5 minutes' }
    }

    return { isValid: true }
  }

  /**
   * Validate session title
   */
  static validateTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: 'Session title is required' }
    }
    if (title.length > 255) {
      return { isValid: false, error: 'Session title cannot exceed 255 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate speaker information
   */
  static validateSpeaker(speaker: Speaker): { isValid: boolean; error?: string } {
    if (!speaker.name || speaker.name.trim().length === 0) {
      return { isValid: false, error: 'Speaker name is required' }
    }
    if (speaker.name.length > 255) {
      return { isValid: false, error: 'Speaker name cannot exceed 255 characters' }
    }
    if (speaker.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(speaker.email)) {
      return { isValid: false, error: 'Invalid speaker email format' }
    }
    return { isValid: true }
  }

  /**
   * Validate session capacity
   */
  static validateCapacity(capacity: number): { isValid: boolean; error?: string } {
    if (capacity < 1) {
      return { isValid: false, error: 'Session capacity must be at least 1' }
    }
    if (capacity > 1000) {
      return { isValid: false, error: 'Session capacity cannot exceed 1,000' }
    }
    return { isValid: true }
  }

  /**
   * Validate session timing against event
   */
  static validateTimingAgainstEvent(session: Session, eventStartDate: string, eventEndDate: string): { isValid: boolean; error?: string } {
    const sessionStart = new Date(session.startTime)
    const sessionEnd = new Date(session.endTime)
    const eventStart = new Date(eventStartDate)
    const eventEnd = new Date(eventEndDate)

    if (sessionStart < eventStart) {
      return { isValid: false, error: 'Session cannot start before event start date' }
    }
    if (sessionEnd > eventEnd) {
      return { isValid: false, error: 'Session cannot end after event end date' }
    }

    return { isValid: true }
  }

  /**
   * Sanitize session input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
  }
}

// Session business logic methods
export class SessionService {
  /**
   * Check if session is scheduled
   */
  static isScheduled(session: Session): boolean {
    return session.status === 'scheduled'
  }

  /**
   * Check if session has ended
   */
  static isEnded(session: Session): boolean {
    const now = new Date()
    const endTime = new Date(session.endTime)
    return session.status === 'ended' || now > endTime
  }

  /**
   * Check if session is currently live
   */
  static isLive(session: Session): boolean {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)
    return session.status === 'live' && now >= startTime && now <= endTime
  }

  /**
   * Check if session is upcoming
   */
  static isUpcoming(session: Session): boolean {
    const now = new Date()
    const startTime = new Date(session.startTime)
    return startTime > now && session.status === 'scheduled'
  }

  /**
   * Check if session is in the past
   */
  static isPast(session: Session): boolean {
    const now = new Date()
    const endTime = new Date(session.endTime)
    return endTime < now
  }

  /**
   * Get session duration in minutes
   */
  static getDurationMinutes(session: Session): number {
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  }

  /**
   * Get session duration in hours
   */
  static getDurationHours(session: Session): number {
    return this.getDurationMinutes(session) / 60
  }

  /**
   * Check if session has capacity available
   */
  static hasCapacityAvailable(session: Session): boolean {
    if (!session.metadata.maxAttendees) return true
    return session.currentAttendees < session.metadata.maxAttendees
  }

  /**
   * Get session capacity utilization percentage
   */
  static getCapacityUtilization(session: Session): number {
    if (!session.metadata.maxAttendees) return 0
    return Math.round((session.currentAttendees / session.metadata.maxAttendees) * 100)
  }

  /**
   * Check if session is at high capacity (80%+)
   */
  static isAtHighCapacity(session: Session): boolean {
    return this.getCapacityUtilization(session) >= 80
  }

  /**
   * Get session status based on current time
   */
  static getCurrentStatus(session: Session): SessionStatus {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)

    if (session.status === 'cancelled') return 'cancelled'
    if (now < startTime) return 'scheduled'
    if (now >= startTime && now <= endTime) return 'live'
    if (now > endTime) return 'ended'
    
    return session.status
  }

  /**
   * Check if user can join session
   */
  static canJoin(session: Session, userId: string): { canJoin: boolean; reason?: string } {
    if (session.status === 'cancelled') {
      return { canJoin: false, reason: 'Session has been cancelled' }
    }
    if (this.isPast(session)) {
      return { canJoin: false, reason: 'Session has already ended' }
    }
    if (!this.hasCapacityAvailable(session)) {
      return { canJoin: false, reason: 'Session is at capacity' }
    }
    
    return { canJoin: true }
  }

  /**
   * Check if session is starting soon (within 15 minutes)
   */
  static isStartingSoon(session: Session): boolean {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const timeDiff = startTime.getTime() - now.getTime()
    const fifteenMinutes = 15 * 60 * 1000
    
    return timeDiff <= fifteenMinutes && timeDiff > 0
  }

  /**
   * Get time until session starts in minutes
   */
  static getTimeUntilStart(session: Session): number {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const timeDiff = startTime.getTime() - now.getTime()
    
    return Math.max(0, Math.round(timeDiff / (1000 * 60)))
  }

  /**
   * Check if session has recording available
   */
  static hasRecording(session: Session): boolean {
    return !!session.recordingUrl
  }

  /**
   * Check if session has materials available
   */
  static hasMaterials(session: Session): boolean {
    return session.metadata.materials.length > 0 || !!session.materialsUrl
  }

  /**
   * Get session materials
   */
  static getMaterials(session: Session): Array<{ title: string; url: string; type: string }> {
    const materials = [...session.metadata.materials]
    if (session.materialsUrl) {
      materials.push({
        title: 'Session Materials',
        url: session.materialsUrl,
        type: 'other' as const
      })
    }
    return materials
  }
}

