#!/usr/bin/env node
/**
 * Data Transformation Utilities for AppointmentScheduler
 * 
 * This file contains utilities for transforming data between different formats
 * (API, database, domain models) and handling data validation.
 * 
 * Maps to TASK-007: Create Data Models
 * TDD Phase: Contract
 * Constitutional Compliance: Anti-Abstraction Gate, Traceability Gate
 */

import {
  Appointment,
  TimeSlot,
  Calendar,
  CalendarDay,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CalendarRequest,
  AvailabilityRequest,
  ApiResponse,
  ResponseMetadata,
  ValidationError,
  ApiError,
  DomainError,
  AppointmentStatus,
  AppointmentStats
} from './types';

// ============================================================================
// Database Entity Transformers
// ============================================================================

/**
 * Transform database row to Appointment entity
 * Maps to FR-002: Appointment Booking, FR-003: Appointment Management
 */
export function transformDbRowToAppointment(dbRow: any): Appointment {
  return {
    id: dbRow.id,
    startTime: new Date(dbRow.start_time),
    endTime: new Date(dbRow.end_time),
    userEmail: dbRow.user_email,
    userName: dbRow.user_name,
    notes: dbRow.notes || undefined,
    status: dbRow.status as AppointmentStatus,
    createdAt: new Date(dbRow.created_at),
    updatedAt: new Date(dbRow.updated_at),
    createdBy: dbRow.created_by || undefined,
    updatedBy: dbRow.updated_by || undefined
  };
}

/**
 * Transform Appointment entity to database row
 * Maps to FR-002: Appointment Booking, FR-003: Appointment Management
 */
export function transformAppointmentToDbRow(appointment: Appointment): any {
  return {
    id: appointment.id,
    start_time: appointment.startTime.toISOString(),
    end_time: appointment.endTime.toISOString(),
    user_email: appointment.userEmail,
    user_name: appointment.userName,
    notes: appointment.notes || null,
    status: appointment.status,
    created_at: appointment.createdAt.toISOString(),
    updated_at: appointment.updatedAt.toISOString(),
    created_by: appointment.createdBy || null,
    updated_by: appointment.updatedBy || null
  };
}

/**
 * Transform database row to TimeSlot entity
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function transformDbRowToTimeSlot(dbRow: any): TimeSlot {
  return {
    startTime: new Date(dbRow.start_time),
    endTime: new Date(dbRow.end_time),
    isAvailable: dbRow.is_available,
    appointmentId: dbRow.appointment_id || undefined,
    userEmail: dbRow.user_email || undefined,
    userName: dbRow.user_name || undefined
  };
}

/**
 * Transform TimeSlot entity to database row
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function transformTimeSlotToDbRow(timeSlot: TimeSlot): any {
  return {
    start_time: timeSlot.startTime.toISOString(),
    end_time: timeSlot.endTime.toISOString(),
    is_available: timeSlot.isAvailable,
    appointment_id: timeSlot.appointmentId || null,
    user_email: timeSlot.userEmail || null,
    user_name: timeSlot.userName || null
  };
}

// ============================================================================
// API Request/Response Transformers
// ============================================================================

/**
 * Transform API request to CreateAppointmentRequest
 * Maps to FR-002: Appointment Booking
 */
export function transformApiRequestToCreateAppointment(apiRequest: any): CreateAppointmentRequest {
  return {
    startTime: new Date(apiRequest.startTime),
    endTime: new Date(apiRequest.endTime),
    userEmail: apiRequest.userEmail,
    userName: apiRequest.userName,
    notes: apiRequest.notes || undefined
  };
}

/**
 * Transform API request to UpdateAppointmentRequest
 * Maps to FR-003: Appointment Management
 */
export function transformApiRequestToUpdateAppointment(apiRequest: any): UpdateAppointmentRequest {
  const updateRequest: UpdateAppointmentRequest = {};
  
  if (apiRequest.startTime) {
    updateRequest.startTime = new Date(apiRequest.startTime);
  }
  if (apiRequest.endTime) {
    updateRequest.endTime = new Date(apiRequest.endTime);
  }
  if (apiRequest.userEmail) {
    updateRequest.userEmail = apiRequest.userEmail;
  }
  if (apiRequest.userName) {
    updateRequest.userName = apiRequest.userName;
  }
  if (apiRequest.notes !== undefined) {
    updateRequest.notes = apiRequest.notes;
  }
  if (apiRequest.status) {
    updateRequest.status = apiRequest.status as AppointmentStatus;
  }
  
  return updateRequest;
}

