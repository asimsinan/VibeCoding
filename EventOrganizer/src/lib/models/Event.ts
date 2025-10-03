import { z } from 'zod'

/**
 * Event Model - Core event entity for virtual events
 * Traces to FR-002: Event creation with comprehensive details
 */

// Event status enum
const EventStatus = z.enum(['draft', 'published', 'live', 'ended', 'cancelled'])
export type EventStatus = z.infer<typeof EventStatus>

// Event type enum
const EventType = z.enum(['conference', 'workshop', 'meetup', 'webinar', 'networking', 'other'])
export type EventType = z.infer<typeof EventType>

// Event metadata schema
export const EventMetadataSchema = z.object({
  location: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().default('UTC'),
  tags: z.array(z.string()).max(10).default([]),
  categories: z.array(z.string()).max(5).default([]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  language: z.string().default('en'),
  recordingEnabled: z.boolean().default(false),
  chatEnabled: z.boolean().default(true),
  qaEnabled: z.boolean().default(true),
  networkingEnabled: z.boolean().default(true),
  maxSessions: z.number().int().min(1).max(100).default(10),
  customFields: z.record(z.string(), z.any()).default({})
})

export type EventMetadata = z.infer<typeof EventMetadataSchema>

// Base Event schema
const BaseEventSchema = z.object({
  id: z.string().uuid(),
  organizerId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  capacity: z.number().int().min(1).max(10000),
  attendeeCount: z.number().int().min(0).default(0),
  status: EventStatus.default('draft'),
  type: EventType.default('conference'),
  isPublic: z.boolean().default(true),
  registrationOpen: z.boolean().default(true),
  registrationDeadline: z.string().datetime().optional(),
  eventUrl: z.string().url().optional(),
  meetingLink: z.string().url().optional(),
  meetingPassword: z.string().max(100).optional(),
  thumbnailUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  metadata: EventMetadataSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const EventSchema = BaseEventSchema.refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine(data => data.attendeeCount <= data.capacity, {
  message: "Attendee count cannot exceed capacity",
  path: ["attendeeCount"]
})

export type Event = z.infer<typeof EventSchema>

// Create Event schema
export const CreateEventSchema = BaseEventSchema.omit({
  id: true,
  attendeeCount: true,
  createdAt: true,
  updatedAt: true
}).extend({
  organizerId: z.string().uuid().optional() // Will be set from auth context
})

export type CreateEventRequest = z.infer<typeof CreateEventSchema>

// Update Event schema
export const UpdateEventSchema = BaseEventSchema.partial().omit({
  id: true,
  organizerId: true,
  attendeeCount: true,
  createdAt: true,
  updatedAt: true
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate)
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

export type UpdateEventRequest = z.infer<typeof UpdateEventSchema>

// Event list query schema
export const EventListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: EventStatus.optional(),
  type: EventType.optional(),
  isPublic: z.boolean().optional(),
  organizerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['startDate', 'createdAt', 'title', 'attendeeCount']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type EventListQuery = z.infer<typeof EventListQuerySchema>

// Event search schema
export const EventSearchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.object({
    status: EventStatus.optional(),
    type: EventType.optional(),
    isPublic: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional()
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['relevance', 'startDate', 'createdAt', 'title', 'attendeeCount']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type EventSearchRequest = z.infer<typeof EventSearchSchema>

// Event registration schema
export const EventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  registrationData: z.object({
    notes: z.string().max(500).optional(),
    dietaryRequirements: z.string().max(200).optional(),
    accessibilityNeeds: z.string().max(200).optional(),
    emergencyContact: z.string().max(100).optional(),
    customFields: z.record(z.string(), z.any()).default({})
  }).optional()
})

export type EventRegistrationRequest = z.infer<typeof EventRegistrationSchema>

// Event validation methods
export class EventValidator {
  /**
   * Validate event capacity
   */
  static validateCapacity(capacity: number): { isValid: boolean; error?: string } {
    if (capacity < 1) {
      return { isValid: false, error: 'Event capacity must be at least 1' }
    }
    if (capacity > 10000) {
      return { isValid: false, error: 'Event capacity cannot exceed 10000' }
    }
    return { isValid: true }
  }

  /**
   * Validate event dates
   */
  static validateDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start >= end) {
      return { isValid: false, error: 'End date must be after start date' }
    }
    if (start < now) {
      return { isValid: false, error: 'Start date cannot be in the past' }
    }

    return { isValid: true }
  }

  /**
   * Validate event title
   */
  static validateTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: 'Event title is required' }
    }
    if (title.length > 100) {
      return { isValid: false, error: 'Event title cannot exceed 100 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate event description
   */
  static validateDescription(description: string): { isValid: boolean; error?: string } {
    if (!description || description.trim().length === 0) {
      return { isValid: false, error: 'Event description is required' }
    }
    if (description.length > 1000) {
      return { isValid: false, error: 'Event description cannot exceed 1000 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate event metadata
   */
  static validateMetadata(metadata: EventMetadata): { isValid: boolean; error?: string } {
    // Check tags limit
    if (metadata.tags && metadata.tags.length > 10) {
      return { isValid: false, error: 'Cannot have more than 10 tags' }
    }
    
    // Check categories limit
    if (metadata.categories && metadata.categories.length > 5) {
      return { isValid: false, error: 'Cannot have more than 5 categories' }
    }
    
    // Check coordinates
    if (metadata.latitude !== undefined && (metadata.latitude < -90 || metadata.latitude > 90)) {
      return { isValid: false, error: 'Invalid coordinates' }
    }
    if (metadata.longitude !== undefined && (metadata.longitude < -180 || metadata.longitude > 180)) {
      return { isValid: false, error: 'Invalid coordinates' }
    }
    
    const result = EventMetadataSchema.safeParse(metadata)
    if (!result.success) {
      return { isValid: false, error: `Invalid metadata: ${result.error.issues[0].message}` }
    }
    return { isValid: true }
  }

  /**
   * Validate registration deadline
   */
  static validateRegistrationDeadline(deadline: string, eventStartDate: string): { isValid: boolean; error?: string } {
    const deadlineDate = new Date(deadline)
    const startDate = new Date(eventStartDate)

    if (deadlineDate >= startDate) {
      return { isValid: false, error: 'Registration deadline must be before event start date' }
    }

    return { isValid: true }
  }

  /**
   * Validate event URL
   */
  static validateEventUrl(url: string): { isValid: boolean; error?: string } {
    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return { isValid: false, error: 'Invalid event URL format' }
    }
  }

  /**
   * Sanitize event input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
  }
}

// Event business logic methods
export class EventService {
  /**
   * Check if event is draft
   */
  static isDraft(event: Event): boolean {
    return event.status === 'draft'
  }

  /**
   * Check if event is published
   */
  static isPublished(event: Event): boolean {
    return event.status === 'published'
  }

  /**
   * Check if event is currently live
   */
  static isLive(event: Event): boolean {
    const now = new Date()
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    return event.status === 'live' && now >= startDate && now <= endDate
  }

  /**
   * Check if event has ended
   */
  static isEnded(event: Event): boolean {
    const now = new Date()
    const endDate = new Date(event.endDate)
    return event.status === 'ended' || now > endDate
  }

  /**
   * Check if event is cancelled
   */
  static isCancelled(event: Event): boolean {
    return event.status === 'cancelled'
  }

  /**
   * Check if event is public
   */
  static isPublic(event: Event): boolean {
    return event.isPublic
  }

  /**
   * Check if event is full
   */
  static isFull(event: Event): boolean {
    return event.attendeeCount >= event.capacity
  }

  /**
   * Get available spots
   */
  static getAvailableSpots(event: Event): number {
    return Math.max(0, event.capacity - event.attendeeCount)
  }

  /**
   * Get event duration in hours
   */
  static getDurationHours(event: Event): number {
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Check if event is starting soon (within 24 hours)
   */
  static isStartingSoon(event: Event): boolean {
    const now = new Date()
    const startDate = new Date(event.startDate)
    const timeDiff = startDate.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000
  }

  /**
   * Check if event is ending soon (within 24 hours)
   */
  static isEndingSoon(event: Event): boolean {
    const now = new Date()
    const endDate = new Date(event.endDate)
    const timeDiff = endDate.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000
  }

  /**
   * Get location from metadata
   */
  static getLocation(event: Event): string {
    return event.metadata.location || ''
  }

  /**
   * Get address from metadata
   */
  static getAddress(event: Event): string {
    return event.metadata.address || ''
  }

  /**
   * Get city from metadata
   */
  static getCity(event: Event): string {
    return event.metadata.city || ''
  }

  /**
   * Get state from metadata
   */
  static getState(event: Event): string {
    return event.metadata.state || ''
  }

  /**
   * Get country from metadata
   */
  static getCountry(event: Event): string {
    return event.metadata.country || ''
  }

  /**
   * Get timezone from metadata
   */
  static getTimezone(event: Event): string {
    return event.metadata.timezone || 'UTC'
  }

  /**
   * Get tags from metadata
   */
  static getTags(event: Event): string[] {
    return event.metadata.tags || []
  }

  /**
   * Get categories from metadata
   */
  static getCategories(event: Event): string[] {
    return event.metadata.categories || []
  }

  /**
   * Check if event has specific tag
   */
  static hasTag(event: Event, tag: string): boolean {
    return event.metadata.tags?.includes(tag) || false
  }

  /**
   * Check if event has specific category
   */
  static hasCategory(event: Event, category: string): boolean {
    return event.metadata.categories?.includes(category) || false
  }

  /**
   * Get tag count
   */
  static getTagCount(event: Event): number {
    return event.metadata.tags?.length || 0
  }

  /**
   * Get category count
   */
  static getCategoryCount(event: Event): number {
    return event.metadata.categories?.length || 0
  }

  /**
   * Get status display text
   */
  static getStatusDisplayText(event: Event): string {
    switch (event.status) {
      case 'draft': return 'Draft'
      case 'published': return 'Published'
      case 'live': return 'Live'
      case 'ended': return 'Ended'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  }

  /**
   * Get type display text
   */
  static getTypeDisplayText(event: Event): string {
    switch (event.type) {
      case 'conference': return 'Conference'
      case 'workshop': return 'Workshop'
      case 'meetup': return 'Meetup'
      case 'webinar': return 'Webinar'
      case 'networking': return 'Networking'
      case 'other': return 'Other'
      default: return 'Unknown'
    }
  }

  /**
   * Get cover image URL
   */
  static getCoverImageUrl(event: Event): string {
    return event.coverImageUrl || '/default-event-cover.jpg'
  }

  /**
   * Get event quality score
   */
  static getEventQualityScore(event: Event): number {
    let score = 0
    
    // Basic information completeness
    if (event.title && event.title.length > 10) score += 10
    if (event.description && event.description.length > 50) score += 10
    if (event.coverImageUrl) score += 10
    
    // Metadata completeness
    if (event.metadata.location) score += 10
    if (event.metadata.tags && event.metadata.tags.length > 0) score += 10
    if (event.metadata.categories && event.metadata.categories.length > 0) score += 10
    
    // Event configuration
    if (event.metadata.chatEnabled) score += 5
    if (event.metadata.qaEnabled) score += 5
    if (event.metadata.networkingEnabled) score += 5
    
    // Capacity and registration
    if (event.capacity > 0) score += 5
    if (event.registrationOpen) score += 5
    
    // Time configuration
    if (event.startDate && event.endDate) score += 10
    if (event.registrationDeadline) score += 5
    
    return Math.min(100, score)
  }

  /**
   * Check if event registration is open
   */
  static isRegistrationOpen(event: Event): boolean {
    if (!event.registrationOpen) return false
    if (event.status !== 'published' && event.status !== 'live') return false
    
    const now = new Date()
    if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
      return false
    }
    
    return true
  }

  /**
   * Check if event has capacity available
   */
  static hasCapacityAvailable(event: Event): boolean {
    return event.attendeeCount < event.capacity
  }

  /**
   * Check if event is in the past
   */
  static isPast(event: Event): boolean {
    const now = new Date()
    const endDate = new Date(event.endDate)
    return endDate < now
  }

  /**
   * Check if event is upcoming
   */
  static isUpcoming(event: Event): boolean {
    const now = new Date()
    const startDate = new Date(event.startDate)
    return startDate > now && event.status === 'published'
  }

  /**
   * Get event status based on current time
   */
  static getCurrentStatus(event: Event): EventStatus {
    const now = new Date()
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)

    if (event.status === 'cancelled') return 'cancelled'
    if (now < startDate) return 'published'
    if (now >= startDate && now <= endDate) return 'live'
    if (now > endDate) return 'ended'
    
    return event.status
  }

  /**
   * Check if user can register for event
   */
  static canRegister(event: Event, userId: string): { canRegister: boolean; reason?: string } {
    if (!this.isRegistrationOpen(event)) {
      return { canRegister: false, reason: 'Registration is not open' }
    }
    if (!this.hasCapacityAvailable(event)) {
      return { canRegister: false, reason: 'Event is at capacity' }
    }
    if (this.isPast(event)) {
      return { canRegister: false, reason: 'Event has already ended' }
    }
    
    return { canRegister: true }
  }

  /**
   * Check if user can manage event
   */
  static canManage(event: Event, userId: string): boolean {
    return event.organizerId === userId
  }

  /**
   * Get event capacity utilization percentage
   */
  static getCapacityUtilization(event: Event): number {
    return Math.round((event.attendeeCount / event.capacity) * 100)
  }

  /**
   * Check if event is at high capacity (80%+)
   */
  static isAtHighCapacity(event: Event): boolean {
    return this.getCapacityUtilization(event) >= 80
  }
}

