#!/usr/bin/env node
/**
 * TypeScript Type Definitions for AppointmentScheduler
 * 
 * This file contains all TypeScript interfaces and type definitions
 * for the AppointmentScheduler data models.
 * 
 * Maps to TASK-007: Create Data Models
 * TDD Phase: Contract
 * Constitutional Compliance: Anti-Abstraction Gate, Traceability Gate
 */

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Appointment Status Enum
 * Maps to FR-003: Appointment Management
 */
export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

/**
 * Time Zone Type
 * Maps to FR-001: Calendar View
 */
export type TimeZone = string;

/**
 * Email Type with validation
 * Maps to FR-002: Appointment Booking
 */
export type Email = string;

/**
 * Duration in minutes
 * Maps to FR-002: Appointment Booking
 */
export type Duration = number;

// ============================================================================
// Core Domain Models
// ============================================================================

/**
 * Appointment Entity
 * Central domain model for scheduled appointments
 * Maps to FR-002: Appointment Booking, FR-003: Appointment Management
 */
export interface Appointment {
  /** Unique identifier for the appointment */
  id: string;
  
  /** Appointment start time with timezone */
  startTime: Date;
  
  /** Appointment end time with timezone */
  endTime: Date;
  
  /** User email address */
  userEmail: Email;
  
  /** User full name */
  userName: string;
  
  /** Optional appointment notes */
  notes?: string;
  
  /** Current appointment status */
  status: AppointmentStatus;
  
  /** Timestamp when appointment was created */
  createdAt: Date;
  
  /** Timestamp when appointment was last updated */
  updatedAt: Date;
  
  /** User who created the appointment */
  createdBy?: string;
  
  /** User who last updated the appointment */
  updatedBy?: string;
}

/**
 * Time Slot Entity
 * Represents available time slots for booking
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export interface TimeSlot {
  /** Start time of the slot */
  startTime: Date;
  
  /** End time of the slot */
  endTime: Date;
  
  /** Whether the slot is available for booking */
  isAvailable: boolean;
  
  /** ID of existing appointment if slot is taken */
  appointmentId?: string;
  
  /** User email if slot is taken */
  userEmail?: Email;
  
  /** User name if slot is taken */
  userName?: string;
}

/**
 * Calendar Day Entity
 * Represents a single day in the calendar view
 * Maps to FR-001: Calendar View
 */
export interface CalendarDay {
  /** Date of the day */
  date: Date;
  
  /** Day of the week (0 = Sunday, 6 = Saturday) */
  dayOfWeek: number;
  
  /** Whether the day has any available slots */
  isAvailable: boolean;
  
  /** Available time slots for the day */
  timeSlots: TimeSlot[];
}

/**
 * Calendar Entity
 * Represents a monthly calendar view
 * Maps to FR-001: Calendar View
 */
export interface Calendar {
  /** Year of the calendar */
  year: number;
  
  /** Month of the calendar (1-12) */
  month: number;
  
  /** Days in the calendar */
  days: CalendarDay[];
  
  /** Timezone for the calendar */
  timezone: TimeZone;
}

/**
 * User Entity
 * Represents user information
 * Maps to FR-002: Appointment Booking
 */
export interface User {
  /** User email address */
  email: Email;
  
  /** User full name */
  name: string;
  
  /** User preferences */
  preferences?: UserPreferences;
}

/**
 * User Preferences
 * Maps to FR-002: Appointment Booking
 */
export interface UserPreferences {
  /** User's preferred timezone */
  timezone: TimeZone;
  
  /** Default appointment duration in minutes */
  defaultDuration: Duration;
  
  /** Notification settings */
  notificationSettings: NotificationSettings;
}

/**
 * Notification Settings
 * Maps to FR-002: Appointment Booking
 */
export interface NotificationSettings {
  /** Email notifications enabled */
  emailNotifications: boolean;
  
  /** SMS notifications enabled */
  smsNotifications: boolean;
  
  /** Reminder time in minutes before appointment */
  reminderTime: Duration;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create Appointment Request
 * Maps to FR-002: Appointment Booking
 */
export interface CreateAppointmentRequest {
  /** Appointment start time */
  startTime: Date;
  
  /** Appointment end time */
  endTime: Date;
  
  /** User email address */
  userEmail: Email;
  
  /** User full name */
  userName: string;
  
  /** Optional appointment notes */
  notes?: string;
}

/**
 * Update Appointment Request
 * Maps to FR-003: Appointment Management
 */
export interface UpdateAppointmentRequest {
  /** Appointment start time */
  startTime?: Date;
  
  /** Appointment end time */
  endTime?: Date;
  
  /** User email address */
  userEmail?: Email;
  
  /** User full name */
  userName?: string;
  
  /** Optional appointment notes */
  notes?: string;
  
  /** Appointment status */
  status?: AppointmentStatus;
}

/**
 * Calendar Request
 * Maps to FR-001: Calendar View
 */
export interface CalendarRequest {
  /** Year for the calendar */
  year: number;
  
  /** Month for the calendar (1-12) */
  month: number;
  
  /** Timezone for the calendar */
  timezone?: TimeZone;
}

/**
 * Availability Request
 * Maps to FR-004: Availability Checking
 */
export interface AvailabilityRequest {
  /** Start time for availability check */
  startTime: Date;
  
  /** End time for availability check */
  endTime: Date;
  
  /** Optional appointment ID to exclude from conflict check */
  excludeAppointmentId?: string;
}

/**
 * Standard API Response
 * Maps to FR-005: API Design
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T;
  
  /** Response metadata */
  metadata: ResponseMetadata;
  
  /** Response timestamp */
  timestamp: Date;
}

