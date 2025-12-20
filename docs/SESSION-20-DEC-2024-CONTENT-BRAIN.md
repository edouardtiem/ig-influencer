# 🧠 Session 20 Décembre 2024 — Content Brain Implementation

> Implémentation IDEA-005: Moteur de contenu intelligent 100% autonome

**Date** : 20 décembre 2024  
**Durée** : ~2h

---

## ✅ Ce qui a été fait cette session

### 1. Schema Supabase Enrichi — `supabase/schema.sql`

Créé le schema complet avec 10 tables :

| Table | Description |
|-------|-------------|
| `characters` | Mila, Elena avec tous leurs attributs |
| `posts` | Historique posts avec contexte narratif |
| `timeline_events` | Le "lore" — événements passés partagés |
| `narrative_arcs` | Arcs narratifs multi-posts |
| `relationships` | Détails amitié Mila×Elena |
| `caption_templates` | Templates captions par catégorie |
| `daily_schedules` | Planning quotidien généré par Claude |
| `conversations` | Historique interactions |
| `messages` | Messages individuels |
| `analytics_snapshots` | Snapshots analytics quotidiens |

**Données initiales incluses :**
- 2 personnages (Mila, Elena)
- Relation Mila×Elena avec inside jokes
- 8 événements timeline (2023-2024)
- 8 templates de captions

### 2. Client Supabase TypeScript — `src/lib/supabase.ts`

Client complet avec :
- Types TypeScript stricts
- Fonctions helper CRUD
- `savePost()` — Sauvegarder un post après publication
- `getRecentPosts()` — Récupérer historique
- `getTimelineEvents()` — Récupérer le lore
- `getActiveArcs()` — Arcs narratifs actifs
- `getRelationship()` — Détails relation
- `getCaptionTemplates()` — Templates par catégorie
- `getAnalyticsInsights()` — Insights pour décisions
- `saveDailySchedule()` — Sauvegarder planning
- `isSupabaseConfigured()` — Check configuration

### 3. Content Brain — `src/lib/content-brain.ts`

Le cerveau intelligent qui décide le contenu :

**Fonctions principales :**
- `generateDailyPlan()` — Génère le planning complet du jour
- `quickGeneratePlan()` — Version rapide sans Supabase
- `getNextScheduledPost()` — Récupérer le prochain post à exécuter
- `markPostExecuted()` — Marquer un post comme fait
- `gatherHistoryContext()` — Rassembler tout le contexte

**Workflow :**
```
1. Gather context (historique, timeline, analytics)
2. Build Claude prompt avec toutes les contraintes
3. Claude génère le planning JSON
4. Parse et sauvegarde dans Supabase
5. CRON jobs exécutent les posts aux horaires
```

### 4. Script Content Brain — `scripts/content-brain.mjs`

Script CLI pour tester le Content Brain :

```bash
# Générer plan pour Mila (3 posts par défaut)
node scripts/content-brain.mjs mila

# Générer plan pour Elena avec 5 posts
node scripts/content-brain.mjs elena --posts=5

# Forcer un post duo
node scripts/content-brain.mjs mila --duo

# Générer pour les deux
node scripts/content-brain.mjs both
```

### 5. Mise à jour Configuration

- `env.example.txt` : Ajout `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`
- `package.json` : Installation `@supabase/supabase-js`, `@anthropic-ai/sdk`

---

## 📁 Fichiers créés

| Fichier | Description |
|---------|-------------|
| `app/supabase/schema.sql` | Schema complet + données initiales |
| `app/src/lib/supabase.ts` | Client TypeScript + types + helpers |
| `app/src/lib/content-brain.ts` | Moteur intelligent Claude API |
| `app/scripts/content-brain.mjs` | Script CLI pour tester |
| `docs/SESSION-20-DEC-2024-CONTENT-BRAIN.md` | Cette documentation |

---

## 🚀 Comment utiliser

### 1. Setup Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans SQL Editor
3. Copier-coller le contenu de `supabase/schema.sql`
4. Exécuter

### 2. Configurer les variables d'environnement

```bash
# Dans app/.env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Tester le Content Brain

```bash
cd app
node scripts/content-brain.mjs mila
```

Output exemple :
```
🧠 Content Brain generating plan for MILA...
   Posts: 3 | Force Duo: false

