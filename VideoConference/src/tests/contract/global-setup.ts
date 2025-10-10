/**
 * Global Setup for Contract Tests
 * Runs once before all contract tests
 */

import { execSync } from 'child_process';
import { db } from '../../lib/video-conferencing/services/database.service';

export default async function globalSetup() {
  console.log('🚀 Setting up contract tests...');

  try {
    // Initialize database
    console.log('📊 Initializing test database...');
    await db.initialize();

    // Run database migrations
    console.log('🔄 Running database migrations...');
    execSync('npm run db:migrate', { stdio: 'inherit' });

    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    await db.query('DELETE FROM webrtc_connections');
    await db.query('DELETE FROM media_state_changes');
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM participants');
    await db.query('DELETE FROM room_sessions');
    await db.query('DELETE FROM rooms');

    console.log('✅ Contract tests setup complete');
  } catch (error) {
    console.error('❌ Contract tests setup failed:', error);
    throw error;
  }
}
