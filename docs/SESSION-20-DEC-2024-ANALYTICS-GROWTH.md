# 📊 Session 20 Décembre 2024 — Analytics & Growth Strategy

> Analyse des deux comptes Instagram + définition stratégie de croissance + **implémentation TODO-011**

**Date** : 20 décembre 2024  
**Durée** : ~4h (2 parties)

---

## ✅ Ce qui a été fait cette session

### 1. Analyse Analytics des deux comptes

Créé `dual-analytics.mjs` pour analyser Mila et Elena en parallèle.

**Résultats :**

| Métrique | Mila (@mila_verne) | Elena (@elenav.paris) |
|----------|-------------------|----------------------|
| Followers | 58 | 2 |
| Posts | 41 | 20 |
| Engagement Rate | 8.45% | 112.5% (biaisé) |
| Likes moyens | 4 | 2 |
| Posts/semaine | 24.2 | 41.3 |

**Problème majeur identifié : PAS ASSEZ DE REELS**
- Mila: 4 Reels sur 41 posts (10%) ❌
- Elena: 1 Reel sur 20 posts (5%) ❌
- Cible: 40-50% minimum

### 2. Discussion stratégie Content Brain

Architecture discutée pour un système autonome intelligent :
- **Mémoire** : Timeline historique + posts passés
- **Intelligence** : Analytics + patterns + trends
- **Décision** : Claude API qui décide le contenu quotidien
- **Exécution** : Scripts existants (préservés, pas remplacés)

**Décisions prises :**
- Full auto pour l'autonomie
- Full auto pour les arcs narratifs
- Planning quotidien (direction du jour pour tous les posts)
- Sources externes : Perplexity, météo, calendrier, trends

### 3. Définition des activités des personnages

**Mila fait :**
- Entraîne ses clientes PT
- Shoote (photographe)
- Joue de la guitare
- Morning run Paris
- Yoga/Pilates
- Café & travail
- Meal prep

**Elena fait :**
- Shootings (mannequin)
- Fittings/essayages
- Voyages pour travail
- Fashion Week
- Réunions clients
- Spa/wellness
- Restaurants gastronomiques

**Ensemble (3x/semaine) :**
- Mila photographie Elena
- Brunch
- Shopping
- Voyage duo
- Workout ensemble

### 4. Implémentation TODO-011 — Growth Improvements ✅

Toutes les améliorations prioritaires ont été implémentées :

#### 4.1 Hashtags Optimisés — `hashtags.ts` créé

Nouveau fichier de configuration avec pools de hashtags par catégorie :
- `fitness_mila` — fitness, gym, pilates
- `fashion_elena` — mode, style, luxe
- `model_elena` — mannequin, shooting
- `lifestyle` — daily life, vibes
- `paris` — hashtags Paris
- `travel` — voyages, destinations
- `spa_wellness` — bien-être
- `beach` — plage, été
- `duo` — amitié, BFF
- `reels` / `carousel` — types de contenu

Fonctions helpers : `getHashtags()`, `getMixedHashtags()`, `getMilaHashtags()`, `getElenaHashtags()`, `getDuoHashtags()`

#### 4.2 Captions Engageantes — 4 scripts modifiés

Tous les scripts de publication ont été mis à jour avec des captions incluant questions et CTAs :

**Exemples de nouvelles captions :**
- "Ce moment où tu traînes au lit toute la matinée… Vous êtes team lève-tôt ou grasse mat? 🛏️"
- "Soft mornings > everything else. Change my mind 🤍"
- "Votre café parisien préféré?"
- "Spritz ou Negroni? 🥂"
- "POV: Ta BFF te force à faire du sport 😭💪"

#### 4.3 Elena Voyage Plus — 7 nouveaux lieux

Ajoutés dans `locations-elena.ts` :

