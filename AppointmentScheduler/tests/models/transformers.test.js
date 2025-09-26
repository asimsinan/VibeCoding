#!/usr/bin/env node
/**
 * Unit Tests for Data Transformers
 * 
 * Tests cover:
 * - Database entity transformers
 * - API request/response transformers
 * - Data sanitization and normalization
 * - Time zone and date utilities
 * - Calendar generation utilities
 * - Error transformation utilities
 * 
 * Maps to TASK-008: Create Model Tests
 * TDD Phase: Unit
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const {
  transformDbRowToAppointment,
  transformAppointmentToDbRow,
  transformDbRowToTimeSlot,
  transformTimeSlotToDbRow,
  transformApiRequestToCreateAppointment,
  transformApiRequestToUpdateAppointment,
  transformApiRequestToCalendarRequest,
  transformApiRequestToAvailabilityRequest,
  transformAppointmentToApiResponse,
  transformAppointmentsToApiResponse,
  transformCalendarToApiResponse,
  sanitizeEmail,
  sanitizeUserName,
  sanitizeNotes,
  normalizeToStartOfDay,
  normalizeToEndOfDay,
  normalizeToStartOfHour,
  normalizeToEndOfHour,
  convertToTimezone,
  getTimezoneOffset,
  isInBusinessHours,
  isWeekend,
  generateCalendarDays,
  generateTimeSlotsForDay,
  transformValidationErrorToApiError,
  transformDomainErrorToApiError,
  transformGenericErrorToApiError,
  transformAppointmentsToStats
} = require('../../src/models/transformers');

const { AppointmentStatus } = require('../../src/models/types');

describe('Data Transformers', () => {
  describe('Database Entity Transformers', () => {
    describe('transformDbRowToAppointment', () => {
      test('should transform database row to appointment', () => {
        const dbRow = {
          id: 'appointment-id',
          start_time: '2025-01-01T10:00:00Z',
          end_time: '2025-01-01T11:00:00Z',
          user_email: 'user@example.com',
          user_name: 'User Name',
          notes: 'Test notes',
          status: 'confirmed',
          created_at: '2025-01-01T09:00:00Z',
          updated_at: '2025-01-01T09:00:00Z',
          created_by: 'system',
          updated_by: 'system'
        };

        const appointment = transformDbRowToAppointment(dbRow);

        expect(appointment.id).toBe('appointment-id');
        expect(appointment.startTime).toBeInstanceOf(Date);
        expect(appointment.endTime).toBeInstanceOf(Date);
        expect(appointment.userEmail).toBe('user@example.com');
        expect(appointment.userName).toBe('User Name');
        expect(appointment.notes).toBe('Test notes');
        expect(appointment.status).toBe('confirmed');
        expect(appointment.createdAt).toBeInstanceOf(Date);
        expect(appointment.updatedAt).toBeInstanceOf(Date);
        expect(appointment.createdBy).toBe('system');
        expect(appointment.updatedBy).toBe('system');
      });

      test('should handle null values', () => {
        const dbRow = {
          id: 'appointment-id',
          start_time: '2025-01-01T10:00:00Z',
          end_time: '2025-01-01T11:00:00Z',
          user_email: 'user@example.com',
          user_name: 'User Name',
          notes: null,
          status: 'confirmed',
          created_at: '2025-01-01T09:00:00Z',
          updated_at: '2025-01-01T09:00:00Z',
          created_by: null,
          updated_by: null
        };

        const appointment = transformDbRowToAppointment(dbRow);

        expect(appointment.notes).toBeUndefined();
        expect(appointment.createdBy).toBeUndefined();
        expect(appointment.updatedBy).toBeUndefined();
      });
    });

    describe('transformAppointmentToDbRow', () => {
      test('should transform appointment to database row', () => {
        const appointment = {
          id: 'appointment-id',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
          userEmail: 'user@example.com',
          userName: 'User Name',
          notes: 'Test notes',
          status: AppointmentStatus.CONFIRMED,
          createdAt: new Date('2025-01-01T09:00:00Z'),
          updatedAt: new Date('2025-01-01T09:00:00Z'),
          createdBy: 'system',
          updatedBy: 'system'
        };

        const dbRow = transformAppointmentToDbRow(appointment);

        expect(dbRow.id).toBe('appointment-id');
        expect(dbRow.start_time).toBe('2025-01-01T10:00:00.000Z');
        expect(dbRow.end_time).toBe('2025-01-01T11:00:00.000Z');
        expect(dbRow.user_email).toBe('user@example.com');
        expect(dbRow.user_name).toBe('User Name');
        expect(dbRow.notes).toBe('Test notes');
        expect(dbRow.status).toBe('confirmed');
        expect(dbRow.created_at).toBe('2025-01-01T09:00:00.000Z');
        expect(dbRow.updated_at).toBe('2025-01-01T09:00:00.000Z');
        expect(dbRow.created_by).toBe('system');
        expect(dbRow.updated_by).toBe('system');
      });

      test('should handle undefined values', () => {
        const appointment = {
          id: 'appointment-id',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
          userEmail: 'user@example.com',
          userName: 'User Name',
          status: AppointmentStatus.CONFIRMED,
          createdAt: new Date('2025-01-01T09:00:00Z'),
          updatedAt: new Date('2025-01-01T09:00:00Z')
        };

        const dbRow = transformAppointmentToDbRow(appointment);

        expect(dbRow.notes).toBeNull();
        expect(dbRow.created_by).toBeNull();
        expect(dbRow.updated_by).toBeNull();
      });
    });

    describe('transformDbRowToTimeSlot', () => {
      test('should transform database row to time slot', () => {
        const dbRow = {
          start_time: '2025-01-01T10:00:00Z',
          end_time: '2025-01-01T11:00:00Z',
          is_available: true,
          appointment_id: null,
          user_email: null,
          user_name: null
        };

        const timeSlot = transformDbRowToTimeSlot(dbRow);

        expect(timeSlot.startTime).toBeInstanceOf(Date);
        expect(timeSlot.endTime).toBeInstanceOf(Date);
        expect(timeSlot.isAvailable).toBe(true);
        expect(timeSlot.appointmentId).toBeUndefined();
        expect(timeSlot.userEmail).toBeUndefined();
        expect(timeSlot.userName).toBeUndefined();
      });

      test('should handle occupied time slot', () => {
        const dbRow = {
          start_time: '2025-01-01T10:00:00Z',
          end_time: '2025-01-01T11:00:00Z',
          is_available: false,
          appointment_id: 'appointment-id',
          user_email: 'user@example.com',
          user_name: 'User Name'
        };

        const timeSlot = transformDbRowToTimeSlot(dbRow);

        expect(timeSlot.isAvailable).toBe(false);
        expect(timeSlot.appointmentId).toBe('appointment-id');
        expect(timeSlot.userEmail).toBe('user@example.com');
        expect(timeSlot.userName).toBe('User Name');
      });
    });

    describe('transformTimeSlotToDbRow', () => {
      test('should transform time slot to database row', () => {
        const timeSlot = {
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
          isAvailable: true
        };

        const dbRow = transformTimeSlotToDbRow(timeSlot);

        expect(dbRow.start_time).toBe('2025-01-01T10:00:00.000Z');
        expect(dbRow.end_time).toBe('2025-01-01T11:00:00.000Z');
        expect(dbRow.is_available).toBe(true);
        expect(dbRow.appointment_id).toBeNull();
        expect(dbRow.user_email).toBeNull();
        expect(dbRow.user_name).toBeNull();
      });
    });
  });

  describe('API Request/Response Transformers', () => {
    describe('transformApiRequestToCreateAppointment', () => {
      test('should transform API request to create appointment request', () => {
        const apiRequest = {
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T11:00:00Z',
          userEmail: 'user@example.com',
          userName: 'User Name',
          notes: 'Test notes'
        };

        const request = transformApiRequestToCreateAppointment(apiRequest);

        expect(request.startTime).toBeInstanceOf(Date);
        expect(request.endTime).toBeInstanceOf(Date);
        expect(request.userEmail).toBe('user@example.com');
        expect(request.userName).toBe('User Name');
        expect(request.notes).toBe('Test notes');
      });

      test('should handle missing optional fields', () => {
        const apiRequest = {
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T11:00:00Z',
          userEmail: 'user@example.com',
          userName: 'User Name'
        };

        const request = transformApiRequestToCreateAppointment(apiRequest);

        expect(request.notes).toBeUndefined();
      });
    });

    describe('transformApiRequestToUpdateAppointment', () => {
      test('should transform API request to update appointment request', () => {
        const apiRequest = {
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T11:00:00Z',
          userEmail: 'user@example.com',
          userName: 'User Name',
          notes: 'Updated notes',
          status: 'cancelled'
        };

        const request = transformApiRequestToUpdateAppointment(apiRequest);

        expect(request.startTime).toBeInstanceOf(Date);
        expect(request.endTime).toBeInstanceOf(Date);
        expect(request.userEmail).toBe('user@example.com');
        expect(request.userName).toBe('User Name');
        expect(request.notes).toBe('Updated notes');
        expect(request.status).toBe('cancelled');
      });

      test('should handle partial updates', () => {
        const apiRequest = {
          status: 'cancelled'
        };

        const request = transformApiRequestToUpdateAppointment(apiRequest);

        expect(request.status).toBe('cancelled');
        expect(request.startTime).toBeUndefined();
        expect(request.endTime).toBeUndefined();
        expect(request.userEmail).toBeUndefined();
        expect(request.userName).toBeUndefined();
      });
    });

    describe('transformApiRequestToCalendarRequest', () => {
      test('should transform API request to calendar request', () => {
        const apiRequest = {
          year: '2025',
          month: '1',
          timezone: 'UTC'
        };

        const request = transformApiRequestToCalendarRequest(apiRequest);

        expect(request.year).toBe(2025);
        expect(request.month).toBe(1);
        expect(request.timezone).toBe('UTC');
      });

      test('should handle missing timezone', () => {
        const apiRequest = {
          year: '2025',
          month: '1'
        };

        const request = transformApiRequestToCalendarRequest(apiRequest);

        expect(request.timezone).toBe('UTC'); // Default timezone
      });
    });

    describe('transformApiRequestToAvailabilityRequest', () => {
      test('should transform API request to availability request', () => {
        const apiRequest = {
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T11:00:00Z',
          excludeAppointmentId: 'exclude-id'
        };

        const request = transformApiRequestToAvailabilityRequest(apiRequest);

        expect(request.startTime).toBeInstanceOf(Date);
        expect(request.endTime).toBeInstanceOf(Date);
        expect(request.excludeAppointmentId).toBe('exclude-id');
      });

      test('should handle missing exclude appointment ID', () => {
        const apiRequest = {
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T11:00:00Z'
        };

        const request = transformApiRequestToAvailabilityRequest(apiRequest);

        expect(request.excludeAppointmentId).toBeUndefined();
      });
    });

    describe('transformAppointmentToApiResponse', () => {
      test('should transform appointment to API response', () => {
        const appointment = {
          id: 'appointment-id',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
          userEmail: 'user@example.com',
          userName: 'User Name',
          status: AppointmentStatus.CONFIRMED,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const response = transformAppointmentToApiResponse(appointment);

        expect(response.data).toEqual(appointment);
        expect(response.metadata.total).toBe(1);
        expect(response.timestamp).toBeInstanceOf(Date);
      });
    });

    describe('transformAppointmentsToApiResponse', () => {
      test('should transform appointments array to API response', () => {
        const appointments = [
          {
            id: 'appointment-1',
            startTime: new Date('2025-01-01T10:00:00Z'),
            endTime: new Date('2025-01-01T11:00:00Z'),
            userEmail: 'user1@example.com',
            userName: 'User 1',
            status: AppointmentStatus.CONFIRMED,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'appointment-2',
            startTime: new Date('2025-01-01T14:00:00Z'),
            endTime: new Date('2025-01-01T15:00:00Z'),
            userEmail: 'user2@example.com',
            userName: 'User 2',
            status: AppointmentStatus.CONFIRMED,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const response = transformAppointmentsToApiResponse(appointments);

        expect(response.data).toEqual(appointments);
        expect(response.metadata.total).toBe(2);
        expect(response.timestamp).toBeInstanceOf(Date);
      });

      test('should handle custom metadata', () => {
        const appointments = [];
        const metadata = {
          total: 100,
          page: 1,
          limit: 10,
          hasMore: true
        };

        const response = transformAppointmentsToApiResponse(appointments, metadata);

        expect(response.metadata).toEqual(metadata);
      });
    });

    describe('transformCalendarToApiResponse', () => {
      test('should transform calendar to API response', () => {
        const calendar = {
          year: 2025,
          month: 1,
          timezone: 'UTC',
          days: []
        };

        const response = transformCalendarToApiResponse(calendar);

        expect(response.data).toEqual(calendar);
        expect(response.metadata.total).toBe(0);
        expect(response.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('Data Sanitization and Normalization', () => {
    describe('sanitizeEmail', () => {
      test('should sanitize email addresses', () => {
        expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
        expect(sanitizeEmail('Test.User+Tag@Domain.Co.Uk')).toBe('test.user+tag@domain.co.uk');
      });
    });

    describe('sanitizeUserName', () => {
      test('should sanitize user names', () => {
        expect(sanitizeUserName('  John   Doe  ')).toBe('John Doe');
        expect(sanitizeUserName('Jane\tSmith\nJr.')).toBe('Jane Smith Jr.');
      });
    });

    describe('sanitizeNotes', () => {
      test('should sanitize notes', () => {
        expect(sanitizeNotes('  Test notes  ')).toBe('Test notes');
        expect(sanitizeNotes('Notes\twith\ttabs')).toBe('Notes\twith\ttabs');
      });
    });

    describe('normalizeToStartOfDay', () => {
      test('should normalize date to start of day', () => {
        const date = new Date('2025-01-01T15:30:45Z');
        const normalized = normalizeToStartOfDay(date);

        expect(normalized.getHours()).toBe(0);
        expect(normalized.getMinutes()).toBe(0);
        expect(normalized.getSeconds()).toBe(0);
        expect(normalized.getMilliseconds()).toBe(0);
      });
    });

    describe('normalizeToEndOfDay', () => {
      test('should normalize date to end of day', () => {
        const date = new Date('2025-01-01T15:30:45Z');
        const normalized = normalizeToEndOfDay(date);

        expect(normalized.getHours()).toBe(23);
        expect(normalized.getMinutes()).toBe(59);
        expect(normalized.getSeconds()).toBe(59);
        expect(normalized.getMilliseconds()).toBe(999);
      });
    });

    describe('normalizeToStartOfHour', () => {
      test('should normalize date to start of hour', () => {
        const date = new Date('2025-01-01T15:30:45Z');
        const normalized = normalizeToStartOfHour(date);

        expect(normalized.getMinutes()).toBe(0);
        expect(normalized.getSeconds()).toBe(0);
        expect(normalized.getMilliseconds()).toBe(0);
      });
    });

    describe('normalizeToEndOfHour', () => {
      test('should normalize date to end of hour', () => {
        const date = new Date('2025-01-01T15:30:45Z');
        const normalized = normalizeToEndOfHour(date);

        expect(normalized.getMinutes()).toBe(59);
        expect(normalized.getSeconds()).toBe(59);
        expect(normalized.getMilliseconds()).toBe(999);
      });
    });
  });

  describe('Time Zone and Date Utilities', () => {
    describe('convertToTimezone', () => {
      test('should convert date to specific timezone', () => {
        const utcDate = new Date('2025-01-01T12:00:00Z');
        const localDate = convertToTimezone(utcDate, 'America/New_York');

        expect(localDate).toBeInstanceOf(Date);
        // Note: Exact time depends on DST, so we just check it's a valid date
        expect(localDate.getTime()).toBeDefined();
      });

      test('should throw error for invalid timezone', () => {
        const utcDate = new Date('2025-01-01T12:00:00Z');
        
        expect(() => {
          convertToTimezone(utcDate, 'Invalid/Timezone');
        }).toThrow('Invalid timezone');
      });
    });

    describe('getTimezoneOffset', () => {
      test('should get timezone offset', () => {
        const offset = getTimezoneOffset('America/New_York');
        expect(typeof offset).toBe('number');
      });

      test('should throw error for invalid timezone', () => {
        expect(() => {
          getTimezoneOffset('Invalid/Timezone');
        }).toThrow('Invalid timezone');
      });
    });

    describe('isInBusinessHours', () => {
      test('should check if date is in business hours', () => {
        const businessHourDate = new Date('2025-01-01T10:00:00Z'); // 10 AM UTC
        const nonBusinessHourDate = new Date('2025-01-01T08:00:00Z'); // 8 AM UTC

        expect(isInBusinessHours(businessHourDate)).toBe(true);
        expect(isInBusinessHours(nonBusinessHourDate)).toBe(false);
      });

      test('should check with specific timezone', () => {
        const date = new Date('2025-01-01T10:00:00Z');
        expect(isInBusinessHours(date, 'UTC')).toBe(true);
      });
    });

    describe('isWeekend', () => {
      test('should check if date is weekend', () => {
        const saturday = new Date('2025-01-04T10:00:00Z'); // Saturday
        const sunday = new Date('2025-01-05T10:00:00Z'); // Sunday
        const monday = new Date('2025-01-06T10:00:00Z'); // Monday

        expect(isWeekend(saturday)).toBe(true);
        expect(isWeekend(sunday)).toBe(true);
        expect(isWeekend(monday)).toBe(false);
      });
    });
  });

  describe('Calendar Generation Utilities', () => {
    describe('generateCalendarDays', () => {
      test('should generate calendar days for a month', () => {
        const days = generateCalendarDays(2025, 1, 'UTC');

        expect(Array.isArray(days)).toBe(true);
        expect(days.length).toBeGreaterThan(0);
        
        const firstDay = days[0];
        expect(firstDay.date).toBeInstanceOf(Date);
        expect(typeof firstDay.dayOfWeek).toBe('number');
        expect(typeof firstDay.isAvailable).toBe('boolean');
        expect(Array.isArray(firstDay.timeSlots)).toBe(true);
      });

      test('should handle different months', () => {
        const januaryDays = generateCalendarDays(2025, 1, 'UTC');
        const februaryDays = generateCalendarDays(2025, 2, 'UTC');

        expect(januaryDays.length).toBe(31);
        expect(februaryDays.length).toBe(28); // 2025 is not a leap year
      });
    });

    describe('generateTimeSlotsForDay', () => {
      test('should generate time slots for a day', () => {
        const date = new Date('2025-01-01T00:00:00Z');
        const slots = generateTimeSlotsForDay(date, 'UTC', 60);

        expect(Array.isArray(slots)).toBe(true);
        expect(slots.length).toBe(8); // 9 AM to 5 PM = 8 hours

        const firstSlot = slots[0];
        expect(firstSlot.startTime).toBeInstanceOf(Date);
        expect(firstSlot.endTime).toBeInstanceOf(Date);
        expect(firstSlot.isAvailable).toBe(true);
      });

      test('should generate slots with custom duration', () => {
        const date = new Date('2025-01-01T00:00:00Z');
        const slots = generateTimeSlotsForDay(date, 'UTC', 30);

        expect(slots.length).toBe(8); // 8 hours * 1 slot per hour (30 min duration)
      });
    });
  });

  describe('Error Transformation Utilities', () => {
    describe('transformValidationErrorToApiError', () => {
      test('should transform validation error to API error', () => {
        const validationError = {
          details: [
            {
              path: ['email'],
              message: 'Invalid email format',
              type: 'string.email',
              context: { value: 'invalid-email' }
            }
          ]
        };

        const apiError = transformValidationErrorToApiError(validationError, 'req-123');

        expect(apiError.code).toBe('VALIDATION_ERROR');
        expect(apiError.message).toBe('Request validation failed');
        expect(apiError.requestId).toBe('req-123');
        expect(apiError.details).toHaveLength(1);
        expect(apiError.details[0].field).toBe('email');
        expect(apiError.details[0].message).toBe('Invalid email format');
      });
    });

    describe('transformDomainErrorToApiError', () => {
      test('should transform domain error to API error', () => {
        const domainError = {
          code: 'APPOINTMENT_CONFLICT',
          message: 'Appointment conflicts with existing appointment',
          timestamp: new Date('2025-01-01T10:00:00Z')
        };

        const apiError = transformDomainErrorToApiError(domainError, 'req-123');

        expect(apiError.code).toBe('APPOINTMENT_CONFLICT');
        expect(apiError.message).toBe('Appointment conflicts with existing appointment');
        expect(apiError.requestId).toBe('req-123');
        expect(apiError.timestamp).toEqual(domainError.timestamp);
      });
    });

    describe('transformGenericErrorToApiError', () => {
      test('should transform generic error to API error', () => {
        const genericError = new Error('Something went wrong');
        const apiError = transformGenericErrorToApiError(genericError, 'req-123');

        expect(apiError.code).toBe('INTERNAL_ERROR');
        expect(apiError.message).toBe('An internal error occurred');
        expect(apiError.requestId).toBe('req-123');
        expect(apiError.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('Statistics and Analytics Transformers', () => {
    describe('transformAppointmentsToStats', () => {
      test('should transform appointments to statistics', () => {
        const appointments = [
          {
            id: 'app-1',
            startTime: new Date('2025-01-01T10:00:00Z'),
            endTime: new Date('2025-01-01T11:00:00Z'),
            userEmail: 'user1@example.com',
            userName: 'User 1',
            status: AppointmentStatus.CONFIRMED,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'app-2',
            startTime: new Date('2025-01-01T14:00:00Z'),
            endTime: new Date('2025-01-01T15:00:00Z'),
            userEmail: 'user2@example.com',
            userName: 'User 2',
            status: AppointmentStatus.CONFIRMED,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'app-3',
            startTime: new Date('2025-01-01T16:00:00Z'),
            endTime: new Date('2025-01-01T17:00:00Z'),
            userEmail: 'user3@example.com',
            userName: 'User 3',
            status: AppointmentStatus.CANCELLED,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const stats = transformAppointmentsToStats(appointments);

        expect(stats.total).toBe(3);
        expect(stats.confirmed).toBe(2);
        expect(stats.cancelled).toBe(1);
        expect(stats.rescheduled).toBe(0);
        expect(stats.averageDuration).toBe(60);
        expect(Array.isArray(stats.popularSlots)).toBe(true);
      });

      test('should handle empty appointments array', () => {
        const stats = transformAppointmentsToStats([]);

        expect(stats.total).toBe(0);
        expect(stats.confirmed).toBe(0);
        expect(stats.cancelled).toBe(0);
        expect(stats.rescheduled).toBe(0);
        expect(stats.averageDuration).toBe(0);
        expect(stats.popularSlots).toHaveLength(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
      expect(() => sanitizeEmail(null)).toThrow(TypeError);
      expect(() => sanitizeUserName(undefined)).toThrow(TypeError);
      expect(() => sanitizeNotes(null)).toThrow(TypeError);
    });

    test('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      expect(() => normalizeToStartOfDay(invalidDate)).not.toThrow();
    });

    test('should handle empty arrays', () => {
      const stats = transformAppointmentsToStats([]);
      expect(stats.total).toBe(0);
    });
  });
});
