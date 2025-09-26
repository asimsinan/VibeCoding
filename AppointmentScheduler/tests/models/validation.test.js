#!/usr/bin/env node
/**
 * Unit Tests for Validation Schemas
 * 
 * Tests cover:
 * - Joi validation schemas
 * - Input validation logic
 * - Error handling and messages
 * - Edge cases and boundary conditions
 * 
 * Maps to TASK-008: Create Model Tests
 * TDD Phase: Unit
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const {
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
  availabilityRequestSchema,
  validateAppointmentConflicts,
  validateBusinessHours,
  validateAppointmentDuration,
  validateEmail,
  validateTimezone
} = require('../../src/models/validation');

// Helper function to create future dates for testing
function createFutureDates() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  
  // Set to 10 AM UTC (within business hours 9 AM - 5 PM)
  const futureStart = new Date(tomorrow);
  futureStart.setUTCHours(10, 0, 0, 0);
  
  const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000); // 1 hour later
  return { futureStart, futureEnd };
}

describe('Validation Schemas', () => {
  describe('Common Validation Schemas', () => {
    describe('emailSchema', () => {
      test('should validate valid email addresses', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'test+tag@example.org',
          'user123@test-domain.com'
        ];

        validEmails.forEach(email => {
          const { error } = emailSchema.validate(email);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid email addresses', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test@.com',
          'test..test@example.com',
          '',
          null,
          undefined
        ];

        invalidEmails.forEach(email => {
          const { error } = emailSchema.validate(email);
          expect(error).toBeDefined();
        });
      });

      test('should reject emails that are too long', () => {
        const longEmail = `${'a'.repeat(250)  }@example.com`;
        const { error } = emailSchema.validate(longEmail);
        expect(error).toBeDefined();
        // Joi validates email format before length, so we get format error first
        expect(error.details[0].message).toContain('Invalid email format');
      });
    });

    describe('nameSchema', () => {
      test('should validate valid names', () => {
        const validNames = [
          'John Doe',
          'Jane Smith',
          'A',
          'Dr. John Smith Jr.',
          'Mary-Jane Watson'
        ];

        validNames.forEach(name => {
          const { error } = nameSchema.validate(name);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid names', () => {
        const invalidNames = [
          '',
          '   ',
          null,
          undefined,
          'a'.repeat(101) // Too long
        ];

        invalidNames.forEach(name => {
          const { error } = nameSchema.validate(name);
          expect(error).toBeDefined();
        });
      });

      test('should trim whitespace', () => {
        const { value } = nameSchema.validate('  John Doe  ');
        expect(value).toBe('John Doe');
      });
    });

    describe('dateSchema', () => {
      test('should validate valid dates', () => {
        const validDates = [
          new Date(),
          '2025-01-01T10:00:00Z',
          '2025-12-31T23:59:59Z'
        ];

        validDates.forEach(date => {
          const { error } = dateSchema.validate(date);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid dates', () => {
        const invalidDates = [
          'invalid-date',
          '2025-13-01', // Invalid month
          '2025-01-32', // Invalid day
          null,
          undefined
        ];

        invalidDates.forEach(date => {
          const { error } = dateSchema.validate(date);
          expect(error).toBeDefined();
        });
      });
    });

    describe('futureDateSchema', () => {
      test('should validate future dates', () => {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 1);

        const { error } = futureDateSchema.validate(futureDate);
        expect(error).toBeUndefined();
      });

      test('should reject past dates', () => {
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 1);

        const { error } = futureDateSchema.validate(pastDate);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('future');
      });
    });

    describe('durationSchema', () => {
      test('should validate valid durations', () => {
        const validDurations = [15, 30, 60, 120, 240, 480];

        validDurations.forEach(duration => {
          const { error } = durationSchema.validate(duration);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid durations', () => {
        const invalidDurations = [
          10, // Too short
          500, // Too long
          -10, // Negative
          15.5, // Not integer
          null
        ];

        invalidDurations.forEach(duration => {
          const { error } = durationSchema.validate(duration);
          expect(error).toBeDefined();
        });
      });

      test('should handle undefined duration', () => {
        const { value, error } = durationSchema.validate(undefined);
        expect(error).toBeUndefined();
        expect(value).toBeUndefined();
      });

      test('should convert string numbers to numbers', () => {
        const { value, error } = durationSchema.validate('60');
        expect(error).toBeUndefined();
        expect(value).toBe(60);
      });
    });

    describe('timezoneSchema', () => {
      test('should validate valid timezones', () => {
        const validTimezones = [
          'UTC',
          'America/New_York',
          'Europe/London',
          'Asia/Tokyo'
        ];

        validTimezones.forEach(timezone => {
          const { error } = timezoneSchema.validate(timezone);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid timezones', () => {
        const invalidTimezones = [
          'Invalid/Timezone',
          'EST',
          'GMT+5'
        ];

        invalidTimezones.forEach(timezone => {
          const { error } = timezoneSchema.validate(timezone);
          expect(error).toBeDefined();
        });
      });

      test('should default undefined to UTC', () => {
        const { value: undefinedValue, error: undefinedError } = timezoneSchema.validate(undefined);
        expect(undefinedError).toBeUndefined();
        expect(undefinedValue).toBe('UTC');
      });

      test('should reject null timezone', () => {
        const { error: nullError } = timezoneSchema.validate(null);
        expect(nullError).toBeDefined();
        expect(nullError.details[0].message).toContain('Invalid timezone');
      });

      test('should default to UTC', () => {
        const { value } = timezoneSchema.validate(undefined);
        expect(value).toBe('UTC');
      });
    });

    describe('notesSchema', () => {
      test('should validate valid notes', () => {
        const validNotes = [
          'Regular appointment',
          '',
          'Follow-up consultation',
          'a'.repeat(500) // Max length
        ];

        validNotes.forEach(notes => {
          const { error } = notesSchema.validate(notes);
          expect(error).toBeUndefined();
        });
      });

      test('should reject notes that are too long', () => {
        const longNotes = 'a'.repeat(501);
        const { error } = notesSchema.validate(longNotes);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('less than 500 characters');
      });
    });
  });

  describe('Domain Validation Schemas', () => {
    describe('appointmentStatusSchema', () => {
      test('should validate valid statuses', () => {
        const validStatuses = ['confirmed', 'cancelled', 'rescheduled'];

        validStatuses.forEach(status => {
          const { error } = appointmentStatusSchema.validate(status);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid statuses', () => {
        const invalidStatuses = [
          'pending',
          'active',
          'completed',
          null,
          undefined
        ];

        invalidStatuses.forEach(status => {
          const { error } = appointmentStatusSchema.validate(status);
          expect(error).toBeDefined();
        });
      });
    });

    describe('appointmentIdSchema', () => {
      test('should validate valid UUIDs', () => {
        const validIds = [
          '123e4567-e89b-12d3-a456-426614174000',
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
        ];

        validIds.forEach(id => {
          const { error } = appointmentIdSchema.validate(id);
          expect(error).toBeUndefined();
        });
      });

      test('should reject invalid IDs', () => {
        const invalidIds = [
          'invalid-id',
          '123',
          'not-a-uuid',
          null,
          undefined
        ];

        invalidIds.forEach(id => {
          const { error } = appointmentIdSchema.validate(id);
          expect(error).toBeDefined();
        });
      });
    });

    describe('timeRangeSchema', () => {
      test('should validate valid time ranges', () => {
        const { futureStart, futureEnd } = createFutureDates();
        
        const validRange = {
          start: futureStart,
          end: futureEnd
        };

        const { error } = timeRangeSchema.validate(validRange);
        expect(error).toBeUndefined();
      });

      test('should reject invalid time ranges', () => {
        const { futureStart } = createFutureDates();
        const invalidRange = {
          start: futureStart,
          end: new Date(futureStart.getTime() - 60 * 60 * 1000) // End before start
        };

        const { error } = timeRangeSchema.validate(invalidRange);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('before end time');
      });
    });
  });

  describe('Request Validation Schemas', () => {
    describe('createAppointmentRequestSchema', () => {
      test('should validate valid appointment requests', () => {
        const { futureStart, futureEnd } = createFutureDates();
        
        const validRequest = {
          startTime: futureStart,
          endTime: futureEnd,
          userEmail: 'user@example.com',
          userName: 'User Name',
          notes: 'Test appointment'
        };

        const { error } = createAppointmentRequestSchema.validate(validRequest);
        expect(error).toBeUndefined();
      });

      test('should reject requests with invalid time range', () => {
        const { futureStart } = createFutureDates();
        const invalidRequest = {
          startTime: futureStart,
          endTime: new Date(futureStart.getTime() - 60 * 60 * 1000),
          userEmail: 'user@example.com',
          userName: 'User Name'
        };

        const { error } = createAppointmentRequestSchema.validate(invalidRequest);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('End time must be after start time');
      });

      test('should reject requests with invalid duration', () => {
        const { futureStart } = createFutureDates();
        const invalidRequest = {
          startTime: futureStart,
          endTime: new Date(futureStart.getTime() + 5 * 60 * 1000), // Too short (5 minutes)
          userEmail: 'user@example.com',
          userName: 'User Name'
        };

        const { error } = createAppointmentRequestSchema.validate(invalidRequest);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('at least 15 minutes');
      });

      test('should reject requests outside business hours', () => {
        const { futureStart } = createFutureDates();
        const invalidStartTime = new Date(futureStart);
        invalidStartTime.setUTCHours(8, 0, 0, 0); // Before 9 AM
        const invalidRequest = {
          startTime: invalidStartTime,
          endTime: new Date(invalidStartTime.getTime() + 60 * 60 * 1000),
          userEmail: 'user@example.com',
          userName: 'User Name'
        };

        const { error } = createAppointmentRequestSchema.validate(invalidRequest);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('business hours');
      });
    });

    describe('updateAppointmentRequestSchema', () => {
      test('should validate valid update requests', () => {
        const { futureStart, futureEnd } = createFutureDates();
        
        const validRequest = {
          startTime: futureStart,
          endTime: futureEnd,
          status: 'cancelled'
        };

        const { error } = updateAppointmentRequestSchema.validate(validRequest);
        expect(error).toBeUndefined();
      });

      test('should allow partial updates', () => {
        const partialRequest = {
          status: 'cancelled'
        };

        const { error } = updateAppointmentRequestSchema.validate(partialRequest);
        expect(error).toBeUndefined();
      });
    });

    describe('calendarRequestSchema', () => {
      test('should validate valid calendar requests', () => {
        const validRequest = {
          year: 2025,
          month: 1,
          timezone: 'UTC'
        };

        const { error } = calendarRequestSchema.validate(validRequest);
        expect(error).toBeUndefined();
      });

      test('should reject invalid years', () => {
        const invalidRequest = {
          year: 2019, // Too old
          month: 1
        };

        const { error } = calendarRequestSchema.validate(invalidRequest);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('at least 2020');
      });

      test('should reject invalid months', () => {
        const invalidRequest = {
          year: 2025,
          month: 13 // Invalid month
        };

        const { error } = calendarRequestSchema.validate(invalidRequest);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('at most 12');
      });
    });

    describe('availabilityRequestSchema', () => {
      test('should validate valid availability requests', () => {
        const { futureStart, futureEnd } = createFutureDates();
        
        const validRequest = {
          startTime: futureStart,
          endTime: futureEnd,
          excludeAppointmentId: '123e4567-e89b-12d3-a456-426614174000'
        };

        const { error } = availabilityRequestSchema.validate(validRequest);
        expect(error).toBeUndefined();
      });

      test('should reject requests with invalid time range', () => {
        const { futureStart } = createFutureDates();
        const invalidRequest = {
          startTime: futureStart,
          endTime: new Date(futureStart.getTime() - 60 * 60 * 1000)
        };

        const { error } = availabilityRequestSchema.validate(invalidRequest);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('End time must be after start time');
      });
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateAppointmentConflicts', () => {
      test('should detect conflicts', () => {
        const startTime = new Date('2025-01-01T10:00:00Z');
        const endTime = new Date('2025-01-01T11:00:00Z');
        const existingAppointments = [
          {
            startTime: new Date('2025-01-01T10:30:00Z'),
            endTime: new Date('2025-01-01T11:30:00Z'),
            id: 'appointment-1'
          }
        ];

        const result = validateAppointmentConflicts(startTime, endTime, existingAppointments);
        expect(result.hasConflict).toBe(true);
        expect(result.conflictingAppointments).toContain('appointment-1');
      });

      test('should not detect conflicts when excluding appointment', () => {
        const startTime = new Date('2025-01-01T10:00:00Z');
        const endTime = new Date('2025-01-01T11:00:00Z');
        const existingAppointments = [
          {
            startTime: new Date('2025-01-01T10:30:00Z'),
            endTime: new Date('2025-01-01T11:30:00Z'),
            id: 'appointment-1'
          }
        ];

        const result = validateAppointmentConflicts(startTime, endTime, existingAppointments, 'appointment-1');
        expect(result.hasConflict).toBe(false);
        expect(result.conflictingAppointments).toHaveLength(0);
      });

      test('should not detect conflicts for non-overlapping appointments', () => {
        const startTime = new Date('2025-01-01T10:00:00Z');
        const endTime = new Date('2025-01-01T11:00:00Z');
        const existingAppointments = [
          {
            startTime: new Date('2025-01-01T12:00:00Z'),
            endTime: new Date('2025-01-01T13:00:00Z'),
            id: 'appointment-1'
          }
        ];

        const result = validateAppointmentConflicts(startTime, endTime, existingAppointments);
        expect(result.hasConflict).toBe(false);
        expect(result.conflictingAppointments).toHaveLength(0);
      });
    });

    describe('validateBusinessHours', () => {
      test('should validate business hours', () => {
        const businessHourDate = new Date('2025-01-01T10:00:00Z'); // 10 AM
        expect(validateBusinessHours(businessHourDate)).toBe(true);
      });

      test('should reject non-business hours', () => {
        const { futureStart } = createFutureDates();
        const nonBusinessHourDate = new Date(futureStart);
        nonBusinessHourDate.setUTCHours(8, 0, 0, 0); // 8 AM
        expect(validateBusinessHours(nonBusinessHourDate)).toBe(false);
      });
    });

    describe('validateAppointmentDuration', () => {
      test('should validate valid duration', () => {
        const startTime = new Date('2025-01-01T10:00:00Z');
        const endTime = new Date('2025-01-01T11:00:00Z'); // 60 minutes

        const result = validateAppointmentDuration(startTime, endTime);
        expect(result.isValid).toBe(true);
        expect(result.duration).toBe(60);
      });

      test('should reject too short duration', () => {
        const startTime = new Date('2025-01-01T10:00:00Z');
        const endTime = new Date('2025-01-01T10:10:00Z'); // 10 minutes

        const result = validateAppointmentDuration(startTime, endTime);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('at least 15 minutes');
      });

      test('should reject too long duration', () => {
        const { futureStart } = createFutureDates();
        const startTime = futureStart;
        const endTime = new Date(startTime.getTime() + 481 * 60 * 1000); // 481 minutes (over 8 hours)

        const result = validateAppointmentDuration(startTime, endTime);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('at most 480 minutes');
      });
    });

    describe('validateEmail', () => {
      test('should validate valid emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'test+tag@example.org'
        ];

        validEmails.forEach(email => {
          expect(validateEmail(email)).toBe(true);
        });
      });

      test('should reject invalid emails', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@',
          'test@.com'
        ];

        invalidEmails.forEach(email => {
          expect(validateEmail(email)).toBe(false);
        });
      });
    });

    describe('validateTimezone', () => {
      test('should validate valid timezones', () => {
        const validTimezones = [
          'UTC',
          'America/New_York',
          'Europe/London',
          'Asia/Tokyo'
        ];

        validTimezones.forEach(timezone => {
          expect(validateTimezone(timezone)).toBe(true);
        });
      });

      test('should reject invalid timezones', () => {
        const invalidTimezones = [
          'Invalid/Timezone',
          'NotAReal/Timezone',
          'Invalid123'
        ];

        invalidTimezones.forEach(timezone => {
          expect(validateTimezone(timezone)).toBe(false);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
      const schemasToTest = [
        emailSchema,
        nameSchema,
        dateSchema,
        durationSchema,
        timezoneSchema,
        notesSchema
      ];

      schemasToTest.forEach(schema => {
        const { error: nullError } = schema.validate(null);
        const { error: undefinedError } = schema.validate(undefined);
        
        // Most schemas should reject null/undefined
        expect(nullError || undefinedError).toBeDefined();
      });
    });

    test('should handle empty strings', () => {
      const { error: emailError } = emailSchema.validate('');
      const { error: nameError } = nameSchema.validate('');
      const { error: notesError } = notesSchema.validate('');

      expect(emailError).toBeDefined();
      expect(nameError).toBeDefined();
      expect(notesError).toBeUndefined(); // Notes can be empty
    });

    test('should handle boundary values', () => {
      // Test minimum values
      const { error: minDurationError } = durationSchema.validate(15);
      expect(minDurationError).toBeUndefined();

      // Test maximum values
      const { error: maxDurationError } = durationSchema.validate(480);
      expect(maxDurationError).toBeUndefined();

      // Test just over maximum
      const { error: overMaxError } = durationSchema.validate(481);
      expect(overMaxError).toBeDefined();
    });
  });
});
