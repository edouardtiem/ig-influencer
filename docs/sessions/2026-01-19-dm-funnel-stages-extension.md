# 📝 SESSION — Extension du Funnel DM + Stages CLOSING/FOLLOWUP

**Date** : 19 janvier 2026  
**Durée** : ~2h

---

## ✅ Ce qui a été fait cette session

### 1. 🐛 Fix Bug Intent Detection `ai_question`

**Problème** : Le mot-clé `'ai'` matchait en sous-chaîne, causant des faux positifs :
- "tr**ai**ning" → `ai_question` ❌
- "vr**ai**" → `ai_question` ❌
- "pl**ai**sir" → `ai_question` ❌

**Solution** : Utilisation de regex avec word boundaries au lieu de `includes()` :
```typescript
// Avant (bugué)
const aiKeywords = ['ai', 'ia', ...];
if (aiKeywords.some(kw => lowerMessage.includes(kw))) // ❌

// Après (corrigé)
const aiPatterns = [/\bai\b/i, /\b(ia|i\.a\.)\b/i, ...];
if (aiPatterns.some(pattern => pattern.test(lowerMessage))) // ✅
```

### 2. 🔄 Anti-répétition des questions

**Problème** : Elena reposait les mêmes questions même après que l'utilisateur ait répondu.

**Solution** : Système de "topic extraction" qui :
- Extrait les infos connues (location, job, sport, hobby, age, name)
- Track les questions déjà posées
- Injecte ces infos dans le prompt pour interdire les répétitions

### 3. 👤 Détection "Toi" / "Et toi?"

**Problème** : Quand l'utilisateur dit "Toi", Elena ne comprenait pas qu'il demandait des infos sur elle.

**Solution** : Patterns de détection ajoutés :
```typescript
const askingAboutElenaPatterns = [
  /^toi[\s?!.]*$/i,      // "Toi"
  /^et toi[\s?!.]*$/i,   // "Et toi?"
  /\btoi tu\b/i,         // "Toi tu fais quoi"
  ...
];
```

### 4. 🎯 Follow-up Fanvue au lieu de spam

**Problème** : Elena renvoyait le lien Fanvue plusieurs fois.

**Solution** : Après avoir envoyé 1 lien, utilise des questions de suivi :
```typescript
const FANVUE_FOLLOWUP_QUESTIONS = [
  "t'as eu le temps de regarder? 👀",
  "tu me dis ce que t'en penses? 😏",
  "t'as checké le lien? 🖤",
  ...
];
```

### 5. 📈 Extension du Funnel avec nouveaux stages

**Avant** :
```
COLD → WARM → HOT → PITCHED → CONVERTED → PAID
```

**Après** :
```
COLD → WARM → HOT → PITCHED → CLOSING → FOLLOWUP → CONVERTED → PAID
```

#### Nouveaux message caps (~56 messages total)

| Stage | Messages | Cumul | Comportement |
|-------|----------|-------|--------------|
| COLD | 8 | 1-8 | Build rapport, NO pitch |
| WARM | 12 | 9-20 | Tease content |
| HOT | 15 | 21-35 | Push for pitch |
| PITCHED | 3 | 36-38 | Link just sent, quick transition |
| CLOSING | 10 | 39-48 | Follow-up actif ("t'as vu?") |
| FOLLOWUP | 8 | 49-56 | Re-engagement soft après +20h |

### 6. ⏰ Système de Followup à +20h

**Pourquoi +20h** :
- ManyChat bloque les messages à +24h
- On veut follow-up rapidement après le closing

**Fonctions ajoutées** :
- `scheduleFollowup(contactId)` — Programme un followup à +20h
- `markFollowupSent(contactId)` — Marque le followup comme envoyé
- `getContactsReadyForFollowup()` — Récupère les contacts prêts
- `isReadyForFollowup(contact)` — Vérifie si le contact est prêt

**Messages de followup** :
```typescript
const FOLLOWUP_MESSAGES = [
  "hey toi 🖤 ça fait un moment... tu me manques un peu 👀",
  "coucou 😊 j'ai pensé à toi... t'es passé voir mon contenu?",
  "hey 🖤 tu t'es perdu? je t'attends toujours là-bas 👀",
  ...
];
```

---

## 📁 Fichiers modifiés

### Modifiés :
- `app/src/lib/elena-dm.ts` — Refonte complète du funnel avec nouveaux stages

### Créés :
- `app/supabase/migrations/009_add_followup_columns.sql` — Migration pour les colonnes followup
- `docs/sessions/2026-01-19-dm-funnel-stages-extension.md` — Ce document

---

## 🗄️ Migration Supabase requise

```sql
-- Exécuter dans Supabase SQL Editor
ALTER TABLE elena_dm_contacts 
ADD COLUMN IF NOT EXISTS followup_scheduled_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS followup_sent BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_elena_dm_contacts_followup 
ON elena_dm_contacts (followup_scheduled_at, followup_sent) 
WHERE followup_scheduled_at IS NOT NULL AND followup_sent = FALSE;
```

---

## 🔄 GitHub Action pour Followup

Un GitHub Action `fanvue-dm-followup.yml` doit tourner toutes les heures pour :
1. Récupérer les contacts avec `followup_scheduled_at <= NOW()` et `followup_sent = false`
2. Envoyer un message de re-engagement via ManyChat API
3. Marquer `followup_sent = true`

---

## 📊 Flow complet du nouveau funnel

```
User DM → COLD (1-8 msgs)
            ↓
         WARM (9-20 msgs) — tease content
            ↓
         HOT (21-35 msgs) — push for pitch
            ↓
    [Send Fanvue Link]
            ↓
       PITCHED (36-38 msgs) — acknowledge link sent
            ↓
       CLOSING (39-48 msgs) — "t'as regardé?" follow-ups
            ↓
    [Schedule followup +20h]
            ↓
       FOLLOWUP (49-56 msgs) — soft re-engagement
            ↓
    [Stop or CONVERTED if they click]
```

---

## 🧪 Tests à effectuer

1. **Intent detection** : Vérifier que "training", "vrai", "plaisir" ne sont plus détectés comme `ai_question`
2. **Anti-répétition** : Vérifier qu'Elena ne repose pas les mêmes questions
3. **Followup questions** : Vérifier que le 2ème+ envoi de lien utilise les follow-up questions
4. **Stage transitions** : Vérifier que les stages progressent correctement
5. **Followup +20h** : Vérifier que le GitHub Action envoie les followups

---

## 📝 Notes importantes

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

---

**Commits** : À faire après validation des tests

**Status** : ✅ Code prêt, en attente de migration Supabase et tests
