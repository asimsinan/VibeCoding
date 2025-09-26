#!/usr/bin/env node
/**
 * Server Startup Script
 * 
 * Entry point for starting the Appointment Scheduler API server
 * 
 * Maps to TASK-012: Application Layer
 * TDD Phase: Implementation
 * Constitutional Compliance: Library-First Gate, API-First Gate
 */

const AppointmentServer = require('./app');

async function startServer() {
  try {
    
    const server = new AppointmentServer();
    await server.start();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
