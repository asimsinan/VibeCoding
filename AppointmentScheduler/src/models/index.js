#!/usr/bin/env node
/**
 * Models JavaScript Export
 * 
 * JavaScript version of the models for Node.js compatibility
 */

// Re-export everything from the TypeScript models
const types = require('./types');
const validation = require('./validation');
const transformers = require('./transformers');
const errors = require('./errors');

module.exports = {
  // Types
  AppointmentStatus: types.AppointmentStatus,
  DEFAULT_APPOINTMENT_DURATION: types.DEFAULT_APPOINTMENT_DURATION,
  MIN_APPOINTMENT_DURATION: types.MIN_APPOINTMENT_DURATION,
  MAX_APPOINTMENT_DURATION: types.MAX_APPOINTMENT_DURATION,
  DEFAULT_TIMEZONE: types.DEFAULT_TIMEZONE,
  BUSINESS_HOURS: types.BUSINESS_HOURS,
  DAYS_OF_WEEK: types.DAYS_OF_WEEK,
  MONTHS_OF_YEAR: types.MONTHS_OF_YEAR,
  
  // Validation functions
  validateBusinessHours: validation.validateBusinessHours,
  validateAppointmentDuration: validation.validateAppointmentDuration,
  validateAppointmentConflicts: validation.validateAppointmentConflicts,
  validateEmail: validation.validateEmail,
  validateTimezone: validation.validateTimezone,
  
  // Transformer functions
  generateCalendarDays: transformers.generateCalendarDays,
  sanitizeEmail: transformers.sanitizeEmail,
  sanitizeUserName: transformers.sanitizeUserName,
  sanitizeNotes: transformers.sanitizeNotes,
  
  // Error handling
  ErrorCode: errors.ErrorCode,
  errorUtils: errors.errorUtils
};
