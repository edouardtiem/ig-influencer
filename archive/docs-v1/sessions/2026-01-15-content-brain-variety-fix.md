# 🔥 Content Brain V2.5 — Fix Variété & Retrait Biais Analytics

**Date** : 15 janvier 2026  
**Durée** : ~1h  
**Status** : ✅ Opérationnel

---

## 📝 FIN DE SESSION — À SAUVEGARDER

### ✅ Ce qui a été fait cette session :

1. **Fix du cercle vicieux Bali/Mykonos répétitif**
   - Étendu avoid list de 3 jours → **7 jours** (history-layer.mjs)
   - Ajouté règles HARD de variété : `force_paris_content`, `avoid_repeated_destinations`, `mood_variety`
   - Détection automatique des répétitions (Bali 3x, Mykonos 2x...) → INTERDITS

2. **Diversification des locations sexy-friendly**
   - Ajouté 15+ nouvelles locations : Paris rooftops, Milan fashion, London clubs, art galleries, boudoirs
   - Fallbacks améliorés : 60% Paris/urban au lieu de toujours Bali/tropical

3. **Retrait complet du biais analytics du trending layer**
   - `fetchTrendingSafe()` ne prend plus `topPerformers` → plus de cercle vicieux
   - Nouveau prompt Perplexity : "TIMELESS, CLASSIC content" au lieu de "similar to top performers"
   - Supprimé `extractTopPerformers()` qui créait le biais
   - Analytics utilisé uniquement pour horaires/format, plus pour locations

4. **Amélioration fallbacks trending**
   - Fallback EXPERIMENT : 60% Paris/urban, options variées (boudoir, spa, bar)
   - Fallback SAFE : Rotation pondérée (Paris 40%, Bedroom 25%, Spa 25%, Bar 10%)
   - Plus de "Tropical Villa" par défaut

5. **Fix bug Unicode JSON**
   - Ajouté `sanitizeString()` pour nettoyer surrogate pairs Unicode
   - Corrige erreur "no low surrogate in string" dans prompts

6. **Tracking amélioré**
   - Ajouté `trending_source` dans `scheduled_posts` pour tracker Perplexity vs fallback
   - Logs améliorés pour debug

### 📁 Fichiers créés/modifiés :

- ✅ `app/scripts/lib/history-layer.mjs` — **MODIFIÉ**
  - Avoid list étendu à 7 jours (ligne 112)
  - Ajouté `recentTravelCount` pour détecter surreprésentation travel (ligne 121)
  
- ✅ `app/scripts/cron-scheduler.mjs` — **MODIFIÉ**
  - Ajouté 15+ nouvelles locations dans `ELENA_SEXY_LOCATIONS` (lignes 322-379)
  - Règles exploration renforcées : `force_paris_content`, `avoid_repeated_destinations`, `mood_variety` (lignes 496-530)
  - Retiré import `extractTopPerformers` (ligne 32)
  - `fetchTrendingSafe()` ne prend plus `topPerformers` (ligne 985)
  - Ajouté `trending_source` dans scheduled_posts (ligne 1109)

- ✅ `app/scripts/lib/trending-layer.mjs` — **MODIFIÉ**
  - `fetchTrendingSafe()` : Nouveau prompt "TIMELESS, CLASSIC" sans référence analytics (lignes 183-260)
  - `getFallbackTrendingSafe()` : Plus de paramètre `topPerformers`, rotation pondérée (lignes 377-476)
  - `getFallbackTrending()` : 60% Paris/urban, options variées (lignes 297-332)
  - Supprimé `extractTopPerformers()` (remplacé par commentaire ligne 549)
  - Ajouté `sanitizeString()` pour fix Unicode (lignes 501-505)
  - `formatTrendingForPrompt()` : Applique sanitizeString sur tous les champs (lignes 499-545)

### 🚧 En cours (non terminé) :

- Aucun — Feature complète et opérationnelle

### 📋 À faire prochaine session :

- [ ] Monitorer performance des nouveaux posts Paris vs anciens posts travel
- [ ] Vérifier que `trending_source` est bien tracké dans analytics
- [ ] Ajuster poids fallbacks si nécessaire selon résultats

### 🐛 Bugs découverts :

- ✅ **FIXÉ** : Erreur JSON "no low surrogate in string" → ajouté `sanitizeString()`
- ✅ **FIXÉ** : Cercle vicieux Bali/Mykonos → retiré analytics du trending layer

### 💡 Idées notées :

- **Analytics inversé** : Utiliser analytics pour détecter ce qui est SURREPRÉSENTÉ et l'éviter (diversity enforcer)
- **Cache trending** : Mettre en cache résultats Perplexity (24h) pour économiser API calls
- **Trending pour Mila** : Étendre trending layer à Mila si Elena performe bien

### 📝 Notes importantes :

#### Problème identifié

**Le cercle vicieux** :
```
Posts récents = Bali, Mykonos, Maldives
        ↓
extractTopPerformers() → "Bali performe bien"
        ↓
fetchTrendingSafe() → demande "contenu similaire à Bali"
        ↓
Perplexity ou Fallback → suggère "Tropical Villa"
        ↓
Nouveau post = encore du Bali
        ↓
(répète...)
```

**Solution** : Retirer complètement analytics du trending layer. Perplexity décide 100% basé sur trends actuels.

#### Architecture finale

| Couche | Rôle |
|--------|------|
| History | Où en est l'histoire + **avoid list 7 jours** |
| Context | Events temps réel (Perplexity) |
| Trending EXPERIMENT | Créatif, edgy, nouveaux trends |
| Trending SAFE | **Classique, intemporel, élégant** (sans analytics) |

#### Résultats tests

**Avant** :
- 14h: ibiza_villa, st_tropez_beach, yacht_mediterranean
- 21h: bali_villa (3x), mykonos_villa (2x), maldives_overwater (2x)

**Après** :
- 14h: **Palais Royal Courtyard** (Paris) ✅
- 21h: **SO/Paris Rooftop** (Paris) ✅

#### Changements clés

1. **Avoid list** : 3 jours → **7 jours** (évite répétitions)
2. **Règles HARD** : `force_paris_content` si 3+ travel posts récents
3. **Analytics retiré** : Trending layer 100% Perplexity, pas de biais historique
4. **Fallbacks diversifiés** : 60% Paris/urban au lieu de toujours tropical

---

**Action** : ✅ Système opérationnel, variété garantie, plus de cercle vicieux
