import { DatabaseService } from '../../lib/video-conferencing/services/database.service';

let dbService: DatabaseService;

export async function setupSecurityTests() {
  console.log('Setting up security test database...');
  
  dbService = DatabaseService.getInstance();
  await dbService.initialize();

  // Create tables for security tests
  await dbService.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP
    )
  `);

  await dbService.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      max_participants INTEGER DEFAULT 10,
      settings JSONB DEFAULT '{}',
      created_by UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true
    )
  `);

  await dbService.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      client_info JSONB DEFAULT '{}',
      is_connected BOOLEAN DEFAULT false,
      media_permissions JSONB DEFAULT '{}',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      screen_share JSONB DEFAULT '{}'
    )
  `);

  await dbService.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  await dbService.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  await dbService.query(`
    CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
  `);

  await dbService.query(`
    CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
  `);

  await dbService.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
  `);

  console.log('Security test database setup complete');
}

export async function cleanupSecurityTests() {
  console.log('Cleaning up security test database...');
  
  if (dbService) {
    // Drop tables in reverse order
    await dbService.query('DROP TABLE IF EXISTS messages CASCADE');
    await dbService.query('DROP TABLE IF EXISTS participants CASCADE');
    await dbService.query('DROP TABLE IF EXISTS rooms CASCADE');
    await dbService.query('DROP TABLE IF EXISTS users CASCADE');
    
    await dbService.close();
  }
  
  console.log('Security test database cleanup complete');
}

export function getDatabaseService() {
  return dbService;
}
