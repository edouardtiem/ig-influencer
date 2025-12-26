-- ===========================================
-- DM AUTOMATION — Elena Visconti
-- ===========================================
-- Version: 1.0.0
-- Created: 26 décembre 2024
-- 
-- Tables spécifiques pour l'automatisation des DMs
-- avec lead scoring et conversion Fanvue
-- ===========================================

-- ===========================================
-- TABLE: elena_dm_contacts
-- Leads/contacts avec scoring
-- ===========================================
CREATE TABLE IF NOT EXISTS elena_dm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Instagram data
  ig_user_id TEXT UNIQUE NOT NULL,
  ig_username TEXT,
  ig_name TEXT,
  ig_profile_pic TEXT,
  
  -- Lead scoring
  -- cold: 1-3 messages, just started
  -- warm: 4-7 messages, engaged
  -- hot: 8+ messages, ready for pitch
  -- pitched: Fanvue link sent
  -- converted: Created free Fanvue account
  -- paid: Subscribed or bought pack
  stage TEXT DEFAULT 'cold' CHECK (stage IN ('cold', 'warm', 'hot', 'pitched', 'converted', 'paid')),
  score INT DEFAULT 0,
  
  -- Conversation metrics
  message_count INT DEFAULT 0,
  our_message_count INT DEFAULT 0,
  avg_response_time_seconds INT,
  
  -- Conversion tracking
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  fanvue_pitched_at TIMESTAMPTZ,
  fanvue_link_clicked BOOLEAN DEFAULT FALSE,
  fanvue_converted_at TIMESTAMPTZ,
  fanvue_paid_at TIMESTAMPTZ,
  
  -- Revenue tracking
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Notes & tags
  notes TEXT,
  tags TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: elena_dm_messages
-- Historique des messages
-- ===========================================
CREATE TABLE IF NOT EXISTS elena_dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES elena_dm_contacts(id) ON DELETE CASCADE,
  
  -- Message data
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  content TEXT NOT NULL,
  
  -- AI analysis (filled on incoming messages)
  intent TEXT, -- compliment, question, flirt, greeting, objection, spam, ai_question
  sentiment TEXT, -- positive, neutral, negative
  is_question BOOLEAN DEFAULT FALSE,
  mentions_fanvue BOOLEAN DEFAULT FALSE,
  
  -- Response metadata (filled on outgoing)
  response_strategy TEXT, -- engage, nurture, qualify, pitch, handle_objection
  response_time_ms INT,
  stage_at_time TEXT, -- Stage when message was sent
  
  -- ManyChat metadata
  manychat_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: elena_dm_stats
-- Stats journalières pour tracking
-- ===========================================
CREATE TABLE IF NOT EXISTS elena_dm_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Volume
  new_contacts INT DEFAULT 0,
  total_messages_in INT DEFAULT 0,
  total_messages_out INT DEFAULT 0,
  
  -- Conversions
  moved_to_warm INT DEFAULT 0,
  moved_to_hot INT DEFAULT 0,
  fanvue_pitched INT DEFAULT 0,
  fanvue_converted INT DEFAULT 0,
  fanvue_paid INT DEFAULT 0,
  
  -- Revenue
  daily_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Performance
  avg_messages_to_pitch DECIMAL(5,2),
  avg_messages_to_convert DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_dm_contacts_stage ON elena_dm_contacts(stage);
