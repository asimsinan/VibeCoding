#!/usr/bin/env node
/**
 * Jest Test Setup
 * 
 * Global setup for all tests including environment configuration,
 * database setup, and test utilities.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'appointment_scheduler_test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';

// Global test timeout
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Generate test appointment data
  generateTestAppointment: (overrides = {}) => {
    const baseAppointment = {
      startTime: '2024-12-15T10:00:00Z',
      endTime: '2024-12-15T11:00:00Z',
      userEmail: 'test.user@example.com',
      userName: 'Test User',
      notes: 'Test appointment'
    };
    
    return { ...baseAppointment, ...overrides };
  },

  // Generate test calendar parameters
  generateTestCalendarParams: (overrides = {}) => {
    const baseParams = {
      year: 2024,
      month: 12,
      timezone: 'UTC'
    };
    
    return { ...baseParams, ...overrides };
  },

  // Wait for async operations
  wait: (ms) => new Promise(resolve => {
    setTimeout(resolve, ms);
  }),

  // Validate appointment response
  validateAppointmentResponse: (appointment) => {
    const requiredFields = ['id', 'startTime', 'endTime', 'userEmail', 'userName', 'status', 'createdAt', 'updatedAt'];
    
    requiredFields.forEach(field => {
      expect(appointment[field]).toBeDefined();
    });

    // Validate ID format
    expect(appointment.id).toMatch(/^apt_[a-zA-Z0-9]+$/);

    // Validate email format
    expect(appointment.userEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // Validate status
    expect(['confirmed', 'cancelled', 'rescheduled']).toContain(appointment.status);
  },

  // Validate calendar response
  validateCalendarResponse: (calendar) => {
    expect(calendar.year).toBeDefined();
    expect(calendar.month).toBeDefined();
    expect(calendar.timezone).toBeDefined();
    expect(Array.isArray(calendar.days)).toBe(true);

    calendar.days.forEach(day => {
      expect(day.date).toBeDefined();
      expect(day.dayOfWeek).toBeDefined();
      expect(typeof day.isAvailable).toBe('boolean');
      expect(Array.isArray(day.timeSlots)).toBe(true);
    });
  },

  // Validate availability response
  validateAvailabilityResponse: (availability) => {
    expect(availability.startTime).toBeDefined();
    expect(availability.endTime).toBeDefined();
    expect(typeof availability.isAvailable).toBe('boolean');
    expect(Array.isArray(availability.conflictingAppointments)).toBe(true);
  }
};

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Console configuration for tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Suppress console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
  console.log = () => {};
  console.error = () => {};
}

// Restore console after tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});
