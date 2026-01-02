-- ===========================================
-- Migration: Add is_stopped to elena_dm_contacts
-- ===========================================
-- Date: 2 janvier 2026
-- Purpose: Prevent FINAL_MESSAGE loop by marking contacts as stopped
-- ===========================================

-- Add is_stopped column
ALTER TABLE elena_dm_contacts 
ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT FALSE;

-- Add stopped_at timestamp to track when they were stopped
ALTER TABLE elena_dm_contacts 
ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMPTZ;

-- Create index for quick filtering
CREATE INDEX IF NOT EXISTS idx_dm_contacts_is_stopped ON elena_dm_contacts(is_stopped);

-- Comment
COMMENT ON COLUMN elena_dm_contacts.is_stopped IS 'When true, Elena will not respond to this contact anymore (after FINAL_MESSAGE)';
COMMENT ON COLUMN elena_dm_contacts.stopped_at IS 'Timestamp when the contact was stopped';

