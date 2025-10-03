import { z } from 'zod'

/**
 * Event Analytics Model - Analytics and reporting entity
 * Traces to FR-008: Analytics and reporting for event organizers
 */

// Analytics metric type enum
const AnalyticsMetricType = z.enum([
  'registration',
  'check_in',
  'session_attendance',
  'connection_made',
  'message_sent',
  'feedback_submitted',
  'event_completion',
  'session_completion',
  'networking_activity',
  'engagement_score'
])
export type AnalyticsMetricType = z.infer<typeof AnalyticsMetricType>

// Analytics period enum
const AnalyticsPeriod = z.enum(['hour', 'day', 'week', 'month', 'year'])
export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriod>

// Analytics aggregation type enum
const AnalyticsAggregationType = z.enum(['sum', 'count', 'average', 'min', 'max', 'median'])
export type AnalyticsAggregationType = z.infer<typeof AnalyticsAggregationType>

// Analytics metadata schema
const AnalyticsMetadataSchema = z.object({
  sessionId: z.string().uuid().optional(),
  attendeeId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  feedbackId: z.string().uuid().optional(),
  customFields: z.record(z.string(), z.any()).default({})
})

export type AnalyticsMetadata = z.infer<typeof AnalyticsMetadataSchema>

// Base Event Analytics schema
const BaseEventAnalyticsSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  metricType: AnalyticsMetricType,
  value: z.number(),
  aggregationType: AnalyticsAggregationType.default('count'),
  period: AnalyticsPeriod.default('day'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  metadata: AnalyticsMetadataSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const EventAnalyticsSchema = BaseEventAnalyticsSchema.refine(
  data => data.value >= 0,
  {
    message: "Value cannot be negative",
    path: ["value"]
  }
)

export type EventAnalytics = z.infer<typeof EventAnalyticsSchema>

// Create Event Analytics schema
const CreateEventAnalyticsSchema = BaseEventAnalyticsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).refine(
  data => data.value >= 0,
  {
    message: "Value cannot be negative",
    path: ["value"]
  }
)

export type CreateEventAnalyticsRequest = z.infer<typeof CreateEventAnalyticsSchema>

// Update Event Analytics schema
const UpdateEventAnalyticsSchema = BaseEventAnalyticsSchema.partial().omit({
  id: true,
  eventId: true,
  createdAt: true,
  updatedAt: true
})

export type UpdateEventAnalyticsRequest = z.infer<typeof UpdateEventAnalyticsSchema>