CREATE INDEX IF NOT EXISTS idx_dm_contacts_last_contact ON elena_dm_contacts(last_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_contacts_ig_user ON elena_dm_contacts(ig_user_id);
CREATE INDEX IF NOT EXISTS idx_dm_contacts_username ON elena_dm_contacts(ig_username);

CREATE INDEX IF NOT EXISTS idx_dm_messages_contact ON elena_dm_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created ON elena_dm_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_direction ON elena_dm_messages(direction);

CREATE INDEX IF NOT EXISTS idx_dm_stats_date ON elena_dm_stats(stat_date DESC);

-- ===========================================
-- TRIGGER: Auto-update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_dm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_contacts_updated_at
  BEFORE UPDATE ON elena_dm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_dm_updated_at();

CREATE TRIGGER dm_stats_updated_at
  BEFORE UPDATE ON elena_dm_stats
  FOR EACH ROW EXECUTE FUNCTION update_dm_updated_at();

-- ===========================================
-- FUNCTION: Get or create contact
-- ===========================================
CREATE OR REPLACE FUNCTION get_or_create_dm_contact(
  p_ig_user_id TEXT,
  p_ig_username TEXT DEFAULT NULL,
  p_ig_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  -- Try to find existing contact
  SELECT id INTO v_contact_id
  FROM elena_dm_contacts
  WHERE ig_user_id = p_ig_user_id;
  
  -- If not found, create new
  IF v_contact_id IS NULL THEN
    INSERT INTO elena_dm_contacts (ig_user_id, ig_username, ig_name, first_contact_at, last_contact_at)
    VALUES (p_ig_user_id, p_ig_username, p_ig_name, NOW(), NOW())
    RETURNING id INTO v_contact_id;
  ELSE
    -- Update last contact and username if provided
    UPDATE elena_dm_contacts
    SET 
      last_contact_at = NOW(),
      ig_username = COALESCE(p_ig_username, ig_username),
      ig_name = COALESCE(p_ig_name, ig_name)
    WHERE id = v_contact_id;
  END IF;
  
  RETURN v_contact_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- FUNCTION: Update contact stage based on message count
-- ===========================================
CREATE OR REPLACE FUNCTION update_contact_stage(p_contact_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_message_count INT;
  v_current_stage TEXT;
  v_new_stage TEXT;
BEGIN
  -- Get current data
  SELECT message_count, stage INTO v_message_count, v_current_stage
  FROM elena_dm_contacts
  WHERE id = p_contact_id;
  
  -- Don't downgrade from pitched/converted/paid
  IF v_current_stage IN ('pitched', 'converted', 'paid') THEN
    RETURN v_current_stage;
  END IF;
  
  -- Calculate new stage based on message count
  IF v_message_count >= 8 THEN
    v_new_stage := 'hot';
  ELSIF v_message_count >= 4 THEN
    v_new_stage := 'warm';
  ELSE
    v_new_stage := 'cold';
  END IF;
  
  -- Update if changed
  IF v_new_stage != v_current_stage THEN
    UPDATE elena_dm_contacts
    SET stage = v_new_stage
    WHERE id = p_contact_id;
  END IF;
  
  RETURN v_new_stage;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VIEW: Contact summary with last message
-- ===========================================
CREATE OR REPLACE VIEW elena_dm_contacts_summary AS
SELECT 
  c.*,
  (
    SELECT content 
    FROM elena_dm_messages m 
    WHERE m.contact_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as last_message,
  (
    SELECT direction 
    FROM elena_dm_messages m 
    WHERE m.contact_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as last_message_direction
FROM elena_dm_contacts c;

-- ===========================================
-- Helpful queries for debugging
-- ===========================================

-- Get contacts by stage:
-- SELECT * FROM elena_dm_contacts WHERE stage = 'hot' ORDER BY last_contact_at DESC;

-- Get conversation history:
-- SELECT direction, content, created_at 
-- FROM elena_dm_messages 
-- WHERE contact_id = 'xxx' 
-- ORDER BY created_at;

-- Get daily stats:
-- SELECT * FROM elena_dm_stats ORDER BY stat_date DESC LIMIT 7;

-- Get conversion funnel:
-- SELECT stage, COUNT(*) as count 
-- FROM elena_dm_contacts 
-- GROUP BY stage 
-- ORDER BY CASE stage 
--   WHEN 'cold' THEN 1 
--   WHEN 'warm' THEN 2 
--   WHEN 'hot' THEN 3 
--   WHEN 'pitched' THEN 4 
--   WHEN 'converted' THEN 5 
--   WHEN 'paid' THEN 6 
-- END;

