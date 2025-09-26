#!/usr/bin/env node
/**
 * Transformers JavaScript Export
 * 
 * JavaScript version of the transformer functions for Node.js compatibility
 */

const { DAYS_OF_WEEK } = require('./types');

/**
 * Generate calendar days for a month
 */
function generateCalendarDays(year, month) {
  const days = [];
  const lastDay = new Date(year, month, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    // Create date in local time
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isPastDate = date < today;
    
    days.push({
      date: date, // Use the Date object instead of day number
      dayOfWeek: dayOfWeek,
      dayName: DAYS_OF_WEEK[dayOfWeek],
      isPastDate: isPastDate, // Mark if this date is in the past
      timeSlots: [],
      appointments: [],
      availableSlots: 0,
      totalSlots: 0
    });
  }
  
  return days;
}

/**
 * Sanitize email
 */
function sanitizeEmail(email) {
  if (email === null || email === undefined) {
    throw new TypeError('Email cannot be null or undefined');
  }
  return email.toLowerCase().trim();
}

/**
 * Sanitize user name
 */
function sanitizeUserName(name) {
  if (name === null || name === undefined) {
    throw new TypeError('User name cannot be null or undefined');
  }
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize notes
 */
function sanitizeNotes(notes) {
  if (notes === null || notes === undefined) {
    throw new TypeError('Notes cannot be null or undefined');
  }
  return notes.trim();
}

// Database Entity Transformers
function transformDbRowToAppointment(row) {
  return {
    id: row.id,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    userEmail: row.user_email,
    userName: row.user_name,
    notes: row.notes || '',
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function transformAppointmentToDbRow(appointment) {
  return {
    id: appointment.id,
    start_time: appointment.startTime.toISOString(),
    end_time: appointment.endTime.toISOString(),
    user_email: appointment.userEmail,
    user_name: appointment.userName,
    notes: appointment.notes || null,
    status: appointment.status,
    created_at: appointment.createdAt.toISOString(),
    updated_at: appointment.updatedAt.toISOString()
  };
}

function transformDbRowToTimeSlot(row) {
  return {
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    duration: row.duration || 60,
    available: !row.appointment_id,
    appointmentId: row.appointment_id || null
  };
}

function transformTimeSlotToDbRow(timeSlot) {
  return {
    start_time: timeSlot.startTime.toISOString(),
    end_time: timeSlot.endTime.toISOString(),
    duration: timeSlot.duration || 60,
    appointment_id: timeSlot.appointmentId || null
  };
}

// API Request/Response Transformers
function transformApiRequestToCreateAppointment(request) {
  return {
    startTime: new Date(request.startTime),
    endTime: new Date(request.endTime),
    userEmail: request.userEmail,
    userName: request.userName,
    notes: request.notes || '',
    duration: request.duration || 60
  };
}

function transformApiRequestToUpdateAppointment(request) {
  const updateData = {};
  
  if (request.startTime) updateData.startTime = new Date(request.startTime);
  if (request.endTime) updateData.endTime = new Date(request.endTime);
  if (request.userEmail) updateData.userEmail = request.userEmail;
  if (request.userName) updateData.userName = request.userName;
  if (request.notes !== undefined) updateData.notes = request.notes;
  if (request.status) updateData.status = request.status;
  
  return updateData;
}

function transformApiRequestToCalendarRequest(request) {
  return {
    year: parseInt(request.year),
    month: parseInt(request.month),
    timezone: request.timezone || 'Europe/Istanbul',
    duration: parseInt(request.duration) || 60
  };
}

function transformApiRequestToAvailabilityRequest(request) {
  return {
    startTime: new Date(request.startTime),
    endTime: new Date(request.endTime),
    duration: parseInt(request.duration) || 60,
    excludeId: request.excludeId || null
  };
}

function transformAppointmentToApiResponse(appointment) {
  return {
    id: appointment.id,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    userEmail: appointment.userEmail,
    userName: appointment.userName,
    notes: appointment.notes,
    status: appointment.status,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString()
  };
}

function transformAppointmentsToApiResponse(appointments, metadata = {}) {
  return {
    data: appointments.map(transformAppointmentToApiResponse),
    meta: {
      total: appointments.length,
      ...metadata
    }
  };
}

function transformCalendarToApiResponse(calendar) {
  return {
    year: calendar.year,
    month: calendar.month,
    monthName: calendar.monthName,
    timezone: calendar.timezone,
    days: calendar.days.map(day => ({
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      dayName: day.dayName,
      isBusinessDay: day.isBusinessDay,
      timeSlots: day.timeSlots.map(slot => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        duration: slot.duration,
        available: slot.available,
        appointmentId: slot.appointmentId
      })),
      appointments: day.appointments || [],
      availableSlots: day.availableSlots || 0,
      totalSlots: day.totalSlots || 0
    })),
    stats: calendar.stats || {},
    businessHours: calendar.businessHours || {}
  };
}

// Data Sanitization and Normalization
function normalizeToStartOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0); // Use setHours instead of setUTCHours
  return normalized;
}

function normalizeToEndOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999); // Use setHours instead of setUTCHours
  return normalized;
}

function normalizeToStartOfHour(date) {
  const normalized = new Date(date);
  normalized.setMinutes(0, 0, 0); // Use setMinutes instead of setUTCMinutes
  return normalized;
}

function normalizeToEndOfHour(date) {
  const normalized = new Date(date);
  normalized.setMinutes(59, 59, 999); // Use setMinutes instead of setUTCMinutes
  return normalized;
}

// Time Zone and Date Utilities
function convertToTimezone(date, timezone) {
  try {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (target.getTime() - utc.getTime()) / (1000 * 60);
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

function isInBusinessHours(date, timezone = 'Europe/Istanbul') {
  try {
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const hour = localDate.getHours();
    return hour >= 9 && hour < 17;
  } catch (error) {
    return false;
  }
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// Calendar Generation Utilities
function generateTimeSlotsForDay(date, duration = 60) {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const slotsPerHour = 60 / duration;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let slot = 0; slot < slotsPerHour; slot++) {
      const startTime = new Date(date);
      startTime.setHours(hour, slot * duration, 0, 0); // Use setHours instead of setUTCHours
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration); // Use setMinutes instead of setUTCMinutes
      
      slots.push({
        startTime,
        endTime,
        duration,
        available: true,
        appointmentId: null
      });
    }
  }
  
  return slots;
}

// Error Transformation Utilities
function transformValidationErrorToApiError(error, requestId = null) {
  return {
    code: 'VALIDATION_ERROR',
    message: error.message || 'Validation failed',
    details: error.details || null,
    timestamp: new Date().toISOString(),
    requestId: requestId || null
  };
}

function transformDomainErrorToApiError(error, requestId = null) {
  return {
    code: error.code || 'DOMAIN_ERROR',
    message: error.message || 'Domain error occurred',
    details: error.details || null,
    timestamp: new Date().toISOString(),
    requestId: requestId || null
  };
}

function transformGenericErrorToApiError(error, requestId = null) {
  return {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
    details: error?.message || null,
    timestamp: new Date().toISOString(),
    requestId: requestId || null
  };
}

// Statistics and Analytics Transformers
function transformAppointmentsToStats(appointments) {
  const stats = {
    totalAppointments: appointments.length,
    confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
    pendingAppointments: appointments.filter(a => a.status === 'pending').length,
    cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
    rescheduledAppointments: appointments.filter(a => a.status === 'rescheduled').length,
    averageDuration: 0,
    popularTimeSlots: []
  };
  
  if (appointments.length > 0) {
    const totalDuration = appointments.reduce((sum, apt) => {
      return sum + (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60);
    }, 0);
    stats.averageDuration = totalDuration / appointments.length;
  }
  
  return stats;
}

module.exports = {
  // Data sanitization
  sanitizeEmail,
  sanitizeUserName,
  sanitizeNotes,
  
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
  
  // Date utilities
  normalizeToStartOfDay,
  normalizeToEndOfDay,
  normalizeToStartOfHour,
  normalizeToEndOfHour,
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
  
  // Statistics
  transformAppointmentsToStats
};
