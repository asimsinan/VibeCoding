#!/usr/bin/env node
/**
 * Validation Schemas for AppointmentScheduler
 * 
 * This file contains Joi validation schemas for all data models
 * and input validation logic.
 * 
 * Maps to TASK-007: Create Data Models
 * TDD Phase: Contract
 * Constitutional Compliance: Anti-Abstraction Gate, Traceability Gate
 */

import Joi from 'joi';
import {
  AppointmentStatus,
  DEFAULT_APPOINTMENT_DURATION,
  MIN_APPOINTMENT_DURATION,
  MAX_APPOINTMENT_DURATION,
  DEFAULT_TIMEZONE,
  BUSINESS_HOURS
} from './types';

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Email validation schema
 * Maps to FR-002: Appointment Booking
 */
export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(255)
  .required()
  .messages({
    'string.email': 'Invalid email format',
    'string.max': 'Email must be less than 255 characters',
    'any.required': 'Email is required'
  });

/**
 * Name validation schema
 * Maps to FR-002: Appointment Booking
 */
export const nameSchema = Joi.string()
  .min(1)
  .max(100)
  .trim()
  .required()
  .messages({
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must be less than 100 characters',
    'any.required': 'Name is required'
  });

/**
 * Date validation schema
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export const dateSchema = Joi.date()
  .iso()
  .required()
  .messages({
    'date.base': 'Invalid date format',
    'date.format': 'Date must be in ISO format',
    'any.required': 'Date is required'
  });

/**
 * Future date validation schema
 * Maps to FR-002: Appointment Booking
 */
export const futureDateSchema = Joi.date()
  .iso()
  .min('now')
  .required()
  .messages({
    'date.base': 'Invalid date format',
    'date.format': 'Date must be in ISO format',
    'date.min': 'Date must be in the future',
    'any.required': 'Date is required'
  });

/**
 * Duration validation schema
 * Maps to FR-002: Appointment Booking
 */
export const durationSchema = Joi.number()
  .integer()
  .min(MIN_APPOINTMENT_DURATION)
  .max(MAX_APPOINTMENT_DURATION)
  .messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': `Duration must be at least ${MIN_APPOINTMENT_DURATION} minutes`,
    'number.max': `Duration must be at most ${MAX_APPOINTMENT_DURATION} minutes`
  });

/**
 * Timezone validation schema
 * Maps to FR-001: Calendar View
 */
export const timezoneSchema = Joi.string()
  .valid(
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  )
  .default(DEFAULT_TIMEZONE)
  .messages({
    'any.only': 'Invalid timezone',
    'any.default': 'Using default timezone'
  });

/**
 * Notes validation schema
 * Maps to FR-002: Appointment Booking
 */
export const notesSchema = Joi.string()
  .max(500)
  .allow('')
  .optional()
  .messages({
    'string.max': 'Notes must be less than 500 characters'
  });

// ============================================================================
// Core Domain Validation Schemas
// ============================================================================

/**
 * Appointment Status validation schema
 * Maps to FR-003: Appointment Management
 */
export const appointmentStatusSchema = Joi.string()
  .valid(...Object.values(AppointmentStatus))
  .required()
  .messages({
    'any.only': 'Invalid appointment status',
    'any.required': 'Appointment status is required'
  });

/**
 * Appointment ID validation schema
 * Maps to FR-003: Appointment Management
 */
export const appointmentIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Invalid appointment ID format',
    'any.required': 'Appointment ID is required'
  });

/**
 * Time Range validation schema
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export const timeRangeSchema = Joi.object({
  start: futureDateSchema,
  end: futureDateSchema
}).custom((value, helpers) => {
  if (value.start >= value.end) {
    return helpers.error('timeRange.invalid');
  }
  return value;
}).messages({
  'timeRange.invalid': 'Start time must be before end time'
});

/**
 * Business Hours validation schema
 * Maps to FR-001: Calendar View
 */
export const businessHoursSchema = Joi.object({
  start: Joi.number().integer().min(0).max(23).default(BUSINESS_HOURS.START),
  end: Joi.number().integer().min(0).max(23).default(BUSINESS_HOURS.END)
}).custom((value, helpers) => {
  if (value.start >= value.end) {
    return helpers.error('businessHours.invalid');
  }
  return value;
}).messages({
  'businessHours.invalid': 'Start hour must be before end hour'
});

// ============================================================================
// Request Validation Schemas
// ============================================================================

/**
 * Create Appointment Request validation schema
 * Maps to FR-002: Appointment Booking
 */
