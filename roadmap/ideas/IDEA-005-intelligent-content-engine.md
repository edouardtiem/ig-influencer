# 💡 IDEA-005 — Intelligent Content Engine (Content Brain)

> Moteur de contenu intelligent 100% autonome avec timeline narrative

**Créé** : 17 décembre 2024  
**Mis à jour** : 20 décembre 2024  
**Status** : 💡 Idea → 🚧 Planning  
**Impact** : 🔴 High  
**Effort** : 🔴 High  

---

## 🎯 Objectif

Créer un système **100% autonome** qui :
1. Analyse l'historique et les analytics
2. Décide automatiquement le contenu quotidien
3. Maintient une **histoire cohérente** avec timeline et arcs narratifs
4. Génère et publie sans intervention humaine

---

## 🧠 Concept

### L'Histoire comme Base

Chaque personnage a une **histoire** qui se construit post après post :
- **Où elle était** (lieux visités)
- **Ce qu'elle faisait** (activités)
- **Avec qui** (solo, avec l'autre, etc.)
- **Son mood** (cozy, aventure, travail, etc.)

Cette histoire est stockée dans **Supabase** et devient le contexte pour les futurs posts.

---

## 🔄 Flow Proposé

```
┌─────────────────────────────────────────────────────────────┐
│                    INTELLIGENT CONTENT ENGINE                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. FETCH HISTORY                                            │
│     - Récupérer les N derniers posts (Supabase)              │
│     - Lieux récents, outfits, moods                          │
│     - Posts avec Mila/Elena ensemble                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ANALYZE ANALYTICS                                        │
│     - Likes, comments, saves, shares                         │
│     - Reach, impressions                                     │
│     - Best performing: lieu? outfit? mood? heure?            │
│     - Engagement rate par type de contenu                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. GENERATE PROPOSAL (LLM)                                  │
│     - Input: history + analytics + character sheet           │
│     - Contraintes: pas répéter lieu récent, varier outfits   │
│     - Output: { lieu, outfit, action, mood, caption }        │
│     - Bonus: suggérer crossover si pertinent                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. CREATE CONTENT                                           │
│     - Générer prompt Nano Banana                             │
│     - Générer image(s)                                       │
│     - Si reel: générer vidéo Kling/Minimax                   │
│     - Générer caption + hashtags                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. POST & SAVE                                              │
│     - Publier via Graph API                                  │
│     - Sauvegarder dans Supabase (history)                    │
│     - Log analytics initiales                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. LEARN (async, après 24-48h)                              │
│     - Fetch analytics du post                                │
│     - Update Supabase avec performance                       │
│     - Feed le modèle pour améliorer                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Schema Supabase — Posts History

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identité
  character VARCHAR NOT NULL, -- 'mila' | 'elena'
  instagram_post_id VARCHAR,
  
  -- Contenu
  type VARCHAR NOT NULL, -- 'photo' | 'carousel' | 'reel'
  caption TEXT,
  hashtags TEXT[],
  
  -- Contexte narratif
  location VARCHAR, -- 'paris_loft' | 'milan' | 'maldives' etc.
  location_country VARCHAR,
  outfit_description TEXT,
  action_description TEXT,
  mood VARCHAR, -- 'cozy' | 'adventure' | 'work' | 'party' | 'relax'
  with_character VARCHAR, -- NULL | 'mila' | 'elena' (crossover)
  
  -- Génération
  prompt TEXT,
  negative_prompt TEXT,
  image_urls TEXT[],
  video_url TEXT,
  
  -- Analytics (updated async)
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL,
  
  -- Meta
  posted_at TIMESTAMP WITH TIME ZONE,
  analytics_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour queries fréquentes
CREATE INDEX idx_posts_character ON posts(character);
CREATE INDEX idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX idx_posts_location ON posts(location);
CREATE INDEX idx_posts_engagement ON posts(engagement_rate DESC);
```

---

## 🤖 LLM Prompt pour Génération

```
Tu es un stratège contenu Instagram pour {character_name}.

## Contexte Personnage
{character_sheet}

## Historique Récent (5 derniers posts)
{recent_posts_summary}

## Analytics Insights
- Meilleur lieu: {best_location} (avg engagement: {engagement}%)
- Meilleur mood: {best_mood}
- Meilleur type: {best_type}
- Heure optimale: {best_hour}
- Posts crossover performance: {crossover_performance}

## Contraintes
- Ne pas répéter: {locations_to_avoid} (postés récemment)
- Varier les outfits: éviter {recent_outfits}
- Maintenir la cohérence narrative

## Ta mission
Propose le prochain post avec:
1. Lieu (nouveau ou sous-représenté)
2. Outfit (cohérent avec le lieu et le personnage)
3. Action (dynamique, pas juste poser)
4. Mood
5. Caption + 15 hashtags
6. Justification (pourquoi ce choix basé sur les analytics)

Format JSON:
{
  "location": "",
  "location_country": "",
  "outfit": "",
  "action": "",
  "mood": "",
  "caption": "",
  "hashtags": [],
  "reasoning": "",
  "crossover_suggestion": null | "mila" | "elena"
}
```

---

## 📁 Structure Fichiers

```
app/scripts/
├── intelligent-post.mjs        # Main engine
├── lib/
│   ├── supabase-history.ts     # CRUD posts history
│   ├── analytics-fetcher.ts    # Fetch IG analytics
│   ├── content-proposer.ts     # LLM proposal
│   └── prompt-builder.ts       # Build Nano Banana prompt
```

---

## 🎯 Bénéfices

| Bénéfice | Description |
|----------|-------------|
| **Cohérence narrative** | Les personnages ont une vraie histoire qui se suit |
| **Optimisation continue** | Le contenu s'améliore basé sur les analytics |
| **Moins de décisions manuelles** | L'engine propose, tu valides |
| **Crossover intelligent** | Suggère quand faire du contenu ensemble |
| **Évite la répétition** | Garde trace de ce qui a été fait |

---

## 🚧 Dépendances

- [ ] TODO-004: Supabase integration (base)
- [ ] TODO-005: Elena Graph API connection
- [ ] Graph API analytics access
- [ ] LLM API (Claude/GPT pour proposals)

---

## 📅 Phases d'Implémentation

### Phase 1: History Tracking (2h)
- Schema Supabase
- Save posts après publication
- Migration posts existants

### Phase 2: Analytics Sync (3h)
- Fetch analytics via Graph API
- Cron job update (daily)
- Dashboard basique

### Phase 3: Content Proposer (4h)
- LLM integration
- Prompt engineering
- JSON output parsing

### Phase 4: Full Automation (3h)
- End-to-end flow
- Approval step (optional)
- Logging & monitoring

---

## ✅ Décisions Confirmées (Session 20/12/2024)

| Question | Décision |
|----------|----------|
| Approval flow? | **Full auto** — Pas de validation humaine |
| Crossover frequency? | **3x/semaine** — Posts duo Mila×Elena |
| Story arcs? | **Full auto** — L'IA crée et gère les arcs |
| A/B testing? | Future phase |

---

## 📅 Timeline Historique (à créer)

Le système doit connaître le "passé" de Mila et Elena pour créer des throwbacks crédibles :

```
TIMELINE MILA & ELENA
═══════════════════════════════════════════════════════════════

2023
────
Juin 2023     │ 🤝 MEETING
              │ "On se rencontre sur un shooting à Paris"
              │
Août 2023     │ 🏖️ PREMIER VOYAGE
              │ "Weekend à Nice chez les parents de Mila"
              │
Décembre 2023 │ 🎄 PREMIER NOËL
              │ "Réveillon ensemble à Paris"

2024
────
Février 2024  │ 🎿 SKI TRIP COURCHEVEL
              │ Arc: 5 posts sur 2 semaines
              │
Juin 2024     │ 🎂 1 AN D'AMITIÉ
              │ "Milestone: 1 an de BFF"
              │
Août 2024     │ 🌴 BALI TRIP
              │ Arc majeur: 10+ posts
              │
Novembre 2024 │ 🏠 ELENA NOUVEAU LOFT
              │ "Crémaillère"
```

---

## 🎬 Arcs Narratifs

Les arcs sont des "mini-histoires" qui s'étendent sur plusieurs posts :

```sql
CREATE TABLE narrative_arcs (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,        -- 'alps_trip_dec_2024'
  title TEXT NOT NULL,              -- 'Vacances aux Alpes'
  
  characters TEXT[] NOT NULL,       -- ['mila', 'elena']
  status TEXT DEFAULT 'active',     -- 'planned', 'active', 'completed'
  
  start_date DATE,
  end_date DATE,
  
  description TEXT,
  planned_posts INT,
  completed_posts INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemple d'arc :**
```
Arc: "Vacances Alpes Décembre 2024"
├── Post 1: Mila - Préparation valise (teasing)
├── Post 2: Elena - "On y va!" (aéroport/train)
├── Post 3: Duo - Arrivée chalet
├── Post 4: Mila - Reel ski
├── Post 5: Elena - Spa seule
├── Post 6: Duo - Jacuzzi ensemble
├── Post 7: Mila - Throwback retour
```

---

## 🧠 Schéma Supabase Enrichi

Au-delà du schema initial, ajouter :

```sql
-- Timeline events (le lore)
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,  -- 'meeting', 'trip', 'milestone'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  characters TEXT[] NOT NULL,
  shareable BOOLEAN DEFAULT TRUE,
  emotional_tone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships (détails amitié)
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  character_1 TEXT NOT NULL,
  character_2 TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  how_they_met TEXT NOT NULL,
  inside_jokes TEXT[],
  shared_memories TEXT[],
  nicknames JSONB
);

