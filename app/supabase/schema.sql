-- ===========================================
-- CONTENT BRAIN - Full Supabase Schema
-- ===========================================
-- Version: 1.0.0
-- Created: 20 décembre 2024
-- 
-- Execute this in Supabase SQL Editor
-- ===========================================

-- ===========================================
-- TABLE: characters
-- Personnages du projet (Mila, Elena)
-- ===========================================
CREATE TABLE IF NOT EXISTS characters (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(50) UNIQUE NOT NULL,           -- 'mila' | 'elena'
full_name VARCHAR(100) NOT NULL,            -- 'Mila Verne'
instagram_handle VARCHAR(50) NOT NULL,      -- '@mila_verne'
instagram_account_id VARCHAR(50),

-- Character traits
age INTEGER,
job VARCHAR(100),
city VARCHAR(100),
personality TEXT,
interests TEXT[],
style_keywords TEXT[],

-- References
face_reference_url TEXT,
body_reference_url TEXT,
additional_references TEXT[],

-- Metadata
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: posts
-- Historique de tous les posts publiés
-- ===========================================
CREATE TABLE IF NOT EXISTS posts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- Identité
character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
character_name VARCHAR(50) NOT NULL,        -- 'mila' | 'elena' (denormalized for speed)
instagram_post_id VARCHAR(100) UNIQUE,
instagram_permalink TEXT,

-- Contenu
post_type VARCHAR(20) NOT NULL,             -- 'photo' | 'carousel' | 'reel'
caption TEXT,
hashtags TEXT[],
image_urls TEXT[] NOT NULL,
video_url TEXT,

-- Contexte narratif
location_key VARCHAR(100),                  -- 'paris_loft' | 'milan_fashion' etc.
location_name TEXT,                         -- 'Loft Parisien'
location_country VARCHAR(50),
outfit_description TEXT,
action_description TEXT,
mood VARCHAR(50),                           -- 'cozy' | 'adventure' | 'work' | 'party' | 'relax'

-- Crossover
with_character VARCHAR(50),                 -- NULL | 'mila' | 'elena'
narrative_arc_id UUID,                      -- Link to active arc

-- Génération
prompt TEXT,
negative_prompt TEXT,
model_used VARCHAR(100),                    -- 'nano-banana-pro' | 'kling-v2.5'
generation_params JSONB,

-- Analytics (updated async)
likes_count INTEGER DEFAULT 0,
comments_count INTEGER DEFAULT 0,
saves_count INTEGER DEFAULT 0,
shares_count INTEGER DEFAULT 0,
reach INTEGER DEFAULT 0,
impressions INTEGER DEFAULT 0,
engagement_rate DECIMAL(5,2),

-- Timestamps
posted_at TIMESTAMPTZ,
scheduled_for TIMESTAMPTZ,
analytics_updated_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: timeline_events
-- Le "lore" - événements passés partagés
-- ===========================================
CREATE TABLE IF NOT EXISTS timeline_events (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

event_date DATE NOT NULL,
event_type VARCHAR(50) NOT NULL,            -- 'meeting' | 'trip' | 'milestone' | 'memory'
title VARCHAR(200) NOT NULL,
description TEXT NOT NULL,

characters TEXT[] NOT NULL,                 -- ['mila', 'elena'] or ['mila']
location VARCHAR(100),

-- For throwbacks
shareable BOOLEAN DEFAULT TRUE,             -- Can be referenced in posts
emotional_tone VARCHAR(50),                 -- 'nostalgic' | 'funny' | 'romantic' | 'adventurous'

-- Optional media
reference_image_url TEXT,

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: narrative_arcs
-- Arcs narratifs (mini-histoires multi-posts)
-- ===========================================
CREATE TABLE IF NOT EXISTS narrative_arcs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

name VARCHAR(100) UNIQUE NOT NULL,          -- 'alps_trip_dec_2024'
title VARCHAR(200) NOT NULL,                -- 'Vacances aux Alpes'
description TEXT,

characters TEXT[] NOT NULL,                 -- ['mila', 'elena']
status VARCHAR(20) DEFAULT 'planned',       -- 'planned' | 'active' | 'completed'

-- Timeline
start_date DATE,
end_date DATE,

-- Posts planning
planned_posts INTEGER,
completed_posts INTEGER DEFAULT 0,
post_sequence JSONB,                        -- Ordered list of planned posts

-- Location
main_location VARCHAR(100),
location_country VARCHAR(50),

created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: relationships
-- Détails des relations entre personnages
-- ===========================================
CREATE TABLE IF NOT EXISTS relationships (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

character_1 VARCHAR(50) NOT NULL,
character_2 VARCHAR(50) NOT NULL,
relationship_type VARCHAR(50) NOT NULL,     -- 'best_friends' | 'colleagues' | 'roommates'

how_they_met TEXT NOT NULL,
met_date DATE,
met_location VARCHAR(100),

-- Fun details
inside_jokes TEXT[],
shared_memories TEXT[],
nicknames JSONB,                            -- {"mila_calls_elena": "E", "elena_calls_mila": "Milou"}

-- Frequency
see_each_other VARCHAR(50),                 -- 'daily' | 'weekly' | '3x_week'
activities_together TEXT[],

created_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE(character_1, character_2)
);

-- ===========================================
-- TABLE: caption_templates
-- Templates de captions par catégorie
-- ===========================================
CREATE TABLE IF NOT EXISTS caption_templates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

character VARCHAR(50),                      -- NULL = both, 'mila', 'elena'
category VARCHAR(50) NOT NULL,              -- 'cozy' | 'fitness' | 'travel' | 'duo' | 'fashion'
mood VARCHAR(50),                           -- 'playful' | 'chill' | 'excited'

template TEXT NOT NULL,                     -- "Ce moment où {action}... {question}"
questions TEXT[],                           -- ["Vous êtes team X ou Y?", "Et vous?"]
ctas TEXT[],                                -- ["Link in bio", "Swipe pour voir"]

hashtag_pool TEXT[],

usage_count INTEGER DEFAULT 0,
last_used_at TIMESTAMPTZ,

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: daily_schedules
-- Planning quotidien généré par Content Brain
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_schedules (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

schedule_date DATE NOT NULL,
character VARCHAR(50) NOT NULL,

-- Direction du jour (généré par Claude)
daily_theme TEXT,                           -- "Journée cozy à Paris"
mood VARCHAR(50),

-- Posts planifiés
scheduled_posts JSONB NOT NULL,             -- [{time: "08:30", type: "carousel", params: {...}}]

-- Status
status VARCHAR(20) DEFAULT 'pending',       -- 'pending' | 'in_progress' | 'completed' | 'partial'
posts_completed INTEGER DEFAULT 0,
posts_total INTEGER NOT NULL,

-- Generation
generated_by VARCHAR(50) DEFAULT 'content_brain',
generation_reasoning TEXT,                  -- Why these choices

created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE(schedule_date, character)
);

-- ===========================================
-- TABLE: conversations
-- Historique des conversations (comments, DMs)
-- ===========================================
CREATE TABLE IF NOT EXISTS conversations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

character VARCHAR(50) NOT NULL,             -- Which account
instagram_user_id VARCHAR(100) NOT NULL,
username VARCHAR(100) NOT NULL,

first_contact_at TIMESTAMPTZ DEFAULT NOW(),
last_message_at TIMESTAMPTZ DEFAULT NOW(),

-- Categorization
user_type VARCHAR(50),                      -- 'photographer' | 'fitness' | 'brand' | 'fan'
engagement_level VARCHAR(20),               -- 'high' | 'medium' | 'low'
notes TEXT,

-- Stats
total_interactions INTEGER DEFAULT 0,

UNIQUE(character, instagram_user_id)
);

-- ===========================================
-- TABLE: messages
-- Messages individuels
-- ===========================================
CREATE TABLE IF NOT EXISTS messages (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

direction VARCHAR(10) NOT NULL,             -- 'inbound' | 'outbound'
message_type VARCHAR(20) DEFAULT 'text',    -- 'text' | 'comment' | 'dm' | 'story_reply'
content TEXT NOT NULL,

-- Context
post_id UUID REFERENCES posts(id),          -- If comment on a post

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABLE: analytics_snapshots
-- Snapshots quotidiens des analytics globales
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

character VARCHAR(50) NOT NULL,
snapshot_date DATE NOT NULL,

-- Account metrics
followers_count INTEGER,
following_count INTEGER,
posts_count INTEGER,

-- Engagement
total_likes_week INTEGER,
total_comments_week INTEGER,
total_saves_week INTEGER,
avg_engagement_rate DECIMAL(5,2),

-- Best performers
best_post_type VARCHAR(20),
best_location VARCHAR(100),
best_mood VARCHAR(50),
best_posting_hour INTEGER,

created_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE(character, snapshot_date)
);

-- ===========================================
-- INDEXES for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_posts_character ON posts(character_name);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location_key);
CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_posts_with_character ON posts(with_character);

CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_characters ON timeline_events USING GIN(characters);

CREATE INDEX IF NOT EXISTS idx_arcs_status ON narrative_arcs(status);
CREATE INDEX IF NOT EXISTS idx_arcs_characters ON narrative_arcs USING GIN(characters);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON daily_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON daily_schedules(status);

CREATE INDEX IF NOT EXISTS idx_templates_category ON caption_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_character ON caption_templates(character);

-- ===========================================
-- INITIAL DATA: Characters
-- ===========================================
INSERT INTO characters (name, full_name, instagram_handle, age, job, city, personality, interests, style_keywords) VALUES
(
'mila',
'Mila Verne',
'@mila_verne',
26,
'Personal Trainer & Photographe',
'Paris',
'Authentique, passionnée, sportive mais sensuelle. Équilibre entre fitness et douceur.',
ARRAY['fitness', 'photographie', 'yoga', 'musique', 'voyage', 'café'],
ARRAY['athleisure', 'natural', 'cozy', 'casual chic']
),
(
'elena',
'Elena Visconti',
'@elenav.paris',
24,
'Mannequin & Influenceuse Mode',
'Paris',
'Sophistiquée, jet-set, mystérieuse. Luxe discret mais assumé.',
ARRAY['mode', 'voyage luxe', 'spa', 'gastronomie', 'art'],
ARRAY['designer', 'elegant', 'minimalist luxe', 'french girl']
)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- INITIAL DATA: Relationship Mila x Elena
-- ===========================================
INSERT INTO relationships (
character_1, character_2, relationship_type, 
how_they_met, met_date, met_location,
inside_jokes, shared_memories, nicknames,
see_each_other, activities_together
) VALUES (
'mila', 'elena', 'best_friends',
'Sur un shooting photo à Paris. Mila était la photographe, Elena le mannequin. Connexion immédiate.',
'2024-06-15',
'Studio photo Paris 11ème',
ARRAY[
  'Le fameux croissant volé',
  'La fois où Elena a raté son vol',
  'Mila qui dit toujours "5 min" et arrive 30 min après'
],
ARRAY[
  'Premier weekend à Nice chez les parents de Mila',
  'Ski trip Courchevel février 2024',
  'Bali août 2024 - trip de rêve',
  'Premier Noël ensemble décembre 2023'
],
'{"mila_calls_elena": "E", "elena_calls_mila": "Mi", "both": "les inséparables"}',
'3x_week',
ARRAY['brunch', 'shopping', 'shooting photos', 'workout', 'voyage']
)
ON CONFLICT (character_1, character_2) DO NOTHING;

