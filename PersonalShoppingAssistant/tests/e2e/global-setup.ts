/**
 * Global Setup for E2E Tests
 * TASK-024: End-to-End Test Setup
 * 
 * Sets up the test environment before running E2E tests.
 * This includes database setup, test data seeding, and server preparation.
 */

import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  try {
    // 1. Set up test database
    console.log('📊 Setting up test database...');
    await setupTestDatabase();
    
    // 2. Seed test data
    console.log('🌱 Seeding test data...');
    await seedTestData();
    
    // 3. Start backend server
    console.log('🔧 Starting backend server...');
    await startBackendServer();
    
    // 4. Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await waitForServices();
    
    // 5. Create authenticated user session
    console.log('👤 Creating test user session...');
    await createTestUserSession();
    
    console.log('✅ E2E test setup completed successfully!');
  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  }
}

async function setupTestDatabase() {
  try {
    // Drop and recreate test database to ensure clean state
    try {
      execSync('npm run db:drop:test', { stdio: 'inherit' });
    } catch (error) {
      // Database might not exist, that's okay
    }
    
    // Create test database
    execSync('npm run db:create:test', { stdio: 'inherit' });
    
    // Run migrations
    execSync('npm run db:migrate:test', { stdio: 'inherit' });
    
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

async function seedTestData() {
  try {
    // Seed test data
    execSync('npm run db:seed:test', { stdio: 'inherit' });
    
    console.log('✅ Test data seeding completed');
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    throw error;
  }
}

async function startBackendServer() {
  try {
    // Start backend server in background
    const { spawn } = require('child_process');
    const backendProcess = spawn('npm', ['run', 'dev:backend'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Store process ID for cleanup
    process.env.BACKEND_PID = backendProcess.pid?.toString();
    
    console.log('✅ Backend server started');
  } catch (error) {
    console.error('❌ Backend server startup failed:', error);
    throw error;
  }
}

async function waitForServices() {
  const maxRetries = 30;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if backend is ready
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        console.log('✅ Backend service is ready');
        return;
      }
    } catch (error) {
      // Service not ready yet, wait and retry
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error('Services failed to start within timeout');
}

async function createTestUserSession() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.fill('[data-testid="name-input"]', 'E2E Test User');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Wait for successful registration
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Save authentication state
    await context.storageState({ path: 'tests/e2e/auth-state.json' });
    
    console.log('✅ Test user session created');
  } catch (error) {
    console.error('❌ Test user session creation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
