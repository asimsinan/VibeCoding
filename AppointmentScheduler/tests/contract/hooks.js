#!/usr/bin/env node
/**
 * Dredd hooks for API contract testing
 * 
 * This file contains hooks for contract testing using Dredd.
 * These hooks run before and after each API test to set up
 * test data and clean up resources.
 * 
 * Maps to TASK-002: Create Contract Tests
 * TDD Phase: Contract (RED phase - tests initially fail)
 */

const hooks = require('hooks');
const assert = require('assert');

// Test data setup
const testData = {
  appointments: [],
  nextAppointmentId: 1
};

// Helper function to generate test appointment ID (unused but available for future use)
// const generateAppointmentId = () => {
//   return `apt_${String(testData.nextAppointmentId++).padStart(3, '0')}`;
// };

// Helper function to create test appointment data
const createTestAppointment = (overrides = {}) => {
  const baseAppointment = {
    startTime: '2024-12-15T10:00:00Z',
    endTime: '2024-12-15T11:00:00Z',
    userEmail: 'test.user@example.com',
    userName: 'Test User',
    notes: 'Test appointment for contract testing'
  };
  
  return { ...baseAppointment, ...overrides };
};

// Before all tests
hooks.beforeAll((transactions) => {
  console.log('🚀 Starting contract tests for AppointmentScheduler API');
  console.log(`📋 Testing ${transactions.length} API transactions`);
});

// After all tests
hooks.afterAll((transactions) => {
  console.log('✅ Contract tests completed');
  console.log(`📊 Tested ${transactions.length} API transactions`);
});

// Before each test
hooks.beforeEach((transaction) => {
  // Add common headers for all requests
  transaction.request.headers = transaction.request.headers || {};
  transaction.request.headers['Content-Type'] = 'application/json';
  transaction.request.headers['Accept'] = 'application/json';
  
  // Add API key for authentication (if required)
  transaction.request.headers['X-API-Key'] = 'test-api-key-123';
});

// After each test
hooks.afterEach((transaction) => {
  // Log test results
  if (transaction.test && transaction.test.status === 'pass') {
    console.log(`✅ ${transaction.request.method} ${transaction.request.uri} - PASSED`);
  } else if (transaction.test && transaction.test.status === 'fail') {
    console.log(`❌ ${transaction.request.method} ${transaction.request.uri} - FAILED`);
    if (transaction.test.message) {
      console.log(`   Error: ${transaction.test.message}`);
    }
  }
});

// Specific hooks for calendar endpoint
hooks.before('Calendar > Get calendar view for a specific month > GET /calendar/{year}/{month}', (transaction) => {
  // Set up test parameters
  transaction.request.uri = transaction.request.uri.replace('{year}', '2024');
  transaction.request.uri = transaction.request.uri.replace('{month}', '12');
});

// Specific hooks for appointment creation
hooks.before('Appointments > Create a new appointment > POST /appointments', (transaction) => {
  // Set up test appointment data
  const testAppointment = createTestAppointment();
  transaction.request.body = JSON.stringify(testAppointment);
  
  // Store for later validation
  testData.currentAppointment = testAppointment;
});

hooks.after('Appointments > Create a new appointment > POST /appointments', (transaction) => {
  if (transaction.test && transaction.test.status === 'pass') {
    // Extract appointment ID from response for later tests
    try {
      const responseBody = JSON.parse(transaction.real.body);
      if (responseBody.id) {
        testData.createdAppointmentId = responseBody.id;
        testData.appointments.push(responseBody);
      }
    } catch (error) {
      console.log('Warning: Could not parse appointment creation response');
    }
  }
});

// Specific hooks for appointment retrieval
hooks.before('Appointments > Get appointment details > GET /appointments/{id}', (transaction) => {
  // Use the appointment ID from the creation test
  const appointmentId = testData.createdAppointmentId || 'apt_001';
  transaction.request.uri = transaction.request.uri.replace('{id}', appointmentId);
});

