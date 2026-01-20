# 📝 FIN DE SESSION — Extension Funnel DM + Fixes Critiques

**Date** : 19 janvier 2026  
**Durée** : ~3h

---

## ✅ Ce qui a été fait cette session :

### 1. 🐛 Fix Bug Intent Detection `ai_question` (CRITIQUE)

**Problème** : Le mot-clé `'ai'` matchait en sous-chaîne, causant des faux positifs massifs :
- "tr**ai**ning" → `ai_question` ❌
- "vr**ai**" → `ai_question` ❌
- "pl**ai**sir" → `ai_question` ❌
- "j'**ai**" → `ai_question` ❌

**Impact** : Presque tous les messages en français étaient mal classifiés, causant des réponses inappropriées.

**Solution** : Utilisation de regex avec word boundaries et patterns spécifiques :
```typescript
/(?:^|\s)ai(?:\s|$|\?)/i  // "AI" avec espaces (pas "j'ai", "training")
/\ban?\s+ai\b/i            // "an AI", "a AI"
```

**Résultat** : ✅ 13/13 tests passent, plus de faux positifs.

### 2. 🔄 Système Anti-Répétition des Questions

**Problème** : Elena reposait les mêmes questions même après que l'utilisateur ait répondu :
- "tu fais quoi dans la vie?" → 3 fois
- "where are you from?" → 3 fois
- L'utilisateur a même remarqué : *"Tu toi parler à autre homme parce que tu demandes les mêmes questions plusieurs fois"*

**Solution** : Système de "topic extraction" qui :
- Extrait les infos connues (location, job, sport, hobby, age, name)
- Track les questions déjà posées
- Injecte ces infos dans le prompt pour interdire les répétitions

**Résultat** : Elena ne repose plus les mêmes questions.

### 3. 👤 Détection "Toi" / "Et toi?"

**Problème** : Quand l'utilisateur dit "Toi" (= "et toi?"), Elena ne comprenait pas qu'il demandait des infos sur elle.

**Solution** : Patterns de détection ajoutés :
```typescript
/^toi[\s?!.]*$/i           // "Toi"
/^et toi[\s?!.]*$/i        // "Et toi?"
/\btoi tu\b/i              // "Toi tu fais quoi"
/\b(c'est quoi|what's)\s+(tes|your)\b/i  // "C'est quoi tes plaisirs?"
```

**Résultat** : Elena comprend maintenant et parle d'elle-même au lieu de rediriger.

### 4. 🎯 Follow-up Fanvue au lieu de spam

**Problème** : Elena renvoyait le lien Fanvue plusieurs fois, créant du spam.

**Solution** : Après avoir envoyé 1 lien, utilise des questions de suivi flirty :
```typescript
"t'as eu le temps de regarder? 👀"
"tu me dis ce que t'en penses? 😏"
"t'as checké le lien? 🖤"
```

**Résultat** : Plus de spam de liens, engagement naturel.

### 5. 📈 Extension du Funnel avec nouveaux stages

**Avant** :
```
COLD → WARM → HOT → PITCHED → CONVERTED → PAID
(~30 messages max)
```

**Après** :
```
COLD → WARM → HOT → PITCHED → CLOSING → FOLLOWUP → CONVERTED → PAID
(~56 messages max)
```

#### Nouveaux message caps

| Stage | Messages | Cumul | Comportement |
|-------|----------|-------|--------------|
| COLD | 8 | 1-8 | Build rapport, NO pitch |
| WARM | 12 | 9-20 | Tease content |
| HOT | 15 | 21-35 | Push for pitch |
| PITCHED | 3 | 36-38 | Link just sent, quick transition |
| CLOSING | 10 | 39-48 | Follow-up actif ("t'as vu?") |
| FOLLOWUP | 8 | 49-56 | Re-engagement soft après +20h |

**Total** : 56 messages avant stop (vs 30 avant).

### 6. ⏰ Système de Followup à +20h

**Pourquoi +20h** :
- ManyChat bloque les messages à +24h
- On veut follow-up rapidement après le closing

**Implémentation** :
- Colonnes DB : `followup_scheduled_at`, `followup_sent`
- GitHub Action : `dm-followup.yml` tourne toutes les heures
- Script : `dm-followup.mjs` envoie via ManyChat API
- Messages : Soft re-engagement ("hey toi 🖤 ça fait un moment...")

**Flow** :
1. Contact termine CLOSING sans convertir
2. `scheduleFollowup()` programme à +20h
3. GitHub Action détecte les contacts prêts
4. Envoie message de re-engagement
5. Marque `followup_sent = true`, stage = `followup`

---

## 📁 Fichiers créés/modifiés :

### Modifiés :
- ✅ `app/src/lib/elena-dm.ts` — Refonte complète :
  - Fix intent detection (ai_question)
  - Système anti-répétition (topic extraction)
  - Détection "asking about Elena"
  - Nouveaux stages (closing, followup)
  - Follow-up questions au lieu de spam lien
  - Message caps étendus (56 total)

### Créés :
- ✅ `.github/workflows/dm-followup.yml` — GitHub Action pour followup +20h
- ✅ `app/scripts/dm-followup.mjs` — Script d'envoi des followups
- ✅ `app/scripts/test-dm-funnel.mjs` — Suite de tests automatisés
- ✅ `app/supabase/migrations/009_add_followup_columns.sql` — Migration Supabase
- ✅ `docs/sessions/2026-01-19-dm-funnel-stages-extension.md` — Documentation technique
- ✅ `docs/sessions/2026-01-19-dm-funnel-complete.md` — Ce document