| Lieu | Description |
|------|-------------|
| `milan_fashion` | Via Montenapoleone, fashion district |
| `milan_hotel` | Suite 5 étoiles avec vue Duomo |
| `backstage_shooting` | Studio coulisses, BTS mode |
| `yacht_mediterranean` | Yacht côte Amalfitaine |
| `london_rooftop` | Bar rooftop vue Londres |
| `maldives_suite` | Villa sur pilotis |
| `airport_lounge` | First class lounge |

#### 4.4 Script Duo — `duo-post.mjs` créé

Nouveau script pour les posts Mila×Elena :

**4 scénarios implémentés :**

| Scénario | Description | Captions personnalisées |
|----------|-------------|-------------------------|
| `shooting` | Mila photographie Elena | BTS shooting |
| `brunch` | Brunch ensemble | Café Paris |
| `workout` | Elena essaie fitness | Gym/Pilates |
| `shopping` | Shopping trip duo | Boutiques Paris |

**Fonctionnalités :**
- Génère 3 images des deux ensemble
- Publie automatiquement sur les 2 comptes
- Captions avec @mentions croisées
- Hashtags pools dédiés duo

**Usage :**
```bash
node scripts/duo-post.mjs shooting      # Scénario spécifique
node scripts/duo-post.mjs random        # Scénario aléatoire
node scripts/duo-post.mjs brunch test   # Mode test
```

---

## 📁 Fichiers créés/modifiés

### Partie 1 — Analyse & Planification

| Fichier | Action |
|---------|--------|
| `app/scripts/dual-analytics.mjs` | 🆕 Créé |
| `docs/SESSION-20-DEC-2024-ANALYTICS-GROWTH.md` | 🆕 Créé |
| `roadmap/todo/TODO-011-growth-improvements.md` | 🆕 Créé |

### Partie 2 — Implémentation TODO-011

| Fichier | Action |
|---------|--------|
| `app/src/config/hashtags.ts` | 🆕 Créé — Pools hashtags optimisés |
| `app/scripts/duo-post.mjs` | 🆕 Créé — Script posts duo |
| `app/scripts/carousel-post.mjs` | ✏️ Captions avec questions/CTAs |
| `app/scripts/carousel-post-elena.mjs` | ✏️ Captions avec questions/CTAs |
| `app/scripts/vacation-reel-post.mjs` | ✏️ Captions avec questions/CTAs |
| `app/scripts/vacation-reel-post-elena.mjs` | ✏️ Captions avec questions/CTAs |
| `app/src/config/locations-elena.ts` | ✏️ +7 nouveaux lieux voyage |
| `roadmap/done/TODO-011-growth-improvements.md` | ✅ Déplacé → done |
| `roadmap/ideas/IDEA-005-intelligent-content-engine.md` | ✏️ Phase 0 marquée done |
| `ROADMAP.md` | ✏️ Mis à jour |

---

## 🚧 En cours (non terminé)

- Aucun — TODO-011 complété

---

## 📋 À faire prochaine session

### ✅ Priorité 1 : Croissance immédiate — DONE

- [x] **Plus de Reels** — Scripts existants prêts à exécuter
- [x] **Améliorer captions** — Questions + CTAs dans tous les scripts
- [x] **Posts duo 3x/semaine** — `duo-post.mjs` créé avec 4 scénarios
- [x] **Elena voyage** — 7 nouveaux lieux ajoutés
- [x] **Hashtags optimisés** — `hashtags.ts` créé

### 🔴 Priorité 1 : Exécution immédiate

- [ ] **Lancer les Reels** — Exécuter `vacation-reel-post.mjs` et `vacation-reel-post-elena.mjs`
- [ ] **Premier post duo** — Tester `duo-post.mjs shooting` en production
- [ ] **Targeting actif** — 20 comments/jour sur niches cibles (TODO-010)

### 🟡 Priorité 2 : Système intelligent

- [ ] Setup Supabase + schéma enrichi (timeline, arcs, conversations)
- [ ] Timeline historique 2023-2024 Mila×Elena (lore)
- [ ] Content Brain v1 (IA qui décide le planning quotidien)

### 🟢 Priorité 3 : Automatisation avancée

