# SESSION 23 Décembre 2024 — Post Status Tracking System

**Date** : 23 décembre 2024  
**Durée** : ~2h30

---

## 🎯 Objectif de la session

Améliorer le système d'auto-post avec un suivi granulaire des statuts et créer un dashboard Calendar pour tracker les posts en déplacement.

---

## ✅ Ce qui a été fait

### 1. Fix Catchup Window (3h → 18h)

**Problème identifié** : Seulement 1 post par compte publié aujourd'hui au lieu de 3.

**Cause** : Le `CATCHUP_HOURS` était à 3h, mais GitHub Actions cron n'est pas fiable et skip parfois des runs. Les posts de 12h30/13h30 étaient déjà "expirés" quand le cron a tourné.

**Fix** :
```javascript
// cron-executor.mjs ligne 48
const CATCHUP_HOURS = 18; // était 3
```

### 2. Système de Status Tracking Granulaire

Nouvelle table `scheduled_posts` avec 6 statuts :

```
scheduled → generating → images_ready → posting → posted
                |              |              |
                v              v              v
             failed (retry 3x max)
```

**Fichiers créés/modifiés** :
- `app/supabase/schema.sql` — Nouvelle table scheduled_posts
- `app/supabase/migrations/001_scheduled_posts_table.sql` — Migration SQL
- `app/scripts/cron-scheduler.mjs` — Insert dans scheduled_posts après daily_schedules
- `app/scripts/cron-executor.mjs` — **V2 complet** step-based processing
- `app/scripts/scheduled-post.mjs` — Export fonctions pour executor
- `app/scripts/init-scheduled-posts.mjs` — Script initialisation + backfill

### 3. Calendar Dashboard

Nouvelle page `/calendar` pour suivre les posts en temps réel :

**Fonctionnalités** :
- Vue semaine avec navigation (← →)
- Filtres : Tous / Mila / Elena
- Status badges colorés avec animation
- Auto-refresh toutes les 30 secondes
- Panel "Aujourd'hui" avec détails
- Mobile-friendly

**Fichiers créés** :
- `app/src/app/api/calendar-posts/route.ts` — API endpoint
- `app/src/app/calendar/page.tsx` — Page dashboard
- `app/src/app/page.tsx` — Lien ajouté dans Tools

---

## 📁 Fichiers créés/modifiés

```
app/scripts/cron-executor.mjs        # V2 step-based processing
app/scripts/cron-scheduler.mjs       # Insert scheduled_posts
app/scripts/scheduled-post.mjs       # Export fonctions
app/scripts/init-scheduled-posts.mjs # Init + backfill
app/supabase/schema.sql              # Table scheduled_posts
app/supabase/migrations/001_scheduled_posts_table.sql
app/src/app/api/calendar-posts/route.ts
app/src/app/calendar/page.tsx
app/src/app/page.tsx                 # Lien Calendar
```

---

## 🔧 Migration Supabase requise

Si pas encore fait, exécuter dans Supabase SQL Editor :

```sql
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES daily_schedules(id) ON DELETE CASCADE,
  character VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  -- ... voir fichier complet
  UNIQUE(schedule_id, scheduled_time)
);
```

Puis backfill :
```bash
node scripts/init-scheduled-posts.mjs
```

---

## 🐛 Bug fixé

| Bug | Cause | Fix |
|-----|-------|-----|
| 1 seul post par compte au lieu de 3 | CATCHUP_HOURS = 3h trop court | Augmenté à 18h |

---

## 📋 À faire prochaine session

- [ ] Tester le nouveau flow sur une journée complète
- [ ] Ajouter notifications push sur erreur (webhook Discord?)
- [ ] Implémenter les posts de Noël 24-25-26 décembre

---

## 💡 Notes techniques

### Nouveau flow Cron Executor V2

```
Chaque run (toutes les 30min):
1. SELECT next post WHERE status IN ('scheduled', 'images_ready', 'failed')
2. PROCESS based on status:
   - scheduled → generate images → images_ready
   - images_ready → publish → posted
   - failed → retry if count < 3
3. UPDATE status + sync daily_schedules (backward compat)
```

### Status Badges Calendar

| Status | Icon | Color |
|--------|------|-------|
| scheduled | ⏳ | slate |
| generating | 🎨 | amber (pulse) |
| images_ready | 📦 | blue |
| posting | 📤 | violet (pulse) |
| posted | ✅ | emerald |
| failed | ❌ | rose |

---

## 🔗 Commits

1. `fix(cron): increase catchup window from 3h to 18h`
2. `feat(status-tracking): implement granular post status tracking system`
3. `feat(calendar): add calendar dashboard page for post tracking`

---

*Fin de session — 23 décembre 2024*

