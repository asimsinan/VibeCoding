/**
 * Contract Test Setup
 * Configuration and utilities for contract testing
 */

import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { db } from '../../lib/video-conferencing/services/database.service';

// Test database configuration
const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'videoconference_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1000,
};

const TEST_REDIS_CONFIG = {
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  password: process.env.TEST_REDIS_PASSWORD,
  db: 1, // Use different DB for tests
  retryDelayOnFailover: 50,
  maxRetriesPerRequest: 1,
};

// Test data cleanup
const cleanupTestData = async () => {
  try {
    // Clean up test data in reverse dependency order
    await db.query('DELETE FROM webrtc_connections WHERE room_id IN (SELECT id FROM rooms WHERE created_at > NOW() - INTERVAL \'1 hour\')');
    await db.query('DELETE FROM media_state_changes WHERE participant_id IN (SELECT id FROM participants WHERE joined_at > NOW() - INTERVAL \'1 hour\')');
    await db.query('DELETE FROM messages WHERE room_id IN (SELECT id FROM rooms WHERE created_at > NOW() - INTERVAL \'1 hour\')');
    await db.query('DELETE FROM participants WHERE joined_at > NOW() - INTERVAL \'1 hour\')');
    await db.query('DELETE FROM room_sessions WHERE started_at > NOW() - INTERVAL \'1 hour\')');
    await db.query('DELETE FROM rooms WHERE created_at > NOW() - INTERVAL \'1 hour\')');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

// Global test setup
beforeAll(async () => {
  // Initialize test database
  await db.initialize();
  
  // Clean up any existing test data
  await cleanupTestData();
});

// Global test teardown
afterAll(async () => {
  // Clean up test data
  await cleanupTestData();
  
  // Close database connections
  await db.close();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data after each test
  await cleanupTestData();
});

// Test utilities
export const testUtils = {
  /**
   * Create a test room
   */
  async createTestRoom(overrides: any = {}) {
    const defaultRoom = {
      participantName: 'Test User',
      mediaPermissions: {
        camera: true,
        microphone: true,
        screenShare: false,
      },
    };
    
    const roomData = { ...defaultRoom, ...overrides };
    
    const result = await db.query(
      'INSERT INTO rooms (name, max_participants, settings) VALUES ($1, $2, $3) RETURNING *',
      [roomData.name, 50, {}]
    );
    
    return result.rows[0];
  },

  /**
   * Create a test participant
   */
  async createTestParticipant(roomId: string, overrides: any = {}) {
    const defaultParticipant = {
      name: 'Test Participant',
      mediaPermissions: {
        camera: true,
        microphone: true,
        screenShare: false,
      },
    };
    
    const participantData = { ...defaultParticipant, ...overrides };
    
    const result = await db.query(
      'INSERT INTO participants (room_id, name, media_permissions) VALUES ($1, $2, $3) RETURNING *',
      [roomId, participantData.name, JSON.stringify(participantData.mediaPermissions)]
    );
    
    return result.rows[0];
  },

  /**
   * Create a test message
   */
  async createTestMessage(roomId: string, participantId: string, overrides: any = {}) {
    const defaultMessage = {
      message: 'Test message',
      messageType: 'text',
    };
    
    const messageData = { ...defaultMessage, ...overrides };
    
    const result = await db.query(
      'INSERT INTO messages (room_id, participant_id, participant_name, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [roomId, participantId, 'Test User', messageData.message, messageData.messageType]
    );
    
    return result.rows[0];
  },

  /**
   * Generate test JWT token
   */
  generateTestToken(payload: any = {}) {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    
    const defaultPayload = {
      sub: 'test-participant-id',
      roomId: 'test-room-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      permissions: {
        camera: true,
        microphone: true,
        screenShare: false,
      },
    };
    
    return jwt.sign({ ...defaultPayload, ...payload }, secret);
  },

  /**
   * Wait for async operations
   */
  async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate random UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Create test WebSocket connection
   */
  createTestWebSocket(roomId: string, token: string) {
    const WebSocket = require('ws');
    return new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}?token=${token}`);
  },

  /**
   * Validate API response structure
   */
  validateApiResponse(response: any, expectedSuccess: boolean = true) {
    // Basic validation without expect (used in non-test contexts)
    return response && 
           typeof response.success === 'boolean' && 
           typeof response.timestamp === 'string' &&
           response.success === expectedSuccess &&
           (expectedSuccess ? response.data !== undefined : response.error !== undefined);
  },

  /**
   * Validate UUID format
   */
  validateUUID(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate ISO date format
   */
  validateISODate(dateString: string) {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  },
};

// Export test configuration
export const testConfig = {
  database: TEST_DB_CONFIG,
  redis: TEST_REDIS_CONFIG,
  timeout: 10000,
  retries: 3,
};

// Export cleanup function for manual use
export { cleanupTestData };
