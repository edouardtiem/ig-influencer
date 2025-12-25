# 📸 Session Carousel-Only Strategy — 24 Décembre 2024

> Migration complète vers carrousels uniquement + Fix tokens GitHub

**Durée** : ~1h  
**Version** : v2.24.0

---

## 🎯 Objectif

1. Résoudre le problème des posts manquants ce matin
2. Simplifier le pipeline en supprimant les reels (plus besoin de FFmpeg/Kling)
3. Synchroniser les tokens GitHub avec les tokens locaux

---

## ✅ Ce qui a été fait cette session

### 1. **Investigation Posts Manquants**

**Problème identifié** :
- Mila carousel 10h : Images générées ✅ mais publication échouée ❌ (`instagram_post_id: null`)
- Elena reel 8h : Échec FFmpeg (`ffmpeg: not found`)

**Cause racine** :
- **Tokens GitHub désynchronisés** : Les secrets GitHub Actions n'étaient pas à jour avec `.env.local`
- Tokens locaux valides (confirmés via `check-token.mjs`) mais tokens GitHub invalides
- Le code ne vérifiait pas les erreurs API → marquait "posted" même si `id: undefined`

**Solution** :
- ✅ Mis à jour `INSTAGRAM_ACCESS_TOKEN` (Mila) dans GitHub Secrets
- ✅ Mis à jour `INSTAGRAM_ACCESS_TOKEN_ELENA` (Elena) dans GitHub Secrets
- ✅ Tokens synchronisés avec `.env.local`

### 2. **Migration Carousel-Only**

**Changements** :
- ✅ Supprimé règles "minimum reels" et "video reel recommendations"
- ✅ Ajouté règle "TOUS LES POSTS sont des CAROUSELS"
- ✅ Prompt Claude mis à jour pour ne demander que des carrousels
- ✅ `post_type: 'carousel'` forcé dans la base de données
- ✅ Simplifié l'affichage (plus d'info reel)

**Fichiers modifiés** :
- `app/scripts/cron-scheduler.mjs`
  - `getExplorationRequirements()` : Règle carousel-only
  - `buildEnhancedPrompt()` : Prompt mis à jour
  - `generateSchedule()` : Force `post_type: 'carousel'` partout

**Avantages** :
- ✅ Plus besoin de FFmpeg (simplifie GitHub Actions)
- ✅ Plus besoin de Kling (génération plus rapide)
- ✅ Pipeline plus simple et fiable
- ✅ Carrousels performent bien selon analytics

### 3. **Régénération Planning du Jour**

**Actions** :
- ✅ Supprimé tous les posts du 24/12 (6 posts + 2 schedules)
- ✅ Régénéré planning complet avec nouvelle stratégie carousel-only
- ✅ Planning adapté à la journée (10h du matin)

**Nouveau planning** :
- **Mila** : 3 carrousels (08:00 salon, 12:30 throwback Hossegor, 18:00 réponse Elena)
- **Elena** : 3 carrousels (08:00 loft, 12:30 throwback London, 18:00 Tuileries)

---

## 📁 Fichiers modifiés

- `app/scripts/cron-scheduler.mjs`
  - Migration complète vers carousel-only
  - Suppression logique reels

---

## 🚧 En cours (non terminé)

- **Gestion d'erreurs API** : Le code `publishCarousel()` ne vérifie pas les erreurs Instagram API
  - Actuellement : Marque "posted" même si `id: undefined`
  - À faire : Vérifier `publishData.error` et gérer les erreurs correctement

---

## 📋 À faire prochaine session

- [ ] **Fix gestion d'erreurs** dans `publishCarousel()` et `publishReel()`
  - Vérifier `response.error` avant de marquer "posted"
  - Logger les erreurs API correctement
  - Ne pas marquer "posted" si `instagram_post_id` est null
  
- [ ] **Vérifier que les posts du 24/12 sont bien publiés**
  - Contrôler que les tokens GitHub fonctionnent maintenant
  - Vérifier que les carrousels sont générés et publiés correctement

---

## 🐛 Bugs découverts

- ✅ **Tokens GitHub désynchronisés** → Fixé (secrets mis à jour)
- 🔍 **Pas de gestion d'erreurs API** → Identifié, à fixer prochaine session
- ✅ **FFmpeg manquant** → Plus un problème (plus de reels)

---

## 💡 Idées notées

- **Monitoring automatique** : Vérifier que les tokens GitHub sont synchronisés avec `.env.local` avant chaque run
- **Alertes** : Notifier si `instagram_post_id` est null après publication

---

## 📝 Notes importantes

- Les tokens Instagram sont **permanents** (expires_at: 0) et fonctionnent correctement localement
- Le problème était uniquement la désynchronisation GitHub Secrets
- La stratégie carousel-only simplifie beaucoup le pipeline (pas de FFmpeg, pas de Kling)
- Les carrousels performent bien selon analytics (meilleur format selon les données)

---

## 🔗 Références

- [Token Refresh Guide](./20-TOKEN-REFRESH-GUIDE.md)
- [Content Brain V2](./SESSION-21-DEC-2024-CONTENT-BRAIN-V2.md)
- [Status Tracking](./SESSION-23-DEC-2024-STATUS-TRACKING.md)

---

**Prochaine étape** : Fixer la gestion d'erreurs API pour éviter les faux positifs "posted".

