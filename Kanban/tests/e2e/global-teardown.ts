/**
 * Global E2E Test Teardown
 * Cleans up test data after running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { TestHelpers } from './setup/test-helpers';
import { TEST_USERS } from './setup/test-data';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const helpers = new TestHelpers(page);

  try {
    // Clean up test data
    console.log('🗑️  Cleaning up test data...');
    await helpers.cleanupTestData();
    console.log('✅ Test data cleanup complete!');
  } catch (error) {
    console.error('❌ E2E test cleanup failed:', error);
    // Don't throw error to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