-- Caption templates
CREATE TABLE caption_templates (
  id UUID PRIMARY KEY,
  character TEXT NOT NULL,
  category TEXT NOT NULL,
  template TEXT NOT NULL,
  questions TEXT[],
  ctas TEXT[],
  hashtag_pool TEXT[]
);
```

---

## 🌐 Sources d'Intelligence Externes

| Source | Ce qu'elle apporte | API |
|--------|-------------------|-----|
| **Perplexity** | Trending topics, hashtags | Perplexity API |
| **Calendrier** | Noël, Fashion Week, etc. | Date + liste |
| **Météo Paris** | Cohérence (pas plage si neige) | OpenWeather |
| **Google Trends** | Sujets qui montent | Trends API |

---

## 🔄 Cycle Quotidien Autonome

```
6h00 UTC — CRON: "Plan today"
     │
     ▼
┌─────────────────────┐
│   CONTENT BRAIN     │
│                     │
│ 1. Fetch historique │
│ 2. Fetch analytics  │
│ 3. Check arcs       │
│ 4. Check calendar   │
│ 5. Check trends     │
└──────────┬──────────┘
           │
           ▼
    Claude API génère
    le planning du jour
    pour les 2 comptes
           │
           ▼
┌─────────────────────┐
│  Supabase:          │
│  daily_schedule     │
│                     │
│  Mila:              │
│  • 08h30 Carousel   │
│  • 12h00 Reel       │
│  • 19h00 Carousel   │
│                     │
│  Elena:             │
│  • 13h00 Carousel   │
│  • 21h30 Reel       │
└──────────┬──────────┘
           │
           ▼
    CRON jobs exécutent
    les scripts existants
    avec les paramètres
