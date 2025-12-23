# DONE-028: Post Status Tracking System

**Status** : ✅ Done  
**Date** : 23 décembre 2024  
**Version** : v2.20.0  
**Session** : [→ SESSION-23-DEC-2024-STATUS-TRACKING.md](../../docs/SESSION-23-DEC-2024-STATUS-TRACKING.md)

---

## 📋 Résumé

Implémentation d'un système de tracking granulaire pour les posts Instagram avec 6 statuts distincts et un executor step-based.

---

## 🎯 Objectifs atteints

1. ✅ Table `scheduled_posts` Supabase avec 6 statuts
2. ✅ Executor step-based (un step par run)
3. ✅ Système de retry automatique (max 3)
4. ✅ Backward compatibility avec daily_schedules
5. ✅ Script d'initialisation + backfill

---

## 🔧 Implémentation

### Statuts

```
scheduled → generating → images_ready → posting → posted
                |              |              |
                v              v              v
             failed (retry 3x max)
```

### Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `cron-executor.mjs` | V2 step-based processing |
| `cron-scheduler.mjs` | Insert dans scheduled_posts |
| `scheduled-post.mjs` | Export fonctions |
| `init-scheduled-posts.mjs` | Init + backfill |
| `schema.sql` | Table scheduled_posts |
| `001_scheduled_posts_table.sql` | Migration |

### Table scheduled_posts

```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY,
  schedule_id UUID,
  character VARCHAR(50),
  scheduled_date DATE,
  scheduled_time TIME,
  status VARCHAR(20), -- scheduled, generating, images_ready, posting, posted, failed
  -- Tracking
  generation_started_at TIMESTAMP,
  generation_completed_at TIMESTAMP,
  posting_started_at TIMESTAMP,
  posted_at TIMESTAMP,
  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  error_step VARCHAR(20),
  -- ...
);
```

---

## 🔗 Related

- **BUG-007** : Catchup 3h trop court → 18h
- **DONE-029** : Calendar Dashboard

