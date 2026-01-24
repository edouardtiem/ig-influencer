# Session 28 décembre 2024 — Content Brain V3

## 🎯 Objectif
Améliorer le système de planification de contenu Elena avec 4 axes majeurs : balance Paris/voyages, trends temps réel, A/B testing avec 2 posts/jour, et arcs narratifs pour un storytelling cohérent.

## ✅ Ce qui a été fait cette session

### 1. Fix Scheduler GitHub Actions + History Layer
- **Problème** : Le scheduler ne tournait pas (cron overlap) + history layer lisait mauvaise table
- **Fix** : Cron 6:00 → 6:05 UTC + history layer lit `scheduled_posts` au lieu de `posts`
- **Impact** : Scheduler fonctionne + détecte correctement les voyages récents

### 2. Content Brain V3 — 4 améliorations majeures

#### A. Balance Paris/Voyages (Règles bidirectionnelles)
- **Avant** : Règle pour sortir si trop à la maison, mais pas de règle pour varier les voyages
- **Après** : 
  - Si 4/5 posts chez elle → suggérer sortir (café, extérieur, voyage)
  - Si 4/5 posts à Paris (home + cafés + tuileries) → suggérer voyage/throwback
  - Si 4/5 posts en voyage → suggérer variété (dont Paris)
- **Résultat** : Histoire équilibrée entre vie parisienne et jet-set

#### B. Perplexity Trends TODAY
- **Avant** : Demande des "trends lifestyle/mode" génériques
- **Après** : Prompt enrichi pour :
  - Instagram Trending Hashtags TODAY (vrais trends du jour)
  - Viral Content Formats (photo dump, carousel storytelling, etc.)
  - Fashion Events en cours (Fashion Week, lancements)
- **Résultat** : Hashtags plus pertinents et formats viraux détectés

#### C. A/B Testing avec 2 posts/jour
- **Avant** : 1 post/jour à 21h (mode safe après ban)
- **Après** : 
  - **14:00** = EXPERIMENT (Claude teste des trucs créatifs)
  - **21:00** = SAFE (analytics-driven, ce qui fonctionne)
- **Résultat** : Double le contenu + apprentissage continu

#### D. Arcs Narratifs
- **Avant** : Détecte juste le contexte ("rentrée de Bali")
- **Après** : Système d'arcs narratifs (5 types) :
  - `fashion_week` : 5-7 jours, Fashion Weeks
  - `vacation_trip` : 3-5 jours, escapades vacances
  - `paris_life` : 3-4 jours, vie quotidienne
  - `recovery_mode` : 2-3 jours, récupération post-voyage
  - `work_mode` : 2-3 jours, mode travail
- **Résultat** : Storytelling cohérent sur plusieurs jours

## 📁 Fichiers créés/modifiés

### Modifiés
- `app/scripts/cron-scheduler.mjs` — Règles variété + 2 posts/jour + intégration arcs
- `app/scripts/lib/context-layer.mjs` — Prompt Perplexity enrichi + viralFormat + fashionEvents
- `app/scripts/lib/history-layer.mjs` — Système d'arcs narratifs + `suggestNarrativeArc()`

### Créés
- `docs/sessions/SESSION-28-DEC-2024-SCHEDULER-FIX.md` (session précédente)
- `docs/sessions/SESSION-28-DEC-2024-CONTENT-BRAIN-V3.md` (cette session)

## 🚧 En cours (non terminé)
- Rien

## 📋 À faire prochaine session
- [ ] Vérifier demain 7:05 Paris que le scheduler tourne automatiquement
- [ ] Confirmer que 2 posts/jour sont générés (14h + 21h)
- [ ] Vérifier que les arcs narratifs créent du storytelling cohérent
- [ ] Monitorer si les règles de variété fonctionnent bien (équilibre Paris/voyage)

## 🐛 Bugs découverts
- **BUG-011** : Table `posts` a locations NULL (fixé via history layer qui lit `scheduled_posts`)
- **BUG-012** : Scheduler GitHub Actions ne tournait pas (fixé : cron 6:05)

## 💡 Idées notées
- Ajouter sync automatique `scheduled_posts` → `posts` quand status='posted'
- Considérer arcs narratifs plus longs (7-10 jours) pour Fashion Week
- A/B testing pourrait tester aussi les captions (style, longueur, emojis)

## 📝 Notes importantes

### Architecture Content Brain V3

```
6 Layers d'Intelligence:
├── Analytics Layer → Ce qui performe
├── History Layer → Où en est l'histoire + Arcs narratifs
├── Context Layer → Trends TODAY + Viral formats
├── Character Layer → Qui est Elena
├── Memories Layer → Souvenirs partagés
└── Relationship Layer → Le Secret 💕

+ Exploration Rules:
  ├── carousel_only
  ├── location_change (si trop chez elle)
  ├── travel_suggestion (si trop à Paris)
  └── suggest_variety (si trop en voyage)

+ A/B Testing:
  ├── Post 14h = EXPERIMENT
  └── Post 21h = SAFE
```

### Règles de Variété

| Situation | Règle | Suggestion |
|-----------|-------|------------|
| 4/5 chez elle | `location_change` | Sortir (café, extérieur, voyage) |
| 4/5 à Paris | `travel_suggestion` | Voyage/throwback |
| 4/5 en voyage | `suggest_variety` | Variété (dont Paris) |

### Arcs Narratifs

Les arcs sont suggérés automatiquement basés sur :
- History (locationType, daysSinceTravel)
- Context (fashionEvents détectés par Perplexity)
- Recent moods (work/fitness → work_mode)

## 📊 Impact attendu

1. **Variété** : Posts équilibrés entre Paris et voyages
2. **Engagement** : Hashtags trending TODAY + formats viraux
3. **Apprentissage** : 2 posts/jour = 2x plus de données pour optimiser
4. **Storytelling** : Arcs narratifs = histoire cohérente sur plusieurs jours

## 🔜 Prochaines étapes

1. Monitorer les 2 premiers jours avec 2 posts/jour
2. Vérifier que les arcs narratifs créent de la cohérence
3. Analyser si les experiments 14h découvrent de nouveaux patterns performants