-- ===========================================
-- INITIAL DATA: Timeline Events (Lore 2024-2025)
-- Current date reference: December 2025
-- ===========================================
INSERT INTO timeline_events (event_date, event_type, title, description, characters, location, emotional_tone) VALUES
-- 2024
('2024-06-15', 'meeting', 'La rencontre', 'Mila et Elena se rencontrent sur un shooting. Mila était photographe, Elena mannequin. Connexion immédiate autour d''un café après le shooting.', ARRAY['mila', 'elena'], 'paris', 'nostalgic'),
('2024-08-12', 'trip', 'Premier weekend ensemble', 'Elena accompagne Mila chez ses parents à Nice. Premier vrai voyage ensemble, début de l''amitié.', ARRAY['mila', 'elena'], 'nice', 'nostalgic'),
('2024-10-15', 'memory', 'Halloween à Paris', 'Soirée déguisées ensemble. Mila en Catwoman, Elena en Wednesday Addams. Photos iconiques.', ARRAY['mila', 'elena'], 'paris', 'funny'),
('2024-12-24', 'milestone', 'Premier Noël ensemble', 'Réveillon à deux dans l''appartement de Mila. Champagne, cadeaux, et promesse de voyager ensemble en 2025.', ARRAY['mila', 'elena'], 'paris', 'romantic'),

-- 2025
('2025-02-10', 'trip', 'Ski Trip Courchevel', 'Une semaine aux sports d''hiver. Elena apprend à skier (catastrophique mais drôle). Jacuzzi tous les soirs.', ARRAY['mila', 'elena'], 'courchevel', 'adventurous'),
('2025-04-20', 'trip', 'Weekend Milan', 'Elena pour un shooting, Mila l''accompagne. Shopping Via Montenapoleone, pasta et Aperol.', ARRAY['mila', 'elena'], 'milan', 'adventurous'),
('2025-06-15', 'milestone', '1 an d''amitié', 'Un an depuis leur rencontre. Dîner au Meurice pour fêter ça. Posts nostalgie sur leurs deux comptes.', ARRAY['mila', 'elena'], 'paris', 'nostalgic'),
('2025-08-01', 'trip', 'Bali Trip', 'Le voyage de rêve. 2 semaines à Bali - villas, plages privées, yoga sunrise, cérémonies traditionnelles.', ARRAY['mila', 'elena'], 'bali', 'adventurous'),
('2025-09-15', 'memory', 'Fashion Week Paris', 'Elena défile, Mila la photographie backstage. Moment fort de leur collaboration professionnelle.', ARRAY['mila', 'elena'], 'paris', 'excited'),
('2025-11-01', 'milestone', 'Elena nouveau loft', 'Elena emménage dans son nouveau loft parisien du 8ème. Crémaillère avec Mila première invitée.', ARRAY['elena'], 'paris', 'excited'),
('2025-12-01', 'memory', 'Marché de Noël', 'Première sortie au marché de Noël des Champs-Élysées. Vin chaud et photos devant les illuminations.', ARRAY['mila', 'elena'], 'paris', 'cozy'),
('2025-12-15', 'memory', 'Shopping de Noël', 'Shopping aux Galeries Lafayette. Choix des cadeaux pour leurs familles. Mila galère, Elena est organisée.', ARRAY['mila', 'elena'], 'paris', 'funny')
ON CONFLICT DO NOTHING;

-- ===========================================
-- INITIAL DATA: Caption Templates
-- ===========================================
INSERT INTO caption_templates (character, category, mood, template, questions, ctas, hashtag_pool) VALUES
-- Mila templates
('mila', 'fitness', 'motivated', 'Morning workout done ✓ {detail}', ARRAY['Vous êtes team matin ou soir pour le sport?', 'Quel est votre exercice préféré?'], ARRAY['Save pour ta prochaine session'], ARRAY['#fitness', '#workout', '#fitnessmotivation', '#gymlife', '#healthylifestyle']),
('mila', 'cozy', 'chill', 'Ces moments de calme... {detail}', ARRAY['Vous êtes team thé ou café?', 'Comment vous relaxez-vous?'], ARRAY['Link in bio pour mes routines'], ARRAY['#cozy', '#cozyhome', '#sundayvibes', '#relaxation', '#homesweethome']),
('mila', 'photography', 'creative', 'Behind the lens today 📸 {detail}', ARRAY['Quel est votre spot photo préféré à Paris?'], ARRAY['Swipe pour voir le résultat'], ARRAY['#photography', '#photographer', '#parisphoto', '#behindthescenes']),

-- Elena templates
('elena', 'fashion', 'elegant', 'Parisian mood today ✨ {detail}', ARRAY['Votre marque française préférée?', 'Team talons ou sneakers?'], ARRAY['Outfit details in stories'], ARRAY['#fashion', '#parisian', '#frenchstyle', '#ootd', '#luxurylifestyle']),
('elena', 'travel', 'adventurous', 'New destination unlocked 📍 {detail}', ARRAY['Votre prochaine destination de rêve?', 'Hotel ou Airbnb?'], ARRAY['Travel tips in stories'], ARRAY['#travel', '#wanderlust', '#luxurytravel', '#travelgram', '#jetset']),
('elena', 'spa', 'relaxed', 'Self-care Sunday 🤍 {detail}', ARRAY['Votre routine spa préférée?'], ARRAY['Skincare routine linked'], ARRAY['#selfcare', '#spa', '#wellness', '#skincare', '#pamperday']),

-- Duo templates
(NULL, 'duo', 'playful', 'When your bestie is also your {role}... {detail}', ARRAY['Tag ta BFF!', 'Vous aussi vous faites ça avec votre bestie?'], ARRAY['Plus de nous deux en stories'], ARRAY['#bestfriends', '#bff', '#friendshipgoals', '#girlstrip', '#duo']),
(NULL, 'duo_travel', 'excited', 'Adventures are better with your person 💕 {detail}', ARRAY['Avec qui vous partiriez demain?'], ARRAY['Vlog du trip bientôt'], ARRAY['#travelwithfriends', '#girlstrip', '#wanderlust', '#bffgoals'])
ON CONFLICT DO NOTHING;

