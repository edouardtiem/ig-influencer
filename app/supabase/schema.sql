-- ===========================================
-- CONTENT BRAIN - Full Supabase Schema
-- ===========================================
-- Version: 1.1.0
-- Created: 20 décembre 2024
-- Updated: 21 décembre 2024 (Relationship Layer)
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
-- TABLE: relationship_hints
-- Track "The Secret" hints between Mila & Elena
-- ===========================================
CREATE TABLE IF NOT EXISTS relationship_hints (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

hint_type VARCHAR(50) NOT NULL,              -- 'two_cups' | 'same_location' | 'shared_item' etc.
hint_level INTEGER NOT NULL DEFAULT 3,       -- 1-5 teasing level

-- Where it was used
character VARCHAR(50) NOT NULL,              -- Which account posted this
post_id UUID REFERENCES posts(id),
schedule_id UUID REFERENCES daily_schedules(id),

-- What the hint was
description TEXT,                            -- "2 coffee cups visible on table"
caption_element TEXT,                        -- "Cozy morning 💕"
image_element TEXT,                          -- "two cups, feminine hand visible"

-- Performance tracking
engagement_boost DECIMAL(5,2),               -- % increase vs average post
comments_about_relationship INTEGER,         -- "are you guys dating?!" comments

used_at DATE NOT NULL DEFAULT CURRENT_DATE,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_hints_type ON relationship_hints(hint_type);
CREATE INDEX IF NOT EXISTS idx_hints_used_at ON relationship_hints(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_hints_character ON relationship_hints(character);

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
-- THE SECRET: They're together but we NEVER say it
-- ===========================================
INSERT INTO relationships (
character_1, character_2, relationship_type, 
how_they_met, met_date, met_location,
inside_jokes, shared_memories, nicknames,
see_each_other, activities_together
) VALUES (
'mila', 'elena', 'best_friends',
'Sur un shooting photo à Paris. Mila était la photographe, Elena le mannequin. Elena portait un blazer oversize mais Mila a vu son t-shirt Blondie vintage en dessous. "T''écoutes Blondie?!" - Elles ont fini la soirée dans un bar rock du 11e. Inséparables depuis.',
'2024-06-15',
'Studio photo Paris 11ème',
ARRAY[
  'Le fameux croissant volé au café',
  'La fois où Elena a raté son vol et Mila l''a récupérée en pyjama',
  'Mila qui dit toujours "5 min" et arrive 30 min après',
  'Le bar rock du 11e où tout a commencé',
  'Elena qui chante Blondie faux (leur secret)'
],
ARRAY[
  'Premier weekend à Nice chez les parents de Mila (juin 2024)',
  'Ski trip Courchevel février 2025 - Elena apprend à skier (catastrophe)',
  'Bali août 2025 - le voyage qui a tout changé',
  'Premier Noël ensemble décembre 2024 - champagne et promesses',
  'Fashion Week Paris sept 2025 - Elena défile, Mila photographie'
],
'{"mila_calls_elena": "E", "elena_calls_mila": "Mi", "both": "les inséparables", "secret": "ma personne"}',
'daily',
ARRAY['brunch', 'shopping', 'shooting photos', 'workout', 'voyage', 'bar rock secret', 'Netflix nights', 'morning coffee ritual']
)
ON CONFLICT (character_1, character_2) DO UPDATE SET
  how_they_met = EXCLUDED.how_they_met,
  inside_jokes = EXCLUDED.inside_jokes,
  shared_memories = EXCLUDED.shared_memories,
  nicknames = EXCLUDED.nicknames,
  see_each_other = EXCLUDED.see_each_other,
  activities_together = EXCLUDED.activities_together;

-- ===========================================
-- INITIAL DATA: Timeline Events (Lore 2024-2025)
-- Current date reference: December 2025
-- DIVERSE DESTINATIONS pour throwbacks variés
-- ===========================================
INSERT INTO timeline_events (event_date, event_type, title, description, characters, location, emotional_tone) VALUES

-- ═══════════════════════════════════════════════════════════════
-- 2024 — ANNÉE DE LA RENCONTRE
-- ═══════════════════════════════════════════════════════════════
('2024-06-15', 'meeting', 'La rencontre', 'Mila et Elena se rencontrent sur un shooting. Mila était photographe, Elena mannequin. T-shirt Blondie sous le blazer - connexion immédiate. Soirée bar rock du 11e.', ARRAY['mila', 'elena'], 'paris', 'nostalgic'),
('2024-07-01', 'trip', 'Nice chez les parents', 'Elena accompagne Mila chez ses parents à Nice. Premier vrai voyage ensemble, plage, apéros sunset, début de tout.', ARRAY['mila', 'elena'], 'nice', 'nostalgic'),
('2024-07-15', 'trip', 'Road trip Côte d''Azur', 'De Nice à St Tropez en voiture. Plages, Pampelonne, rosé, Club 55. Premier bikini content ensemble.', ARRAY['mila', 'elena'], 'st_tropez', 'adventurous'),
('2024-08-10', 'trip', 'Ibiza Girls Trip', 'Une semaine à Ibiza. Villa avec piscine, sunsets à Café del Mar, soirées, plages cachées.', ARRAY['mila', 'elena'], 'ibiza', 'adventurous'),
('2024-09-05', 'trip', 'Milan Fashion Week', 'Premier Fashion Week ensemble. Elena défile, Mila photographie. Aperol sur les Navigli.', ARRAY['mila', 'elena'], 'milan', 'excited'),
('2024-10-15', 'memory', 'Halloween à Paris', 'Soirée déguisées. Mila en Catwoman, Elena en Wednesday Addams. Photos iconiques au bar rock.', ARRAY['mila', 'elena'], 'paris', 'funny'),
('2024-11-20', 'trip', 'Weekend Mykonos hors saison', 'Mykonos en novembre - calme, romantique, villas vides, sunsets privés. Le trip qui a tout changé.', ARRAY['mila', 'elena'], 'mykonos', 'romantic'),
('2024-12-24', 'milestone', 'Premier Noël ensemble', 'Réveillon à deux chez Mila. Champagne, cadeaux, promesses de voyager le monde ensemble.', ARRAY['mila', 'elena'], 'paris', 'romantic'),

-- ═══════════════════════════════════════════════════════════════
-- 2025 — DÉBUT D''ANNÉE (Janvier-Mars)
-- ═══════════════════════════════════════════════════════════════
('2025-01-05', 'trip', 'Nouvel An aux Maldives', 'Bungalow sur pilotis, snorkeling, sunset dinners. Début d''année parfait.', ARRAY['mila', 'elena'], 'maldives', 'adventurous'),
('2025-02-10', 'trip', 'Ski Trip Courchevel', 'Une semaine au ski. Elena apprend (catastrophe drôle). Jacuzzi, raclette, fous rires.', ARRAY['mila', 'elena'], 'courchevel', 'adventurous'),
('2025-02-14', 'memory', 'Valentine''s à Courchevel', 'Saint-Valentin au chalet. Personne n''a posté mais le dîner était parfait.', ARRAY['mila', 'elena'], 'courchevel', 'romantic'),
('2025-03-15', 'trip', 'Elena à Dubai solo', 'Shooting pour une marque luxe. Marina, désert, rooftops. Mila manquait.', ARRAY['elena'], 'dubai', 'glamorous'),
('2025-03-20', 'trip', 'Mila surf Hossegor', 'Une semaine de surf avec des amis. Van life, vagues, feux de camp. Elena a rejoint le weekend.', ARRAY['mila'], 'hossegor', 'adventurous'),

-- ═══════════════════════════════════════════════════════════════
-- 2025 — PRINTEMPS (Avril-Juin)
-- ═══════════════════════════════════════════════════════════════
('2025-04-05', 'trip', 'Lisbonne escape', 'City trip imprévu. Alfama, pastéis de nata, tram 28, miradouros sunset.', ARRAY['mila', 'elena'], 'lisbon', 'adventurous'),
('2025-04-20', 'trip', 'Weekend Milan', 'Elena shooting Armani, Mila l''accompagne. Via Montenapoleone, pasta, Aperol Navigli.', ARRAY['mila', 'elena'], 'milan', 'adventurous'),
('2025-05-10', 'trip', 'Cannes Film Festival', 'Tapis rouge, yachts, soirées. Elena invitée, Mila +1. Glamour absolu.', ARRAY['mila', 'elena'], 'cannes', 'glamorous'),
('2025-05-25', 'trip', 'Amalfi Coast road trip', 'Positano, Ravello, Capri. Vespa, limoncello, pasta vue mer. Photos iconiques.', ARRAY['mila', 'elena'], 'amalfi', 'adventurous'),
('2025-06-01', 'trip', 'Elena Monaco Grand Prix', 'Weekend luxe à Monaco. Yachts, casino, rooftops. Elena solo (travail).', ARRAY['elena'], 'monaco', 'glamorous'),
('2025-06-15', 'milestone', '1 an d''amitié', 'Un an depuis leur rencontre. Dîner au Meurice pour fêter ça. Posts nostalgie.', ARRAY['mila', 'elena'], 'paris', 'nostalgic'),

-- ═══════════════════════════════════════════════════════════════
-- 2025 — ÉTÉ (Juillet-Août)
-- ═══════════════════════════════════════════════════════════════
('2025-07-01', 'trip', 'St Tropez Summer', 'Retour à St Tropez. Villa avec pool, Club 55, yacht day, rosé sunset.', ARRAY['mila', 'elena'], 'st_tropez', 'adventurous'),
('2025-07-15', 'trip', 'Mila Nice famille', 'Mila retourne voir ses parents. Plage des galets, vieux Nice, apéros familiaux. Elena rejoint 3 jours.', ARRAY['mila'], 'nice', 'nostalgic'),
('2025-07-20', 'trip', 'Santorini dream', 'Une semaine à Santorin. Hôtel vue caldera, sunset Oia, dîners aux chandelles.', ARRAY['mila', 'elena'], 'santorini', 'romantic'),
('2025-08-01', 'trip', 'Bali Trip', 'Le voyage de rêve. 2 semaines - villas rizières, yoga sunrise, temples, plages privées.', ARRAY['mila', 'elena'], 'bali', 'adventurous'),
('2025-08-20', 'trip', 'Mila Barcelona solo', 'Weekend Barcelona pour un shooting. Barceloneta, tapas, nightlife. Retrouvailles avec amis.', ARRAY['mila'], 'barcelona', 'adventurous'),

-- ═══════════════════════════════════════════════════════════════
-- 2025 — AUTOMNE (Septembre-Novembre)
-- ═══════════════════════════════════════════════════════════════
('2025-09-05', 'trip', 'NYC Fashion Week', 'Elena défile à New York. Mila photographie backstage. SoHo, rooftops, pizza.', ARRAY['mila', 'elena'], 'nyc', 'excited'),
('2025-09-15', 'memory', 'Fashion Week Paris', 'Elena défile pour 3 maisons. Mila backstage à chaque show. Their moment.', ARRAY['mila', 'elena'], 'paris', 'excited'),
('2025-10-01', 'trip', 'London Fashion', 'Extension London. Claridge''s tea time, Shoreditch coffee, Camden vibes.', ARRAY['mila', 'elena'], 'london', 'adventurous'),
('2025-10-15', 'trip', 'Elena Tulum retreat', 'Retraite wellness solo. Cenotes, yoga, jungle, beach club. Reconnexion.', ARRAY['elena'], 'tulum', 'peaceful'),
('2025-10-20', 'trip', 'Mila Amsterdam weekend', 'City trip avec amis photographes. Canaux, musées, coffee shops. Créativité.', ARRAY['mila'], 'amsterdam', 'adventurous'),
('2025-11-01', 'milestone', 'Elena nouveau loft', 'Elena emménage au loft du 8ème. Crémaillère - Mila première invitée, dernière partie.', ARRAY['elena'], 'paris', 'excited'),
('2025-11-15', 'trip', 'Weekend capri late season', 'Capri en novembre - calme, Faraglioni, limoncello. Derniers jours de douceur.', ARRAY['mila', 'elena'], 'capri', 'nostalgic'),

-- ═══════════════════════════════════════════════════════════════
-- 2025 — HIVER (Décembre)
-- ═══════════════════════════════════════════════════════════════
('2025-12-01', 'memory', 'Marché de Noël Paris', 'Champs-Élysées illuminations. Vin chaud, churros, photos magiques.', ARRAY['mila', 'elena'], 'paris', 'cozy'),
('2025-12-10', 'trip', 'Spa Alpes weekend', 'Weekend détente avant les fêtes. Spa montagne, piscine chauffée, neige, massages.', ARRAY['mila', 'elena'], 'courchevel', 'peaceful'),
('2025-12-15', 'memory', 'Shopping de Noël', 'Galeries Lafayette sous la coupole. Cadeaux, chocolat chaud, rires. Mila galère, Elena organisée.', ARRAY['mila', 'elena'], 'paris', 'funny')

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

