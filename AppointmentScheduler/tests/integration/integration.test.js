#!/usr/bin/env node
/**
 * Integration Tests for AppointmentScheduler API
 * 
 * Jest test file that runs the integration test scenarios defined in scenarios.js.
 * These tests validate the complete API + database integration flow.
 * 
 * Maps to TASK-003: Create Integration Test Scenarios
 * TDD Phase: Integration
 */

const IntegrationTestScenarios = require('./scenarios');

describe('AppointmentScheduler Integration Tests', () => {
  let scenarios;

  beforeAll(() => {
    scenarios = new IntegrationTestScenarios();
  });

  afterAll(async () => {
    if (scenarios) {
      await scenarios.cleanup();
    }
  });

  describe('Calendar View Integration', () => {
    test('should retrieve calendar data with proper structure', async () => {
      await scenarios.scenarioCalendarViewIntegration();
    });
  });

  describe('Appointment Booking Integration', () => {
    test('should create appointments with proper validation', async () => {
      await scenarios.scenarioAppointmentBookingIntegration();
    });
  });

  describe('Appointment Management Integration', () => {
    test('should manage appointments (retrieve, update, cancel)', async () => {
      await scenarios.scenarioAppointmentManagementIntegration();
    });
  });

  describe('Time Slot Availability Integration', () => {
    test('should check time slot availability correctly', async () => {
      await scenarios.scenarioTimeSlotAvailabilityIntegration();
    });
  });

  describe('Database Connection Integration', () => {
    test('should handle database connections properly', async () => {
      await scenarios.scenarioDatabaseConnectionIntegration();
    });
  });

  describe('Performance Integration', () => {
    test('should meet performance requirements', async () => {
      await scenarios.scenarioPerformanceIntegration();
    });
  });

  describe('Complete Integration Flow', () => {
    test('should run all integration scenarios successfully', async () => {
      await scenarios.runAllScenarios();
    });
  });
});
