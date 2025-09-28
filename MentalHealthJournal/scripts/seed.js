#!/usr/bin/env node
/**
 * Database Seed Script
 * 
 * Seeds the database with sample data for development and testing.
 * Supports both IndexedDB and PostgreSQL seeding.
 * 
 * @fileoverview Database seeding utility
 * @author Mental Health Journal App
 * @version 1.0.0
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseSeeder {
  constructor() {
    this.sampleData = this.generateSampleData();
  }

  /**
   * Generate sample mood data
   */
  generateSampleData() {
    const data = {
      moodEntries: [],
      userSettings: {
        id: 'default',
        theme: 'system',
        chartPreferences: {
          defaultPeriod: '30d',
          showNotes: true,
          showTrends: true,
        },
        privacy: {
          dataRetention: 365,
          cloudSync: false,
          analytics: false,
        },
        notifications: {
          dailyReminder: true,
          weeklyReport: true,
          moodInsights: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Generate 30 days of sample mood data
    const today = new Date();
    const moods = [
      { rating: 8, notes: 'Great day at work!' },
      { rating: 6, notes: 'Feeling okay, had some stress' },
      { rating: 9, notes: 'Amazing day with friends' },
      { rating: 5, notes: 'Tired and overwhelmed' },
      { rating: 7, notes: 'Productive day' },
      { rating: 4, notes: 'Struggling with anxiety' },
      { rating: 8, notes: 'Good workout, feeling strong' },
      { rating: 6, notes: 'Mixed feelings today' },
      { rating: 9, notes: 'Perfect weather, great mood' },
      { rating: 3, notes: 'Really tough day' },
    ];

    const notes = [
      'Had a great morning workout',
      'Feeling grateful for family',
      'Work was challenging but rewarding',
      'Spent time in nature',
      'Good conversation with a friend',
      'Struggled with motivation today',
      'Feeling anxious about upcoming events',
      'Had a relaxing evening',
      'Accomplished a lot today',
      'Feeling overwhelmed with tasks',
    ];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const moodIndex = Math.floor(Math.random() * moods.length);
      const mood = moods[moodIndex];
      
      const entry = {
        id: `sample-${i + 1}`,
        rating: mood.rating,
        notes: Math.random() > 0.3 ? mood.notes : notes[Math.floor(Math.random() * notes.length)],
        date: date.toISOString().split('T')[0],
        createdAt: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
        updatedAt: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
        synced: Math.random() > 0.5,
      };

      data.moodEntries.push(entry);
    }

    // Sort by date (most recent first)
    data.moodEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return data;
  }

  /**
   * Seed PostgreSQL database
   */
  async seedPostgres() {
    const config = this.getPostgresConfig();
    if (!config) {
      console.log('PostgreSQL not configured, skipping cloud seeding');
      return;
    }

    const pool = new Pool(config);
    const client = await pool.connect();

    try {
      console.log('Seeding PostgreSQL database...');

      // Clear existing data
      await client.query('DELETE FROM mood_entries');
      await client.query('DELETE FROM user_settings');

      // Insert sample mood entries
      for (const entry of this.sampleData.moodEntries) {
        const encryptedData = this.encryptData(entry);
        
        await client.query(`
          INSERT INTO mood_entries (id, user_id, rating, notes, date, created_at, updated_at, encrypted_data, version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          entry.id,
          'sample-user',
          entry.rating,
          entry.notes,
          entry.date,
          entry.createdAt,
          entry.updatedAt,
          encryptedData,
          1
        ]);
      }

      // Insert user settings
      const encryptedSettings = this.encryptData(this.sampleData.userSettings);
      await client.query(`
        INSERT INTO user_settings (user_id, encrypted_data, created_at, updated_at, version)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'sample-user',
        encryptedSettings,
        this.sampleData.userSettings.createdAt,
        this.sampleData.userSettings.updatedAt,
        1
      ]);

      console.log(`✓ Seeded ${this.sampleData.moodEntries.length} mood entries`);
      console.log('✓ Seeded user settings');
      console.log('PostgreSQL seeding completed');
    } finally {
      client.release();
      await pool.end();
    }
  }

  /**
   * Seed IndexedDB (via export file)
   */
  async seedIndexedDB() {
    console.log('Creating IndexedDB seed file...');
    
    const seedFile = path.join(__dirname, '..', 'src', 'tests', 'fixtures', 'seed-data.json');
    const seedDir = path.dirname(seedFile);
    
    // Ensure directory exists
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }

    // Write seed data
    fs.writeFileSync(seedFile, JSON.stringify(this.sampleData, null, 2));
    
    console.log(`✓ Created seed file: ${seedFile}`);
    console.log('IndexedDB seeding file created');
  }

  /**
   * Get PostgreSQL configuration
   */
  getPostgresConfig() {
    const {
      DATABASE_URL,
      POSTGRES_HOST,
      POSTGRES_PORT,
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_SSL,
    } = process.env;

    if (DATABASE_URL) {
      try {
        const url = new URL(DATABASE_URL);
        return {
          host: url.hostname,
          port: parseInt(url.port || '5432', 10),
          database: url.pathname.slice(1),
          user: url.username,
          password: url.password,
          ssl: url.protocol === 'postgresql+ssl:' || url.searchParams.get('sslmode') === 'require',
        };
      } catch (error) {
        console.error('Invalid DATABASE_URL:', error.message);
        return null;
      }
    }

    if (POSTGRES_HOST && POSTGRES_USER && POSTGRES_PASSWORD) {
      return {
        host: POSTGRES_HOST,
        port: parseInt(POSTGRES_PORT || '5432', 10),
        database: POSTGRES_DB || 'moodtracker',
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
        ssl: POSTGRES_SSL === 'true',
      };
    }

    return null;
  }

  /**
   * Simple encryption for sample data
   */
  encryptData(data) {
    // In a real implementation, this would use proper encryption
    // For seeding purposes, we'll just base64 encode
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Clear all data
   */
  async clearData() {
    console.log('Clearing all data...');

    const config = this.getPostgresConfig();
    if (config) {
      const pool = new Pool(config);
      const client = await pool.connect();

      try {
        await client.query('DELETE FROM mood_entries');
        await client.query('DELETE FROM user_settings');
        await client.query('DELETE FROM sync_queue');
        console.log('✓ Cleared PostgreSQL data');
      } finally {
        client.release();
        await pool.end();
      }
    }

    // Clear IndexedDB seed file
    const seedFile = path.join(__dirname, '..', 'src', 'tests', 'fixtures', 'seed-data.json');
    if (fs.existsSync(seedFile)) {
      fs.unlinkSync(seedFile);
      console.log('✓ Cleared IndexedDB seed file');
    }

    console.log('Data clearing completed');
  }

  /**
   * Show seed data statistics
   */
  showStats() {
    console.log('Seed Data Statistics:');
    console.log('====================');
    console.log(`Mood Entries: ${this.sampleData.moodEntries.length}`);
    console.log(`Date Range: ${this.sampleData.moodEntries[this.sampleData.moodEntries.length - 1].date} to ${this.sampleData.moodEntries[0].date}`);
    
    const ratings = this.sampleData.moodEntries.map(entry => entry.rating);
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    console.log(`Average Rating: ${avgRating.toFixed(2)}`);
    
    const ratingDistribution = {};
    ratings.forEach(rating => {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });
    
    console.log('Rating Distribution:');
    for (let i = 1; i <= 10; i++) {
      const count = ratingDistribution[i] || 0;
      const percentage = ((count / ratings.length) * 100).toFixed(1);
      console.log(`  ${i}: ${count} (${percentage}%)`);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const seeder = new DatabaseSeeder();

  try {
    switch (command) {
      case 'postgres':
        await seeder.seedPostgres();
        break;
      case 'indexeddb':
        await seeder.seedIndexedDB();
        break;
      case 'all':
        await seeder.seedIndexedDB();
        await seeder.seedPostgres();
        break;
      case 'clear':
        await seeder.clearData();
        break;
      case 'stats':
        seeder.showStats();
        break;
      default:
        console.log(`
Database Seeding Tool

Usage:
  node scripts/seed.js <command>

Commands:
  postgres     Seed PostgreSQL database
  indexeddb    Create IndexedDB seed file
  all          Seed both PostgreSQL and IndexedDB
  clear        Clear all seeded data
  stats        Show seed data statistics

Examples:
  node scripts/seed.js all
  node scripts/seed.js postgres
  node scripts/seed.js clear
  node scripts/seed.js stats
`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseSeeder };
