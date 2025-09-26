/**
 * Global Teardown for E2E Tests
 * 
 * Cleans up the test environment after running E2E tests
 * 
 * Maps to TASK-013: End-to-End Validation
 * TDD Phase: E2E
 * Constitutional Compliance: Test-First Gate, Integration-First Testing Gate
 */

const { appointmentCore } = require('../../src/index');

async function globalTeardown(config) {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    // Clean up test data
    await cleanupTestData();
    console.log('✅ Test data cleaned up');

    // Close appointment core
    await appointmentCore.close();
    console.log('✅ Appointment core closed');

    console.log('✅ E2E test environment cleanup complete');
  } catch (error) {
    console.error('❌ Failed to clean up E2E test environment:', error.message);
    // Don't throw error to avoid masking test failures
  }
}

async function cleanupTestData() {
  try {
    const appointmentService = appointmentCore.getAppointmentService();
    
    // Get all test appointments
    const appointments = await appointmentService.listAppointments({ status: 'all' });
    
    // Delete test appointments
    for (const appointment of appointments) {
      if (appointment.userEmail.startsWith('test') && appointment.userEmail.includes('@example.com')) {
        try {
          await appointmentService.cancelAppointment(appointment.id);
        } catch (error) {
          // Ignore errors during cleanup
          console.warn(`⚠️ Failed to delete test appointment ${appointment.id}:`, error.message);
        }
      }
    }

    console.log(`✅ Cleaned up test appointments`);
  } catch (error) {
    console.error('❌ Failed to clean up test data:', error.message);
    // Don't throw error to avoid masking test failures
  }
}

module.exports = globalTeardown;