---

## 🚧 En cours (non terminé) :

- ⏳ **Monitoring** — Vérifier que les fixes fonctionnent en production
- ⏳ **Test followup réel** — Attendre qu'un contact passe en CLOSING pour tester le +20h

---

## 📋 À faire prochaine session :

### 🟠 IMPORTANT

- [ ] **Monitorer conversations** — Vérifier qu'il n'y a plus de répétitions de questions
- [ ] **Vérifier followup** — Tester qu'un contact reçoit bien le followup à +20h
- [ ] **Ajuster messages followup** — Si besoin, améliorer les messages selon les retours

### 🟢 OPTIONNEL

- [ ] **Analytics** — Track combien de contacts passent en CLOSING vs FOLLOWUP
- [ ] **A/B test messages** — Tester différents messages de followup

---

## 🐛 Bugs découverts :

### BUG-019 : Intent `ai_question` faux positifs ✅ FIXÉ

**Description** : Le pattern `'ai'` matchait en sous-chaîne, causant des faux positifs massifs sur les messages français.

**Impact** : 🔴 CRITIQUE — Presque tous les messages français mal classifiés

**Fix** : Regex avec word boundaries et patterns spécifiques

---

### BUG-020 : Questions répétées en boucle ✅ FIXÉ

**Description** : Elena reposait les mêmes questions même après réponse de l'utilisateur.

**Impact** : 🔴 CRITIQUE — L'utilisateur remarquait le problème ("tu demandes les mêmes questions plusieurs fois")

**Fix** : Système de topic extraction qui track les infos connues et questions posées

---

### BUG-021 : "Toi" non compris ✅ FIXÉ

**Description** : Quand l'utilisateur disait "Toi" (= "et toi?"), Elena ne comprenait pas.

**Impact** : 🟠 MOYEN — Mauvaise expérience utilisateur

**Fix** : Patterns de détection spécifiques pour "asking about Elena"

---

### BUG-022 : Spam de liens Fanvue ✅ FIXÉ

**Description** : Elena renvoyait le lien Fanvue plusieurs fois au lieu de suivre.

**Impact** : 🟠 MOYEN — Spam, mauvaise expérience

**Fix** : Questions de suivi flirty au lieu de renvoyer le lien

---

## 💡 Idées notées :

### 1. **Analytics sur les stages**

Track combien de contacts :
- Passent de CLOSING → FOLLOWUP (pas converti)
- Convertissent pendant CLOSING
- Convertissent pendant FOLLOWUP
- Ne convertissent jamais

### 2. **A/B test messages followup**

Tester différents messages :
- Soft vs direct
- Questions vs statements
- Avec/sans emoji

### 3. **Personnalisation followup**

Adapter le message selon :
- Langue détectée
- Nombre de messages échangés
- Dernier intent détecté

---

## 📝 Notes importantes :

### Architecture finale du funnel

```
User DM → COLD (1-8 msgs) — Build rapport
            ↓
         WARM (9-20 msgs) — Tease content
            ↓
         HOT (21-35 msgs) — Push for pitch
            ↓
    [Send Fanvue Link]
            ↓
       PITCHED (36-38 msgs) — Acknowledge link sent
            ↓
       CLOSING (39-48 msgs) — "t'as regardé?" follow-ups
            ↓
    [Schedule followup +20h]
            ↓
       FOLLOWUP (49-56 msgs) — Soft re-engagement
            ↓
    [Stop or CONVERTED if they click]
```

### Comportement par stage

| Stage | Fanvue Mention | Link Send | Comportement |
|-------|----------------|-----------|--------------|
| COLD | ❌ Jamais | ❌ | Build rapport only |
| WARM | ⚠️ Tease OK | ❌ | "j'ai d'autres trucs ailleurs 👀" |
| HOT | ✅ Push | ✅ 1ère fois | Pitch actif |
| PITCHED | ✅ | ❌ (déjà envoyé) | Quick transition |
| CLOSING | ✅ Follow-up | ❌ | "t'as regardé?" |
| FOLLOWUP | ✅ Soft | ❌ | "ça fait un moment 🖤" |

### Timing ManyChat

- **Délai réponse** : 12-15 secondes (Smart Delay dans ManyChat)
- **Followup** : +20h (avant la limite de 24h de ManyChat)
- **Reactivation** : +7 jours si contact stopped

### Tests automatisés

Tous les tests passent ✅ :
- Intent detection : 13/13
- "Asking about Elena" : 10/10
- Stage transitions : ✅
- Followup scheduling (DB) : ✅
- Followup dry run : ✅

---

## 🔗 Références

- [Document technique détaillé](./2026-01-19-dm-funnel-stages-extension.md)
- [Migration Supabase](../supabase/migrations/009_add_followup_columns.sql)
- [GitHub Action](../../.github/workflows/dm-followup.yml)

---

**Commits** : 
- `[hash]` — `feat: Extend DM funnel with CLOSING/FOLLOWUP stages + critical fixes`

**Status** : ✅ Code déployé, migration Supabase faite, tests passent, prêt pour production
