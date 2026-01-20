# 📝 Session 20 Décembre 2024 — Content Brain Full Auto

**Date** : 20 décembre 2024  
**Durée** : ~3h

---

## ✅ Ce qui a été fait cette session

### 1. **Content Brain — Architecture complète**
- Création du système intelligent de contenu 100% autonome
- Intégration Claude API (Anthropic) pour planning AI
- Timeline narrative adaptée à décembre 2025

### 2. **Supabase Integration**
- Schema SQL complet avec 10 tables :
  - `characters` — Mila + Elena
  - `posts` — Historique publications
  - `timeline_events` — Événements narratifs (rencontre, colocation, etc.)
  - `narrative_arcs` — Arcs d'histoire actifs
  - `relationships` — Liens entre personnages
  - `caption_templates` — Templates de captions par mood
  - `daily_schedules` — Planning quotidien généré par AI
  - `conversations` + `messages` — DM tracking
  - `analytics_snapshots` — Métriques IG

### 3. **Scripts CRON automatisés**
- `cron-scheduler.mjs` — Génère le planning quotidien (7h Paris)
- `cron-executor.mjs` — Exécute les posts aux heures prévues (toutes les 30min)
- `sync-analytics.mjs` — Sync les métriques Instagram

### 4. **GitHub Actions Migration**
- Nouveau workflow `content-brain.yml` centralisé
- Désactivation des 4 anciens workflows (gardés en manual trigger) :
  - `auto-post.yml` (LEGACY)
  - `auto-post-elena.yml` (LEGACY)
  - `vacation-reel.yml` (LEGACY)
  - `vacation-reel-elena.yml` (LEGACY)

### 5. **Timeline Lore 2025**
- Ajustement des dates pour cohérence (juin 2024 → décembre 2025)
- Script `update-timeline.mjs` pour mise à jour Supabase

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
```
app/
├── supabase/
│   └── schema.sql              # Schema complet Supabase
├── src/lib/
│   ├── supabase.ts             # Client Supabase + types + helpers
│   └── content-brain.ts        # Logique AI planning
├── scripts/
│   ├── content-brain.mjs       # CLI test Content Brain
│   ├── cron-scheduler.mjs      # CRON daily planning
│   ├── cron-executor.mjs       # CRON post execution
│   ├── sync-analytics.mjs      # Sync IG metrics
│   ├── test-supabase.mjs       # Test connexion (temp)
│   └── update-timeline.mjs     # Update dates (temp)

.github/workflows/
└── content-brain.yml           # Workflow principal
```

### Fichiers modifiés
```
.github/workflows/
├── auto-post.yml              # CRON désactivé
├── auto-post-elena.yml        # CRON désactivé
├── vacation-reel.yml          # CRON désactivé
└── vacation-reel-elena.yml    # CRON désactivé

app/
├── package.json               # +dotenv, +@anthropic-ai/sdk
└── env.example.txt            # +SUPABASE_URL, SUPABASE_SERVICE_KEY, CLAUDE_KEY
```

---

## 🏗️ Architecture Content Brain

```
┌────────────────────────────────────────────────────────────────┐
│                    CONTENT BRAIN FLOW                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐                                          │
│  │  CRON SCHEDULER  │  ← 7h Paris (daily)                      │
│  │  (7:00 UTC)      │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │              GATHER CONTEXT                       │          │
│  │  • Recent posts (14 days)                        │          │
│  │  • Analytics (best performing)                   │          │
│  │  • Timeline events (lore)                        │          │
│  │  • Active narrative arcs                         │          │
│  │  • Relationships (Mila-Elena)                    │          │
│  └────────┬─────────────────────────────────────────┘          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │              CLAUDE API                           │          │
│  │  "Génère le planning pour [character]"           │          │
│  │  → 2-4 posts avec heures optimales               │          │
│  │  → Prompts détaillés pour génération             │          │
│  │  → Captions engageantes                          │          │
│  └────────┬─────────────────────────────────────────┘          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │         SAVE TO SUPABASE                          │          │
│  │  daily_schedules → scheduled_posts[]             │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                │
│  ═══════════════════════════════════════════════════════════   │
│                                                                │
│  ┌──────────────────┐                                          │
│  │  CRON EXECUTOR   │  ← Toutes les 30min                      │
│  │  (*/30 * * * *)  │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │  CHECK pending posts in daily_schedules          │          │
│  │  IF scheduled_time <= now AND status = 'pending' │          │
│  │  THEN execute post script                        │          │
│  └────────┬─────────────────────────────────────────┘          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │  EXECUTE                                          │          │
│  │  • carousel-post.mjs (images)                    │          │
│  │  • vacation-reel-post.mjs (reels)                │          │
│  │  • Mark as 'completed' in Supabase               │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Supabase Schema

```sql
-- Characters (Mila, Elena)
characters: id, name, instagram_handle, personality, style_keywords...