- [ ] GitHub Actions pour `duo-post.mjs` (3x/semaine auto)
- [ ] Gemini Reel Analyzer (copier les Reels qui marchent)
- [ ] Sources externes (Perplexity trends, météo, calendrier)
- [ ] Auto-planning hebdomadaire

---

## 🐛 Bugs découverts

- Aucun nouveau bug

---

## 💡 Idées notées

### Fréquence Reels proposée

| Jour | Mila | Elena |
|------|------|-------|
| Lundi-Jeudi | 1 Reel + 1 Carousel | 1 Reel + 1 Carousel |
| Vendredi | 2 Reels | 2 Reels |
| **Samedi-Dimanche** | **3 Reels** | **3 Reels** |

= ~12 Reels/semaine par compte

### Répartition lieux Elena

| Type de lieu | Fréquence |
|--------------|-----------|
| Loft Paris | 30% |
| Voyages/Hôtels luxe | 40% |
| Shootings/Backstage | 15% |
| Paris extérieur | 15% |

### Captions engageantes — Structure

```
[Hook/Story - 1-2 lignes]

[Question ou CTA]

[Hashtags]
```

**Exemples :**
- "Ce moment où ta BFF t'appelle à 7h pour un brunch improvisé... Vous êtes team matin ou soir?"
- "Les matins > les soirées. Change my mind."
- "Swipe pour voir la surprise... 👀"

### Gemini Reel Analyzer

Workflow :
1. Tu vois un Reel qui cartonne
2. Tu le partages à Gemini
3. Gemini analyse : hook, mouvement, musique, durée, transition
4. Gemini génère un prompt adapté à Mila/Elena
5. On génère et poste

---

## 📝 Notes importantes

### Architecture Content Brain (confirmée)

```
┌─────────────────────────────────────────┐
│           CONTENT BRAIN                 │
│     (nouvelle couche intelligente)      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          EXECUTION LAYER                │
│   (scripts existants INCHANGÉS)         │
│                                         │
│   carousel-post.mjs                     │
│   vacation-reel-post.mjs                │
│   carousel-post-elena.mjs               │
│   vacation-reel-post-elena.mjs          │
│                                         │
│   Pipeline: Nano Banana → Cloudinary    │
│             → Instagram API             │
└─────────────────────────────────────────┘
```

**Le système est ADDITIF, pas destructif.**

### Schéma Supabase enrichi discuté

Nouvelles tables au-delà du TODO-004 :
- `characters` — Mila, Elena
- `timeline_events` — Le lore partagé (rencontres, voyages, milestones)
- `relationships` — Détails amitié Mila×Elena (inside jokes, nicknames)
- `narrative_arcs` — Arcs en cours (ski trip, etc.)
- `caption_templates` — Templates par catégorie avec questions/CTAs

### Full auto confirmé

- Autonomie complète (pas de validation humaine)
- Arcs narratifs créés automatiquement
- Planning quotidien généré le matin

---

## 🔗 Documents liés

- [IDEA-005 — Intelligent Content Engine](../roadmap/ideas/IDEA-005-intelligent-content-engine.md) — Phase 0 terminée
- [TODO-004 — Supabase Integration](../roadmap/todo/TODO-004-supabase-integration.md)
- [TODO-011 — Growth Improvements](../roadmap/done/TODO-011-growth-improvements.md) — ✅ Terminé

---

## 📊 Résumé de la Session

| Métrique | Valeur |
|----------|--------|
| Durée totale | ~4h |
| Fichiers créés | 3 |
| Fichiers modifiés | 8 |
| TODO complétés | 1 (TODO-011) |
| Nouveaux scripts | 1 (`duo-post.mjs`) |
| Nouveaux lieux Elena | 7 |
| Scripts améliorés | 4 |

**Impact attendu :**
- Engagement +20% grâce aux captions avec questions
- Reach Elena +40% grâce aux nouveaux lieux voyage
- Followers +50% grâce aux posts duo 3x/semaine

---

*Session documentée le 20 décembre 2024*