export const createAppointmentRequestSchema = Joi.object({
  startTime: futureDateSchema,
  endTime: futureDateSchema,
  userEmail: emailSchema,
  userName: nameSchema,
  notes: notesSchema
}).custom((value, helpers) => {
  // Validate that end time is after start time
  if (value.startTime >= value.endTime) {
    return helpers.error('appointment.timeRange.invalid');
  }
  
  // Validate appointment duration
  const duration = (value.endTime.getTime() - value.startTime.getTime()) / (1000 * 60);
  if (duration < MIN_APPOINTMENT_DURATION) {
    return helpers.error('appointment.duration.tooShort');
  }
  if (duration > MAX_APPOINTMENT_DURATION) {
    return helpers.error('appointment.duration.tooLong');
  }
  
  // Validate business hours
  const startHour = value.startTime.getUTCHours();
  const endHour = value.endTime.getUTCHours();
  if (startHour < BUSINESS_HOURS.START || endHour > BUSINESS_HOURS.END) {
    return helpers.error('appointment.businessHours.invalid');
  }
  
  return value;
}).messages({
  'appointment.timeRange.invalid': 'End time must be after start time',
  'appointment.duration.tooShort': `Appointment must be at least ${MIN_APPOINTMENT_DURATION} minutes`,
  'appointment.duration.tooLong': `Appointment must be at most ${MAX_APPOINTMENT_DURATION} minutes`,
  'appointment.businessHours.invalid': 'Appointment must be within business hours'
});

/**
 * Update Appointment Request validation schema
 * Maps to FR-003: Appointment Management
 */
export const updateAppointmentRequestSchema = Joi.object({
  startTime: futureDateSchema.optional(),
  endTime: futureDateSchema.optional(),
  userEmail: emailSchema.optional(),
  userName: nameSchema.optional(),
  notes: notesSchema,
  status: appointmentStatusSchema.optional()
}).custom((value, helpers) => {
  // If both start and end times are provided, validate the range
  if (value.startTime && value.endTime) {
    if (value.startTime >= value.endTime) {
      return helpers.error('appointment.timeRange.invalid');
    }
    
    const duration = (value.endTime.getTime() - value.startTime.getTime()) / (1000 * 60);
    if (duration < MIN_APPOINTMENT_DURATION) {
      return helpers.error('appointment.duration.tooShort');
    }
    if (duration > MAX_APPOINTMENT_DURATION) {
      return helpers.error('appointment.duration.tooLong');
    }
    
    // Validate business hours
    if (!validateBusinessHours(value.startTime)) {
      return helpers.error('appointment.businessHours.invalid');
    }
  }
  
  return value;
}).messages({
  'appointment.timeRange.invalid': 'End time must be after start time',
  'appointment.duration.tooShort': `Appointment must be at least ${MIN_APPOINTMENT_DURATION} minutes`,
  'appointment.duration.tooLong': `Appointment must be at most ${MAX_APPOINTMENT_DURATION} minutes`,
  'appointment.businessHours.invalid': 'Appointment must be scheduled during business hours (9 AM - 5 PM UTC)'
});

/**
 * Calendar Request validation schema
 * Maps to FR-001: Calendar View
 */
export const calendarRequestSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  timezone: timezoneSchema
}).messages({
  'number.base': 'Year and month must be numbers',
  'number.integer': 'Year and month must be integers',
  'number.min': 'Year must be at least 2020, month must be at least 1',
  'number.max': 'Year must be at most 2030, month must be at most 12',
  'any.required': 'Year and month are required'
});

/**
 * Availability Request validation schema
 * Maps to FR-004: Availability Checking
 */
export const availabilityRequestSchema = Joi.object({
  startTime: futureDateSchema,
  endTime: futureDateSchema,
  excludeAppointmentId: appointmentIdSchema.optional()
}).custom((value, helpers) => {
  if (value.startTime >= value.endTime) {
    return helpers.error('availability.timeRange.invalid');
  }
  
  const duration = (value.endTime.getTime() - value.startTime.getTime()) / (1000 * 60);
  if (duration < MIN_APPOINTMENT_DURATION) {
    return helpers.error('availability.duration.tooShort');
  }
  
  return value;
}).messages({
  'availability.timeRange.invalid': 'End time must be after start time',
  'availability.duration.tooShort': `Time slot must be at least ${MIN_APPOINTMENT_DURATION} minutes`
});

/**
 * User Preferences validation schema
 * Maps to FR-002: Appointment Booking
 */
