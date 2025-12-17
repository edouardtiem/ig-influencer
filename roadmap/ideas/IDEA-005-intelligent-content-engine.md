# 💡 IDEA-005 — Intelligent Content Engine

> Moteur de contenu intelligent basé sur l'historique et les analytics

**Créé** : 17 décembre 2024  
**Status** : 💡 Idea  
**Impact** : 🔴 High  
**Effort** : 🔴 High  

---

## 🎯 Objectif

Automatiser la création de contenu en analysant ce qui fonctionne, pour proposer du contenu nouveau mais performant — tout en maintenant une **histoire cohérente** pour chaque personnage.

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

## 💭 Questions Ouvertes

1. **Approval flow?** — Full auto ou validation humaine avant post?
2. **Crossover frequency?** — Quelle fréquence pour les posts ensemble?
3. **Story arcs?** — Créer des mini-arcs narratifs (vacances, fashion week, etc.)?
4. **A/B testing?** — Tester différentes approches sur le même moment?

---

*Créé le 17 décembre 2024*

