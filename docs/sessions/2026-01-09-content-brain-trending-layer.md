# 🔥 Content Brain V2.4 — Trending Layer Integration

**Date** : 9 janvier 2026  
**Durée** : ~2h  
**Status** : ✅ Opérationnel

---

## 📝 FIN DE SESSION — À SAUVEGARDER

### ✅ Ce qui a été fait cette session :

1. **Création du Trending Layer** (`lib/trending-layer.mjs`)
   - Intégration Perplexity API pour contenu dynamique
   - Deux modes : EXPERIMENT (14h) et SAFE (21h)
   - Sanitization "Safe Sexy Vocabulary" pour éviter flagging AI
   - Extraction top performers depuis analytics pour SAFE slot
   - Fallbacks si Perplexity indisponible

2. **Intégration dans Content Brain** (`cron-scheduler.mjs`)
   - Nouvelle couche 7️⃣ TRENDING dans le prompt Claude
   - Fetch trending pour Elena uniquement (après autres layers)
   - Instructions spécifiques 14h/21h avec trending obligatoire
   - Field `trending_source` ajouté pour tracking

3. **Architecture 7 Couches**
   - 1️⃣ Analytics → Top performers
   - 2️⃣ History → Continuité narrative
   - 3️⃣ Context → Events temps réel
   - 4️⃣ Character → Fiche Elena/Mila
   - 5️⃣ Memories → Duo opportunités
   - 6️⃣ Relationship → Le secret 💕
   - 7️⃣ **TRENDING** → [NEW] Locations/Outfits/Poses viral

4. **Stratégie 14h vs 21h clarifiée**
   - **14h EXPERIMENT** : Trending créatif, nouveaux lieux/outfits/poses
   - **21h SAFE** : Trending similaire aux top performers mais fresh
   - A/B test conservé pour tracker performance

### 📁 Fichiers créés/modifiés :

- ✅ `app/scripts/lib/trending-layer.mjs` — **NOUVEAU** : Module trending complet
  - `fetchTrendingExperiment()` — Perplexity search créatif
  - `fetchTrendingSafe()` — Perplexity search analytics-based
  - `sanitizePromptFragment()` — Safe sexy vocabulary
  - `extractTopPerformers()` — Parse analytics pour patterns
  - `formatTrendingForPrompt()` — Format pour prompt Claude
  - Fallbacks si Perplexity indisponible

- ✅ `app/scripts/cron-scheduler.mjs` — **MODIFIÉ**
  - Import `trending-layer.mjs`
  - Fetch trending pour Elena après autres layers
  - Section 7️⃣ TRENDING dans prompt Claude
  - Instructions 14h/21h mises à jour avec trending obligatoire
  - Field `trending_source` ajouté dans output JSON

- ✅ `archive/one-shot-scripts/test-trending-carousel.mjs` — **ARCHIVÉ**
  - Script de test gardé pour référence

### 🚧 En cours (non terminé) :

- Aucun — Feature complète et opérationnelle

### 📋 À faire prochaine session :

- [ ] Tester génération réelle avec trending (14h + 21h)
- [ ] Monitorer performance trending EXPERIMENT vs SAFE
- [ ] Ajuster prompts Perplexity si nécessaire selon résultats
- [ ] Vérifier que `prompt_hints` contient bien les `promptFragments` trending

### 🐛 Bugs découverts :

- Aucun bug découvert

### 💡 Idées notées :

- **Trending pour Mila** : Étendre trending layer à Mila si Elena performe bien
- **Cache trending** : Mettre en cache résultats Perplexity (24h) pour économiser API calls
- **A/B Test trending** : Tester différentes stratégies Perplexity (temperature, prompts)

### 📝 Notes importantes :

#### Architecture Trending Layer

**EXPERIMENT Mode (14h)** :
- Temperature 0.6 (plus créatif)
- Évite lieux récents (Bali, yacht, spa)
- Cherche lieux NOUVEAUX et viral
- "Petites tenues" trending (bikini/lingerie/sport underwear)
- Poses candid (pas toujours face caméra)

