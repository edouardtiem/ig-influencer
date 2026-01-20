-- Migration: Add followup scheduling columns to elena_dm_contacts
-- Date: 2026-01-19
-- Purpose: Support the new CLOSING and FOLLOWUP stages in the DM funnel

-- Add followup scheduling columns
ALTER TABLE elena_dm_contacts 
ADD COLUMN IF NOT EXISTS followup_scheduled_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS followup_sent BOOLEAN DEFAULT FALSE;

-- Add index for efficient followup queries
CREATE INDEX IF NOT EXISTS idx_elena_dm_contacts_followup 
ON elena_dm_contacts (followup_scheduled_at, followup_sent) 
WHERE followup_scheduled_at IS NOT NULL AND followup_sent = FALSE;

-- Update stage enum check constraint (if exists) to include new stages
-- Note: If there's a check constraint, you may need to drop and recreate it
-- ALTER TABLE elena_dm_contacts DROP CONSTRAINT IF EXISTS stage_check;
-- ALTER TABLE elena_dm_contacts ADD CONSTRAINT stage_check 
--   CHECK (stage IN ('cold', 'warm', 'hot', 'pitched', 'closing', 'followup', 'converted', 'paid'));

COMMENT ON COLUMN elena_dm_contacts.followup_scheduled_at IS 'When to send followup message (+20h from closing stage end)';
COMMENT ON COLUMN elena_dm_contacts.followup_sent IS 'Whether the followup message has been sent';
