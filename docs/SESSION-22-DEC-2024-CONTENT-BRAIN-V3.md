# 📝 Session 22 Décembre 2024 — Content Brain V3 Ideas

**Date** : 22 décembre 2024  
**Durée** : ~1h (brainstorm)

---

## ✅ Ce qui a été fait cette session

### 1. **Brainstorm 3 nouvelles features Content Brain**

Exploration de 3 axes d'amélioration du Content Brain pour augmenter l'engagement et la viralité :

#### 🎯 IDEA-006 : Ideas Backlog (Curated Inspirations)
- Tu trouves une photo/post inspirant sur Instagram
- Tu l'envoies → AI génère prompt/description + timing optimal
- Stocké dans backlog Supabase
- Content Brain pioche automatiquement quand contexte optimal

#### 📈 IDEA-007 : Trends Layer (Viral Intelligence)
- Perplexity daily search à 7h (avec scheduler)
- Priority markets : **US → France → Europe**
- Détecte trends viraux + hashtags + content suggestions
- Posts adaptés aux trends avec time-sensitivity (urgent/soon/week)

#### ✍️ IDEA-008 : Long-form Captions + Character Voice
- Évolution du format : hook accrocheur + long texte FR
- Annonce relationship : bi + open relationship
- Character voices distinctes :
  - **Mila** : Punk authentique qui questionne les standards
  - **Elena** : Femme fatale qui tease et crée le doute

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
```
docs/
└── SESSION-22-DEC-2024-CONTENT-BRAIN-V3.md  # Cette session

roadmap/ideas/
├── IDEA-006-ideas-backlog.md                 # Système inspirations curated
├── IDEA-007-trends-layer.md                  # Viral intelligence via Perplexity
└── IDEA-008-longform-captions.md             # Évolution format + character voice
```

### Fichiers modifiés
```
ROADMAP.md   # Ajout 3 nouvelles IDEA
```

---

## 🚧 En cours (non terminé)

- [ ] Implémentation des 3 features (non démarrée)
- [ ] Définition précise des "character voices" pour captions

---

## 📋 À faire prochaine session

- [ ] **IDEA-006** : Créer table `content_ideas` + script `add-idea.mjs`
- [ ] **IDEA-007** : Créer `trends-layer.mjs` + intégrer dans scheduler
- [ ] **IDEA-008** : Définir character voices + templates captions longues
- [ ] **IP-002** : Continuer Model Evolution (Mila red + Elena blonde)

---

## 🐛 Bugs découverts

- Aucun

---

## 💡 Idées notées

### Character Voices (à creuser)

**Mila — La Punk Authentique**
- Questionne les standards de beauté, fitness, mode de vie
- "Pourquoi on devrait..." / "Est-ce que c'est vraiment..."
- Ton : direct, sincère, un peu rebelle
- Thèmes : body positivity, authenticité, anti-perfectionnisme
- Hook style : "On m'a dit que..." / "Je pensais que..." / "Confession:"

**Elena — La Femme Fatale Mystérieuse**
- Tease, suggère, ne dit jamais tout
- "Certains pensent que..." / "On me demande souvent si..."
- Ton : mystérieux, sensuel, confiant
- Thèmes : luxe vs authenticité, apparences, secrets
- Hook style : "Ce que personne ne sait..." / "Derrière les photos..." / "Le secret c'est..."

### Format Long Caption FR

```
[HOOK - 1 ligne choc en français]

[DÉVELOPPEMENT - 3-5 phrases, ton personnel]

[QUESTION/CTA - engagement]

[HASHTAGS - 15-20]
```

### Progression Reveal Relationship

1. **Phase 1** (actuelle) : Indices subtils ("two cups", même location)
2. **Phase 2** (janvier) : Questions publiques ("vous êtes ensemble?")
3. **Phase 3** (février) : Annonce officielle bi + open relationship
4. **Phase 4** : Posts sur leur mode de vie, opinions clivantes dating

---

## 📝 Notes importantes

### Architecture Content Brain V3 (proposée)

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT BRAIN V3                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: Analytics      — What performs best                │
│  LAYER 2: History        — Where we are in the story         │
│  LAYER 3: Context        — Weather, events, seasonal         │
│  LAYER 4: Character      — Who is she                        │
│  LAYER 5: Memories       — Shared moments, duo opportunities │
│  LAYER 6: Relationship   — The Secret hints 💕               │
│                                                              │
│  NEW LAYERS:                                                 │
│  ─────────────────────────────────────────────────────────  │
│  LAYER 7: Ideas Backlog  — Curated inspirations from user    │
│  LAYER 8: Trends         — Viral opportunities US→FR→EU      │
│  LAYER 9: Voice          — Long-form captions + character    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tables Supabase à créer

```sql
-- IDEA-006: Ideas Backlog
content_ideas (
  id, character, title, description, prompt_suggestion,
  inspiration_images[], mood, location_suggestion,
  best_season, best_time_slot, priority, status,
  used_in_schedule_id, created_at
)

-- IDEA-007: Trends Tracking
viral_trends (
  id, detected_date, topic, region,
  relevance_mila, relevance_elena,
  time_sensitivity, viral_hashtags[],
  content_idea_mila, content_idea_elena,
  used_by_mila, used_by_elena, engagement_boost
)

-- IDEA-008: Caption Templates V2
caption_templates_v2 (
  id, character, style, hook_template, body_template,
  cta_options[], voice_guidelines, example_caption,
  usage_count, avg_engagement
)
```

---

## 🔗 Documents liés

- [IDEA-006 — Ideas Backlog](../roadmap/ideas/IDEA-006-ideas-backlog.md)
- [IDEA-007 — Trends Layer](../roadmap/ideas/IDEA-007-trends-layer.md)
- [IDEA-008 — Long-form Captions](../roadmap/ideas/IDEA-008-longform-captions.md)
- [IP-002 — Model Evolution](../roadmap/in-progress/IP-002-model-evolution.md)
- [DONE-022 — Content Brain V2.1](../roadmap/done/DONE-022-content-brain-v2.md)

