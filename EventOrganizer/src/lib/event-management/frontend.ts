/**
 * Frontend-only Event Management Services
 * 
 * Exports only the services needed for frontend, excluding CLI modules
 * 
 * @fileoverview Frontend Event Management Services for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

// Export only the services, not the CLI
export { EventService } from './services/EventService'
export { AttendeeService } from './services/AttendeeService'
export { SessionService } from './services/SessionService'

// Export models
export * from '../models/Event'
export * from '../models/Attendee'
export * from '../models/Session'
