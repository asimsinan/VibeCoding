/**
 * Global Teardown for Contract Tests
 * Runs once after all contract tests complete
 */

import { db } from '../../lib/video-conferencing/services/database.service';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up contract tests...');

  try {
    // Clean up all test data
    console.log('🗑️  Cleaning up test data...');
    await db.query('DELETE FROM webrtc_connections');
    await db.query('DELETE FROM media_state_changes');
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM participants');
    await db.query('DELETE FROM room_sessions');
    await db.query('DELETE FROM rooms');

    // Close database connections
    console.log('🔌 Closing database connections...');
    await db.close();

    console.log('✅ Contract tests cleanup complete');
  } catch (error) {
    console.error('❌ Contract tests cleanup failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}
