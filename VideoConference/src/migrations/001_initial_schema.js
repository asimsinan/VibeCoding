/**
 * Initial Database Schema Migration
 * Creates the complete database schema for the video conferencing application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'lib', 'video-conferencing', 'models', 'database.schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

export default {
  version: '001',
  name: 'initial_schema',
  
  async up(db) {
    // Execute the complete schema
    await db.query(schema);
  },
  
  async down(db) {
    // Drop all tables in reverse dependency order
    const dropStatements = [
      'DROP MATERIALIZED VIEW IF EXISTS room_analytics CASCADE',
      'DROP VIEW IF EXISTS recent_messages CASCADE',
      'DROP VIEW IF EXISTS room_participants CASCADE',
      'DROP VIEW IF EXISTS active_rooms CASCADE',
      'DROP TABLE IF EXISTS webrtc_connections CASCADE',
      'DROP TABLE IF EXISTS media_state_changes CASCADE',
      'DROP TABLE IF EXISTS room_sessions CASCADE',
      'DROP TABLE IF EXISTS messages CASCADE',
      'DROP TABLE IF EXISTS participants CASCADE',
      'DROP TABLE IF EXISTS rooms CASCADE',
      'DROP TYPE IF EXISTS participant_connection_state CASCADE',
      'DROP TYPE IF EXISTS message_type CASCADE',
      'DROP TYPE IF EXISTS media_permission CASCADE',
    ];
    
    for (const statement of dropStatements) {
      await db.query(statement);
    }
  }
};
