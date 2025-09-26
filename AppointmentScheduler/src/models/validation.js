#!/usr/bin/env node
/**
 * Validation JavaScript Export
 * 
 * JavaScript version of the validation functions for Node.js compatibility
 */

const Joi = require('joi');
const { BUSINESS_HOURS, MIN_APPOINTMENT_DURATION, MAX_APPOINTMENT_DURATION } = require('./types');

/**
 * Validate business hours (Europe/Istanbul timezone)
 */
function validateBusinessHours(date) {
  // Convert to Europe/Istanbul timezone
  const istanbulDate = new Date(date.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
  const hour = istanbulDate.getHours();
  return hour >= BUSINESS_HOURS.START && hour < BUSINESS_HOURS.END;
}

/**
 * Validate appointment duration
 */
function validateAppointmentDuration(startTime, endTime) {
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  if (duration < MIN_APPOINTMENT_DURATION) {
    return {
      isValid: false,
      error: `Appointment must be at least ${MIN_APPOINTMENT_DURATION} minutes`
    };
  }
  
  if (duration > MAX_APPOINTMENT_DURATION) {
    return {
      isValid: false,
      error: `Appointment must be at most ${MAX_APPOINTMENT_DURATION} minutes`
    };
  }
  
  return {
    isValid: true,
    duration: duration
  };
}

/**
 * Validate appointment conflicts
 */
function validateAppointmentConflicts(startTime, endTime, existingAppointments, excludeAppointmentId = null) {
  const conflicts = existingAppointments.filter(appointment => {
    if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
      return false;
    }
    
    return startTime < appointment.endTime && endTime > appointment.startTime;
  });
  
  return {
    hasConflict: conflicts.length > 0,
    conflictingAppointments: conflicts.map(app => app.id)
  };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate timezone
 */
function validateTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Joi Validation Schemas
const emailSchema = Joi.string()
  .email()
  .max(254)
  .required()
  .messages({
    'string.email': 'Invalid email format',
    'string.max': 'Email must be less than 254 characters',
    'any.required': 'Email is required'
  });

const nameSchema = Joi.string()
  .min(1)
  .max(100)
  .trim()
  .required()
  .messages({
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must be less than 100 characters',
    'any.required': 'Name is required'
  });

const dateSchema = Joi.date()
  .iso()
  .required()
  .messages({
    'date.format': 'Invalid date format',
    'any.required': 'Date is required'
  });

const futureDateSchema = Joi.date()
  .iso()
  .min('now')
  .required()
  .messages({
    'date.format': 'Invalid date format',
    'date.min': 'Date must be in the future',
    'any.required': 'Date is required'
  });

const durationSchema = Joi.number()
  .integer()
  .min(MIN_APPOINTMENT_DURATION)
  .max(MAX_APPOINTMENT_DURATION)
  .allow(null)
  .optional()
  .messages({
    'number.min': `Duration must be at least ${MIN_APPOINTMENT_DURATION} minutes`,
    'number.max': `Duration must be at most ${MAX_APPOINTMENT_DURATION} minutes`,
    'number.integer': 'Duration must be an integer'
  });

const timezoneSchema = Joi.string()
  .valid('UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai')
  .default('UTC')
  .messages({
    'any.only': 'Invalid timezone'
  });

const notesSchema = Joi.string()
  .max(500)
  .allow('', null)
  .messages({
    'string.max': 'Notes must be less than 500 characters'
  });

const appointmentStatusSchema = Joi.string()
  .valid('pending', 'confirmed', 'cancelled', 'rescheduled')
  .required()
  .messages({
    'any.only': 'Invalid appointment status',
    'any.required': 'Status is required'
  });

const appointmentIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Invalid appointment ID format',
    'any.required': 'Appointment ID is required'
  });

const timeRangeSchema = Joi.object({
  startTime: futureDateSchema,
  endTime: futureDateSchema
}).custom((value, helpers) => {
  if (value.startTime >= value.endTime) {
    return helpers.error('custom.timeRange');
  }
  return value;
}).messages({
  'custom.timeRange': 'Start time must be before end time'
});

const createAppointmentRequestSchema = Joi.object({
  startTime: futureDateSchema,
  endTime: futureDateSchema,
  userEmail: emailSchema,
  userName: nameSchema,
  notes: notesSchema,
  duration: durationSchema
}).custom((value, helpers) => {
  // Validate duration
  if (value.endTime <= value.startTime) {
    return helpers.error('custom.duration');
  }
  
  return value;
}).messages({
  'custom.duration': 'End time must be after start time'
});

const updateAppointmentRequestSchema = Joi.object({
  startTime: futureDateSchema.optional(),
  endTime: futureDateSchema.optional(),
  userEmail: emailSchema.optional(),
  userName: nameSchema.optional(),
  notes: notesSchema.optional(),
  status: appointmentStatusSchema.optional()
}).min(1)
.messages({
  'object.min': 'At least one field must be provided for update'
});

const calendarRequestSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  timezone: timezoneSchema,
  duration: durationSchema
});

const availabilityRequestSchema = Joi.object({
  startTime: futureDateSchema,
  endTime: futureDateSchema,
  duration: durationSchema,
  excludeId: appointmentIdSchema.optional()
}).custom((value, helpers) => {
  if (value.endTime <= value.startTime) {
    return helpers.error('custom.timeRange');
  }
  return value;
}).messages({
  'custom.timeRange': 'End time must be after start time'
});

module.exports = {
  // Validation functions
  validateBusinessHours,
  validateAppointmentDuration,
  validateAppointmentConflicts,
  validateEmail,
  validateTimezone,
  
  // Joi schemas
  emailSchema,
  nameSchema,
  dateSchema,
  futureDateSchema,
  durationSchema,
  timezoneSchema,
  notesSchema,
  appointmentStatusSchema,
  appointmentIdSchema,
  timeRangeSchema,
  createAppointmentRequestSchema,
  updateAppointmentRequestSchema,
  calendarRequestSchema,
  availabilityRequestSchema
};
