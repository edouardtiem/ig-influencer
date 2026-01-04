-- Add language detection fields to elena_dm_contacts
ALTER TABLE elena_dm_contacts
ADD COLUMN IF NOT EXISTS detected_language TEXT DEFAULT NULL;

ALTER TABLE elena_dm_contacts
ADD COLUMN IF NOT EXISTS language_confidence INTEGER DEFAULT 0;

ALTER TABLE elena_dm_contacts
ADD COLUMN IF NOT EXISTS language_detected_at TIMESTAMPTZ DEFAULT NULL;

-- Comments
COMMENT ON COLUMN elena_dm_contacts.detected_language IS 'Detected language code: en, fr, it, es, pt, de, etc. NULL = not yet detected';
COMMENT ON COLUMN elena_dm_contacts.language_confidence IS 'Confidence level 0-10. Set language only when >= 3 (3+ messages in same language) or 10 (explicit statement)';
COMMENT ON COLUMN elena_dm_contacts.language_detected_at IS 'When the language was confidently detected';

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_dm_contacts_language ON elena_dm_contacts(detected_language);

