/**
 * Global Setup for E2E Tests
 * 
 * Sets up the test environment before running E2E tests
 * 
 * Maps to TASK-013: End-to-End Validation
 * TDD Phase: E2E
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const { chromium } = require('@playwright/test');
const { appointmentCore } = require('../../src/index');

async function globalSetup(config) {
  console.log('🚀 Setting up E2E test environment...');

  try {
    // Initialize the appointment core
    await appointmentCore.initialize();
    console.log('✅ Appointment core initialized');

    // Set up test database
    await setupTestDatabase();
    console.log('✅ Test database set up');

    // Verify server is running
    await verifyServerRunning();
    console.log('✅ Server is running');

    // Set up test data
    await setupTestData();
    console.log('✅ Test data set up');

    console.log('✅ E2E test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error.message);
    throw error;
  }
}

async function setupTestDatabase() {
  try {
    // Run migrations
    const { execSync } = require('child_process');
    execSync('npm run migrate', { stdio: 'inherit' });
    
    // Run seeds
    execSync('npm run seed', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to set up test database:', error.message);
    throw error;
  }
}

async function verifyServerRunning() {
  const maxRetries = 30;
  const retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
    }

    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error('Server failed to start within timeout');
}

async function setupTestData() {
  try {
    // Create test appointments
    const appointmentService = appointmentCore.getAppointmentService();
    
    // Clear existing test data
    await appointmentService.listAppointments({ status: 'all' });
    
    // Create test appointments for different scenarios
    const testAppointments = [
      {
        startTime: new Date('2025-01-15T09:00:00Z'),
        endTime: new Date('2025-01-15T10:00:00Z'),
        userEmail: 'test1@example.com',
        userName: 'Test User 1',
        notes: 'E2E test appointment 1'
      },
      {
        startTime: new Date('2025-01-15T14:00:00Z'),
        endTime: new Date('2025-01-15T15:00:00Z'),
        userEmail: 'test2@example.com',
        userName: 'Test User 2',
        notes: 'E2E test appointment 2'
      },
      {
        startTime: new Date('2025-01-16T10:00:00Z'),
        endTime: new Date('2025-01-16T11:00:00Z'),
        userEmail: 'test3@example.com',
        userName: 'Test User 3',
        notes: 'E2E test appointment 3'
      }
    ];

    for (const appointmentData of testAppointments) {
      try {
        await appointmentService.createAppointment(appointmentData);
      } catch (error) {
        // Ignore conflicts, appointment might already exist
        if (!error.message.includes('conflicts with existing appointments')) {
          throw error;
        }
      }
    }

    console.log(`✅ Created ${testAppointments.length} test appointments`);
  } catch (error) {
    console.error('❌ Failed to set up test data:', error.message);
    throw error;
  }
}

module.exports = globalSetup;