// Analytics query schema
const AnalyticsQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  metricType: AnalyticsMetricType.optional(),
  aggregationType: AnalyticsAggregationType.optional(),
  period: AnalyticsPeriod.default('day'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(100),
  sortBy: z.enum(['periodStart', 'value', 'createdAt']).default('periodStart'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>

// Analytics summary schema
const AnalyticsSummarySchema = z.object({
  eventId: z.string().uuid(),
  totalRegistrations: z.number().int().min(0),
  totalCheckIns: z.number().int().min(0),
  totalSessions: z.number().int().min(0),
  totalConnections: z.number().int().min(0),
  totalMessages: z.number().int().min(0),
  totalFeedback: z.number().int().min(0),
  averageEngagementScore: z.number().min(0).max(100),
  peakConcurrentAttendees: z.number().int().min(0),
  completionRate: z.number().min(0).max(100),
  networkingRate: z.number().min(0).max(100),
  lastUpdated: z.string().datetime()
})

export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>

// Analytics report schema
const AnalyticsReportSchema = z.object({
  eventId: z.string().uuid(),
  reportType: z.enum(['summary', 'detailed', 'custom']),
  period: AnalyticsPeriod,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.object({
    metricType: AnalyticsMetricType,
    value: z.number(),
    aggregationType: AnalyticsAggregationType,
    period: AnalyticsPeriod,
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime()
  })),
  summary: AnalyticsSummarySchema,
  generatedAt: z.string().datetime(),
  generatedBy: z.string().uuid()
})

export type AnalyticsReport = z.infer<typeof AnalyticsReportSchema>

// Analytics validation methods
export class AnalyticsValidator {
  /**
   * Validate analytics value
   */
  static validateValue(value: number, metricType: AnalyticsMetricType): { isValid: boolean; error?: string } {
    if (value < 0) {
      return { isValid: false, error: 'Analytics value cannot be negative' }
    }

    // Validate specific metric types
    switch (metricType) {
      case 'engagement_score':
        if (value > 100) {
          return { isValid: false, error: 'Engagement score cannot exceed 100' }
        }
        break
      case 'event_completion':
        if (value > 100) {
          return { isValid: false, error: 'Event completion rate cannot exceed 100%' }
        }
        break
      case 'networking_activity':
        if (value > 100) {
          return { isValid: false, error: 'Networking activity rate cannot exceed 100%' }
        }
        break
    }

    return { isValid: true }
  }

  /**
   * Validate analytics period
   */
  static validatePeriod(period: AnalyticsPeriod): { isValid: boolean; error?: string } {
    const validPeriods = ['hour', 'day', 'week', 'month', 'year']
    if (!validPeriods.includes(period)) {
      return { isValid: false, error: 'Invalid analytics period' }
    }
    return { isValid: true }
  }

  /**
   * Validate analytics aggregation type
   */
  static validateAggregationType(aggregationType: AnalyticsAggregationType): { isValid: boolean; error?: string } {
    const validTypes = ['sum', 'count', 'average', 'min', 'max', 'median']
    if (!validTypes.includes(aggregationType)) {
      return { isValid: false, error: 'Invalid aggregation type' }
    }
    return { isValid: true }
  }

  /**
   * Validate analytics period range
   */
  static validatePeriodRange(periodStart: string, periodEnd: string): { isValid: boolean; error?: string } {
    const start = new Date(periodStart)
    const end = new Date(periodEnd)

    if (start >= end) {
      return { isValid: false, error: 'Period start must be before period end' }
    }

    // Check if period is not too long (max 1 year)
    const maxPeriod = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
    if (end.getTime() - start.getTime() > maxPeriod) {
      return { isValid: false, error: 'Analytics period cannot exceed 1 year' }
    }

    return { isValid: true }
  }

  /**
   * Validate analytics query date range
   */
  static validateQueryDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return { isValid: false, error: 'Start date must be before end date' }
    }

    // Check if range is not too long (max 2 years)
    const maxRange = 2 * 365 * 24 * 60 * 60 * 1000 // 2 years in milliseconds
    if (end.getTime() - start.getTime() > maxRange) {
      return { isValid: false, error: 'Query date range cannot exceed 2 years' }
    }

    return { isValid: true }
  }
}

// Analytics business logic methods
export class AnalyticsService {
  /**
   * Check if analytics is for registration
   */
  static isRegistration(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'registration'
  }

  /**
   * Check if analytics is for check-in
   */
  static isCheckIn(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'check_in'
  }

  /**
   * Check if analytics is for session attendance
   */
  static isSessionAttendance(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'session_attendance'
  }

  /**
   * Check if analytics is for connection
   */
  static isConnection(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'connection_made'
  }

  /**
   * Check if analytics is for message
   */
  static isMessage(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'message_sent'
  }

  /**
   * Check if analytics is for feedback
   */
  static isFeedback(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'feedback_submitted'
  }

  /**
   * Check if analytics is for engagement
   */
  static isEngagement(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'engagement_score'
  }

  /**
   * Check if analytics is for completion
   */
  static isCompletion(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'event_completion' || analytics.metricType === 'session_completion'
  }

  /**
   * Check if analytics is for networking
   */
  static isNetworking(analytics: EventAnalytics): boolean {
    return analytics.metricType === 'networking_activity'
  }

