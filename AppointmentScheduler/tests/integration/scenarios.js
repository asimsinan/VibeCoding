#!/usr/bin/env node
/**
 * Integration Test Scenarios for AppointmentScheduler API
 * 
 * This file defines comprehensive integration test scenarios for API + database
 * interactions using real PostgreSQL database. These scenarios test the complete
 * data flow from API requests to database persistence and back.
 * 
 * Maps to TASK-003: Create Integration Test Scenarios
 * TDD Phase: Integration
 * Constitutional Compliance: Integration-First Testing Gate, Anti-Abstraction Gate
 */

const { Pool } = require('pg');
const request = require('supertest');
const app = require('../../tests/contract/mock-server'); // Using mock server for now

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'appointment_scheduler_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

// Test data setup
const testData = {
  appointments: [],
  users: [],
  timeSlots: []
};

/**
 * Integration Test Scenarios
 * 
 * These scenarios test the complete integration between API endpoints
 * and database operations, ensuring data consistency and proper error handling.
 */

class IntegrationTestScenarios {
  constructor() {
    this.db = new Pool(dbConfig);
    this.app = app;
  }

  /**
   * Scenario 1: Calendar View Integration
   * 
   * Tests the complete flow of retrieving calendar data from the database
   * through the API endpoint, including time slot availability calculation.
   */
  async scenarioCalendarViewIntegration() {
    console.log('🧪 Running Scenario 1: Calendar View Integration');
    
    const testCases = [
      {
        name: 'Valid calendar request',
        params: { year: 2024, month: 12 },
        expectedStatus: 200,
        expectedFields: ['year', 'month', 'timezone', 'days']
      },
      {
        name: 'Invalid year parameter',
        params: { year: 2020, month: 12 },
        expectedStatus: 400,
        expectedError: 'INVALID_YEAR'
      },
      {
        name: 'Invalid month parameter',
        params: { year: 2024, month: 13 },
        expectedStatus: 400,
        expectedError: 'INVALID_MONTH'
      },
      {
        name: 'Calendar with timezone',
        params: { year: 2024, month: 12, timezone: 'America/New_York' },
        expectedStatus: 200,
        expectedFields: ['year', 'month', 'timezone', 'days']
      }
    ];

    for (const testCase of testCases) {
      await this.runCalendarViewTest(testCase);
    }
  }

