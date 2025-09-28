-- Add sync metadata to mood entries
-- Version: 2
-- Description: Add sync metadata columns for better tracking

-- Add sync metadata columns to mood_entries
ALTER TABLE mood_entries 
ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'pending' 
  CHECK (sync_status IN ('pending', 'synced', 'conflict', 'error'));

-- Add index for sync status
CREATE INDEX IF NOT EXISTS idx_mood_entries_sync_status 
ON mood_entries(sync_status, last_sync_at);

-- Add sync metadata to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Update sync_queue to include more metadata
ALTER TABLE sync_queue
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;

-- Add index for failed sync operations
CREATE INDEX IF NOT EXISTS idx_sync_queue_failed 
ON sync_queue(status, retry_count) 
WHERE status = 'failed';

-- Add comments
COMMENT ON COLUMN mood_entries.sync_version IS 'Version number for optimistic locking during sync';
COMMENT ON COLUMN mood_entries.last_sync_at IS 'Timestamp of last successful sync';
COMMENT ON COLUMN mood_entries.sync_status IS 'Current sync status of the entry';
COMMENT ON COLUMN sync_queue.error_message IS 'Error message from last failed sync attempt';
COMMENT ON COLUMN sync_queue.last_attempt_at IS 'Timestamp of last sync attempt';
