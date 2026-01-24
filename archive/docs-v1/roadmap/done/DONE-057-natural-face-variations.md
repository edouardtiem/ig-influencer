# DONE-057: Natural Face Variations — Grimaces, Looking Away, Candid Moments

**Status**: ✅ Done  
**Date**: 6 janvier 2025  
**Version**: v2.42.0  
**Durée**: ~20min

---

## 📋 Objectif

Rendre Elena plus naturelle et moins "posée" dans les photos générées :
- Plus de variété dans les expressions faciales
- Regard ailleurs (pas toujours l'objectif)
- Grimaces naturelles authentiques
- Moments candid non-posés

---

## 🔧 Changements effectués

### 1. SEXY_EXPRESSIONS enrichies (`calendar.ts`)

**Avant** : 8 expressions posées  
**Après** : 25 expressions avec 3 catégories

#### Catégories ajoutées :
- **Regard ailleurs** : fenêtre, profil, yeux fermés, plafond
- **Grimaces naturelles** : rire authentique, nez plissé, surprise, bâillement
- **Candid non-posé** : mid-blink, mid-sentence, resting face, distracted

### 2. HERO_EXPRESSIONS + SECONDARY_EXPRESSIONS (`carousel-post-elena.mjs`)

- Photo 1 peut maintenant être candid aussi
- 12 expressions secondaires naturelles/candid

### 3. Notes style dans prompt

Ajout section **EXPRESSION AUTHENTICITY** pour guider la génération :
- NOT always looking at camera
- Natural imperfect moments encouraged
- NO forced smiles
- Real emotions preferred

---

## 📁 Fichiers modifiés

- `app/src/config/calendar.ts` - SEXY_EXPRESSIONS (8 → 25)
- `app/scripts/carousel-post-elena.mjs` - HERO_EXPRESSIONS + SECONDARY_EXPRESSIONS + notes prompt
- `app/src/app/api/auto-post/route.ts` - HERO_EXPRESSIONS + SECONDARY_EXPRESSIONS

---

## 🎯 Impact

- ✅ **Dès le prochain post automatique** après déploiement Vercel
- ✅ Plus de variété naturelle dans les expressions
- ✅ Moins de poses forcées, plus d'authenticité
- ✅ Compatible avec style iPhone RAW existant

---

## 📊 Nouvelles variations

| Type | Exemples |
|------|----------|
| Regard ailleurs | `gazing out window`, `side profile`, `eyes closed` |
| Grimaces | `genuine laugh mid-burst`, `scrunched nose`, `surprised expression` |
| Candid | `mid-blink`, `resting face`, `caught off-guard` |

---

## 🚫 Retrait téléphone

Toutes les références au téléphone retirées des expressions (remplacé par regard ailleurs).

---

## 🔗 Liens

- Session: [→](./docs/sessions/2025-01-06-natural-face-variations.md)
- Commit: `ff89b9b`