export const userPreferencesSchema = Joi.object({
  timezone: timezoneSchema,
  defaultDuration: durationSchema.default(DEFAULT_APPOINTMENT_DURATION),
  notificationSettings: Joi.object({
    emailNotifications: Joi.boolean().default(true),
    smsNotifications: Joi.boolean().default(false),
    reminderTime: durationSchema.default(60)
  }).default()
}).default();

/**
 * User validation schema
 * Maps to FR-002: Appointment Booking
 */
export const userSchema = Joi.object({
  email: emailSchema,
  name: nameSchema,
  preferences: userPreferencesSchema
});

// ============================================================================
// Search and Pagination Schemas
// ============================================================================

/**
 * Pagination parameters validation schema
 * Maps to FR-005: API Design
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('startTime', 'endTime', 'userEmail', 'status', 'createdAt').default('startTime'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
}).messages({
  'number.base': 'Page and limit must be numbers',
  'number.integer': 'Page and limit must be integers',
  'number.min': 'Page must be at least 1, limit must be at least 1',
  'number.max': 'Limit must be at most 100',
  'any.only': 'Invalid sort field or order'
});

/**
 * Search parameters validation schema
 * Maps to FR-003: Appointment Management
 */
export const searchParamsSchema = Joi.object({
  query: Joi.string().max(100).optional(),
  userEmail: emailSchema.optional(),
  status: appointmentStatusSchema.optional(),
  dateRange: timeRangeSchema.optional(),
  pagination: paginationSchema
}).messages({
  'string.max': 'Search query must be less than 100 characters'
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate appointment time conflicts
 * Maps to FR-004: Availability Checking
 */
export function validateAppointmentConflicts(
  startTime: Date,
  endTime: Date,
  existingAppointments: Array<{ startTime: Date; endTime: Date; id: string }>,
  excludeId?: string
): { hasConflict: boolean; conflictingAppointments: string[] } {
  const conflicts: string[] = [];
  
  for (const appointment of existingAppointments) {
    if (excludeId && appointment.id === excludeId) {
      continue;
    }
    
    // Check for time overlap
    if (startTime < appointment.endTime && endTime > appointment.startTime) {
      conflicts.push(appointment.id);
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflictingAppointments: conflicts
  };
}

/**
 * Validate business hours
 * Maps to FR-001: Calendar View
 */
export function validateBusinessHours(date: Date): boolean {
  const hour = date.getUTCHours();
  return hour >= BUSINESS_HOURS.START && hour < BUSINESS_HOURS.END;
}

/**
 * Validate appointment duration
 * Maps to FR-002: Appointment Booking
 */
export function validateAppointmentDuration(startTime: Date, endTime: Date): {
  isValid: boolean;
  duration: number;
  error?: string;
} {
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  if (duration < MIN_APPOINTMENT_DURATION) {
    return {
      isValid: false,
      duration,
      error: `Appointment must be at least ${MIN_APPOINTMENT_DURATION} minutes`
    };
  }
  
  if (duration > MAX_APPOINTMENT_DURATION) {
    return {
      isValid: false,
      duration,
      error: `Appointment must be at most ${MAX_APPOINTMENT_DURATION} minutes`
    };
  }
  
  return {
    isValid: true,
    duration
  };
}

/**
 * Validate email format
 * Maps to FR-002: Appointment Booking
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate timezone
 * Maps to FR-001: Calendar View
 */
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Schema Export
// ============================================================================

export const schemas = {
  // Common schemas
  email: emailSchema,
  name: nameSchema,
  date: dateSchema,
  futureDate: futureDateSchema,
  duration: durationSchema,
  timezone: timezoneSchema,
  notes: notesSchema,
  
  // Domain schemas
  appointmentStatus: appointmentStatusSchema,
  appointmentId: appointmentIdSchema,
  timeRange: timeRangeSchema,
  businessHours: businessHoursSchema,
  
  // Request schemas
  createAppointment: createAppointmentRequestSchema,
  updateAppointment: updateAppointmentRequestSchema,
  calendar: calendarRequestSchema,
  availability: availabilityRequestSchema,
  user: userSchema,
  userPreferences: userPreferencesSchema,
  
  // Search and pagination schemas
  pagination: paginationSchema,
  searchParams: searchParamsSchema
};

export const validators = {
  validateAppointmentConflicts,
  validateBusinessHours,
  validateAppointmentDuration,
  validateEmail,
  validateTimezone
};
