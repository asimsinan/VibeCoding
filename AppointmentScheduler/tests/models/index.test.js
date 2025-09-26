#!/usr/bin/env node
/**
 * Models Index Tests
 * 
 * Tests cover:
 * - Model exports and imports
 * - Integration between different model components
 * - Overall model functionality
 * 
 * Maps to TASK-008: Create Model Tests
 * TDD Phase: Unit
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const models = require('../../src/models');

describe('Models Index', () => {
  test('should export all required components', () => {
    // Test that all main components are exported
    expect(models.AppointmentStatus).toBeDefined();
    // Note: TypeScript interfaces are not runtime values, so we don't test them
    // expect(models.Appointment).toBeDefined();
    // expect(models.TimeSlot).toBeDefined();
    // expect(models.Calendar).toBeDefined();
    // expect(models.User).toBeDefined();
    // Note: TypeScript interfaces are not runtime values, so we don't test them
    // expect(models.CreateAppointmentRequest).toBeDefined();
    // expect(models.UpdateAppointmentRequest).toBeDefined();
    // expect(models.CalendarRequest).toBeDefined();
    // expect(models.AvailabilityRequest).toBeDefined();
    // expect(models.ApiResponse).toBeDefined();
    // expect(models.ValidationError).toBeDefined();
    // expect(models.ApiError).toBeDefined();
    // expect(models.DomainError).toBeDefined();
  });

  test('should export validation schemas', () => {
    expect(models.schemas).toBeDefined();
    expect(models.validators).toBeDefined();
    expect(models.validationSchemas).toBeDefined();
    expect(models.validationUtils).toBeDefined();
  });

  test('should export transformers', () => {
    expect(models.transformers).toBeDefined();
    expect(models.dataTransformers).toBeDefined();
  });

  test('should export error handling', () => {
    expect(models.ErrorCode).toBeDefined();
    expect(models.errorUtils).toBeDefined();
    expect(models.errorHandlers).toBeDefined();
  });

  test('should export constants', () => {
    expect(models.DEFAULT_APPOINTMENT_DURATION).toBeDefined();
    expect(models.MIN_APPOINTMENT_DURATION).toBeDefined();
    expect(models.MAX_APPOINTMENT_DURATION).toBeDefined();
    expect(models.DEFAULT_TIMEZONE).toBeDefined();
    expect(models.BUSINESS_HOURS).toBeDefined();
    expect(models.DAYS_OF_WEEK).toBeDefined();
    expect(models.MONTHS_OF_YEAR).toBeDefined();
  });

  test('should export type guards', () => {
    expect(models.isAppointment).toBeDefined();
    expect(models.isTimeSlot).toBeDefined();
    expect(models.isCalendar).toBeDefined();
    expect(models.isUser).toBeDefined();
  });

  test('should have working type guards', () => {
    const validAppointment = {
      id: 'test-id',
      startTime: new Date(),
      endTime: new Date(),
      userEmail: 'test@example.com',
      userName: 'Test User',
      status: models.AppointmentStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(models.isAppointment(validAppointment)).toBe(true);
    expect(models.isAppointment(null)).toBe(false);
  });

  test('should have working validation schemas', () => {
    const { error } = models.schemas.email.validate('test@example.com');
    expect(error).toBeUndefined();

    const { error: invalidError } = models.schemas.email.validate('invalid-email');
    expect(invalidError).toBeDefined();
  });

  test('should have working transformers', () => {
    const dbRow = {
      id: 'test-id',
      start_time: '2025-01-01T10:00:00Z',
      end_time: '2025-01-01T11:00:00Z',
      user_email: 'test@example.com',
      user_name: 'Test User',
      notes: 'Test notes',
      status: 'confirmed',
      created_at: '2025-01-01T09:00:00Z',
      updated_at: '2025-01-01T09:00:00Z',
      created_by: 'system',
      updated_by: 'system'
    };

    const appointment = models.transformers.transformDbRowToAppointment(dbRow);
    expect(appointment.id).toBe('test-id');
    expect(appointment.startTime).toBeInstanceOf(Date);
    expect(appointment.userEmail).toBe('test@example.com');
  });

  test('should have working error handling', () => {
    const error = models.errorUtils.createAppointmentConflictError('app-123', ['app-456']);
    expect(error.code).toBe('APPOINTMENT_CONFLICT');
    expect(error.message).toContain('app-456');
    expect(error.context.appointmentId).toBe('app-123');
  });

  test('should have working validators', () => {
    expect(models.validators.validateEmail('test@example.com')).toBe(true);
    expect(models.validators.validateEmail('invalid-email')).toBe(false);
    expect(models.validators.validateTimezone('UTC')).toBe(true);
    expect(models.validators.validateTimezone('Invalid/Timezone')).toBe(false);
  });
});
