# 🔥 Stratégie Qualité & Sexy Content

> **Status**: Piste de réflexion — À implémenter
> **Date**: 15 décembre 2024

---

## 📋 Contexte

L'objectif principal de Mila est d'engager une audience masculine (25-45 ans) qui recherche du contenu "sexy soft charnel" — sensuel mais tasteful, pas vulgaire.

### Problème Actuel

Le contenu généré peut être trop "safe" à cause de :
1. **Filtres Google Nano Banana Pro** — Rejette les prompts trop explicites
2. **Fallback system** — Dilue le sexy en remplaçant les mots clés
3. **Dispersion** — Le "niveau sexy" est défini à plusieurs endroits sans cohérence

---

## 🎯 Objectif

Créer un système centralisé pour contrôler le **"niveau de sensualité"** du contenu de manière :
- Cohérente (même style partout)
- Contrôlable (slider 1-10)
- Filtrable (éviter les rejets sans perdre l'essence)

---

## 🔧 Architecture Actuelle

### Où est défini le "Sexy" aujourd'hui ?

| Fichier | Élément | Niveau Sexy |
|---------|---------|-------------|
| `carousel-post.mjs` L30-37 | MILA_BASE | Moyen (description physique) |
| `carousel-post.mjs` L43-57 | HERO_EXPRESSIONS | Élevé ("sensual gaze") |
| `carousel-post.mjs` L130-166 | OUTFITS | Élevé (lingerie, bodysuit) |
| `carousel-post.mjs` L168-203 | FALLBACK | **Dilue tout** |
| `config/calendar.ts` L477-486 | SEXY_EXPRESSIONS | Élevé |
| `config/locations.ts` L367-411 | LOCATION_OUTFITS | Variable |

### Le Problème du Fallback

```javascript
// Quand Google rejette, ces remplacements tuent le sexy :
{ from: /\bsensual\b/gi, to: 'confident' }  // ❌ Perd la sensualité
{ from: /\bsexy\b/gi, to: 'stylish' }       // ❌ Devient neutre
{ from: /\bbralette\b/gi, to: 'soft top' }  // ❌ Perd l'intimité
```

---

## 💡 Solutions Proposées

### ✅ Option Retenue : Dual-Model Fallback

**Stratégie validée le 16 décembre 2024** :

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRATÉGIE DUAL-MODEL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Prompt Sexy          Nano Banana Pro         Image OK          │
│  ──────────────────►  (Google)           ───► ✅ Publier        │
│                            │                                     │
│                            │ ❌ "flagged as sensitive"           │
│                            ▼                                     │
│                       Minimax Image-01   ───► ✅ Publier        │
│                       (plus permissif)                           │
│                       (avec face ref)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Avantages** :
- ✅ Nano Banana Pro pour 80% du contenu (rapide, qualité)
- ✅ Minimax pour le contenu sexy que Nano refuse
- ✅ Minimax supporte face reference (consistance Mila)
- ✅ Pas de prompt "sanitizé" — on garde le sexy voulu

**Coûts estimés** :
- Nano Banana Pro : ~$0.02/image
- Minimax Image-01 : ~$0.05/image (fallback uniquement)

---

### Option B : Prompts "Pré-Safés" (Alternative)

**Principe** : Écrire des prompts sexy qui passent les filtres Google nativement.

**Exemples de reformulation** :

| Original (rejeté) | Reformulé (passe) | Effet préservé |
|-------------------|-------------------|----------------|
| "sensual gaze" | "soft warm gaze with feminine allure" | ✅ |
| "bare legs" | "long toned legs visible" | ✅ |
| "lingerie" | "delicate intimate sleepwear" | ✅ |
| "cleavage" | "elegant décolleté" | ✅ |
| "sexy pose" | "confident feminine pose" | ✅ |
| "seductive" | "captivating presence" | ✅ |

**Note** : Cette option est complémentaire — on peut pré-safer les prompts ET avoir le fallback Minimax.

---

### Option C : Architecture "Sexy Levels"

**Principe** : Centraliser le contrôle du niveau sexy dans un seul fichier config.

```typescript
// src/config/sexy-levels.ts

export type SexyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const SEXY_CONFIG = {
  // Niveau global par défaut
  defaultLevel: 6,
  
  // Niveaux par type de contenu
  contentLevels: {
    gym: 5,           // Sporty sexy
    bedroom: 8,       // Intimate sexy
    cafe: 4,          // Subtle sexy
    beach: 7,         // Summer sexy
    street: 5,        // Chic sexy
  },
  
  // Vocabulaire par niveau
  expressions: {
    low: ['soft smile', 'warm gaze', 'confident look'],
    medium: ['alluring gaze', 'playful smirk', 'knowing smile'],
    high: ['sultry gaze', 'sensual expression', 'intimate look'],
  },
  
  outfits: {
    low: ['casual athleisure', 'oversized sweater', 'jeans and top'],
    medium: ['fitted bodysuit', 'silk slip', 'crop top'],
    high: ['lace bralette', 'lingerie set', 'bikini'],
  },
  
  poses: {
    low: ['standing casual', 'sitting relaxed', 'walking'],
    medium: ['leaning against wall', 'stretching', 'hair flip'],
    high: ['lying on bed', 'arched back', 'over shoulder glance'],
  },
};

export function getSexyPromptElements(level: SexyLevel, location: string) {
  // Retourne les éléments de prompt appropriés au niveau
}
```

**Avantages** :
- Contrôle centralisé
- Facile à ajuster
- Scalable

**Inconvénients** :
- Refactoring significatif
- Complexité ajoutée

---

## 🧪 Tests à Réaliser

### Test 1 : Modèles Alternatifs

Générer la même image avec :
1. Nano Banana Pro (actuel)
2. Flux Pro
3. SDXL + IP-Adapter (face reference)
4. Flux Kontext (face reference)

**Critères d'évaluation** :
- Consistance du visage
- Qualité image
- Niveau sexy atteint
- Coût
- Temps de génération

### Test 2 : Prompts Pré-Safés

Comparer :
1. Prompt original (risque rejet)
2. Prompt "pré-safé" (devrait passer)
3. Résultat fallback (baseline)

**Mesurer** : Différence de sexy perçu

---

## 📊 Matrice Décisionnelle

| Critère | Poids | Option A | Option B | Option C |
|---------|-------|----------|----------|----------|
| Facilité implém. | 20% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Niveau sexy max | 30% | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Consistance visage | 25% | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Coût | 15% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Maintenabilité | 10% | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Score pondéré** :
- Option A : 3.85/5
- Option B : 3.70/5
- Option C : 3.65/5

---

## 🎬 Plan d'Action Recommandé

### Phase 1 : Quick Wins (Cette semaine)
1. ✅ Documenter la stratégie (ce fichier)
2. 🔄 Tester modèles alternatifs
3. 📝 Créer liste de "safe sexy words"

### Phase 2 : Implémentation (Semaine prochaine)
1. Réécrire les prompts avec vocabulaire pré-safé
2. Implémenter Option A
3. Monitorer les rejets

### Phase 3 : Optimisation (Long terme)
1. Si rejets > 10% → Implémenter Option B
2. Si besoin contrôle fin → Implémenter Option C
3. A/B test engagement par niveau sexy

---

## 📝 Notes & Références

### Vocabulaire "Safe Sexy"

**Pour les expressions** :
- ❌ "sensual" → ✅ "captivating", "alluring", "magnetic"
- ❌ "seductive" → ✅ "charming", "enchanting", "inviting"
- ❌ "hot" → ✅ "striking", "stunning", "radiant"

**Pour les poses** :
- ❌ "sexy pose" → ✅ "confident feminine pose"
- ❌ "provocative" → ✅ "bold", "daring", "expressive"

**Pour les tenues** :
- ❌ "lingerie" → ✅ "intimate sleepwear", "delicate loungewear"
- ❌ "underwear" → ✅ "loungewear set", "soft basics"

---

## 🔗 Documents Liés

- [03-PERSONNAGE.md](./03-PERSONNAGE.md) — Character sheet complet
- [18-AUDIENCE-TARGET.md](./18-AUDIENCE-TARGET.md) — Audience cible
- [carousel-post.mjs](../app/scripts/carousel-post.mjs) — Script principal

---

*Dernière mise à jour : 15 décembre 2024*

