-- =============================================
-- FANVUE DM SYSTEM V2 + LONG-TERM MEMORY
-- Migration: 007_fanvue_dm_system.sql
-- Date: 2026-01-10
-- =============================================

-- fanvue_dm_contacts: Core contact tracking for Fanvue users
CREATE TABLE IF NOT EXISTS fanvue_dm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fanvue_user_id TEXT UNIQUE NOT NULL,
  fanvue_chat_id TEXT,
  username TEXT,
  profile_pic TEXT,
  
  -- Funnel stage
  stage TEXT DEFAULT 'cold' CHECK (stage IN ('cold', 'warm', 'hot', 'pitched', 'paid')),
  score INT DEFAULT 0,
  
  -- Message counts
  message_count INT DEFAULT 0,
  our_message_count INT DEFAULT 0,
  
  -- Timestamps
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  last_user_message_at TIMESTAMPTZ,
  
  -- Language detection (same as IG system)
  detected_language TEXT,  -- en, fr, it, es, pt, de
  language_confidence INT DEFAULT 0,
  language_detected_at TIMESTAMPTZ,
  
  -- Re-engagement tracking
  last_reengagement_at TIMESTAMPTZ,
  reengagement_count INT DEFAULT 0,
  
  -- PPV tracking
  ppv_pitched_at TIMESTAMPTZ,
  ppv_bought_at TIMESTAMPTZ,
  total_revenue INT DEFAULT 0,
  
  -- Stop system
  is_stopped BOOLEAN DEFAULT false,
  stopped_at TIMESTAMPTZ,
  
  -- Meta
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_fanvue_dm_contacts_user_id ON fanvue_dm_contacts(fanvue_user_id);
CREATE INDEX IF NOT EXISTS idx_fanvue_dm_contacts_stage ON fanvue_dm_contacts(stage);
CREATE INDEX IF NOT EXISTS idx_fanvue_dm_contacts_last_user_message ON fanvue_dm_contacts(last_user_message_at);


-- fanvue_user_profiles: Long-term memory for personalization
CREATE TABLE IF NOT EXISTS fanvue_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID UNIQUE REFERENCES fanvue_dm_contacts(id) ON DELETE CASCADE,
  
  -- Personal facts
  display_name TEXT,
  nickname TEXT,
  location TEXT,
  timezone TEXT,  -- IANA timezone (Europe/Paris, America/New_York)
  job TEXT,
  industry TEXT,
  relationship_status TEXT,  -- single, married, complicated, divorced
  has_kids BOOLEAN,
  kids_count INT,
  age_range TEXT,  -- 20s, 30s, 40s, 50s+
  hobbies TEXT[],
  interests TEXT[],
  languages_spoken TEXT[],
  
  -- Buyer behavior
  spending_pattern TEXT CHECK (spending_pattern IN ('impulsive', 'thoughtful', 'price_sensitive', 'big_spender', 'unknown')),
  avg_purchase_value INT,
  total_spent INT DEFAULT 0,
  purchase_count INT DEFAULT 0,
  preferred_price_range TEXT,  -- low (1-3€), medium (3-7€), high (7€+)
  objection_history TEXT[],
  conversion_triggers TEXT[],
  last_purchase_at TIMESTAMPTZ,
  
  -- Psychological profile
  communication_style TEXT CHECK (communication_style IN ('direct', 'playful', 'romantic', 'dominant', 'submissive', 'unknown')),
  emotional_needs TEXT[],  -- validation, attention, fantasy, connection, escape
  tone_preference TEXT CHECK (tone_preference IN ('bratty', 'sweet', 'dominant', 'mysterious', 'playful', 'unknown')),
  content_preferences TEXT[],  -- lingerie, bikini, explicit, roleplay, soft, artistic
  fantasies TEXT[],
  triggers TEXT[],  -- what excites them
  boundaries TEXT[],  -- what they don't like
  
  -- Conversation insights
  topics_discussed TEXT[],
  personal_stories TEXT[],  -- key stories they shared
  compliments_given TEXT[],  -- what they compliment about Elena
  
  -- Meta
  last_analyzed_at TIMESTAMPTZ,
  analysis_version INT DEFAULT 1,
  notes TEXT,
  raw_insights JSONB,  -- Store full Claude analysis for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for profile lookups
CREATE INDEX IF NOT EXISTS idx_fanvue_user_profiles_contact ON fanvue_user_profiles(contact_id);