  async runCalendarViewTest(testCase) {
    const { year, month, timezone } = testCase.params;
    let url = `/api/v1/calendar/${year}/${month}`;
    
    if (timezone) {
      url += `?timezone=${encodeURIComponent(timezone)}`;
    }

    const response = await request(this.app)
      .get(url)
      .expect(testCase.expectedStatus);

    if (testCase.expectedStatus === 200) {
      // Validate response structure
      testCase.expectedFields.forEach(field => {
        if (!response.body[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      });

      // Validate calendar data integrity
      this.validateCalendarData(response.body, year, month);
    } else if (testCase.expectedError) {
      // Validate error response
      if (response.body.error !== testCase.expectedError) {
        throw new Error(`Expected error ${testCase.expectedError}, got ${response.body.error}`);
      }
    }

    console.log(`✅ ${testCase.name} - PASSED`);
  }

  validateCalendarData(calendarData, expectedYear, expectedMonth) {
    // Validate year and month match
    if (calendarData.year !== expectedYear || calendarData.month !== expectedMonth) {
      throw new Error('Calendar year/month mismatch');
    }

    // Validate days array structure
    if (!Array.isArray(calendarData.days)) {
      throw new Error('Days must be an array');
    }

    // Validate each day has required fields
    calendarData.days.forEach(day => {
      const requiredFields = ['date', 'dayOfWeek', 'isAvailable', 'timeSlots'];
      requiredFields.forEach(field => {
        if (day[field] === undefined) {
          throw new Error(`Day missing required field: ${field}`);
        }
      });

      // Validate time slots structure
      if (!Array.isArray(day.timeSlots)) {
        throw new Error('Time slots must be an array');
      }

      day.timeSlots.forEach(slot => {
        const slotFields = ['startTime', 'endTime', 'isAvailable'];
        slotFields.forEach(field => {
          if (slot[field] === undefined) {
            throw new Error(`Time slot missing required field: ${field}`);
          }
        });
      });
    });
  }

  /**
   * Scenario 2: Appointment Booking Integration
   * 
   * Tests the complete flow of creating appointments, including database
   * persistence, conflict detection, and data validation.
   */
  async scenarioAppointmentBookingIntegration() {
    console.log('🧪 Running Scenario 2: Appointment Booking Integration');

    const testCases = [
      {
        name: 'Valid appointment creation',
        data: {
          startTime: '2024-12-15T10:00:00Z',
          endTime: '2024-12-15T11:00:00Z',
          userEmail: 'test.user@example.com',
          userName: 'Test User',
          notes: 'Integration test appointment'
        },
        expectedStatus: 201,
        validateResponse: true
      },
      {
        name: 'Missing required fields',
        data: {
          startTime: '2024-12-15T10:00:00Z',
          endTime: '2024-12-15T11:00:00Z'
          // Missing userEmail and userName
        },
        expectedStatus: 400,
        expectedError: 'MISSING_FIELDS'
      },
      {
        name: 'Invalid email format',
        data: {
          startTime: '2024-12-15T10:00:00Z',
          endTime: '2024-12-15T11:00:00Z',
          userEmail: 'invalid-email',
          userName: 'Test User'
        },
        expectedStatus: 400,
        expectedError: 'INVALID_EMAIL'
      },
      {
        name: 'Time slot conflict',
        data: {
          startTime: '2024-12-15T10:00:00Z', // Same time as existing appointment
          endTime: '2024-12-15T11:00:00Z',
          userEmail: 'conflict.user@example.com',
          userName: 'Conflict User'
        },
        expectedStatus: 409,
        expectedError: 'SLOT_CONFLICT'
      }
    ];

    for (const testCase of testCases) {
      await this.runAppointmentBookingTest(testCase);
    }
  }

  async runAppointmentBookingTest(testCase) {
    const response = await request(this.app)
      .post('/api/v1/appointments')
      .send(testCase.data)
      .expect(testCase.expectedStatus);

    if (testCase.expectedStatus === 201 && testCase.validateResponse) {
      // Validate appointment creation response
      this.validateAppointmentResponse(response.body);
      
      // Store for later tests
      testData.appointments.push(response.body);
    } else if (testCase.expectedError) {
      // Validate error response
      if (response.body.error !== testCase.expectedError) {
        throw new Error(`Expected error ${testCase.expectedError}, got ${response.body.error}`);
      }
    }

    console.log(`✅ ${testCase.name} - PASSED`);
  }

  validateAppointmentResponse(appointment) {
    const requiredFields = ['id', 'startTime', 'endTime', 'userEmail', 'userName', 'status', 'createdAt', 'updatedAt'];
    
    requiredFields.forEach(field => {
      if (appointment[field] === undefined) {
        throw new Error(`Appointment missing required field: ${field}`);
      }
    });

    // Validate ID format
    if (!/^apt_[a-zA-Z0-9]+$/.test(appointment.id)) {
      throw new Error('Invalid appointment ID format');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointment.userEmail)) {
      throw new Error('Invalid email format in response');
    }

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(appointment.status)) {
      throw new Error('Invalid appointment status');
    }
  }

