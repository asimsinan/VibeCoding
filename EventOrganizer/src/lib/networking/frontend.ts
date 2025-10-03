/**
 * Frontend-only Networking Services
 * 
 * Exports only the services needed for frontend, excluding CLI modules
 * 
 * @fileoverview Frontend Networking Services for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

// Export only the services, not the CLI
export { ConnectionService } from './services/ConnectionService'
export { MessagingService } from './services/MessagingService'

// Export models
export * from '../models/Connection'
export * from '../models/Message'