✅ Plan Generated: "Journée créative à Montmartre"

═══════════════════════════════════════════════════════════════

📝 POST 1 — 08:30
────────────────────────────────────────
📍 Location: KB CaféShop (nice_old_town_cafe)
🎬 Type: CAROUSEL
😊 Mood: cozy
👗 Outfit: Oversized beige knit sweater, high-waisted jeans
🎯 Action: Working on laptop with flat white, golden morning light
💬 Caption: "Morning ritual ☕ Vous êtes plutôt home office ou café?"
💡 Reasoning: Lundi matin = café content pour engagement

📝 POST 2 — 12:30
────────────────────────────────────────
📍 Location: L'Usine Paris (nice_gym)
🎬 Type: REEL
...
```

---

## 🧠 Architecture Content Brain

```
┌─────────────────────────────────────────┐
│           CONTENT BRAIN                 │
│     (src/lib/content-brain.ts)          │
│                                         │
│  1. Gather Context                      │
│     - Recent posts (Supabase)           │
│     - Timeline events (lore)            │
│     - Active arcs                       │
│     - Analytics insights                │
│                                         │
│  2. Build Claude Prompt                 │
│     - Character sheet                   │
│     - Constraints (no repeat lieux)     │
│     - Available locations               │
│     - Crossover probability             │
│                                         │
│  3. Claude API Call                     │
│     - Model: claude-sonnet-4-20250514             │
│     - Output: JSON planning             │
│                                         │
│  4. Save Schedule                       │
│     - daily_schedules table             │
│     - Status: pending                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          EXECUTION LAYER                │
│   (scripts existants INCHANGÉS)         │
│                                         │
│   carousel-post.mjs                     │
│   vacation-reel-post.mjs                │
│   duo-post.mjs                          │
│                                         │
│   Nano Banana Pro → Cloudinary → IG     │
└─────────────────────────────────────────┘
```

---

## 📋 Prochaines étapes

### Phase 3: Full Automation (restant)

- [ ] **CRON job morning** — Génère le planning à 6h UTC
- [ ] **CRON jobs posts** — Exécute aux horaires planifiés
- [ ] **GitHub Actions** — Automatisation cloud
- [ ] **Monitoring** — Dashboard status des schedules

### Intégrations futures

- [ ] Perplexity API pour trending topics
- [ ] OpenWeather pour cohérence météo
- [ ] Google Calendar pour événements
- [ ] Auto-analytics sync après 24h

---

## 💡 Notes techniques

### Claude Prompt Engineering

Le prompt inclut :
1. **Character sheet** condensé (personnalité, style, tone)
2. **Historique récent** (éviter répétitions)
3. **Analytics insights** (optimiser engagement)
4. **Timeline lore** (cohérence narrative)
5. **Contraintes strictes** (JSON output, questions obligatoires)

### Output JSON Structure

```json
{
  "daily_theme": "Journée cozy à Paris",
  "posts": [
    {
      "location_key": "home_bedroom",
      "location_name": "Chambre Mila",
      "post_type": "carousel",
      "mood": "cozy",
      "outfit": "Cream silk pajama set",
      "action": "Lazy morning in bed with coffee and book",
      "caption": "Ces matins où on ne veut pas sortir du lit... Vous aussi? 🛏️",
      "hashtags": ["#cozy", "#parismorning", ...],
      "scheduled_time": "08:30",
      "prompt_hints": "warm natural light, rumpled sheets, lazy vibe",
      "with_character": null,
      "reasoning": "Weekend = cozy content, high engagement for lifestyle"
    }
  ]
}
```

---

## 🔗 Documents liés

- [IDEA-005 — Intelligent Content Engine](../roadmap/ideas/IDEA-005-intelligent-content-engine.md)
- [TODO-004 — Supabase Integration](../roadmap/todo/TODO-004-supabase-integration.md)
- [SESSION-20-DEC-2024-ANALYTICS-GROWTH.md](./SESSION-20-DEC-2024-ANALYTICS-GROWTH.md)

---

*Session documentée le 20 décembre 2024*

