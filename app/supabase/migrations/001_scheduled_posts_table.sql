-- Migration: Add scheduled_posts table for granular status tracking
-- Run this in Supabase SQL Editor
-- Created: 2024-12-23

-- ===========================================
-- TABLE: scheduled_posts
-- Individual posts with granular status tracking
-- ===========================================
CREATE TABLE IF NOT EXISTS scheduled_posts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
schedule_id UUID REFERENCES daily_schedules(id) ON DELETE CASCADE,
character VARCHAR(50) NOT NULL,
scheduled_date DATE NOT NULL,
scheduled_time TIME NOT NULL,

-- Status tracking
-- scheduled: Post planned, not yet processed
-- generating: Currently generating images
-- images_ready: Images generated, ready to post
-- posting: Currently publishing to Instagram
-- posted: Successfully published
-- failed: Error occurred (check error_message)
status VARCHAR(20) DEFAULT 'scheduled',

-- Content params (from scheduler)
post_type VARCHAR(20) NOT NULL,              -- 'carousel' | 'reel'
reel_type VARCHAR(20),                       -- 'photo' | 'video' (if reel)
reel_theme VARCHAR(50),                      -- 'fitness' | 'spa' | 'lifestyle' | 'travel'
content_type VARCHAR(20),                    -- 'new' | 'throwback' | 'duo' | 'response'
location_key VARCHAR(100),
location_name TEXT,
mood VARCHAR(50),
outfit TEXT,
action TEXT,
caption TEXT,
hashtags TEXT[],
prompt_hints TEXT,

-- Generated content (filled by executor)
image_urls TEXT[],                           -- Cloudinary URLs of generated images
video_url TEXT,                              -- If reel video
cloudinary_ids TEXT[],                       -- For cleanup if needed

-- Instagram result (filled after posting)
instagram_post_id VARCHAR(100),
instagram_permalink TEXT,

-- Error tracking
error_message TEXT,
error_step VARCHAR(20),                      -- Which step failed: 'generating' | 'posting'
retry_count INTEGER DEFAULT 0,
max_retries INTEGER DEFAULT 3,

-- Timestamps
generation_started_at TIMESTAMPTZ,
generation_completed_at TIMESTAMPTZ,
posting_started_at TIMESTAMPTZ,
posted_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

-- Unique constraint: one post per schedule + time
UNIQUE(schedule_id, scheduled_time)
);

-- Indexes for scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_date ON scheduled_posts(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_character ON scheduled_posts(character);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_schedule ON scheduled_posts(schedule_id);

