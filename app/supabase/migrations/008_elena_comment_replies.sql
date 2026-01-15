-- ===========================================
-- MIGRATION 008: Elena Comment Replies Table
-- ===========================================
-- Auto-reply to Instagram comments via ManyChat + Claude
-- Created: 2025-01-15
-- ===========================================

-- Table for tracking comment replies
CREATE TABLE IF NOT EXISTS elena_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Instagram data
  comment_id TEXT UNIQUE NOT NULL,
  post_id TEXT,
  username TEXT NOT NULL,
  user_id TEXT,
  
  -- Content
  original_comment TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  
  -- Metadata
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id 
  ON elena_comment_replies(comment_id);

-- Index for analytics by date
CREATE INDEX IF NOT EXISTS idx_comment_replies_created_at 
  ON elena_comment_replies(created_at);

-- Index for post-level analytics
CREATE INDEX IF NOT EXISTS idx_comment_replies_post_id 
  ON elena_comment_replies(post_id);

-- ===========================================
-- COMMENTS
-- ===========================================
-- 
-- This table stores all comment replies sent by Elena:
-- - Tracks original comment and our reply
-- - Prevents duplicate replies via unique comment_id
-- - Allows analytics on reply volume, skip rate, etc.
--
-- Usage:
-- SELECT COUNT(*) FROM elena_comment_replies WHERE created_at > NOW() - INTERVAL '1 day';
-- SELECT COUNT(*) FILTER (WHERE skipped) FROM elena_comment_replies;
-- ===========================================
