-- ===========================================
-- DAILY TRENDS CACHE TABLE
-- ===========================================
-- Version: 1.0.0
-- Created: January 2025
-- 
-- Stores daily trends from Perplexity for caching
-- Prevents redundant API calls in serverless environment
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_date DATE NOT NULL UNIQUE,
  topics JSONB NOT NULL,
  trending_hashtags TEXT[] NOT NULL,
  suggested_hashtags TEXT[] NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient date lookups
CREATE INDEX IF NOT EXISTS idx_daily_trends_date ON daily_trends(trend_date DESC);

-- Comment for documentation
COMMENT ON TABLE daily_trends IS 'Cache for daily trends fetched from Perplexity API';
COMMENT ON COLUMN daily_trends.trend_date IS 'Date for which trends are valid (unique)';
COMMENT ON COLUMN daily_trends.topics IS 'Array of trend topics with relevance and context';
COMMENT ON COLUMN daily_trends.trending_hashtags IS 'Currently trending hashtags';
COMMENT ON COLUMN daily_trends.suggested_hashtags IS 'Evergreen suggested hashtags';

