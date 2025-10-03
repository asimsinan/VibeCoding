/**
 * Event Management Library
 * 
 * Comprehensive event management functionality including:
 * - Event CRUD operations and status management
 * - Attendee registration and check-in/check-out
 * - Session scheduling and speaker management
 * - Capacity management and waitlist functionality
 * - Analytics and reporting
 * 
 * @fileoverview Event Management Library for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

// Export all models
export * from '../models/Event'
export * from '../models/Attendee'
export * from '../models/Session'

// Export all services
export { EventService } from './services/EventService'
export { AttendeeService } from './services/AttendeeService'
export { SessionService } from './services/SessionService'

// Export CLI interface
// export { EventManagementCLI } from './cli'

// Import types for internal use
import { EventService } from './services/EventService'
import { AttendeeService } from './services/AttendeeService'
import { SessionService } from './services/SessionService'

/**
 * Event Management Library Factory
 * 
 * Creates configured instances of all event management services
 * with shared database connection and configuration.
 */
export class EventManagementLibrary {
  private eventService: EventService
  private attendeeService: AttendeeService
  private sessionService: SessionService

  constructor() {
    this.eventService = new EventService()
    this.attendeeService = new AttendeeService()
    this.sessionService = new SessionService()
  }

  /**
   * Get Event Service instance
   */
  get events(): EventService {
    return this.eventService
  }

  /**
   * Get Attendee Service instance
   */
  get attendees(): AttendeeService {
    return this.attendeeService
  }

  /**
   * Get Session Service instance
   */
  get sessions(): SessionService {
    return this.sessionService
  }

  /**
   * Get library health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy'
    services: {
      events: 'healthy' | 'unhealthy'
      attendees: 'healthy' | 'unhealthy'
      sessions: 'healthy' | 'unhealthy'
    }
    timestamp: string
  }> {
    const timestamp = new Date().toISOString()
    
    try {
      // Test each service with a simple query
      await this.eventService.listEvents({ limit: 1 })
      await this.attendeeService.listEventAttendees('test', { limit: 1 })
      await this.sessionService.listEventSessions('test', { limit: 1 })

      return {
        status: 'healthy',
        services: {
          events: 'healthy',
          attendees: 'healthy',
          sessions: 'healthy'
        },
        timestamp
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          events: 'unhealthy',
          attendees: 'unhealthy',
          sessions: 'unhealthy'
        },
        timestamp
      }
    }
  }
}

// Default export
export default EventManagementLibrary
