# TODO-011 — Growth Improvements

> Améliorations immédiates pour accélérer la croissance des deux comptes

**Status** : ✅ Done  
**Priorité** : 🔴 High  
**Estimation** : 4-6h  
**Créé** : 20 décembre 2024  
**Terminé** : 20 décembre 2024

---

## 🎯 Objectif

Implémenter les quick wins identifiés lors de l'analyse analytics du 20/12/2024 pour augmenter la croissance organique des comptes Mila et Elena.

---

## 📊 Contexte

**Problèmes identifiés :**
- Mila: 4 Reels / 41 posts (10%) — Cible: 50%
- Elena: 1 Reel / 20 posts (5%) — Cible: 50%
- Elena trop cantonnée à son loft (manque de voyages)
- Captions pas assez engageantes
- Pas assez de posts duo Mila×Elena

---

## ✅ Tâches

### 1. Plus de Reels (Priorité absolue)

- [x] **Scripts Reels existants prêts** - À exécuter quotidiennement :
  - `node scripts/vacation-reel-post.mjs` pour Mila
  - `node scripts/vacation-reel-post-elena.mjs` pour Elena
  
- [x] **Cible fréquence Reels :**
  - Semaine: 1 Reel/jour par compte
  - Weekend: 3 Reels/jour par compte (samedi-dimanche)
  - Total: ~12 Reels/semaine par compte

### 2. Améliorer les Captions ✅

- [x] **Templates de captions modifiés** avec questions/CTAs :
  - `carousel-post.mjs` ✅
  - `carousel-post-elena.mjs` ✅
  - `vacation-reel-post.mjs` ✅
  - `vacation-reel-post-elena.mjs` ✅

- [x] **Structure caption optimale implémentée :**
  ```
  [Hook/Story - 1-2 lignes] + [Question ou CTA]
  
  [Hashtags from pools]
  ```

- [x] **Exemples de questions engageantes ajoutés :**
  - "Vous êtes team matin ou soir?"
  - "Cette tenue ou la suivante? 👀"
  - "Change my mind: les matins > les soirées"
  - "Who can relate?"

### 3. Elena voyage plus ✅

- [x] **Nouveaux lieux ajoutés** dans `locations-elena.ts` :
  
  | Lieu | Type | Status |
  |------|------|--------|
  | **Milan Fashion** | Hôtel 5*, rues mode | ✅ Ajouté |
  | **Milan Hotel** | Suite 5 étoiles | ✅ Ajouté |
  | **Backstage shooting** | Studio, coulisses | ✅ Ajouté |
  | **Yacht Méditerranée** | Luxe, été | ✅ Ajouté |
  | **London rooftop** | Bar, soirée | ✅ Ajouté |
  | **Maldives suite** | Vacances luxe | ✅ Ajouté |
  | **Aéroport lounge** | Transit, work | ✅ Ajouté |

- [x] **Objectif répartition Elena :** Locations disponibles pour atteindre
  - Loft Paris: 30%
  - Voyages/Hôtels: 40%
  - Shootings/BTS: 15%
  - Paris extérieur: 15%

### 4. Posts Duo Mila×Elena (3x/semaine) ✅

- [x] **Script `duo-post.mjs` créé** avec :
  - Génération d'images des deux ensemble
  - Publication sur les deux comptes
  - Tag de l'autre dans la caption
  - Captions personnalisées par compte

- [x] **Scénarios duo implémentés :**
  
  | Scénario | Description | Status |
  |----------|-------------|--------|
  | `shooting` | Mila photographie Elena | ✅ |
  | `brunch` | Café Paris ensemble | ✅ |
  | `workout` | Elena essaie fitness | ✅ |
  | `shopping` | Shopping trip duo | ✅ |

- [x] **Format caption duo avec @mentions** implémenté

### 5. Hashtags Optimisés ✅

- [x] **Fichier `hashtags.ts` créé** avec pools par catégorie :
  - `fitness_mila` - fitness et healthy lifestyle
  - `fashion_elena` - mode et style
  - `model_elena` - vie de mannequin
  - `lifestyle` - contenu lifestyle général
  - `paris` - hashtags Paris
  - `travel` - voyage et destinations
  - `spa_wellness` - spa et bien-être
  - `beach` - plage et été
  - `duo` - amitié et BFF
  - `reels` / `carousel` - types de contenu

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Status |
|---------|--------|--------|
| `app/scripts/duo-post.mjs` | 🆕 Créé | ✅ |
| `app/scripts/carousel-post.mjs` | ✏️ Captions améliorés | ✅ |
| `app/scripts/carousel-post-elena.mjs` | ✏️ Captions améliorés | ✅ |
| `app/scripts/vacation-reel-post.mjs` | ✏️ Captions améliorés | ✅ |
| `app/scripts/vacation-reel-post-elena.mjs` | ✏️ Captions améliorés | ✅ |
| `app/src/config/locations-elena.ts` | ✏️ 7 nouveaux lieux | ✅ |
| `app/src/config/hashtags.ts` | 🆕 Créé avec pools | ✅ |

---

## 📈 Métriques de succès

| Métrique | Avant | Cible 1 mois |
|----------|-------|--------------|
| % Reels Mila | 10% | 50% |
| % Reels Elena | 5% | 50% |
| Engagement rate Mila | 8.45% | >10% |
| Followers Mila | 58 | 200+ |
| Followers Elena | 2 | 100+ |
| Posts duo/semaine | 0 | 3 |

---

## ⏱️ Estimation par tâche

| Tâche | Temps |
|-------|-------|
| Exécuter plus de Reels | 0h (scripts existent) |
| Améliorer captions | 1h |
| Ajouter lieux Elena | 1h |
| Script duo-post | 2h |
| Hashtags pools | 0.5h |
| **Total** | **~4.5h** |

---

## 🔗 Dépendances

- Scripts Reels existants ✅
- Nano Banana Pro ✅
- Instagram Graph API ✅
- Tokens Mila & Elena ✅

---

*Créé le 20 décembre 2024*

