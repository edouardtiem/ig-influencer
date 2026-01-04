# DONE-058: Content Brain — Suppression Analytics "Best" pour Plus de Créativité

**Status**: ✅ Done  
**Date**: 7 janvier 2025  
**Version**: v2.43.0  
**Durée**: ~15min

---

## 📋 Objectif

Supprimer les analytics "best" (bestLocation, bestMood, bestPostType) du Content Brain pour éviter le **biais de convergence** et permettre plus de **créativité et variété** dans les posts générés.

### Problème identifié

Quand Claude recevait :
```
- Meilleur lieu : loft_paris
- Meilleur mood : cozy
- Meilleur type : carousel
```

Il convergeait naturellement vers ces valeurs → **moins de variété**, feed répétitif.

---

## 🔧 Changements effectués

### 1. `analytics-layer.mjs` — `formatAnalyticsForPrompt()`

**Avant** : Injectait patterns + recommendations (biais de convergence)
```javascript
### Patterns détectés:
- Location: travel performe +15% mieux
- Format: reel = meilleur engagement
- Mood: "cozy" = le plus engageant
- Créneau: evening = meilleur reach

### Recommandations:
→ Privilégie le contenu travel...
```

**Après** : Juste les top posts comme **inspiration** (pas directive)
```javascript
### Top 5 posts récents (inspiration, pas obligation):
1. carousel @ loft_paris (cozy) — 245 likes
...

💡 Ces posts ont bien marché, mais sois CRÉATIF et explore de nouvelles combinaisons!
```

### 2. `content-brain.ts` — Section "Analytics Insights" supprimée

**Supprimé** :
```typescript
## Analytics Insights
- Meilleur lieu : ${context.analytics.bestLocation}
- Meilleur mood : ${context.analytics.bestMood}
- Meilleur type : ${context.analytics.bestPostType}
- Engagement moyen : ${context.analytics.avgEngagement}%
```

**Gardé** : Les lieux à éviter (pour la variété)
```typescript
## Lieux à éviter (postés récemment)
${context.analytics.recentLocations.join(', ')}
```

### 3. `cron-scheduler.mjs` — Titre section changé

**Avant** : `## 1️⃣ ANALYTICS — Ce qui FONCTIONNE`  
**Après** : `## 1️⃣ ANALYTICS — Posts récents (inspiration)`

---

## 📁 Fichiers modifiés

- `app/scripts/lib/analytics-layer.mjs` - `formatAnalyticsForPrompt()` simplifiée
- `app/src/lib/content-brain.ts` - Section "Analytics Insights" supprimée
- `app/scripts/cron-scheduler.mjs` - Titre section analytics changé

---

## 🎯 Résultat attendu

Claude va maintenant :
- ✅ Voir les posts récents qui ont bien marché (inspiration)
- ✅ Éviter de répéter les lieux récents (variété)
- ❌ Ne plus recevoir "fais plus de cozy/travel/carousel" (libéré du biais)

**Impact** : Plus de variété dans les prochaines générations de posts, découverte de nouvelles combinaisons qui pourraient mieux marcher.

---

## 📝 Notes importantes

- Les analytics sont toujours calculés en BDD (`getAnalyticsInsights()`), mais ne sont plus injectés comme directive dans le prompt
- On garde `recentLocations` pour éviter les répétitions (variété)
- Philosophie : **Exploration > Exploitation** pour découvrir de nouveaux patterns

---

## 🔗 Liens

- Issue discussion : Session 7 janvier 2025
- Fichiers modifiés : `analytics-layer.mjs`, `content-brain.ts`, `cron-scheduler.mjs`