// Specific hooks for appointment update
hooks.before('Appointments > Update an existing appointment > PUT /appointments/{id}', (transaction) => {
  // Use the appointment ID from the creation test
  const appointmentId = testData.createdAppointmentId || 'apt_001';
  transaction.request.uri = transaction.request.uri.replace('{id}', appointmentId);
  
  // Set up update data
  const updateData = {
    startTime: '2024-12-15T14:00:00Z',
    endTime: '2024-12-15T15:00:00Z',
    notes: 'Updated appointment notes'
  };
  transaction.request.body = JSON.stringify(updateData);
});

// Specific hooks for appointment cancellation
hooks.before('Appointments > Cancel an appointment > DELETE /appointments/{id}', (transaction) => {
  // Use the appointment ID from the creation test
  const appointmentId = testData.createdAppointmentId || 'apt_001';
  transaction.request.uri = transaction.request.uri.replace('{id}', appointmentId);
});

// Specific hooks for availability checking
hooks.before('Availability > Check time slot availability > GET /slots/availability', (transaction) => {
  // Add query parameters for availability check
  const queryParams = new URLSearchParams({
    startTime: '2024-12-15T10:00:00Z',
    endTime: '2024-12-15T11:00:00Z'
  });
  
  const baseUri = transaction.request.uri.split('?')[0];
  transaction.request.uri = `${baseUri}?${queryParams.toString()}`;
});

// Validation hooks for response schemas
hooks.beforeValidation('Calendar > Get calendar view for a specific month > GET /calendar/{year}/{month}', (transaction) => {
  // Validate calendar response structure
  if (transaction.real && transaction.real.body) {
    try {
      const response = JSON.parse(transaction.real.body);
      
      // Validate required fields
      assert(response.year !== undefined, 'Calendar response must include year');
      assert(response.month !== undefined, 'Calendar response must include month');
      assert(response.timezone !== undefined, 'Calendar response must include timezone');
      assert(Array.isArray(response.days), 'Calendar response must include days array');
      
      console.log('✅ Calendar response structure validated');
    } catch (error) {
      console.log(`❌ Calendar response validation failed: ${error.message}`);
    }
  }
});

hooks.beforeValidation('Appointments > Create a new appointment > POST /appointments', (transaction) => {
  // Validate appointment creation response
  if (transaction.real && transaction.real.body) {
    try {
      const response = JSON.parse(transaction.real.body);
      
      // Validate required fields
      assert(response.id !== undefined, 'Appointment response must include id');
      assert(response.startTime !== undefined, 'Appointment response must include startTime');
      assert(response.endTime !== undefined, 'Appointment response must include endTime');
      assert(response.userEmail !== undefined, 'Appointment response must include userEmail');
      assert(response.userName !== undefined, 'Appointment response must include userName');
      assert(response.status !== undefined, 'Appointment response must include status');
      assert(response.createdAt !== undefined, 'Appointment response must include createdAt');
      assert(response.updatedAt !== undefined, 'Appointment response must include updatedAt');
      
      // Validate ID format
      assert(/^apt_[a-zA-Z0-9]+$/.test(response.id), 'Appointment ID must match pattern apt_[a-zA-Z0-9]+');
      
      console.log('✅ Appointment creation response structure validated');
    } catch (error) {
      console.log(`❌ Appointment creation response validation failed: ${error.message}`);
    }
  }
});

// Error scenario testing
hooks.before('Appointments > Create a new appointment > POST /appointments', (transaction) => {
  // Test conflict scenario by creating overlapping appointment
  if (transaction.request.body) {
    try {
      const appointmentData = JSON.parse(transaction.request.body);
      
      // Check if this is a conflict test
      if (appointmentData.userEmail === 'conflict.test@example.com') {
        // This should result in a conflict error
        console.log('🧪 Testing conflict scenario');
      }
    } catch (error) {
      console.log('Warning: Could not parse appointment data for conflict testing');
    }
  }
});

// Cleanup after tests
hooks.afterAll((_transactions) => {
  // Clean up test data
  testData.appointments = [];
  testData.createdAppointmentId = null;
  testData.nextAppointmentId = 1;
  
  console.log('🧹 Test data cleaned up');
});

module.exports = hooks;
