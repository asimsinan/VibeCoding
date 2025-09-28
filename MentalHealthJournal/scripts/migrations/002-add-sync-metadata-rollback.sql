-- Rollback sync metadata changes
-- Version: 2
-- Description: Remove sync metadata columns added in migration 2

-- Drop indexes first
DROP INDEX IF EXISTS idx_sync_queue_failed;
DROP INDEX IF EXISTS idx_mood_entries_sync_status;

-- Remove columns from sync_queue
ALTER TABLE sync_queue
DROP COLUMN IF EXISTS last_attempt_at,
DROP COLUMN IF EXISTS error_message;

-- Remove columns from user_settings
ALTER TABLE user_settings
DROP COLUMN IF EXISTS last_sync_at,
DROP COLUMN IF EXISTS sync_version;

-- Remove columns from mood_entries
ALTER TABLE mood_entries
DROP COLUMN IF EXISTS sync_status,
DROP COLUMN IF EXISTS last_sync_at,
DROP COLUMN IF EXISTS sync_version;

-- Note: This rollback will remove sync metadata but preserve core data