/**
 * Response Metadata
 * Maps to FR-005: API Design
 */
export interface ResponseMetadata {
  /** Total number of items (for paginated responses) */
  total?: number;
  
  /** Current page (for paginated responses) */
  page?: number;
  
  /** Items per page (for paginated responses) */
  limit?: number;
  
  /** Whether there are more pages */
  hasMore?: boolean;
}

/**
 * Availability Response
 * Maps to FR-004: Availability Checking
 */
export interface AvailabilityResponse {
  /** Whether the requested time slot is available */
  isAvailable: boolean;
  
  /** Conflicting appointments if any */
  conflictingAppointments: Appointment[];
  
  /** Available time slots near the requested time */
  availableSlots: TimeSlot[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Validation Error
 * Maps to FR-006: Error Handling
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  
  /** Error message */
  message: string;
  
  /** Error code */
  code: string;
  
  /** Value that failed validation */
  value?: any;
}

/**
 * API Error
 * Maps to FR-006: Error Handling
 */
export interface ApiError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Detailed validation errors */
  details?: ValidationError[];
  
  /** Error timestamp */
  timestamp: Date;
  
  /** Request ID for tracking */
  requestId?: string;
}

/**
 * Domain Error
 * Maps to FR-006: Error Handling
 */
export interface DomainError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Additional context */
  context?: Record<string, any>;
  
  /** Error timestamp */
  timestamp: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Time Range Utility Type
 * Maps to FR-001: Calendar View, FR-002: Appointment Booking
 */
export interface TimeRange {
  /** Start time */
  start: Date;
  
  /** End time */
  end: Date;
}

/**
 * Pagination Parameters
 * Maps to FR-005: API Design
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number;
  
  /** Items per page */
  limit: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Parameters
 * Maps to FR-003: Appointment Management
 */
export interface SearchParams {
  /** Search query */
  query?: string;
  
  /** Filter by user email */
  userEmail?: Email;
  
  /** Filter by status */
  status?: AppointmentStatus;
  
  /** Filter by date range */
  dateRange?: TimeRange;
  
  /** Pagination parameters */
  pagination: PaginationParams;
}

/**
 * Appointment Statistics
 * Maps to FR-007: Reporting
 */
export interface AppointmentStats {
  /** Total appointments */
  total: number;
  
  /** Confirmed appointments */
  confirmed: number;
  
  /** Cancelled appointments */
  cancelled: number;
  
  /** Rescheduled appointments */
  rescheduled: number;
  
  /** Average appointment duration */
  averageDuration: Duration;
  
  /** Most popular time slots */
  popularSlots: TimeSlot[];
}

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

/**
 * Branded type for Appointment ID
 * Ensures type safety for appointment identifiers
 */
export type AppointmentId = string & { readonly __brand: 'AppointmentId' };

/**
 * Branded type for User ID
 * Ensures type safety for user identifiers
 */
export type UserId = string & { readonly __brand: 'UserId' };

/**
 * Branded type for Time Slot ID
 * Ensures type safety for time slot identifiers
 */
export type TimeSlotId = string & { readonly __brand: 'TimeSlotId' };

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for Appointment
 */
export function isAppointment(obj: any): obj is Appointment {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj.id === 'string' &&
    obj.startTime instanceof Date &&
    obj.endTime instanceof Date &&
    typeof obj.userEmail === 'string' &&
    typeof obj.userName === 'string' &&
    Object.values(AppointmentStatus).includes(obj.status) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

/**
 * Type guard for TimeSlot
 */
export function isTimeSlot(obj: any): obj is TimeSlot {
  return (
    obj !== null &&
    obj !== undefined &&
    obj.startTime instanceof Date &&
    obj.endTime instanceof Date &&
    typeof obj.isAvailable === 'boolean'
  );
}

/**
 * Type guard for CalendarDay
 */
export function isCalendarDay(obj: any): obj is CalendarDay {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj.date === 'string' &&
    typeof obj.dayOfWeek === 'number' &&
    Array.isArray(obj.timeSlots) &&
    obj.timeSlots.every(isTimeSlot)
  );
}

/**
 * Type guard for Calendar
 */
export function isCalendar(obj: any): obj is Calendar {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj.year === 'number' &&
    typeof obj.month === 'number' &&
    Array.isArray(obj.days) &&
    obj.days.every(isCalendarDay) &&
    typeof obj.timezone === 'string'
  );
}

/**
 * Type guard for User
 */
export function isUser(obj: any): obj is User {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj.email === 'string' &&
    typeof obj.name === 'string'
  );
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default appointment duration in minutes
 * Maps to FR-002: Appointment Booking
 */
export const DEFAULT_APPOINTMENT_DURATION: Duration = 60;

/**
 * Minimum appointment duration in minutes
 * Maps to FR-002: Appointment Booking
 */
export const MIN_APPOINTMENT_DURATION: Duration = 15;

/**
 * Maximum appointment duration in minutes
 * Maps to FR-002: Appointment Booking
 */
export const MAX_APPOINTMENT_DURATION: Duration = 480; // 8 hours

/**
 * Default timezone
 * Maps to FR-001: Calendar View
 */
export const DEFAULT_TIMEZONE: TimeZone = 'UTC';

/**
 * Business hours (24-hour format)
 * Maps to FR-001: Calendar View
 */
export const BUSINESS_HOURS = {
  START: 9, // 9:00 AM
  END: 17   // 5:00 PM
} as const;

/**
 * Days of the week
 * Maps to FR-001: Calendar View
 */
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

/**
 * Months of the year
 * Maps to FR-001: Calendar View
 */
export const MONTHS_OF_YEAR = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;
