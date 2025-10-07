/**
 * Global E2E Test Setup
 * Sets up test environment and data before running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { TestHelpers } from './setup/test-helpers';
import { TEST_USERS, TEST_WORKSPACES, TEST_BOARDS } from './setup/test-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const helpers = new TestHelpers(page);

  try {
    // Create test users
    console.log('👤 Creating test users...');
    for (const user of Object.values(TEST_USERS)) {
      try {
        await helpers.signup(user);
        console.log(`✅ Created user: ${user.email}`);
      } catch (error) {
        console.log(`⚠️  User ${user.email} may already exist: ${error}`);
      }
    }

    // Create test workspaces
    console.log('🏢 Creating test workspaces...');
    await helpers.login(TEST_USERS.admin);
    
    for (const workspace of Object.values(TEST_WORKSPACES)) {
      try {
        await helpers.createWorkspace(workspace);
        console.log(`✅ Created workspace: ${workspace.name}`);
      } catch (error) {
        console.log(`⚠️  Workspace ${workspace.name} may already exist: ${error}`);
      }
    }

    // Create test boards
    console.log('📋 Creating test boards...');
    for (const board of Object.values(TEST_BOARDS)) {
      try {
        await helpers.createBoard(board, 'workspace-id-placeholder');
        console.log(`✅ Created board: ${board.title}`);
      } catch (error) {
        console.log(`⚠️  Board ${board.title} may already exist: ${error}`);
      }
    }

    console.log('✅ E2E test environment setup complete!');
  } catch (error) {
    console.error('❌ E2E test environment setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