-- fanvue_dm_messages: Conversation history
CREATE TABLE IF NOT EXISTS fanvue_dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES fanvue_dm_contacts(id) ON DELETE CASCADE,
  
  -- Message data
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  content TEXT NOT NULL,
  
  -- Analysis
  intent TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_question BOOLEAN DEFAULT false,
  mentions_ppv BOOLEAN DEFAULT false,
  
  -- Response metadata
  response_strategy TEXT,
  response_time_ms INT,
  stage_at_time TEXT,
  
  -- Fanvue message ID for deduplication
  fanvue_message_id TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for conversation history
CREATE INDEX IF NOT EXISTS idx_fanvue_dm_messages_contact ON fanvue_dm_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_fanvue_dm_messages_created ON fanvue_dm_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_fanvue_dm_messages_direction ON fanvue_dm_messages(direction);


-- fanvue_ppv_content: Vault of available PPV content
CREATE TABLE IF NOT EXISTS fanvue_ppv_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fanvue post reference
  post_uuid TEXT UNIQUE,  -- Fanvue post UUID after publishing
  
  -- Content info
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,  -- Price in cents (299 = 2.99€)
  category TEXT NOT NULL CHECK (category IN ('teaser', 'soft', 'spicy', 'explicit')),
  
  -- Media
  cloudinary_url TEXT,  -- Full quality image
  teaser_url TEXT,  -- Blurred/cropped preview
  
  -- Targeting
  tags TEXT[],  -- For matching with user preferences
  target_tone TEXT[],  -- Which tone_preference this appeals to
  
  -- Stats
  times_sent INT DEFAULT 0,
  times_purchased INT DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for PPV queries
CREATE INDEX IF NOT EXISTS idx_fanvue_ppv_content_category ON fanvue_ppv_content(category);
CREATE INDEX IF NOT EXISTS idx_fanvue_ppv_content_active ON fanvue_ppv_content(is_active);


-- fanvue_purchases: Track what each user has bought
CREATE TABLE IF NOT EXISTS fanvue_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES fanvue_dm_contacts(id) ON DELETE CASCADE,
  
  -- Purchase info
  post_uuid TEXT NOT NULL,
  ppv_content_id UUID REFERENCES fanvue_ppv_content(id),
  price INT NOT NULL,  -- Price in cents
  
  -- Fanvue data
  fanvue_transaction_id TEXT,
  
  -- Meta
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate purchases
  UNIQUE(contact_id, post_uuid)
);

-- Index for purchase history
CREATE INDEX IF NOT EXISTS idx_fanvue_purchases_contact ON fanvue_purchases(contact_id);
CREATE INDEX IF NOT EXISTS idx_fanvue_purchases_post ON fanvue_purchases(post_uuid);


-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fanvue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to contacts
DROP TRIGGER IF EXISTS fanvue_dm_contacts_updated_at ON fanvue_dm_contacts;
CREATE TRIGGER fanvue_dm_contacts_updated_at
  BEFORE UPDATE ON fanvue_dm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_fanvue_updated_at();

-- Apply to profiles
DROP TRIGGER IF EXISTS fanvue_user_profiles_updated_at ON fanvue_user_profiles;
CREATE TRIGGER fanvue_user_profiles_updated_at
  BEFORE UPDATE ON fanvue_user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_fanvue_updated_at();

-- Apply to ppv content
DROP TRIGGER IF EXISTS fanvue_ppv_content_updated_at ON fanvue_ppv_content;
CREATE TRIGGER fanvue_ppv_content_updated_at
  BEFORE UPDATE ON fanvue_ppv_content
  FOR EACH ROW EXECUTE FUNCTION update_fanvue_updated_at();


-- =============================================
-- ROW LEVEL SECURITY (optional, for API access)
-- =============================================

-- Enable RLS
ALTER TABLE fanvue_dm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanvue_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanvue_dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanvue_ppv_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanvue_purchases ENABLE ROW LEVEL SECURITY;

-- Allow all for service role (backend)
CREATE POLICY "Service role full access on fanvue_dm_contacts" ON fanvue_dm_contacts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on fanvue_user_profiles" ON fanvue_user_profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on fanvue_dm_messages" ON fanvue_dm_messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on fanvue_ppv_content" ON fanvue_ppv_content
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on fanvue_purchases" ON fanvue_purchases
  FOR ALL USING (true) WITH CHECK (true);
