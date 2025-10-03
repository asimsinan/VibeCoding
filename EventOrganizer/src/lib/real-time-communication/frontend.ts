/**
 * Frontend-only Real-time Communication Services
 * 
 * Exports only the services needed for frontend, excluding CLI modules
 * 
 * @fileoverview Frontend Real-time Communication Services for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

// Export only the services, not the CLI
export { WebSocketService } from './services/WebSocketService'
export { NotificationService } from './services/NotificationService'

// Export models
export * from '../models/Notification'