```

---

## 🏗️ Architecture Non-Destructive

**IMPORTANT** : Le Content Brain est une **couche par-dessus**, pas un remplacement.

```
┌─────────────────────────────────────────┐
│           CONTENT BRAIN                 │
│     (nouvelle couche intelligente)      │
└─────────────────┬───────────────────────┘
                  │ Génère paramètres
                  ▼
┌─────────────────────────────────────────┐
│          EXECUTION LAYER                │
│   (scripts existants INCHANGÉS)         │
│                                         │
│   carousel-post.mjs                     │
│   vacation-reel-post.mjs                │
│   carousel-post-elena.mjs               │
│   vacation-reel-post-elena.mjs          │
│                                         │
│   Nano Banana Pro → Cloudinary → IG     │
└─────────────────────────────────────────┘
```

Les scripts actuels fonctionnent toujours en standalone.

---

## 📅 Phases Révisées

### Phase 0: Growth Improvements ✅ DONE (20/12/2024)
- [x] Plus de Reels (scripts existants prêts)
- [x] Améliorer captions (questions/CTAs dans tous les scripts)
- [x] Posts duo 3x/semaine → **`duo-post.mjs` créé** (4 scénarios: shooting, brunch, workout, shopping)
- [x] Elena voyage plus → **7 nouveaux lieux** (Milan, backstage, yacht, London, Maldives, airport)
- [x] **`hashtags.ts` créé** avec pools optimisés par catégorie

### Phase 1: Supabase + History ✅ DONE (20/12/2024)
- [x] Schema complet avec 10 tables (`supabase/schema.sql`)
- [x] Client TypeScript avec types stricts (`src/lib/supabase.ts`)
- [x] Timeline 2023-2024 avec 8 événements (données initiales SQL)
- [x] Table caption_templates avec 8 templates
- [x] Relation Mila×Elena avec inside jokes

### Phase 2: Content Brain v1 ✅ DONE (20/12/2024)
- [x] Intégration Claude API (`src/lib/content-brain.ts`)
- [x] Planning quotidien automatique
- [x] Script CLI (`scripts/content-brain.mjs`)
- [x] Contexte complet (historique, timeline, analytics, arcs)

### Phase 3: Full Auto (restant)
- [ ] CRON job morning (génère planning 6h UTC)
- [ ] CRON jobs posts (exécute aux horaires planifiés)
- [ ] GitHub Actions automation
- [ ] Monitoring dashboard

---

*Créé le 17 décembre 2024*  
*Enrichi le 20 décembre 2024 — Full auto confirmé*

