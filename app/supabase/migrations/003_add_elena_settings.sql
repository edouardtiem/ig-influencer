-- ===========================================
-- Migration: Create elena_settings table
-- ===========================================
-- Date: 2 janvier 2026
-- Purpose: Store global settings like DM pause state
-- ===========================================

-- Create settings table
CREATE TABLE IF NOT EXISTS elena_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default DM settings
INSERT INTO elena_settings (key, value) 
VALUES ('dm_system', '{"paused": false, "paused_at": null, "paused_reason": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON elena_settings
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

