#!/usr/bin/env node
/**
 * Models Index - AppointmentScheduler Data Models
 * 
 * This file exports all data models, validation schemas, transformers,
 * and error handling utilities for the AppointmentScheduler system.
 * 
 * Maps to TASK-007: Create Data Models
 * TDD Phase: Contract
 * Constitutional Compliance: Anti-Abstraction Gate, Traceability Gate
 */

// ============================================================================
// Export All Types
// ============================================================================
export * from './types';

// ============================================================================
// Export Validation Schemas
// ============================================================================
export * from './validation';

// ============================================================================
// Export Transformers
// ============================================================================
export * from './transformers';

// ============================================================================
// Export Error Handling
// ============================================================================
export * from './errors';

// ============================================================================
// Convenience Exports
// ============================================================================

// Re-export commonly used items for convenience
export {
  // Types
  Appointment,
  TimeSlot,
  Calendar,
  CalendarDay,
  User,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CalendarRequest,
  AvailabilityRequest,
  ApiResponse,
  ValidationError,
  ApiError,
  DomainError,
  AppointmentStatus
} from './types';

export {
  schemas as validationSchemas,
  validators as validationUtils
} from './validation';

export {
  transformers as dataTransformers
} from './transformers';

export {
  errorUtils as errorHandlers
} from './errors';

// ============================================================================
// CommonJS Export for Tests
// ============================================================================

// Export everything for CommonJS compatibility
const types = require('./types');
const validation = require('./validation');
const transformers = require('./transformers');
const errors = require('./errors');

module.exports = {
  // Re-export all types
  AppointmentStatus: types.AppointmentStatus,
  // Note: TypeScript interfaces are not runtime values, so we don't export them
  // Appointment: types.Appointment,
  // TimeSlot: types.TimeSlot,
  // Calendar: types.Calendar,
  // CalendarDay: types.CalendarDay,
  // User: types.User,
  // CreateAppointmentRequest: types.CreateAppointmentRequest,
  // UpdateAppointmentRequest: types.UpdateAppointmentRequest,
  // CalendarRequest: types.CalendarRequest,
  // AvailabilityRequest: types.AvailabilityRequest,
  // ApiResponse: types.ApiResponse,
  // ValidationError: types.ValidationError,
  // ApiError: types.ApiError,
  // DomainError: types.DomainError,
  
  // Re-export validation
  validationSchemas: validation.schemas,
  validationUtils: validation.validators,
  
  // Re-export transformers
  dataTransformers: transformers.transformers,
  
  // Re-export error handling
  errorHandlers: errors.errorUtils,
  
  // Re-export everything else
  ...types,
  ...validation,
  ...transformers,
  ...errors
};
