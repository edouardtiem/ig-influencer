# 📊 Session 22 Décembre 2024 — Analytics Page & Full Sync

> Création d'une page Analytics complète avec sync Instagram Graph API et sauvegarde Supabase

**Date** : 22 décembre 2024  
**Durée** : ~3h

---

## ✅ Ce qui a été fait cette session

### 1. Page Analytics Complète (`/analytics`)

Créé une page dashboard avec :

- **8 KPI Cards** avec badges de variation (%)
  - Impressions, Reach, Likes, Comments, Saves, Posts
  - **Engagement Rate** (nouveau)
  - **Meilleure heure de post** (nouveau)

- **3 Graphiques**
  - 📈 Évolution des impressions (Area Chart)
  - 💖 Engagement par jour (Line Chart - likes, comments, saves)
  - 👥 Évolution Followers (Area Chart - nouveau)

- **Best Performers**
  - 🏆 Top 5 Posts (avec ranking, views, likes)
  - 📍 Meilleur lieu (avg views/post)

- **Filtres**
  - Période : Tout | 90j | 60j | 30j | 7j (défaut)
  - Compte : Tous | Mila | Elena
  - Exclut automatiquement aujourd'hui (données incomplètes)

- **Comparaison période précédente**
  - Chaque KPI affiche +X% ou -X% vs période précédente

### 2. API Sync Instagram Graph API v22

Corrigé les métriques deprecated :
- ❌ `impressions` (deprecated API v22)
- ✅ `views` (nouvelle métrique)

Créé `/api/sync-analytics` :
- **POST** : Sync TOUS les posts existants (pas juste 25)
- Met à jour views, reach, saves, shares pour chaque post
- Détecte et importe les nouveaux posts automatiquement
- Sauvegarde snapshot quotidien des followers

### 3. Scripts Full Sync

Créé 3 scripts utilitaires :

| Script | Fonction |
|--------|----------|
| `full-sync-insights.mjs` | Re-fetch views pour tous les posts |
| `import-missing-posts.mjs` | Importe les posts IG pas dans Supabase |
| `check-impressions.mjs` | Debug des données en DB |

### 4. Sauvegarde Automatique Supabase

Créé `scripts/lib/supabase-helper.mjs` avec fonction `savePostToSupabase()`.

Modifié 5 scripts de publication pour sauvegarder automatiquement :

| Script | Character |
|--------|-----------|
| `carousel-post.mjs` | Mila |
| `carousel-post-elena.mjs` | Elena |
| `photo-reel-post.mjs` | Mila |
| `photo-reel-post-elena.mjs` | Elena |
| `duo-post.mjs` | Both |

---

## 📁 Fichiers créés/modifiés

### Créés

| Fichier | Description |
|---------|-------------|
| `src/app/analytics/page.tsx` | 🆕 Page Analytics dashboard |
| `src/app/api/analytics/route.ts` | 🆕 API données analytics |
| `src/app/api/sync-analytics/route.ts` | 🆕 API sync Instagram |
| `scripts/lib/supabase-helper.mjs` | 🆕 Helper sauvegarde posts |
| `scripts/full-sync-insights.mjs` | 🆕 Re-sync views tous posts |
| `scripts/import-missing-posts.mjs` | 🆕 Import posts manquants |
| `scripts/check-impressions.mjs` | 🆕 Debug données DB |
| `scripts/debug-insights.mjs` | 🆕 Debug API Instagram |

### Modifiés

| Fichier | Modification |
|---------|--------------|
| `src/app/page.tsx` | ✏️ Ajout lien Analytics |
| `scripts/carousel-post.mjs` | ✏️ + savePostToSupabase |
| `scripts/carousel-post-elena.mjs` | ✏️ + savePostToSupabase |
| `scripts/photo-reel-post.mjs` | ✏️ + savePostToSupabase |
| `scripts/photo-reel-post-elena.mjs` | ✏️ + savePostToSupabase |
| `scripts/duo-post.mjs` | ✏️ + savePostToSupabase |
| `scripts/sync-analytics.mjs` | ✏️ Utilise `views` au lieu de `impressions` |

---

## 📊 Données après full sync

| Compte | Posts | Views | Reach |
|--------|-------|-------|-------|
| Mila | 49 | 4,995 | 1,427 |
| Elena | 28 | 2,539 | 939 |
| **Total** | **77** | **7,534** | **2,366** |

**Engagement Rate global** : 19.9%  
**Meilleure heure** : 15h (148 views/post)

---

## 🚧 En cours (non terminé)

- Aucun — Session complète

---

## 📋 À faire prochaine session

- [ ] Ajouter cron job pour sync analytics quotidien (GitHub Actions)
- [ ] Implémenter comparaison Mila vs Elena side-by-side
- [ ] Ajouter graphique "Posts par jour de la semaine"
- [ ] Ajouter export CSV des données
- [ ] Implémenter alertes si engagement drop > 20%

---

## 🐛 Bugs découverts

- **Elena sync timeout** : L'API route timeout parfois sur 77 posts. Solution : utiliser le script CLI `node scripts/sync-analytics.mjs elena` si le bouton échoue.

---

## 💡 Idées notées

### Dashboard v2
- Heatmap des heures de post
- Comparaison engagement Carousel vs Reel
- Prédiction reach basée sur heure de post
- Détection automatique des posts viraux

### Automatisation
- Webhook Instagram pour sync en temps réel
- Notification Slack si post performe bien
- Auto-adjust posting time basé sur analytics

---

## 📝 Notes importantes

### Migration API Instagram v22

```
DEPRECATED (v22+):
- impressions → utiliser "views"
- plays → utiliser "views"

TOUJOURS VALIDE:
- reach, saved, shares, total_interactions
```

### Flow Sync

```
Bouton "Sync Instagram"
        │
        ▼
┌─────────────────────────────────────┐
│  Pour chaque post en DB:           │
│  1. Fetch insights (views, reach)  │
│  2. Update dans Supabase           │
│  3. Rate limit 80ms entre calls    │
└─────────────────────────────────────┘
        │
        ▼
  Refresh page avec nouvelles données
```

### Calcul Engagement Rate

```
Engagement Rate = (likes + comments + saves) / reach × 100
```

---

## 🔗 Documents liés

- [TODO-004 — Supabase Integration](../roadmap/todo/TODO-004-supabase-integration.md) — Partiellement complété
- [IDEA-005 — Intelligent Content Engine](../roadmap/ideas/IDEA-005-intelligent-content-engine.md) — Phase 2 complète
- [SESSION-20-DEC-2024-ANALYTICS-GROWTH.md](./SESSION-20-DEC-2024-ANALYTICS-GROWTH.md) — Session précédente analytics

---

*Session documentée le 22 décembre 2024*







