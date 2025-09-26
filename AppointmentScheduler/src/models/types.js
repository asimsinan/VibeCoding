#!/usr/bin/env node
/**
 * Types JavaScript Export
 * 
 * JavaScript version of the types for Node.js compatibility
 */

// Appointment Status Enum
const AppointmentStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
};

// Constants
const DEFAULT_APPOINTMENT_DURATION = 60; // minutes
const MIN_APPOINTMENT_DURATION = 15; // minutes
const MAX_APPOINTMENT_DURATION = 480; // minutes (8 hours)
const DEFAULT_TIMEZONE = 'Europe/Istanbul'; // UTC+3 (Turkey timezone)

const BUSINESS_HOURS = {
  START: 9, // 9 AM Europe/Istanbul
  END: 16   // 4 PM Europe/Istanbul
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS_OF_YEAR = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Type Guards
function isAppointment(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    obj.startTime instanceof Date &&
    obj.endTime instanceof Date &&
    typeof obj.userEmail === 'string' &&
    typeof obj.userName === 'string' &&
    typeof obj.status === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

function isTimeSlot(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    obj.startTime instanceof Date &&
    obj.endTime instanceof Date &&
    typeof obj.duration === 'number' &&
    typeof obj.available === 'boolean'
  );
}

function isCalendar(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.year === 'number' &&
    typeof obj.month === 'number' &&
    Array.isArray(obj.days)
  );
}

function isUser(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.email === 'string' &&
    typeof obj.name === 'string'
  );
}

function isCalendarDay(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.date === 'number' &&
    typeof obj.dayOfWeek === 'number' &&
    typeof obj.dayName === 'string' &&
    typeof obj.isBusinessDay === 'boolean' &&
    Array.isArray(obj.timeSlots)
  );
}

module.exports = {
  AppointmentStatus,
  DEFAULT_APPOINTMENT_DURATION,
  MIN_APPOINTMENT_DURATION,
  MAX_APPOINTMENT_DURATION,
  DEFAULT_TIMEZONE,
  BUSINESS_HOURS,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  
  // Type Guards
  isAppointment,
  isTimeSlot,
  isCalendar,
  isUser,
  isCalendarDay
};
