-- ===========================================
-- Migration 010: Add fanvue_link_sent_count column
-- Track how many times we've sent the Fanvue link (max 3)
-- ===========================================

-- Add column to track link send count
ALTER TABLE elena_dm_contacts 
ADD COLUMN IF NOT EXISTS fanvue_link_sent_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN elena_dm_contacts.fanvue_link_sent_count IS 'Number of times Fanvue link was sent (max 3, then reference only)';

-- Update existing contacts that have been pitched to have at least 1
UPDATE elena_dm_contacts 
SET fanvue_link_sent_count = 1 
WHERE fanvue_pitched_at IS NOT NULL 
  AND fanvue_link_sent_count = 0;
