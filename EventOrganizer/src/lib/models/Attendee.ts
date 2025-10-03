import { z } from 'zod'

/**
 * Attendee Model - Event attendance entity
 * Traces to FR-003: Event registration and check-in
 */

// Attendee status enum
const AttendeeStatus = z.enum(['registered', 'checked_in', 'cancelled'])
export type AttendeeStatus = z.infer<typeof AttendeeStatus>

// Attendee type enum
const AttendeeType = z.enum(['attendee', 'speaker', 'organizer', 'volunteer'])
export type AttendeeType = z.infer<typeof AttendeeType>

// Attendee metadata schema
export const AttendeeMetadataSchema = z.object({
  dietaryRequirements: z.string().max(255).optional(),
  accessibilityNeeds: z.string().max(500).optional(),
  emergencyContact: z.string().max(255).optional(),
  tshirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).optional(),
  customFields: z.record(z.string(), z.any()).default({})
})

export type AttendeeMetadata = z.infer<typeof AttendeeMetadataSchema>

// Base Attendee schema
export const AttendeeSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  status: AttendeeStatus.default('registered'),
  type: AttendeeType.default('attendee'),
  registrationDate: z.string().datetime(),
  checkInDate: z.string().datetime().optional(),
  checkOutDate: z.string().datetime().optional(),
  metadata: AttendeeMetadataSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type Attendee = z.infer<typeof AttendeeSchema>

// Create Attendee schema
export const CreateAttendeeSchema = AttendeeSchema.omit({
  id: true,
  registrationDate: true,
  checkInDate: true,
  checkOutDate: true,
  createdAt: true,
  updatedAt: true
})

export type CreateAttendeeRequest = z.infer<typeof CreateAttendeeSchema>

// Update Attendee schema
export const UpdateAttendeeSchema = AttendeeSchema.partial().omit({
  id: true,
  eventId: true,
  userId: true,
  registrationDate: true,
  createdAt: true,
  updatedAt: true
})

export type UpdateAttendeeRequest = z.infer<typeof UpdateAttendeeSchema>

// Attendee list query schema
export const AttendeeListQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: AttendeeStatus.optional(),
  type: AttendeeType.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['registrationDate', 'checkInDate', 'createdAt']).default('registrationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeCancelled: z.boolean().default(false)
})

export type AttendeeListQuery = z.infer<typeof AttendeeListQuerySchema>

// Attendee search schema
export const AttendeeSearchSchema = z.object({
  query: z.string().min(1).max(100),
  eventId: z.string().uuid().optional(),
  status: AttendeeStatus.optional(),
  type: AttendeeType.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
})

export type AttendeeSearchRequest = z.infer<typeof AttendeeSearchSchema>

// Attendee validation methods
export class AttendeeValidator {
  /**
   * Validate attendee status
   */
  static validateStatus(status: AttendeeStatus): { isValid: boolean; error?: string } {
    const validStatuses = ['registered', 'checked_in', 'cancelled']
    if (!validStatuses.includes(status)) {
      return { isValid: false, error: 'Invalid attendee status' }
    }
    return { isValid: true }
  }

  /**
   * Validate attendee type
   */
  static validateType(type: AttendeeType): { isValid: boolean; error?: string } {
    const validTypes = ['attendee', 'speaker', 'organizer', 'volunteer']
    if (!validTypes.includes(type)) {
      return { isValid: false, error: 'Invalid attendee type' }
    }
    return { isValid: true }
  }

  /**
   * Validate attendee metadata
   */
  static validateMetadata(metadata: AttendeeMetadata): { isValid: boolean; error?: string } {
    if (metadata.dietaryRequirements && metadata.dietaryRequirements.length > 255) {
      return { isValid: false, error: 'Dietary requirements cannot exceed 255 characters' }
    }
    if (metadata.accessibilityNeeds && metadata.accessibilityNeeds.length > 500) {
      return { isValid: false, error: 'Accessibility needs cannot exceed 500 characters' }
    }
    if (metadata.emergencyContact && metadata.emergencyContact.length > 255) {
      return { isValid: false, error: 'Emergency contact cannot exceed 255 characters' }
    }
    return { isValid: true }
  }

  /**
   * Validate check-in/check-out dates
   */
  static validateCheckDates(checkInDate: string, checkOutDate?: string): { isValid: boolean; error?: string } {
    if (checkOutDate) {
      const checkIn = new Date(checkInDate)
      const checkOut = new Date(checkOutDate)
      if (checkOut <= checkIn) {
        return { isValid: false, error: 'Check-out date must be after check-in date' }
      }
    }
    return { isValid: true }
  }
}

// Attendee business logic methods
export class AttendeeService {
  /**
   * Check if attendee is registered
   */
  static isRegistered(attendee: Attendee): boolean {
    return attendee.status === 'registered'
  }

  /**
   * Check if attendee is checked in
   */
  static isCheckedIn(attendee: Attendee): boolean {
    return attendee.status === 'checked_in'
  }

  /**
   * Check if attendee is cancelled
   */
  static isCancelled(attendee: Attendee): boolean {
    return attendee.status === 'cancelled'
  }

  /**
   * Check if attendee is active
   */
  static isActive(attendee: Attendee): boolean {
    return attendee.status === 'registered' || attendee.status === 'checked_in'
  }

