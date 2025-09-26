#!/usr/bin/env node
/**
 * Core Library Integration Tests
 * 
 * Integration tests for the appointment-core library:
 * - Real database integration testing
 * - End-to-end booking flow tests
 * - Performance tests (<100ms response time)
 * - Error handling and edge case tests
 * - Concurrent access and conflict resolution tests
 * 
 * Maps to TASK-011: Library Integration Tests
 * TDD Phase: Integration
 * Constitutional Compliance: Integration-First Testing Gate, Performance Gate
 */

const { appointmentCore } = require('../../src/index');
const { AppointmentStatus } = require('../../src/models');

describe('Core Library Integration Tests', () => {
  let appointmentService;
  let timeSlotService;
  let calendarService;
  let conflictService;
  let appointmentRepository;

  beforeAll(async () => {
    // Initialize the core library
    await appointmentCore.initialize({
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'appointment_scheduler_test',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        maxConnections: 10,
        minConnections: 2
      }
    });

    // Get service instances
    appointmentService = appointmentCore.getAppointmentService();
    timeSlotService = appointmentCore.getTimeSlotService();
    calendarService = appointmentCore.getCalendarService();
    conflictService = appointmentCore.getConflictService();
    appointmentRepository = appointmentCore.getAppointmentRepository();
  });

  afterAll(async () => {
    // Cleanup
    await appointmentCore.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await appointmentRepository.rawQuery('DELETE FROM appointments WHERE user_email LIKE $1', ['test%@example.com']);
  });

  describe('Appointment Service Integration', () => {
    test('should create appointment successfully', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0); // 10 AM UTC
      startTime.setDate(startTime.getDate() + 1); // Tomorrow

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0); // 11 AM UTC

      const appointmentData = {
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User',
        notes: 'Test appointment'
      };

      const start = Date.now();
      const appointment = await appointmentService.createAppointment(appointmentData);
      const duration = Date.now() - start;

      expect(appointment).toBeDefined();
      expect(appointment.id).toBeDefined();
      expect(appointment.userEmail).toBe('test@example.com');
      expect(appointment.userName).toBe('Test User');
      expect(appointment.status).toBe(AppointmentStatus.PENDING);
      expect(appointment.startTime).toEqual(startTime);
      expect(appointment.endTime).toEqual(endTime);
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should prevent double booking', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      const appointmentData = {
        startTime,
        endTime,
        userEmail: 'test1@example.com',
        userName: 'Test User 1'
      };

      // Create first appointment
      const appointment1 = await appointmentService.createAppointment(appointmentData);
      expect(appointment1).toBeDefined();

      // Try to create conflicting appointment
      const conflictingData = {
        startTime: new Date(startTime.getTime() + 30 * 60 * 1000), // 30 minutes later
        endTime: new Date(endTime.getTime() + 30 * 60 * 1000),
        userEmail: 'test2@example.com',
        userName: 'Test User 2'
      };

      await expect(appointmentService.createAppointment(conflictingData))
        .rejects.toThrow('conflicts with existing appointments');
    });

    test('should update appointment successfully', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      const appointment = await appointmentService.createAppointment({
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      const newEndTime = new Date(startTime);
      newEndTime.setUTCHours(12, 0, 0, 0);

      const start = Date.now();
      const updatedAppointment = await appointmentService.updateAppointment(appointment.id, {
        endTime: newEndTime,
        status: AppointmentStatus.CONFIRMED
      });
      const duration = Date.now() - start;

      expect(updatedAppointment.endTime).toEqual(newEndTime);
      expect(updatedAppointment.status).toBe(AppointmentStatus.CONFIRMED);
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should cancel appointment successfully', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      const appointment = await appointmentService.createAppointment({
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      const start = Date.now();
      const cancelledAppointment = await appointmentService.cancelAppointment(appointment.id);
      const duration = Date.now() - start;

      expect(cancelledAppointment.status).toBe(AppointmentStatus.CANCELLED);
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should list appointments with filters', async () => {
      // Create test appointments
      const appointments = [];
      for (let i = 0; i < 3; i++) {
        const startTime = new Date();
        startTime.setUTCHours(10 + i, 0, 0, 0);
        startTime.setDate(startTime.getDate() + 1);

        const endTime = new Date(startTime);
        endTime.setUTCHours(11 + i, 0, 0, 0);

        const appointment = await appointmentService.createAppointment({
          startTime,
          endTime,
          userEmail: 'test@example.com',
          userName: `Test User ${i}`
        });
        appointments.push(appointment);
      }

      const start = Date.now();
      const listedAppointments = await appointmentService.listAppointments({
        userEmail: 'test@example.com',
        limit: 10
      });
      const duration = Date.now() - start;

      expect(listedAppointments).toHaveLength(3);
      expect(duration).toBeLessThan(100); // Performance test
    });
  });

  describe('Time Slot Service Integration', () => {
    test('should generate time slots for a day', async () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 1);
      testDate.setUTCHours(0, 0, 0, 0);

      const start = Date.now();
      const timeSlots = await timeSlotService.generateTimeSlots(testDate, 60, 'UTC');
      const duration = Date.now() - start;

      expect(timeSlots).toBeDefined();
      expect(timeSlots.length).toBeGreaterThan(0);
      expect(timeSlots[0]).toHaveProperty('startTime');
      expect(timeSlots[0]).toHaveProperty('endTime');
      expect(timeSlots[0]).toHaveProperty('isAvailable');
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should check availability correctly', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      const start = Date.now();
      const availability = await timeSlotService.checkAvailability(startTime, endTime);
      const duration = Date.now() - start;

      expect(availability).toHaveProperty('isAvailable');
      expect(availability).toHaveProperty('conflictingAppointments');
      expect(availability).toHaveProperty('availableSlots');
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should detect conflicts in availability check', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      // Create an appointment
      await appointmentService.createAppointment({
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      // Check availability for overlapping time
      const overlappingStart = new Date(startTime.getTime() + 30 * 60 * 1000);
      const overlappingEnd = new Date(endTime.getTime() + 30 * 60 * 1000);

      const availability = await timeSlotService.checkAvailability(overlappingStart, overlappingEnd);

      expect(availability.isAvailable).toBe(false);
      expect(availability.conflictingAppointments.length).toBeGreaterThan(0);
    });
  });

  describe('Calendar Service Integration', () => {
    test('should generate calendar for a month', async () => {
      const year = 2025;
      const month = 1;

      const start = Date.now();
      const calendar = await calendarService.generateCalendar(year, month, 'UTC', 60);
      const duration = Date.now() - start;

      expect(calendar).toBeDefined();
      expect(calendar.year).toBe(year);
      expect(calendar.month).toBe(month);
      expect(calendar.days).toBeDefined();
      expect(calendar.days.length).toBeGreaterThan(0);
      expect(calendar.stats).toBeDefined();
      expect(duration).toBeLessThan(200); // Performance test
    });

    test('should get calendar summary', async () => {
      const year = 2025;
      const month = 1;

      const start = Date.now();
      const summary = await calendarService.getCalendarSummary(year, month, 'UTC');
      const duration = Date.now() - start;

      expect(summary).toBeDefined();
      expect(summary.year).toBe(year);
      expect(summary.month).toBe(month);
      expect(summary.totalDays).toBeGreaterThan(0);
      expect(summary.businessDays).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should get appointment statistics', async () => {
      // Create test appointments
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      for (let i = 0; i < 5; i++) {
        const startTime = new Date(startDate);
        startTime.setUTCHours(10 + i, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setUTCHours(11 + i, 0, 0, 0);

        await appointmentService.createAppointment({
          startTime,
          endTime,
          userEmail: 'test@example.com',
          userName: `Test User ${i}`
        });
      }

      const start = Date.now();
      const stats = await calendarService.getAppointmentStats(startDate, endDate);
      const duration = Date.now() - start;

      expect(stats).toBeDefined();
      expect(stats.totalAppointments).toBe(5);
      expect(stats.confirmedAppointments).toBeDefined();
      expect(stats.pendingAppointments).toBeDefined();
      expect(stats.cancelledAppointments).toBeDefined();
      expect(duration).toBeLessThan(100); // Performance test
    });
  });

  describe('Conflict Service Integration', () => {
    test('should detect conflicts correctly', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      // Create an appointment
      const appointment = await appointmentService.createAppointment({
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      const start = Date.now();
      const conflicts = await conflictService.checkConflicts(startTime, endTime);
      const duration = Date.now() - start;

      expect(conflicts.hasConflict).toBe(true);
      expect(conflicts.conflictingAppointments).toContain(appointment.id);
      expect(duration).toBeLessThan(100); // Performance test
    });

    test('should suggest alternative slots', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      // Create an appointment
      await appointmentService.createAppointment({
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      const start = Date.now();
      const suggestions = await conflictService.suggestAlternativeSlots(startTime, endTime, 60, 3);
      const duration = Date.now() - start;

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(duration).toBeLessThan(200); // Performance test
    });

    test('should get conflict statistics', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const start = Date.now();
      const stats = await conflictService.getConflictStats(startDate, endDate);
      const duration = Date.now() - start;

      expect(stats).toBeDefined();
      expect(stats.totalAppointments).toBeDefined();
      expect(stats.totalConflicts).toBeDefined();
      expect(stats.conflictRate).toBeDefined();
      expect(duration).toBeLessThan(100); // Performance test
    });
  });

  describe('Concurrent Access Tests', () => {
    test('should handle concurrent appointment creation', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      // Create multiple appointments concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const appointmentData = {
          startTime: new Date(startTime.getTime() + i * 60 * 60 * 1000), // 1 hour apart
          endTime: new Date(endTime.getTime() + i * 60 * 60 * 1000),
          userEmail: `test${i}@example.com`,
          userName: `Test User ${i}`
        };
        promises.push(appointmentService.createAppointment(appointmentData));
      }

      const start = Date.now();
      const appointments = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(appointments).toHaveLength(5);
      appointments.forEach(appointment => {
        expect(appointment).toBeDefined();
        expect(appointment.id).toBeDefined();
      });
      expect(duration).toBeLessThan(500); // Performance test for concurrent operations
    });

    test('should handle concurrent conflict checks', async () => {
      const startTime = new Date();
      startTime.setUTCHours(10, 0, 0, 0);
      startTime.setDate(startTime.getDate() + 1);

      const endTime = new Date(startTime);
      endTime.setUTCHours(11, 0, 0, 0);

      // Create an appointment
      await appointmentService.createAppointment({
        startTime,
        endTime,
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      // Check conflicts concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(conflictService.checkConflicts(startTime, endTime));
      }

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.hasConflict).toBe(true);
      });
      expect(duration).toBeLessThan(200); // Performance test for concurrent conflict checks
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle invalid appointment data', async () => {
      const invalidData = {
        startTime: 'invalid-date',
        endTime: new Date(),
        userEmail: 'invalid-email',
        userName: ''
      };

      await expect(appointmentService.createAppointment(invalidData))
        .rejects.toThrow();
    });

    test('should handle non-existent appointment updates', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(appointmentService.updateAppointment(nonExistentId, { status: AppointmentStatus.CONFIRMED }))
        .rejects.toThrow('not found');
    });

    test('should handle invalid time ranges', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() - 60 * 60 * 1000); // End before start

      await expect(timeSlotService.checkAvailability(startTime, endTime))
        .rejects.toThrow('Start time must be before end time');
    });

    test('should handle database connection errors gracefully', async () => {
      // Close the connection to simulate database error
      await appointmentCore.close();

      await expect(appointmentService.createAppointment({
        startTime: new Date(),
        endTime: new Date(),
        userEmail: 'test@example.com',
        userName: 'Test User'
      })).rejects.toThrow();

      // Reconnect for cleanup
      await appointmentCore.initialize();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of appointments efficiently', async () => {
      const appointments = [];
      const startTime = Date.now();

      // Create 100 appointments
      for (let i = 0; i < 100; i++) {
        const appointmentStart = new Date();
        appointmentStart.setUTCHours(9 + (i % 8), 0, 0, 0);
        appointmentStart.setDate(appointmentStart.getDate() + Math.floor(i / 8));

        const appointmentEnd = new Date(appointmentStart);
        appointmentEnd.setUTCHours(10 + (i % 8), 0, 0, 0);

        const appointment = await appointmentService.createAppointment({
          startTime: appointmentStart,
          endTime: appointmentEnd,
          userEmail: `test${i}@example.com`,
          userName: `Test User ${i}`
        });
        appointments.push(appointment);
      }

      const creationDuration = Date.now() - startTime;
      expect(creationDuration).toBeLessThan(5000); // Should create 100 appointments in under 5 seconds

      // Test listing performance
      const listStart = Date.now();
      const listedAppointments = await appointmentService.listAppointments({ limit: 100 });
      const listDuration = Date.now() - listStart;

      expect(listedAppointments.length).toBeGreaterThanOrEqual(100);
      expect(listDuration).toBeLessThan(200); // Should list 100 appointments in under 200ms
    });

    test('should handle complex calendar generation efficiently', async () => {
      const start = Date.now();
      const calendar = await calendarService.generateCalendar(2025, 1, 'UTC', 30); // 30-minute slots
      const duration = Date.now() - start;

      expect(calendar).toBeDefined();
      expect(duration).toBeLessThan(500); // Should generate calendar in under 500ms
    });
  });
});
