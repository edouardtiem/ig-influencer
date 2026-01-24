# 💡 IDEA-006 — Ideas Backlog (Curated Inspirations)

> Système de backlog d'idées/inspirations curated pour alimenter le Content Brain

**Créé** : 22 décembre 2024  
**Status** : 💡 Idea  
**Impact** : 🟡 Medium  
**Effort** : 🟡 Medium  

---

## 🎯 Objectif

Permettre d'ajouter manuellement des inspirations (photos Instagram, idées) dans un backlog que le Content Brain utilisera automatiquement au moment optimal.

---

## 🔄 Flow

```
1. Tu trouves une photo/post inspirant sur Instagram
         ↓
2. Tu m'envoies l'image (screenshot ou URL)
         ↓
3. AI génère :
   - title: "Cozy reading corner vibes"
   - prompt_suggestion: "young woman reading book, cozy corner..."
   - mood: "cozy"
   - best_season: "winter"
   - best_time_slot: "evening"
         ↓
4. Stocké dans table `content_ideas` (Supabase)
         ↓
5. Content Brain pioche automatiquement quand :
   - Le timing est optimal (season, day, mood)
   - Le personnage n'a pas posté ce type récemment
   - L'engagement prédit est bon
```

---

## 📊 Schema Supabase

```sql
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target character
  character VARCHAR(50) NOT NULL,             -- 'mila' | 'elena' | 'both'
  
  -- Inspiration source
  source_type VARCHAR(50) DEFAULT 'instagram',
  source_url TEXT,
  source_username VARCHAR(100),
  
  -- Generated content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  prompt_suggestion TEXT,
  
  -- Visual references
  inspiration_images TEXT[],                   -- URLs Cloudinary
  
  -- Categorization
  mood VARCHAR(50),
  location_suggestion VARCHAR(100),
  outfit_suggestion TEXT,
  action_suggestion TEXT,
  
  -- Timing hints
  best_season VARCHAR(20),                     -- 'winter' | 'summer' | 'any'
  best_day_type VARCHAR(20),                   -- 'weekday' | 'weekend' | 'any'
  best_time_slot VARCHAR(20),                  -- 'morning' | 'evening' | 'any'
  
  -- Priority & Status
  priority INTEGER DEFAULT 5,                  -- 1-10 (10 = must do soon)
  status VARCHAR(20) DEFAULT 'backlog',        -- 'backlog' | 'scheduled' | 'used' | 'archived'
  
  -- Usage tracking
  used_in_schedule_id UUID REFERENCES daily_schedules(id),
  used_at TIMESTAMPTZ,
  
  -- Meta
  created_by VARCHAR(50) DEFAULT 'user',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ideas_character ON content_ideas(character);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_priority ON content_ideas(priority DESC);
```

---

## 📁 Fichiers à créer

```
app/scripts/
├── add-idea.mjs              # CLI pour ajouter une idée
└── lib/
    └── ideas-layer.mjs       # Layer Content Brain

supabase/
└── migrations/
    └── 003_content_ideas.sql
```

---

## 🔧 Intégration Content Brain

### Dans `cron-scheduler.mjs`

```javascript
import { fetchIdeasBacklog, formatIdeasForPrompt } from './lib/ideas-layer.mjs';

// Dans generateSchedule():
const ideas = await fetchIdeasBacklog(supabase, character);

// Dans buildEnhancedPrompt():
## 💡 IDEAS BACKLOG
${formatIdeasForPrompt(ideas)}

### Règle IDEAS:
Si une idée priority >= 8 correspond au contexte (season, mood):
→ L'utiliser pour au moins 1 post
→ Marquer comme "scheduled"
```

---

## 🎯 Critères de succès

- [ ] Table `content_ideas` créée
- [ ] Script `add-idea.mjs` fonctionnel
- [ ] Intégration dans cron-scheduler
- [ ] Ideas utilisées automatiquement par Content Brain
- [ ] Tracking de l'usage dans Supabase

---

## 📝 Notes

- Les ideas peuvent venir de n'importe quelle source (Instagram, Pinterest, idées manuelles)
- Le système doit respecter le style/mood du personnage
- Priority 10 = à faire cette semaine
- Les ideas archivées restent pour référence future