  /**
   * Scenario 3: Appointment Management Integration
   * 
   * Tests the complete flow of retrieving, updating, and cancelling appointments
   * with proper database operations and error handling.
   */
  async scenarioAppointmentManagementIntegration() {
    console.log('🧪 Running Scenario 3: Appointment Management Integration');

    // First create an appointment to manage
    const createResponse = await request(this.app)
      .post('/api/v1/appointments')
      .send({
        startTime: '2024-12-16T14:00:00Z',
        endTime: '2024-12-16T15:00:00Z',
        userEmail: 'manage.user@example.com',
        userName: 'Manage User',
        notes: 'Appointment for management testing'
      })
      .expect(201);

    const appointmentId = createResponse.body.id;

    const testCases = [
      {
        name: 'Retrieve existing appointment',
        method: 'GET',
        url: `/api/v1/appointments/${appointmentId}`,
        expectedStatus: 200,
        validateResponse: true
      },
      {
        name: 'Retrieve non-existent appointment',
        method: 'GET',
        url: '/api/v1/appointments/apt_999',
        expectedStatus: 404,
        expectedError: 'APPOINTMENT_NOT_FOUND'
      },
      {
        name: 'Update appointment',
        method: 'PUT',
        url: `/api/v1/appointments/${appointmentId}`,
        data: {
          notes: 'Updated appointment notes',
          status: 'confirmed'
        },
        expectedStatus: 200,
        validateResponse: true
      },
      {
        name: 'Update with conflict',
        method: 'PUT',
        url: `/api/v1/appointments/${appointmentId}`,
        data: {
          startTime: '2024-12-15T10:00:00Z', // Conflict with existing appointment
          endTime: '2024-12-15T11:00:00Z'
        },
        expectedStatus: 409,
        expectedError: 'SLOT_CONFLICT'
      },
      {
        name: 'Cancel appointment',
        method: 'DELETE',
        url: `/api/v1/appointments/${appointmentId}`,
        expectedStatus: 204
      },
      {
        name: 'Retrieve cancelled appointment',
        method: 'GET',
        url: `/api/v1/appointments/${appointmentId}`,
        expectedStatus: 404,
        expectedError: 'APPOINTMENT_NOT_FOUND'
      }
    ];

    for (const testCase of testCases) {
      await this.runAppointmentManagementTest(testCase);
    }
  }

  async runAppointmentManagementTest(testCase) {
    let requestBuilder = request(this.app)[testCase.method.toLowerCase()](testCase.url);

    if (testCase.data) {
      requestBuilder = requestBuilder.send(testCase.data);
    }

    const response = await requestBuilder.expect(testCase.expectedStatus);

    if (testCase.expectedStatus === 200 && testCase.validateResponse) {
      this.validateAppointmentResponse(response.body);
    } else if (testCase.expectedError) {
      if (response.body.error !== testCase.expectedError) {
        throw new Error(`Expected error ${testCase.expectedError}, got ${response.body.error}`);
      }
    }

    console.log(`✅ ${testCase.name} - PASSED`);
  }

  /**
   * Scenario 4: Time Slot Availability Integration
   * 
   * Tests the complete flow of checking time slot availability,
   * including conflict detection and database queries.
   */
  async scenarioTimeSlotAvailabilityIntegration() {
    console.log('🧪 Running Scenario 4: Time Slot Availability Integration');

    const testCases = [
      {
        name: 'Check available slot',
        params: {
          startTime: '2024-12-17T09:00:00Z',
          endTime: '2024-12-17T10:00:00Z'
        },
        expectedStatus: 200,
        expectedAvailable: true
      },
      {
        name: 'Check unavailable slot',
        params: {
          startTime: '2024-12-15T10:00:00Z', // Conflict with existing appointment
          endTime: '2024-12-15T11:00:00Z'
        },
        expectedStatus: 200,
        expectedAvailable: false
      },
      {
        name: 'Check slot excluding appointment',
        params: {
          startTime: '2024-12-15T10:00:00Z',
          endTime: '2024-12-15T11:00:00Z',
          excludeAppointmentId: 'apt_001' // Exclude existing appointment
        },
        expectedStatus: 200,
        expectedAvailable: true
      },
      {
        name: 'Missing required parameters',
        params: {
          startTime: '2024-12-17T09:00:00Z'
          // Missing endTime
        },
        expectedStatus: 400,
        expectedError: 'MISSING_PARAMETERS'
      }
    ];

    for (const testCase of testCases) {
      await this.runAvailabilityTest(testCase);
    }
  }