/**
 * Transform API request to CalendarRequest
 * Maps to FR-001: Calendar View
 */
export function transformApiRequestToCalendarRequest(apiRequest: any): CalendarRequest {
  return {
    year: parseInt(apiRequest.year, 10),
    month: parseInt(apiRequest.month, 10),
    timezone: apiRequest.timezone || 'UTC'
  };
}

/**
 * Transform API request to AvailabilityRequest
 * Maps to FR-004: Availability Checking
 */
export function transformApiRequestToAvailabilityRequest(apiRequest: any): AvailabilityRequest {
  return {
    startTime: new Date(apiRequest.startTime),
    endTime: new Date(apiRequest.endTime),
    excludeAppointmentId: apiRequest.excludeAppointmentId || undefined
  };
}

/**
 * Transform Appointment entity to API response
 * Maps to FR-005: API Design
 */
export function transformAppointmentToApiResponse(appointment: Appointment): ApiResponse<Appointment> {
  return {
    data: appointment,
    metadata: {
      total: 1
    },
    timestamp: new Date()
  };
}

/**
 * Transform Appointment array to API response
 * Maps to FR-005: API Design
 */
export function transformAppointmentsToApiResponse(
  appointments: Appointment[],
  metadata?: ResponseMetadata
): ApiResponse<Appointment[]> {
  return {
    data: appointments,
    metadata: metadata || {
      total: appointments.length
    },
    timestamp: new Date()
  };
}

/**
 * Transform Calendar entity to API response
 * Maps to FR-001: Calendar View
 */
export function transformCalendarToApiResponse(calendar: Calendar): ApiResponse<Calendar> {
  return {
    data: calendar,
    metadata: {
      total: calendar.days.length
    },
    timestamp: new Date()
  };
}

// ============================================================================
// Data Sanitization and Normalization
// ============================================================================

/**
 * Sanitize and normalize email address
 * Maps to FR-002: Appointment Booking
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize and normalize user name
 * Maps to FR-002: Appointment Booking
 */
export function sanitizeUserName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize and normalize notes
 * Maps to FR-002: Appointment Booking
 */
export function sanitizeNotes(notes: string): string {
  return notes.trim();
}

/**
 * Normalize date to start of day
 * Maps to FR-001: Calendar View
 */
export function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Normalize date to end of day
 * Maps to FR-001: Calendar View
 */
export function normalizeToEndOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

/**
 * Normalize date to start of hour
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function normalizeToStartOfHour(date: Date): Date {
  const normalized = new Date(date);
  normalized.setMinutes(0, 0, 0);
  return normalized;
}

/**
 * Normalize date to end of hour
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function normalizeToEndOfHour(date: Date): Date {
  const normalized = new Date(date);
  normalized.setMinutes(59, 59, 999);
  return normalized;
}

// ============================================================================
// Time Zone and Date Utilities
// ============================================================================

/**
 * Convert date to specific timezone
 * Maps to FR-001: Calendar View
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  try {
    const utcDate = new Date(date.toISOString());
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    return localDate;
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

/**
 * Get timezone offset in minutes
 * Maps to FR-001: Calendar View
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (local.getTime() - utc.getTime()) / (1000 * 60);
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

/**
 * Check if date is in business hours
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function isInBusinessHours(date: Date, timezone: string = 'UTC'): boolean {
  const localDate = convertToTimezone(date, timezone);
  const hour = localDate.getHours();
  return hour >= 9 && hour < 17; // 9 AM to 5 PM
}

/**
 * Check if date is on weekend
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

// ============================================================================
// Calendar Generation Utilities
// ============================================================================

/**
 * Generate calendar days for a month
 * Maps to FR-001: Calendar View
 */
export function generateCalendarDays(year: number, month: number, timezone: string = 'UTC'): CalendarDay[] {
  const days: CalendarDay[] = [];
  const lastDay = new Date(year, month, 0);
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    days.push({
      date: date, // Keep the original date without timezone conversion
      dayOfWeek,
      isAvailable: !isWeekend(date) && isInBusinessHours(date, timezone),
      timeSlots: []
    });
  }
  
  return days;
}