-- Posts history
posts: id, character_id, type, prompt, caption, hashtags, likes, comments...

-- Narrative
timeline_events: date, type, title, characters, location, emotional_tone...
narrative_arcs: arc_name, status, characters, start_date, end_date...
relationships: character_1, character_2, type, closeness_level, history...

-- Planning
daily_schedules: character_id, schedule_date, scheduled_posts[], status...
caption_templates: mood, templates[], emojis...

-- Analytics
analytics_snapshots: post_id, date, likes, comments, reach...
```

---

## 🚧 En cours (non terminé)

- **Test en production** — Workflow déployé mais pas encore de secrets GitHub
- **Sync initial analytics** — À faire une fois les tokens configurés

---

## 📋 À faire prochaine session

- [ ] **Ajouter les secrets GitHub** :
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `CLAUDE_KEY`
  - `REPLICATE_API_TOKEN`
  - `CLOUDINARY_*`
  - `INSTAGRAM_*` (Mila + Elena)
  - `MILA_*` references

- [ ] **Tester le workflow complet** :
  - Déclencher manuellement le scheduler
  - Vérifier le planning dans Supabase
  - Déclencher l'executor
  - Confirmer le post sur Instagram

- [ ] **Sync analytics initiales** :
  - Exécuter `sync-analytics.mjs` pour les posts existants

- [ ] **Monitor premier jour auto** :
  - Vérifier les logs GitHub Actions
  - Valider la qualité du contenu généré

---

## 🐛 Bugs découverts

- **JSON parsing Claude** — Claude retourne parfois des hashtags avec newlines, corrigé avec preprocessing
- **TypeScript strict mode** — Plusieurs fixes pour la compatibilité Supabase types

---

## 💡 Idées notées

- **Learning loop** — Utiliser les analytics pour améliorer les prompts Claude
- **A/B testing** — Tester différents styles de captions via le Content Brain
- **Mood calendar** — Prédéfinir les ambiances par jour de la semaine

---

## 📝 Notes importantes

### Secrets GitHub à configurer
```
https://github.com/edouardtiem/ig-influencer/settings/secrets/actions

SUPABASE_URL           → Supabase Project Settings → API → URL
SUPABASE_SERVICE_KEY   → Supabase → service_role key (PAS anon key!)
CLAUDE_KEY             → Ta clé Anthropic
REPLICATE_API_TOKEN    → .env.local
CLOUDINARY_CLOUD_NAME  → .env.local
CLOUDINARY_API_KEY     → .env.local
CLOUDINARY_API_SECRET  → .env.local
INSTAGRAM_ACCESS_TOKEN → .env.local (Mila)
INSTAGRAM_ACCOUNT_ID   → .env.local (Mila)
INSTAGRAM_ACCESS_TOKEN_ELENA → .env.local
INSTAGRAM_ACCOUNT_ID_ELENA   → .env.local
MILA_BASE_FACE_URL     → .env.local
MILA_REFERENCE_URLS    → .env.local
```

### Timeline Mila-Elena (2025)
```
Juin 2024      → Rencontre sur shooting
Juillet 2024   → Premières sorties
Août 2024      → Vacances ensemble (Mykonos)
Septembre 2024 → Elena emménage chez Mila
Octobre 2024   → Routines établies
Novembre 2024  → Premier projet pro ensemble
Décembre 2024  → Fêtes de fin d'année
Décembre 2025  → Maintenant (1.5 ans d'amitié)
```

---

## 🔗 Références

- [IDEA-005 Content Engine](../roadmap/ideas/IDEA-005-intelligent-content-engine.md)
- [Schema SQL](../app/supabase/schema.sql)
- [Content Brain Workflow](.github/workflows/content-brain.yml)

---

*Session productive — Content Brain opérationnel, prêt pour production après config secrets*
