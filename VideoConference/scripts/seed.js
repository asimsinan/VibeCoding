#!/usr/bin/env node

/**
 * Database Seed Script
 * Populates the database with initial test data
 */

import { db } from '../src/lib/video-conferencing/services/database.service.js';

/**
 * Seed data
 */
const seedData = {
  rooms: [
    {
      name: 'Welcome Room',
      max_participants: 50,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        requireApproval: false,
        recordingEnabled: false,
        maxDuration: 0,
      },
    },
    {
      name: 'Test Room',
      max_participants: 10,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        requireApproval: true,
        recordingEnabled: true,
        maxDuration: 3600, // 1 hour
      },
    },
  ],
  participants: [
    {
      name: 'System Admin',
      media_permissions: {
        camera: true,
        microphone: true,
        screenShare: true,
      },
    },
    {
      name: 'Test User 1',
      media_permissions: {
        camera: true,
        microphone: true,
        screenShare: false,
      },
    },
    {
      name: 'Test User 2',
      media_permissions: {
        camera: false,
        microphone: true,
        screenShare: false,
      },
    },
  ],
  messages: [
    {
      message: 'Welcome to the video conference room!',
      message_type: 'system',
    },
    {
      message: 'Hello everyone!',
      message_type: 'text',
    },
    {
      message: 'This is a test message',
      message_type: 'text',
    },
  ],
};

/**
 * Seed functions
 */
async function seedRooms() {
  console.log('🌱 Seeding rooms...');
  
  for (const roomData of seedData.rooms) {
    const result = await db.query(
      'INSERT INTO rooms (name, max_participants, settings) VALUES ($1, $2, $3) RETURNING *',
      [roomData.name, roomData.max_participants, JSON.stringify(roomData.settings)]
    );
    console.log(`  ✅ Created room: ${result.rows[0].name}`);
  }
}

async function seedParticipants() {
  console.log('🌱 Seeding participants...');
  
  // Get the first room
  const roomsResult = await db.query('SELECT id FROM rooms ORDER BY created_at LIMIT 1');
  if (roomsResult.rows.length === 0) {
    throw new Error('No rooms found. Please run migrations first.');
  }
  
  const roomId = roomsResult.rows[0].id;
  
  for (const participantData of seedData.participants) {
    const result = await db.query(
      'INSERT INTO participants (room_id, name, media_permissions, is_connected, connection_state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        roomId,
        participantData.name,
        JSON.stringify(participantData.media_permissions),
        false,
        'disconnected'
      ]
    );
    console.log(`  ✅ Created participant: ${result.rows[0].name}`);
  }
}

async function seedMessages() {
  console.log('🌱 Seeding messages...');
  
  // Get the first room and participants
  const roomsResult = await db.query('SELECT id FROM rooms ORDER BY created_at LIMIT 1');
  const participantsResult = await db.query('SELECT id, name FROM participants ORDER BY joined_at LIMIT 2');
  
  if (roomsResult.rows.length === 0 || participantsResult.rows.length === 0) {
    throw new Error('No rooms or participants found. Please run migrations first.');
  }
  
  const roomId = roomsResult.rows[0].id;
  const participants = participantsResult.rows;
  
  for (let i = 0; i < seedData.messages.length; i++) {
    const messageData = seedData.messages[i];
    const participant = participants[i % participants.length];
    
    const result = await db.query(
      'INSERT INTO messages (room_id, participant_id, participant_name, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [roomId, participant.id, participant.name, messageData.message, messageData.message_type]
    );
    console.log(`  ✅ Created message: ${result.rows[0].message.substring(0, 50)}...`);
  }
}

async function seedRoomSessions() {
  console.log('🌱 Seeding room sessions...');
  
  const roomsResult = await db.query('SELECT id FROM rooms ORDER BY created_at');
  
  for (const room of roomsResult.rows) {
    const result = await db.query(
      'INSERT INTO room_sessions (room_id, participant_count, total_messages) VALUES ($1, $2, $3) RETURNING *',
      [room.id, 0, 0]
    );
    console.log(`  ✅ Created room session for room: ${room.id}`);
  }
}

async function seedAnalytics() {
  console.log('🌱 Refreshing analytics...');
  
  try {
    await db.query('REFRESH MATERIALIZED VIEW room_analytics');
    console.log('  ✅ Analytics refreshed');
  } catch (error) {
    console.log('  ⚠️  Analytics refresh failed (this is normal if no data exists)');
  }
}

/**
 * Clear existing data
 */
async function clearData() {
  console.log('🧹 Clearing existing seed data...');
  
  const clearStatements = [
    'DELETE FROM webrtc_connections',
    'DELETE FROM media_state_changes',
    'DELETE FROM messages',
    'DELETE FROM participants',
    'DELETE FROM room_sessions',
    'DELETE FROM rooms',
  ];
  
  for (const statement of clearStatements) {
    await db.query(statement);
  }
  
  console.log('  ✅ Data cleared');
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clear existing data
    await clearData();
    
    // Seed data in dependency order
    await seedRooms();
    await seedParticipants();
    await seedMessages();
    await seedRoomSessions();
    await seedAnalytics();
    
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'seed';
  
  try {
    // Initialize database
    await db.initialize();
    
    switch (command) {
      case 'seed':
        await seed();
        break;
      case 'clear':
        await clearData();
        console.log('✅ Data cleared');
        break;
      default:
        console.log('Usage: node seed.js [seed|clear]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seed, clearData };
