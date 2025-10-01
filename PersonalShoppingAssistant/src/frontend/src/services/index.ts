/**
 * Services Index
 * TASK-022: API Data Flow Integration
 * 
 * Exports all services for centralized access.
 */

export { RealtimeService, realtimeService, useRealtime } from './realtimeService';
export { InteractionTracker, interactionTracker, useInteractionTracker } from './interactionTracker';
export type { RealtimeConfig } from './realtimeService';
export type { InteractionEvent, InteractionAnalytics } from './interactionTracker';