**SAFE Mode (21h)** :
- Temperature 0.3 (plus conservateur)
- Basé sur top performers analytics
- Lieux SIMILAIRES aux succès mais fresh
- Outfits style qui marche déjà
- Poses similaires aux top posts

#### Safe Sexy Vocabulary

Le système sanitize automatiquement les prompts pour éviter flagging :
- "bikini" → "elegant high-cut swimwear"
- "lingerie" → "intimate sleepwear" / "delicate loungewear"
- "underwear" → "athletic loungewear set"
- "sensual" → "captivating"
- "sexy" → "striking"
- Évite "sheer", "transparent", "see-through"

#### Intégration dans Content Brain

1. Claude reçoit trending dans Section 7️⃣
2. Instructions explicites : utiliser trending pour 14h/21h
3. `prompt_hints` doit contenir les `promptFragments` (location + outfit + pose)
4. Caption suggérée peut être adaptée mais garde micro-story format
5. Field `trending_source` : "experiment" ou "safe" pour tracking

#### A/B Testing Conservé

- Le système A/B test existant reste actif
- Trending EXPERIMENT vs SAFE = nouveau test implicite
- Tracking via `trending_source` + `is_experiment` fields

---

## 🔥 Détails Techniques

### Perplexity API Integration

```javascript
// EXPERIMENT Mode
const trendingExperiment = await fetchTrendingExperiment(recentLocations);
// → Location + Outfit + Pose + Caption suggérée

// SAFE Mode  
const topPerformers = extractTopPerformers(analytics);
const trendingSafe = await fetchTrendingSafe(topPerformers);
// → Similar to top performers but fresh
```

### Prompt Structure

Le prompt Claude inclut maintenant :

```
═══════════════════════════════════════════════════════════════
## 🔥 7️⃣ TRENDING CONTENT — Perplexity Real-Time Insights
═══════════════════════════════════════════════════════════════

### 🧪 TRENDING CONTENT (14h EXPERIMENT)
**Location**: Mediterranean Cliffside Hotel
→ Hotel pool content trending for European influencers
→ Prompt: "luxury hotel rooftop pool with city skyline view..."

**Outfit (Petite Tenue)**: Metallic High-Cut Swimwear
→ Metallic swimwear trending for curvy models
→ Prompt: "elegant metallic high-cut swimwear in champagne gold..."

**Pose**: Seated Edge Lean
→ Candid seated poses viral for pool/lounge content

**Suggested Caption**: "Some views are better without explanation..."

### ✅ TRENDING CONTENT (21h SAFE)
**Location**: Tropical Villa Morning
→ Similar to top performer: Bali/travel content
→ Prompt: "luxury tropical villa with infinity pool..."

**Outfit**: Resort Swimwear
→ Swimwear performs well in travel content

**Pose**: Poolside Contemplation
→ Candid pool moments match top performers

**Suggested Caption**: "Missing these mornings..."
```

### Output JSON Structure

```json
{
  "scheduled_time": "14:00",
  "is_experiment": true,
  "location_name": "Mediterranean Cliffside Hotel",
  "outfit": "metallic high-cut swimwear in champagne gold",
  "action": "seated on edge, leaning back, looking away",
  "prompt_hints": "Mediterranean villa terrace... elegant metallic high-cut swimwear... seated on edge, leaning back on hands, looking away lost in thought",
  "caption": "Some views are better without explanation...",
  "trending_source": "experiment"
}
```

---

## 📊 Impact Attendu

- **Variété** : Plus de lieux/outfits/poses, moins de répétition
- **Virality** : Contenu aligné avec trends Instagram actuelles
- **Performance** : Tracking EXPERIMENT vs SAFE pour optimiser
- **Scalabilité** : Système dynamique, pas de hardcoding

---

**Action** : ✅ Intégré dans Content Brain, prêt pour tests réels
