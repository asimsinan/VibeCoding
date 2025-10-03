import { z } from 'zod'

/**
 * Connection Model - Networking entity
 * Traces to FR-006: Networking features for attendees to connect and chat
 */

// Connection status enum
const ConnectionStatus = z.enum(['pending', 'accepted', 'declined', 'blocked', 'cancelled'])
export type ConnectionStatus = z.infer<typeof ConnectionStatus>

// Connection type enum
const ConnectionType = z.enum(['professional', 'personal', 'mentor', 'mentee', 'collaborator'])
export type ConnectionType = z.infer<typeof ConnectionType>

// Connection metadata schema
const ConnectionMetadataSchema = z.object({
  sharedInterests: z.array(z.string()).default([]),
  sharedEvents: z.array(z.string().uuid()).default([]),
  connectionStrength: z.number().min(0).max(100).default(50),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(500).optional(),
  customFields: z.record(z.string(), z.any()).default({})
})

export type ConnectionMetadata = z.infer<typeof ConnectionMetadataSchema>

// Base Connection schema
const BaseConnectionSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(),
  addresseeId: z.string().uuid(),
  status: ConnectionStatus.default('pending'),
  type: ConnectionType.default('professional'),
  message: z.string().max(500).optional(),
  metadata: ConnectionMetadataSchema.default({}),
  requestedAt: z.string().datetime(),
  respondedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const ConnectionSchema = BaseConnectionSchema.refine(
  data => data.requesterId !== data.addresseeId,
  {
    message: "Requester and addressee cannot be the same",
    path: ["addresseeId"]
  }
)

export type Connection = z.infer<typeof ConnectionSchema>

// Create Connection schema
const CreateConnectionSchema = BaseConnectionSchema.omit({
  id: true,
  status: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true
}).refine(
  data => data.requesterId !== data.addresseeId,
  {
    message: "Requester and addressee cannot be the same",
    path: ["addresseeId"]
  }
)

export type CreateConnectionRequest = z.infer<typeof CreateConnectionSchema>

// Update Connection schema
const UpdateConnectionSchema = BaseConnectionSchema.partial().omit({
  id: true,
  requesterId: true,
  addresseeId: true,
  requestedAt: true,
  createdAt: true,
  updatedAt: true
})

export type UpdateConnectionRequest = z.infer<typeof UpdateConnectionSchema>

// Connection response schema
const ConnectionResponseSchema = z.object({
  connectionId: z.string().uuid(),
  status: ConnectionStatus,
  message: z.string().max(500).optional()
})

export type ConnectionResponseRequest = z.infer<typeof ConnectionResponseSchema>

// Connection list query schema
const ConnectionListQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  status: ConnectionStatus.optional(),
  type: ConnectionType.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['requestedAt', 'respondedAt', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includePending: z.boolean().default(true),
  includeAccepted: z.boolean().default(true),
  includeDeclined: z.boolean().default(false),
  includeBlocked: z.boolean().default(false)
})

export type ConnectionListQuery = z.infer<typeof ConnectionListQuerySchema>

// Connection search schema
const ConnectionSearchSchema = z.object({
  query: z.string().min(1).max(100),
  userId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
})

export type ConnectionSearchRequest = z.infer<typeof ConnectionSearchSchema>

// Connection recommendation schema
const ConnectionRecommendationSchema = z.object({
  userId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  maxRecommendations: z.number().int().min(1).max(50).default(10),
  includeMutualConnections: z.boolean().default(true),
  includeSharedInterests: z.boolean().default(true),
  includeEventAttendees: z.boolean().default(true)
})

export type ConnectionRecommendationRequest = z.infer<typeof ConnectionRecommendationSchema>

// Connection validation methods
export class ConnectionValidator {
  /**
   * Validate connection request
   */
  static validateRequest(requesterId: string, addresseeId: string): { isValid: boolean; error?: string } {
    if (requesterId === addresseeId) {
      return { isValid: false, error: 'Cannot connect to yourself' }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requesterId)) {
      return { isValid: false, error: 'Invalid requester ID format' }
    }
    if (!uuidRegex.test(addresseeId)) {
      return { isValid: false, error: 'Invalid addressee ID format' }
    }

