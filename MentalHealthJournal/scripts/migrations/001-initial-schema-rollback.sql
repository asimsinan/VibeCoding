-- Rollback for Initial Database Schema Migration
-- Version: 1
-- Description: Removes all tables created in the initial schema migration

-- Drop indexes first
DROP INDEX IF EXISTS idx_sync_queue_operation;
DROP INDEX IF EXISTS idx_sync_queue_created_at;
DROP INDEX IF EXISTS idx_sync_queue_user_status;
DROP INDEX IF EXISTS idx_mood_entries_rating;
DROP INDEX IF EXISTS idx_mood_entries_created_at;
DROP INDEX IF EXISTS idx_mood_entries_user_date;

-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS sync_queue;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS mood_entries;

-- Note: This rollback will completely remove all tables and data
-- Use with caution in production environments
