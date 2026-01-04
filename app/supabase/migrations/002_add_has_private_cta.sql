-- ===========================================
-- Migration: Add has_private_cta column to scheduled_posts
-- ===========================================
-- Version: 1.0.0
-- Created: 4 January 2026
-- 
-- Adds tracking for soft CTA to private content
-- ===========================================

-- Add column to scheduled_posts table
ALTER TABLE scheduled_posts 
ADD COLUMN IF NOT EXISTS has_private_cta BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN scheduled_posts.has_private_cta IS 'Whether the caption includes a soft CTA to private content';