    return { isValid: true }
  }

  /**
   * Validate connection message
   */
  static validateMessage(message: string): { isValid: boolean; error?: string } {
    if (message && message.length > 500) {
      return { isValid: false, error: 'Connection message cannot exceed 500 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate connection type
   */
  static validateType(type: ConnectionType): { isValid: boolean; error?: string } {
    const validTypes = ['professional', 'personal', 'mentor', 'mentee', 'collaborator']
    if (!validTypes.includes(type)) {
      return { isValid: false, error: 'Invalid connection type' }
    }
    return { isValid: true }
  }

  /**
   * Validate connection metadata
   */
  static validateMetadata(metadata: ConnectionMetadata): { isValid: boolean; error?: string } {
    if (metadata.sharedInterests.length > 20) {
      return { isValid: false, error: 'Cannot have more than 20 shared interests' }
    }
    if (metadata.tags.length > 10) {
      return { isValid: false, error: 'Cannot have more than 10 tags' }
    }
    if (metadata.notes && metadata.notes.length > 500) {
      return { isValid: false, error: 'Notes cannot exceed 500 characters' }
    }
    return { isValid: true }
  }

  /**
   * Sanitize connection message
   */
  static sanitizeMessage(message: string): string {
    return message
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
  }
}

// Connection business logic methods
export class ConnectionService {
  /**
   * Check if connection is pending
   */
  static isPending(connection: Connection): boolean {
    return connection.status === 'pending'
  }

  /**
   * Check if connection is accepted
   */
  static isAccepted(connection: Connection): boolean {
    return connection.status === 'accepted'
  }

  /**
   * Check if connection is declined
   */
  static isDeclined(connection: Connection): boolean {
    return connection.status === 'declined'
  }

  /**
   * Check if connection is blocked
   */
  static isBlocked(connection: Connection): boolean {
    return connection.status === 'blocked'
  }

  /**
   * Check if connection is cancelled
   */
  static isCancelled(connection: Connection): boolean {
    return connection.status === 'cancelled'
  }

  /**
   * Check if connection is active
   */
  static isActive(connection: Connection): boolean {
    return connection.status === 'accepted'
  }

  /**
   * Check if connection is inactive
   */
  static isInactive(connection: Connection): boolean {
    return ['declined', 'blocked', 'cancelled'].includes(connection.status)
  }

  /**
   * Check if connection can be accepted
   */
  static canAccept(connection: Connection): boolean {
    return connection.status === 'pending'
  }

  /**
   * Check if connection can be declined
   */
  static canDecline(connection: Connection): boolean {
    return connection.status === 'pending'
  }

  /**
   * Check if connection can be blocked
   */
  static canBlock(connection: Connection): boolean {
    return ['pending', 'accepted'].includes(connection.status)
  }

  /**
   * Check if connection can be cancelled
   */
  static canCancel(connection: Connection): boolean {
    return connection.status === 'pending'
  }

  /**
   * Check if connection can be unblocked
   */
  static canUnblock(connection: Connection): boolean {
    return connection.status === 'blocked'
  }

  /**
   * Get connection age in hours
   */
  static getAgeHours(connection: Connection): number {
    const now = new Date()
    const requestedAt = new Date(connection.requestedAt)
    return (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Check if connection is stale
   */
  static isStale(connection: Connection): boolean {
    // Consider connection stale if pending for more than 30 days
    return this.isPending(connection) && this.getAgeHours(connection) > (30 * 24)
  }

  /**
   * Get connection strength
   */
  static getConnectionStrength(connection: Connection): number {
    return connection.metadata.connectionStrength
  }

  /**
   * Check if connection has shared interests
   */
  static hasSharedInterests(connection: Connection): boolean {
    return connection.metadata.sharedInterests.length > 0
  }

  /**
   * Check if connection has shared events
   */
  static hasSharedEvents(connection: Connection): boolean {
    return connection.metadata.sharedEvents.length > 0
  }

  /**
   * Get connection tags
   */
  static getTags(connection: Connection): string[] {
    return connection.metadata.tags
  }

  /**
   * Check if connection has notes
   */
  static hasNotes(connection: Connection): boolean {
    return !!connection.metadata.notes
  }

  /**
   * Get connection notes
   */
  static getNotes(connection: Connection): string | null {
    return connection.metadata.notes || null
  }

  /**
   * Check if connection is professional
   */
  static isProfessional(connection: Connection): boolean {
    return connection.type === 'professional'
  }

  /**
   * Check if connection is personal
   */
  static isPersonal(connection: Connection): boolean {
    return connection.type === 'personal'
  }

  /**
   * Check if connection is mentor-mentee
   */
  static isMentorMentee(connection: Connection): boolean {
    return ['mentor', 'mentee'].includes(connection.type)
  }

  /**
   * Check if connection is collaborator
   */
  static isCollaborator(connection: Connection): boolean {
    return connection.type === 'collaborator'
  }

  /**
   * Get connection response time in hours
   */
  static getResponseTimeHours(connection: Connection): number | null {
    if (!connection.respondedAt) return null
    const requestedAt = new Date(connection.requestedAt)
    const respondedAt = new Date(connection.respondedAt)
    return (respondedAt.getTime() - requestedAt.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Check if connection was responded to quickly
   */
  static wasRespondedQuickly(connection: Connection): boolean {
    const responseTime = this.getResponseTimeHours(connection)
    return responseTime !== null && responseTime < 24 // Within 24 hours
  }

  /**
   * Get connection status display text
   */
  static getStatusDisplayText(connection: Connection): string {
    switch (connection.status) {
      case 'pending': return 'Pending'
      case 'accepted': return 'Connected'
      case 'declined': return 'Declined'
      case 'blocked': return 'Blocked'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  }

  /**
   * Get connection type display text
   */
  static getTypeDisplayText(connection: Connection): string {
    switch (connection.type) {
      case 'professional': return 'Professional'
      case 'personal': return 'Personal'
      case 'mentor': return 'Mentor'
      case 'mentee': return 'Mentee'
      case 'collaborator': return 'Collaborator'
      default: return 'Unknown'
    }
  }

  /**
   * Check if connection can send messages
   */
  static canSendMessages(connection: Connection): boolean {
    return this.isAccepted(connection)
  }

  /**
   * Check if connection can be recommended
   */
  static canBeRecommended(connection: Connection): boolean {
    return this.isAccepted(connection) && !this.isStale(connection)
  }

  /**
   * Get connection quality score
   */
  static getQualityScore(connection: Connection): number {
    let score = 0
    
    // Base score from connection strength
    score += connection.metadata.connectionStrength / 100 * 40
    
    // Bonus for shared interests
    if (this.hasSharedInterests(connection)) {
      score += Math.min(connection.metadata.sharedInterests.length * 2, 20)
    }
    
    // Bonus for shared events
    if (this.hasSharedEvents(connection)) {
      score += Math.min(connection.metadata.sharedEvents.length * 5, 20)
    }
    
    // Bonus for quick response
    if (this.wasRespondedQuickly(connection)) {
      score += 10
    }
    
    // Bonus for notes
    if (this.hasNotes(connection)) {
      score += 5
    }
    
    // Bonus for professional type
    if (this.isProfessional(connection)) {
      score += 5
    }
    
    return Math.min(score, 100)
  }
}