/**
 * Generate time slots for a day
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export function generateTimeSlotsForDay(
  date: Date,
  timezone: string = 'UTC',
  duration: number = 60
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);
    
    slots.push({
      startTime: convertToTimezone(startTime, timezone),
      endTime: convertToTimezone(endTime, timezone),
      isAvailable: true
    });
  }
  
  return slots;
}

// ============================================================================
// Error Transformation Utilities
// ============================================================================

/**
 * Transform validation error to API error
 * Maps to FR-006: Error Handling
 */
export function transformValidationErrorToApiError(
  error: any,
  requestId?: string
): ApiError {
  const validationErrors: ValidationError[] = [];
  
  if (error.details) {
    for (const detail of error.details) {
      validationErrors.push({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type,
        value: detail.context?.value
      });
    }
  }
  
  const result: ApiError = {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: validationErrors,
    timestamp: new Date()
  };
  
  if (requestId) {
    result.requestId = requestId;
  }
  
  return result;
}

/**
 * Transform domain error to API error
 * Maps to FR-006: Error Handling
 */
export function transformDomainErrorToApiError(
  error: DomainError,
  requestId?: string
): ApiError {
  const result: ApiError = {
    code: error.code,
    message: error.message,
    timestamp: error.timestamp
  };
  
  if (requestId) {
    result.requestId = requestId;
  }
  
  return result;
}

/**
 * Transform generic error to API error
 * Maps to FR-006: Error Handling
 */
export function transformGenericErrorToApiError(
  _error: Error,
  requestId?: string
): ApiError {
  const result: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    timestamp: new Date()
  };
  
  if (requestId) {
    result.requestId = requestId;
  }
  
  return result;
}

// ============================================================================
// Statistics and Analytics Transformers
// ============================================================================

/**
 * Transform appointment data to statistics
 * Maps to FR-007: Reporting
 */
export function transformAppointmentsToStats(appointments: Appointment[]): AppointmentStats {
  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
  const cancelled = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
  const rescheduled = appointments.filter(a => a.status === AppointmentStatus.RESCHEDULED).length;
  
  const totalDuration = appointments.reduce((sum, appointment) => {
    return sum + (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60);
  }, 0);
  
  const averageDuration = total > 0 ? totalDuration / total : 0;
  
  // Find popular time slots (simplified implementation)
  const popularSlots: TimeSlot[] = [];
  const slotCounts = new Map<string, number>();
  
  appointments.forEach(appointment => {
    const hour = appointment.startTime.getHours();
    const key = `${hour}:00`;
    slotCounts.set(key, (slotCounts.get(key) || 0) + 1);
  });
  
  // Get top 3 popular slots
  const sortedSlots = Array.from(slotCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  sortedSlots.forEach(([time, _count]) => {
    const hour = parseInt(time.split(':')[0] || '0', 10);
    const startTime = new Date();
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    popularSlots.push({
      startTime,
      endTime,
      isAvailable: false
    });
  });
  
  return {
    total,
    confirmed,
    cancelled,
    rescheduled,
    averageDuration,
    popularSlots
  };
}

// ============================================================================
// Export All Transformers
// ============================================================================

export const transformers = {
  // Database transformers
  transformDbRowToAppointment,
  transformAppointmentToDbRow,
  transformDbRowToTimeSlot,
  transformTimeSlotToDbRow,
  
  // API transformers
  transformApiRequestToCreateAppointment,
  transformApiRequestToUpdateAppointment,
  transformApiRequestToCalendarRequest,
  transformApiRequestToAvailabilityRequest,
  transformAppointmentToApiResponse,
  transformAppointmentsToApiResponse,
  transformCalendarToApiResponse,
  
  // Sanitization utilities
  sanitizeEmail,
  sanitizeUserName,
  sanitizeNotes,
  normalizeToStartOfDay,
  normalizeToEndOfDay,
  normalizeToStartOfHour,
  normalizeToEndOfHour,
  
  // Time zone utilities
  convertToTimezone,
  getTimezoneOffset,
  isInBusinessHours,
  isWeekend,
  
  // Calendar utilities
  generateCalendarDays,
  generateTimeSlotsForDay,
  
  // Error transformers
  transformValidationErrorToApiError,
  transformDomainErrorToApiError,
  transformGenericErrorToApiError,
  
  // Statistics transformers
  transformAppointmentsToStats
};