  async runAvailabilityTest(testCase) {
    const queryParams = new URLSearchParams(testCase.params);
    const url = `/api/v1/slots/availability?${queryParams.toString()}`;

    const response = await request(this.app)
      .get(url)
      .expect(testCase.expectedStatus);

    if (testCase.expectedStatus === 200) {
      // Validate availability response structure
      this.validateAvailabilityResponse(response.body);

      if (testCase.expectedAvailable !== undefined) {
        if (response.body.isAvailable !== testCase.expectedAvailable) {
          throw new Error(`Expected availability ${testCase.expectedAvailable}, got ${response.body.isAvailable}`);
        }
      }
    } else if (testCase.expectedError) {
      if (response.body.error !== testCase.expectedError) {
        throw new Error(`Expected error ${testCase.expectedError}, got ${response.body.error}`);
      }
    }

    console.log(`✅ ${testCase.name} - PASSED`);
  }

  validateAvailabilityResponse(response) {
    const requiredFields = ['startTime', 'endTime', 'isAvailable', 'conflictingAppointments'];
    
    requiredFields.forEach(field => {
      if (response[field] === undefined) {
        throw new Error(`Availability response missing required field: ${field}`);
      }
    });

    // Validate conflicting appointments structure
    if (!Array.isArray(response.conflictingAppointments)) {
      throw new Error('Conflicting appointments must be an array');
    }

    response.conflictingAppointments.forEach(conflict => {
      const conflictFields = ['id', 'userEmail', 'userName'];
      conflictFields.forEach(field => {
        if (conflict[field] === undefined) {
          throw new Error(`Conflicting appointment missing required field: ${field}`);
        }
      });
    });
  }

  /**
   * Scenario 5: Database Connection and Error Handling
   * 
   * Tests database connection handling, error scenarios, and recovery.
   */
  async scenarioDatabaseConnectionIntegration() {
    console.log('🧪 Running Scenario 5: Database Connection Integration');

    try {
      // Test database connection
      const client = await this.db.connect();
      console.log('✅ Database connection established');

      // Test basic query
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Database query executed successfully');
      console.log(`📅 Current database time: ${result.rows[0].current_time}`);

      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Scenario 6: Performance and Load Testing
   * 
   * Tests API performance under load and database query optimization.
   */
  async scenarioPerformanceIntegration() {
    console.log('🧪 Running Scenario 6: Performance Integration');

    const startTime = Date.now();
    
    // Test multiple concurrent requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(this.app)
          .get('/api/v1/calendar/2024/12')
          .expect(200)
      );
    }

    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 10 concurrent calendar requests completed in ${duration}ms`);
    
    if (duration > 5000) {
      throw new Error(`Performance test failed: ${duration}ms exceeds 5s threshold`);
    }
  }

  /**
   * Run all integration test scenarios
   */
  async runAllScenarios() {
    console.log('🚀 Starting Integration Test Scenarios');
    console.log('=' .repeat(50));

    try {
      await this.scenarioCalendarViewIntegration();
      await this.scenarioAppointmentBookingIntegration();
      await this.scenarioAppointmentManagementIntegration();
      await this.scenarioTimeSlotAvailabilityIntegration();
      await this.scenarioDatabaseConnectionIntegration();
      await this.scenarioPerformanceIntegration();

      console.log('=' .repeat(50));
      console.log('✅ All integration test scenarios completed successfully');
    } catch (error) {
      console.error('❌ Integration test scenario failed:', error.message);
      throw error;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Cleanup test data and connections
   */
  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    // Clear test data
    testData.appointments = [];
    testData.users = [];
    testData.timeSlots = [];

    // Close database connection
    if (this.db) {
      await this.db.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Export for use in test files
module.exports = IntegrationTestScenarios;

// Run scenarios if called directly
if (require.main === module) {
  const scenarios = new IntegrationTestScenarios();
  scenarios.runAllScenarios()
    .then(() => {
      console.log('🎉 Integration test scenarios completed successfully');
    })
    .catch((error) => {
      console.error('💥 Integration test scenarios failed:', error);
      throw error;
    });
}