  /**
   * Get analytics period duration in hours
   */
  static getPeriodDurationHours(analytics: EventAnalytics): number {
    const start = new Date(analytics.periodStart)
    const end = new Date(analytics.periodEnd)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))
  }

  /**
   * Check if analytics is recent
   */
  static isRecent(analytics: EventAnalytics): boolean {
    const now = new Date()
    const createdAt = new Date(analytics.createdAt)
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursSinceCreated < 24 // Within last 24 hours
  }

  /**
   * Get analytics value as percentage
   */
  static getValueAsPercentage(analytics: EventAnalytics): number {
    if (analytics.metricType === 'engagement_score' || 
        analytics.metricType === 'event_completion' || 
        analytics.metricType === 'networking_activity') {
      return analytics.value
    }
    return 0
  }

  /**
   * Get analytics value as count
   */
  static getValueAsCount(analytics: EventAnalytics): number {
    if (analytics.metricType === 'registration' || 
        analytics.metricType === 'check_in' || 
        analytics.metricType === 'session_attendance' ||
        analytics.metricType === 'connection_made' ||
        analytics.metricType === 'message_sent' ||
        analytics.metricType === 'feedback_submitted') {
      return analytics.value
    }
    return 0
  }

  /**
   * Get analytics aggregation type display text
   */
  static getAggregationTypeDisplayText(analytics: EventAnalytics): string {
    switch (analytics.aggregationType) {
      case 'sum': return 'Sum'
      case 'count': return 'Count'
      case 'average': return 'Average'
      case 'min': return 'Minimum'
      case 'max': return 'Maximum'
      case 'median': return 'Median'
      default: return 'Unknown'
    }
  }

  /**
   * Get analytics period display text
   */
  static getPeriodDisplayText(analytics: EventAnalytics): string {
    switch (analytics.period) {
      case 'hour': return 'Hour'
      case 'day': return 'Day'
      case 'week': return 'Week'
      case 'month': return 'Month'
      case 'year': return 'Year'
      default: return 'Unknown'
    }
  }

  /**
   * Get analytics metric type display text
   */
  static getMetricTypeDisplayText(analytics: EventAnalytics): string {
    switch (analytics.metricType) {
      case 'registration': return 'Registrations'
      case 'check_in': return 'Check-ins'
      case 'session_attendance': return 'Session Attendance'
      case 'connection_made': return 'Connections Made'
      case 'message_sent': return 'Messages Sent'
      case 'feedback_submitted': return 'Feedback Submitted'
      case 'event_completion': return 'Event Completion'
      case 'session_completion': return 'Session Completion'
      case 'networking_activity': return 'Networking Activity'
      case 'engagement_score': return 'Engagement Score'
      default: return 'Unknown'
    }
  }

  /**
   * Check if analytics has session context
   */
  static hasSessionContext(analytics: EventAnalytics): boolean {
    return !!analytics.metadata.sessionId
  }

  /**
   * Check if analytics has attendee context
   */
  static hasAttendeeContext(analytics: EventAnalytics): boolean {
    return !!analytics.metadata.attendeeId
  }

  /**
   * Check if analytics has connection context
   */
  static hasConnectionContext(analytics: EventAnalytics): boolean {
    return !!analytics.metadata.connectionId
  }

  /**
   * Get analytics session ID
   */
  static getSessionId(analytics: EventAnalytics): string | null {
    return analytics.metadata.sessionId || null
  }

  /**
   * Get analytics attendee ID
   */
  static getAttendeeId(analytics: EventAnalytics): string | null {
    return analytics.metadata.attendeeId || null
  }

  /**
   * Get analytics connection ID
   */
  static getConnectionId(analytics: EventAnalytics): string | null {
    return analytics.metadata.connectionId || null
  }

  /**
   * Check if analytics is aggregated
   */
  static isAggregated(analytics: EventAnalytics): boolean {
    return analytics.aggregationType !== 'count'
  }

  /**
   * Get analytics trend direction
   */
  static getTrendDirection(currentValue: number, previousValue: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05 // 5% threshold for stability
    const change = (currentValue - previousValue) / previousValue
    
    if (change > threshold) return 'up'
    if (change < -threshold) return 'down'
    return 'stable'
  }

  /**
   * Calculate analytics growth rate
   */
  static calculateGrowthRate(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0
    return ((currentValue - previousValue) / previousValue) * 100
  }

  /**
   * Check if analytics value is significant
   */
  static isSignificant(analytics: EventAnalytics): boolean {
    // Define significance thresholds based on metric type
    switch (analytics.metricType) {
      case 'engagement_score':
        return analytics.value > 70
      case 'event_completion':
        return analytics.value > 80
      case 'networking_activity':
        return analytics.value > 60
      case 'registration':
        return analytics.value > 100
      case 'check_in':
        return analytics.value > 50
      default:
        return analytics.value > 10
    }
  }

  /**
   * Get analytics quality score
   */
  static getQualityScore(analytics: EventAnalytics): number {
    let score = 0
    
    // Base score from value significance
    if (this.isSignificant(analytics)) {
      score += 30
    }
    
    // Bonus for recent data
    if (this.isRecent(analytics)) {
      score += 20
    }
    
    // Bonus for proper aggregation
    if (this.isAggregated(analytics)) {
      score += 20
    }
    
    // Bonus for context
    if (this.hasSessionContext(analytics) || this.hasAttendeeContext(analytics)) {
      score += 15
    }
    
    // Bonus for metadata
    if (Object.keys(analytics.metadata.customFields).length > 0) {
      score += 15
    }
    
    return Math.min(score, 100)
  }
}