  /**
   * Check if attendee can check in
   */
  static canCheckIn(attendee: Attendee): boolean {
    return attendee.status === 'registered'
  }

  /**
   * Check if attendee can check out
   */
  static canCheckOut(attendee: Attendee): boolean {
    return attendee.status === 'checked_in'
  }

  /**
   * Check if attendee can cancel
   */
  static canCancel(attendee: Attendee): boolean {
    return attendee.status === 'registered'
  }

  /**
   * Get attendee age in days
   */
  static getAgeDays(attendee: Attendee): number {
    const now = new Date()
    const registrationDate = new Date(attendee.registrationDate)
    return Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if attendee is new (registered within last 7 days)
   */
  static isNewAttendee(attendee: Attendee): boolean {
    return this.getAgeDays(attendee) <= 7
  }

  /**
   * Get attendee status display text
   */
  static getStatusDisplayText(attendee: Attendee): string {
    switch (attendee.status) {
      case 'registered': return 'Registered'
      case 'checked_in': return 'Checked In'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  }

  /**
   * Get attendee type display text
   */
  static getTypeDisplayText(attendee: Attendee): string {
    switch (attendee.type) {
      case 'attendee': return 'Attendee'
      case 'speaker': return 'Speaker'
      case 'organizer': return 'Organizer'
      case 'volunteer': return 'Volunteer'
      default: return 'Unknown'
    }
  }

  /**
   * Get attendee dietary requirements
   */
  static getDietaryRequirements(attendee: Attendee): string {
    return attendee.metadata.dietaryRequirements || ''
  }

  /**
   * Get attendee accessibility needs
   */
  static getAccessibilityNeeds(attendee: Attendee): string {
    return attendee.metadata.accessibilityNeeds || ''
  }

  /**
   * Get attendee emergency contact
   */
  static getEmergencyContact(attendee: Attendee): string {
    return attendee.metadata.emergencyContact || ''
  }

  /**
   * Get attendee t-shirt size
   */
  static getTshirtSize(attendee: Attendee): string {
    return attendee.metadata.tshirtSize || ''
  }

  /**
   * Check if attendee has dietary requirements
   */
  static hasDietaryRequirements(attendee: Attendee): boolean {
    return !!attendee.metadata.dietaryRequirements
  }

  /**
   * Check if attendee has accessibility needs
   */
  static hasAccessibilityNeeds(attendee: Attendee): boolean {
    return !!attendee.metadata.accessibilityNeeds
  }

  /**
   * Check if attendee has emergency contact
   */
  static hasEmergencyContact(attendee: Attendee): boolean {
    return !!attendee.metadata.emergencyContact
  }

  /**
   * Check if attendee has t-shirt size
   */
  static hasTshirtSize(attendee: Attendee): boolean {
    return !!attendee.metadata.tshirtSize
  }

  /**
   * Get attendee check-in duration in hours
   */
  static getCheckInDurationHours(attendee: Attendee): number | null {
    if (!attendee.checkInDate) return null
    if (!attendee.checkOutDate) return null
    
    const checkIn = new Date(attendee.checkInDate)
    const checkOut = new Date(attendee.checkOutDate)
    return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Check if attendee is currently checked in
   */
  static isCurrentlyCheckedIn(attendee: Attendee): boolean {
    return attendee.status === 'checked_in' && !attendee.checkOutDate
  }

  /**
   * Get attendee registration time
   */
  static getRegistrationTime(attendee: Attendee): Date {
    return new Date(attendee.registrationDate)
  }

  /**
   * Get attendee check-in time
   */
  static getCheckInTime(attendee: Attendee): Date | null {
    return attendee.checkInDate ? new Date(attendee.checkInDate) : null
  }

  /**
   * Get attendee check-out time
   */
  static getCheckOutTime(attendee: Attendee): Date | null {
    return attendee.checkOutDate ? new Date(attendee.checkOutDate) : null
  }

  /**
   * Check if attendee is speaker
   */
  static isSpeaker(attendee: Attendee): boolean {
    return attendee.type === 'speaker'
  }

  /**
   * Check if attendee is organizer
   */
  static isOrganizer(attendee: Attendee): boolean {
    return attendee.type === 'organizer'
  }

  /**
   * Check if attendee is volunteer
   */
  static isVolunteer(attendee: Attendee): boolean {
    return attendee.type === 'volunteer'
  }

  /**
   * Check if attendee is regular attendee
   */
  static isRegularAttendee(attendee: Attendee): boolean {
    return attendee.type === 'attendee'
  }

  /**
   * Get attendee quality score
   */
  static getQualityScore(attendee: Attendee): number {
    let score = 0
    
    // Base score from status
    if (this.isCheckedIn(attendee)) score += 40
    else if (this.isRegistered(attendee)) score += 20
    
    // Bonus for metadata completeness
    if (this.hasDietaryRequirements(attendee)) score += 10
    if (this.hasAccessibilityNeeds(attendee)) score += 10
    if (this.hasEmergencyContact(attendee)) score += 10
    if (this.hasTshirtSize(attendee)) score += 10
    
    // Bonus for type
    if (this.isSpeaker(attendee)) score += 10
    else if (this.isOrganizer(attendee)) score += 5
    else if (this.isVolunteer(attendee)) score += 5
    
    return Math.min(score, 100)
  }
}

