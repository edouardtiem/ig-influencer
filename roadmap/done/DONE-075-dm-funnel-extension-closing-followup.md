# ✅ DONE-075 — Extension Funnel DM + Stages CLOSING/FOLLOWUP

**Date** : 19 janvier 2026  
**Version** : v2.61.0  
**Status** : ✅ Terminé

---

## 📋 Description

Extension majeure du funnel DM avec ajout de 2 nouveaux stages (CLOSING et FOLLOWUP) et fixes critiques de bugs d'intent detection et répétition de questions.

---

## ✅ Ce qui a été fait

### 1. 🐛 Fix Bug Intent Detection `ai_question` (CRITIQUE)

**Problème** : Le pattern `'ai'` matchait en sous-chaîne, causant des faux positifs massifs :
- "tr**ai**ning" → `ai_question` ❌
- "vr**ai**" → `ai_question` ❌
- "j'**ai**" → `ai_question` ❌

**Solution** : Regex avec word boundaries :
```typescript
/(?:^|\s)ai(?:\s|$|\?)/i  // "AI" avec espaces (pas "j'ai", "training")
```

**Résultat** : ✅ 13/13 tests passent

### 2. 🔄 Système Anti-Répétition des Questions

**Problème** : Elena reposait les mêmes questions même après réponse.

**Solution** : Topic extraction qui track les infos connues et questions posées.

### 3. 👤 Détection "Toi" / "Et toi?"

**Problème** : Elena ne comprenait pas "Toi" (= "et toi?").

**Solution** : Patterns de détection spécifiques.

### 4. 🎯 Follow-up Fanvue au lieu de spam

**Problème** : Elena renvoyait le lien Fanvue plusieurs fois.

**Solution** : Questions de suivi flirty après 1er envoi :
- "t'as eu le temps de regarder? 👀"
- "tu me dis ce que t'en penses? 😏"

### 5. 📈 Extension du Funnel

**Avant** : `COLD → WARM → HOT → PITCHED` (~30 messages)

**Après** : `COLD → WARM → HOT → PITCHED → CLOSING → FOLLOWUP` (~56 messages)

#### Nouveaux message caps

| Stage | Messages | Cumul |
|-------|----------|-------|
| COLD | 8 | 1-8 |
| WARM | 12 | 9-20 |
| HOT | 15 | 21-35 |
| PITCHED | 3 | 36-38 |
| CLOSING | 10 | 39-48 |
| FOLLOWUP | 8 | 49-56 |

### 6. ⏰ Système de Followup à +20h

- Colonnes DB : `followup_scheduled_at`, `followup_sent`
- GitHub Action : `dm-followup.yml` (toutes les heures)
- Script : `dm-followup.mjs` (envoi via ManyChat API)
- Messages : Soft re-engagement

---

## 📁 Fichiers modifiés

- `app/src/lib/elena-dm.ts` — Refonte complète
- `.github/workflows/dm-followup.yml` — Nouveau
- `app/scripts/dm-followup.mjs` — Nouveau
- `app/scripts/test-dm-funnel.mjs` — Nouveau
- `app/supabase/migrations/009_add_followup_columns.sql` — Nouveau

---

## 🧪 Tests

✅ Tous les tests passent :
- Intent detection : 13/13
- "Asking about Elena" : 10/10
- Stage transitions : ✅
- Followup scheduling (DB) : ✅
- Followup dry run : ✅

---

## 🔗 Références

- [Documentation complète](../docs/sessions/2026-01-19-dm-funnel-complete.md)
- [Documentation technique](../docs/sessions/2026-01-19-dm-funnel-stages-extension.md)

---

**Impact** : 🔴 CRITIQUE — Fixe bugs majeurs + étend capacité de conversion
