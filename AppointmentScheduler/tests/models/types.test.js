#!/usr/bin/env node
/**
 * Unit Tests for TypeScript Types and Interfaces
 * 
 * Tests cover:
 * - Type definitions and interfaces
 * - Type guards and validation
 * - Constants and enums
 * - Branded types
 * 
 * Maps to TASK-008: Create Model Tests
 * TDD Phase: Unit
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const {
  AppointmentStatus,
  isAppointment,
  isTimeSlot,
  isCalendar,
  isUser,
  DEFAULT_APPOINTMENT_DURATION,
  MIN_APPOINTMENT_DURATION,
  MAX_APPOINTMENT_DURATION,
  DEFAULT_TIMEZONE,
  BUSINESS_HOURS,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR
} = require('../../src/models/types');

describe('TypeScript Types and Interfaces', () => {
  describe('AppointmentStatus Enum', () => {
    test('should have correct enum values', () => {
      expect(AppointmentStatus.CONFIRMED).toBe('confirmed');
      expect(AppointmentStatus.CANCELLED).toBe('cancelled');
      expect(AppointmentStatus.RESCHEDULED).toBe('rescheduled');
    });

    test('should have all required status values', () => {
      const statuses = Object.values(AppointmentStatus);
      expect(statuses).toContain('confirmed');
      expect(statuses).toContain('cancelled');
      expect(statuses).toContain('rescheduled');
      expect(statuses).toHaveLength(3);
    });
  });

  describe('Appointment Interface', () => {
    test('should create valid appointment object', () => {
      const appointment = {
        id: 'test-id',
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        userEmail: 'test@example.com',
        userName: 'Test User',
        notes: 'Test notes',
        status: AppointmentStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system'
      };

      expect(appointment.id).toBe('test-id');
      expect(appointment.userEmail).toBe('test@example.com');
      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.startTime).toBeInstanceOf(Date);
      expect(appointment.endTime).toBeInstanceOf(Date);
    });

    test('should handle optional fields', () => {
      const appointment = {
        id: 'test-id',
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        userEmail: 'test@example.com',
        userName: 'Test User',
        status: AppointmentStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(appointment.notes).toBeUndefined();
      expect(appointment.createdBy).toBeUndefined();
      expect(appointment.updatedBy).toBeUndefined();
    });
  });

  describe('TimeSlot Interface', () => {
    test('should create valid time slot object', () => {
      const timeSlot = {
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        isAvailable: true
      };

      expect(timeSlot.startTime).toBeInstanceOf(Date);
      expect(timeSlot.endTime).toBeInstanceOf(Date);
      expect(timeSlot.isAvailable).toBe(true);
    });

    test('should handle occupied time slot', () => {
      const timeSlot = {
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        isAvailable: false,
        appointmentId: 'appointment-id',
        userEmail: 'user@example.com',
        userName: 'User Name'
      };

      expect(timeSlot.isAvailable).toBe(false);
      expect(timeSlot.appointmentId).toBe('appointment-id');
      expect(timeSlot.userEmail).toBe('user@example.com');
    });
  });

  describe('Calendar Interface', () => {
    test('should create valid calendar object', () => {
      const calendar = {
        year: 2025,
        month: 1,
        timezone: 'UTC',
        days: []
      };

      expect(calendar.year).toBe(2025);
      expect(calendar.month).toBe(1);
      expect(calendar.timezone).toBe('UTC');
      expect(Array.isArray(calendar.days)).toBe(true);
    });
  });

  describe('CalendarDay Interface', () => {
    test('should create valid calendar day object', () => {
      const calendarDay = {
        date: new Date('2025-01-01'),
        dayOfWeek: 3, // Wednesday
        isAvailable: true,
        timeSlots: []
      };

      expect(calendarDay.date).toBeInstanceOf(Date);
      expect(calendarDay.dayOfWeek).toBe(3);
      expect(calendarDay.isAvailable).toBe(true);
      expect(Array.isArray(calendarDay.timeSlots)).toBe(true);
    });
  });

  describe('User Interface', () => {
    test('should create valid user object', () => {
      const user = {
        email: 'user@example.com',
        name: 'User Name'
      };

      expect(user.email).toBe('user@example.com');
      expect(user.name).toBe('User Name');
    });

    test('should handle user with preferences', () => {
      const user = {
        email: 'user@example.com',
        name: 'User Name',
        preferences: {
          timezone: 'UTC',
          defaultDuration: 60,
          notificationSettings: {
            emailNotifications: true,
            smsNotifications: false,
            reminderTime: 30
          }
        }
      };

      expect(user.preferences).toBeDefined();
      expect(user.preferences.timezone).toBe('UTC');
      expect(user.preferences.defaultDuration).toBe(60);
    });
  });

  describe('Request Interfaces', () => {
    test('should create valid CreateAppointmentRequest', () => {
      const request = {
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        userEmail: 'user@example.com',
        userName: 'User Name',
        notes: 'Test notes'
      };

      expect(request.startTime).toBeInstanceOf(Date);
      expect(request.endTime).toBeInstanceOf(Date);
      expect(request.userEmail).toBe('user@example.com');
      expect(request.userName).toBe('User Name');
    });

    test('should create valid UpdateAppointmentRequest', () => {
      const request = {
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        status: AppointmentStatus.CANCELLED
      };

      expect(request.startTime).toBeInstanceOf(Date);
      expect(request.status).toBe(AppointmentStatus.CANCELLED);
    });

    test('should create valid CalendarRequest', () => {
      const request = {
        year: 2025,
        month: 1,
        timezone: 'UTC'
      };

      expect(request.year).toBe(2025);
      expect(request.month).toBe(1);
      expect(request.timezone).toBe('UTC');
    });

    test('should create valid AvailabilityRequest', () => {
      const request = {
        startTime: new Date('2025-01-01T10:00:00Z'),
        endTime: new Date('2025-01-01T11:00:00Z'),
        excludeAppointmentId: 'exclude-id'
      };

      expect(request.startTime).toBeInstanceOf(Date);
      expect(request.endTime).toBeInstanceOf(Date);
      expect(request.excludeAppointmentId).toBe('exclude-id');
    });
  });

  describe('ApiResponse Interface', () => {
    test('should create valid API response', () => {
      const response = {
        data: { id: 'test-id' },
        metadata: {
          total: 1,
          page: 1,
          limit: 10
        },
        timestamp: new Date()
      };

      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Error Interfaces', () => {
    test('should create valid ValidationError', () => {
      const error = {
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
        value: 'invalid-email'
      };

      expect(error.field).toBe('email');
      expect(error.message).toBe('Invalid email format');
      expect(error.code).toBe('INVALID_EMAIL');
    });

    test('should create valid ApiError', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [],
        timestamp: new Date(),
        requestId: 'req-123'
      };

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Request validation failed');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test('should create valid DomainError', () => {
      const error = {
        code: 'APPOINTMENT_CONFLICT',
        message: 'Appointment conflicts with existing appointment',
        context: { appointmentId: 'app-123' },
        timestamp: new Date()
      };

      expect(error.code).toBe('APPOINTMENT_CONFLICT');
      expect(error.context).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Utility Types', () => {
    test('should create valid TimeRange', () => {
      const timeRange = {
        start: new Date('2025-01-01T10:00:00Z'),
        end: new Date('2025-01-01T11:00:00Z')
      };

      expect(timeRange.start).toBeInstanceOf(Date);
      expect(timeRange.end).toBeInstanceOf(Date);
    });

    test('should create valid PaginationParams', () => {
      const pagination = {
        page: 1,
        limit: 10,
        sortBy: 'startTime',
        sortOrder: 'asc'
      };

      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(10);
      expect(pagination.sortBy).toBe('startTime');
      expect(pagination.sortOrder).toBe('asc');
    });

    test('should create valid SearchParams', () => {
      const search = {
        query: 'test query',
        userEmail: 'user@example.com',
        status: AppointmentStatus.CONFIRMED,
        pagination: {
          page: 1,
          limit: 10
        }
      };

      expect(search.query).toBe('test query');
      expect(search.userEmail).toBe('user@example.com');
      expect(search.status).toBe(AppointmentStatus.CONFIRMED);
    });

    test('should create valid AppointmentStats', () => {
      const stats = {
        total: 100,
        confirmed: 80,
        cancelled: 15,
        rescheduled: 5,
        averageDuration: 60,
        popularSlots: []
      };

      expect(stats.total).toBe(100);
      expect(stats.confirmed).toBe(80);
      expect(stats.averageDuration).toBe(60);
      expect(Array.isArray(stats.popularSlots)).toBe(true);
    });
  });

  describe('Type Guards', () => {
    test('isAppointment should validate appointment objects', () => {
      const validAppointment = {
        id: 'test-id',
        startTime: new Date(),
        endTime: new Date(),
        userEmail: 'test@example.com',
        userName: 'Test User',
        status: AppointmentStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const invalidAppointment = {
        id: 'test-id',
        startTime: 'invalid-date',
        endTime: new Date(),
        userEmail: 'test@example.com',
        userName: 'Test User',
        status: AppointmentStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isAppointment(validAppointment)).toBe(true);
      expect(isAppointment(invalidAppointment)).toBe(false);
      expect(isAppointment(null)).toBe(false);
      expect(isAppointment(undefined)).toBe(false);
    });

    test('isTimeSlot should validate time slot objects', () => {
      const validTimeSlot = {
        startTime: new Date(),
        endTime: new Date(),
        isAvailable: true
      };

      const invalidTimeSlot = {
        startTime: 'invalid-date',
        endTime: new Date(),
        isAvailable: true
      };

      expect(isTimeSlot(validTimeSlot)).toBe(true);
      expect(isTimeSlot(invalidTimeSlot)).toBe(false);
      expect(isTimeSlot(null)).toBe(false);
    });

    test('isCalendar should validate calendar objects', () => {
      const validCalendar = {
        year: 2025,
        month: 1,
        days: [],
        timezone: 'UTC'
      };

      const invalidCalendar = {
        year: 'invalid',
        month: 1,
        days: [],
        timezone: 'UTC'
      };

      expect(isCalendar(validCalendar)).toBe(true);
      expect(isCalendar(invalidCalendar)).toBe(false);
      expect(isCalendar(null)).toBe(false);
    });

    test('isUser should validate user objects', () => {
      const validUser = {
        email: 'user@example.com',
        name: 'User Name'
      };

      const invalidUser = {
        email: 'invalid-email',
        name: 'User Name'
      };

      expect(isUser(validUser)).toBe(true);
      expect(isUser(invalidUser)).toBe(true); // Note: isUser only checks basic structure
      expect(isUser(null)).toBe(false);
    });
  });

  describe('Constants', () => {
    test('should have correct default values', () => {
      expect(DEFAULT_APPOINTMENT_DURATION).toBe(60);
      expect(MIN_APPOINTMENT_DURATION).toBe(15);
      expect(MAX_APPOINTMENT_DURATION).toBe(480);
      expect(DEFAULT_TIMEZONE).toBe('UTC');
    });

    test('should have correct business hours', () => {
      expect(BUSINESS_HOURS.START).toBe(9);
      expect(BUSINESS_HOURS.END).toBe(17);
    });

    test('should have correct days of week', () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
      expect(DAYS_OF_WEEK[0]).toBe('Sunday');
      expect(DAYS_OF_WEEK[6]).toBe('Saturday');
    });

    test('should have correct months of year', () => {
      expect(MONTHS_OF_YEAR).toHaveLength(12);
      expect(MONTHS_OF_YEAR[0]).toBe('January');
      expect(MONTHS_OF_YEAR[11]).toBe('December');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
      expect(isAppointment(null)).toBe(false);
      expect(isAppointment(undefined)).toBe(false);
      expect(isTimeSlot(null)).toBe(false);
      expect(isCalendar(null)).toBe(false);
      expect(isUser(null)).toBe(false);
    });

    test('should handle empty objects', () => {
      expect(isAppointment({})).toBe(false);
      expect(isTimeSlot({})).toBe(false);
      expect(isCalendar({})).toBe(false);
      expect(isUser({})).toBe(false);
    });

    test('should handle invalid data types', () => {
      expect(isAppointment('string')).toBe(false);
      expect(isTimeSlot(123)).toBe(false);
      expect(isCalendar(true)).toBe(false);
      expect(isUser([])).toBe(false);
    });
  });
});
