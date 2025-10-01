/**
 * Main Entry Point
 * Personal Shopping Assistant Backend
 * 
 * This is the main entry point for the backend server.
 */

import { App } from './backend/src/app';

async function main() {
  try {
    console.log('🚀 Starting Personal Shopping Assistant Backend...');
    
    const app = new App();
    const port = parseInt(process.env.PORT || '3001', 10);
    await app.start(port);
    
    console.log('✅ Backend server started successfully!');
    console.log(`🌐 Server running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
    
  } catch (error) {
    console.error('❌ Failed to start backend server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
main().catch(console.error);
