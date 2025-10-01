/**
 * Global Teardown for E2E Tests
 * TASK-024: End-to-End Test Setup
 * 
 * Cleans up the test environment after running E2E tests.
 * This includes stopping servers, cleaning up databases, and removing test data.
 */

import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');
  
  try {
    // 1. Stop backend server
    console.log('🛑 Stopping backend server...');
    await stopBackendServer();
    
    // 2. Clean up test database
    console.log('🗑️ Cleaning up test database...');
    await cleanupTestDatabase();
    
    // 3. Remove test artifacts
    console.log('🧽 Removing test artifacts...');
    await removeTestArtifacts();
    
    console.log('✅ E2E test teardown completed successfully!');
  } catch (error) {
    console.error('❌ E2E test teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

async function stopBackendServer() {
  try {
    const backendPid = process.env.BACKEND_PID;
    if (backendPid) {
      // Kill the backend process
      process.kill(parseInt(backendPid), 'SIGTERM');
      console.log('✅ Backend server stopped');
    }
  } catch (error) {
    console.warn('⚠️ Failed to stop backend server:', error);
  }
}

async function cleanupTestDatabase() {
  try {
    // Drop test database
    execSync('npm run db:drop:test', { stdio: 'inherit' });
    
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.warn('⚠️ Failed to cleanup test database:', error);
  }
}

async function removeTestArtifacts() {
  try {
    // Remove test artifacts
    const fs = require('fs');
    const path = require('path');
    
    const artifacts = [
      'tests/e2e/auth-state.json',
      'test-results/',
      'playwright-report/',
    ];
    
    artifacts.forEach(artifact => {
      try {
        if (fs.existsSync(artifact)) {
          if (fs.statSync(artifact).isDirectory()) {
            fs.rmSync(artifact, { recursive: true, force: true });
          } else {
            fs.unlinkSync(artifact);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to remove ${artifact}:`, error);
      }
    });
    
    console.log('✅ Test artifacts removed');
  } catch (error) {
    console.warn('⚠️ Failed to remove test artifacts:', error);
  }
}

export default globalTeardown;
