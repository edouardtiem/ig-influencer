# 💡 IDEA-007 — Trends Layer (Viral Intelligence)

> Recherche Perplexity daily pour détecter les trends viraux et créer du contenu opportuniste

**Créé** : 22 décembre 2024  
**Status** : 💡 Idea  
**Impact** : 🔴 High  
**Effort** : 🟡 Medium  

---

## 🎯 Objectif

Utiliser Perplexity pour rechercher quotidiennement les sujets trending sur Instagram, par région (US → France → Europe), et générer du contenu viral au bon moment.

---

## 🔄 Flow

```
DAILY (7h avec scheduler)
         ↓
Perplexity recherche :
- "What's trending on Instagram right now?"
- Priority: US → France → Europe
         ↓
Output :
- trending_topics: [{topic, region, relevance_score}]
- viral_hashtags: ["#trend1", "#trend2"]
- content_suggestions: ["Idée pour Mila/Elena"]
- time_sensitivity: "urgent" | "soon" | "week"
         ↓
Content Brain utilise les trends dans le planning
         ↓
Posts avec hashtags viraux au moment optimal
```

---

## 🌍 Priorité Régionale

```
1. 🇺🇸 USA      — Trends souvent arrivent en Europe 24-48h après
2. 🇫🇷 France   — Marché principal
3. 🇪🇺 Europe   — Marché secondaire
```

**Logique** : Si un trend US a un score élevé mais n'est pas encore en France, c'est une opportunité "first mover".

---

## 📊 Schema Supabase (optionnel, pour tracking)

```sql
CREATE TABLE IF NOT EXISTS viral_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  detected_date DATE NOT NULL,
  topic VARCHAR(200) NOT NULL,
  region VARCHAR(20) NOT NULL,              -- 'us' | 'france' | 'europe'
  
  -- Relevance scores
  relevance_mila INTEGER,                   -- 1-10
  relevance_elena INTEGER,                  -- 1-10
  
  -- Timing
  time_sensitivity VARCHAR(20),             -- 'urgent' | 'soon' | 'week'
  
  -- Content
  why_trending TEXT,
  viral_hashtags TEXT[],
  content_idea_mila TEXT,
  content_idea_elena TEXT,
  format_suggestion VARCHAR(20),            -- 'reel' | 'carousel'
  
  -- Tracking
  used_by_mila BOOLEAN DEFAULT FALSE,
  used_by_elena BOOLEAN DEFAULT FALSE,
  post_id UUID REFERENCES posts(id),
  
  -- Performance (updated after posting)
  engagement_boost DECIMAL(5,2),            -- % vs average
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📁 Fichiers à créer

```
app/scripts/lib/
└── trends-layer.mjs          # Nouveau layer Perplexity

# Modifier:
app/scripts/cron-scheduler.mjs  # Import + intégration
```

---

## 🔧 Prompt Perplexity

```javascript
const prompt = `
Today: ${dateStr}

I need REAL-TIME Instagram trends analysis for content creation.
Target niche: ${niche} // fitness/lifestyle or fashion/luxury

Search for what's TRENDING RIGHT NOW on Instagram:

1. **USA** (trends often hit Europe 24-48h later)
2. **France** (primary market)  
3. **Europe** (secondary market)

For each trend found, provide:
- Topic/theme
- Why it's trending
- Relevance score for ${niche} (1-10)
- Time sensitivity (urgent: <24h, soon: 24-48h, week: this week)
- Content idea for a young woman influencer
- Viral hashtags

Return JSON format...
`;
```

---

## 🔧 Intégration Content Brain

### Dans `cron-scheduler.mjs`

```javascript
import { fetchTrends, formatTrendsForPrompt } from './lib/trends-layer.mjs';

// Fetch with other layers
const trends = await fetchTrends(character);

// In buildEnhancedPrompt():
## 🔥 TRENDS VIRAUX DU JOUR

${formatTrendsForPrompt(trends)}

### Règle TRENDS:
Si un trend est marqué 🚨 URGENT avec relevance >= 8:
→ OBLIGATOIRE: Au moins 1 post doit surfer sur ce trend
→ Utiliser les hashtags viraux suggérés
→ Adapter l'idée au personnage (pas de copie directe)
```

---

## 📈 Exemples de trends détectables

| Type | Exemple | Time Sensitivity |
|------|---------|------------------|
| Challenge | #75HardChallenge revival | soon |
| Meme | "Very demure, very mindful" | urgent |
| Event | Met Gala looks | urgent |
| Seasonal | Cozy fall content | week |
| Audio | Trending Reel sound | urgent |
| Format | "Get ready with me" style | week |

---

## 🎯 Critères de succès

- [ ] `trends-layer.mjs` créé et testé
- [ ] Intégration dans cron-scheduler
- [ ] Trends détectés quotidiennement
- [ ] Au moins 1 post/semaine surfe sur une trend
- [ ] Tracking engagement boost vs posts normaux

---

## 📝 Notes

- Utiliser `sonar-pro` pour meilleure recherche temps réel
- Fallback saisonnier si API unavailable
- Ne pas forcer une trend qui ne correspond pas au personnage
- Éviter les trends controversées (politiques, drama)
- Les trends US arrivent souvent en France 24-48h après → opportunité first mover

