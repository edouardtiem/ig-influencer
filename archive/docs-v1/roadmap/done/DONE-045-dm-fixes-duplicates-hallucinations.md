# ✅ DONE-045 — DM Fixes — Duplicates, Hallucinations, Long Responses

**Date** : 2 janvier 2025  
**Version** : v2.36.0  
**Status** : ✅ Terminé

---

## 🎯 Objectif

Corriger 3 problèmes critiques identifiés dans les screenshots de conversations DM :
1. **Messages dupliqués** — Elena envoie la même réponse 2-3 fois
2. **Hallucinations de patterns** — Elena invente des répétitions et les célèbre bizarrement
3. **Réponses trop longues/bizarres** — Messages de 50+ mots avec célébrations excessives

---

## ✅ Ce qui a été fait

### 1. Fix Messages Dupliqués
- **Problème** : ManyChat envoie plusieurs webhooks rapidement → Elena répond plusieurs fois avec la même réponse
- **Solution** : Système de cooldown + déduplication amélioré
  - **Cooldown de 20 secondes** après chaque réponse envoyée
  - Vérification du même message entrant dans les **30 secondes** (au lieu de 10s)
  - Retour de `skip: true` dans le webhook pour que ManyChat n'envoie rien
- **Logique** : Si on a déjà répondu à ce contact dans les 20s → skip

### 2. Fix Hallucinations de Patterns Répétitifs
- **Problème** : Claude invente des patterns ("tu m'as envoyé ça 2 fois!", "perfect identical!") et les célèbre bizarrement
- **Solution** : Règles explicitement interdites dans le prompt système
  - Interdiction totale des mots : "twice", "double", "doppio", "identical", "same", "again"
  - Interdiction de célébrer les répétitions ("perfect identical!", "BUENAS NOCHES x2!")
  - Interdiction de citer des IDs techniques (asset_id, message IDs)
  - Message clair : "These behaviors make you look like a weird bot. Just be NORMAL."

### 3. Fix Réponses Trop Longues/Bizarres
- **Problème** : Réponses de 50+ mots avec célébrations excessives en ALL CAPS
- **Solution** : Contraintes renforcées
  - Réduction `max_tokens` : 80 → **50** (force des réponses plus courtes)
  - Renforcement du prompt : "If you write more than 15 words, you FAIL"
  - Interdiction des "ALL CAPS excitement" et "long celebratory messages"

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/src/lib/elena-dm.ts` | Modifié | Cooldown system, anti-hallucination rules, length constraints |
| `app/src/app/api/dm/webhook/route.ts` | Modifié | Skip flag pour ManyChat |
| `docs/sessions/2025-01-02-dm-fixes-duplicates-hallucinations.md` | Créé | Documentation complète |

---

## 🔍 Détails techniques

### Cooldown System

**Avant** :
```typescript
// Vérifiait seulement si le même message arrivait dans les 10s
// Retournait la réponse cached → causait des duplicates
```

**Après** :
```typescript
// Check 1: Même message dans les 30s → skip
// Check 2: Cooldown de 20s après chaque réponse → skip
// ManyChat ne doit pas envoyer de message si skip: true
```

### Anti-Hallucination Rules

**Règles ajoutées dans le prompt** :
```
🚫 ABSOLUTELY FORBIDDEN BEHAVIORS (INSTANT FAIL)
- NEVER celebrate repetitions ("perfect identical!", "twice!", "doppio!")
- NEVER mention words like: "twice", "double", "doppio", "identical", "same", "again"
- NEVER comment on message patterns or frequencies
- NEVER act excited about someone repeating something
- NEVER quote message IDs, asset IDs, or technical details
```

### Length Constraints

**Changements** :
- `max_tokens: 80` → `max_tokens: 50`
- Prompt renforcé : "If you write more than 15 words, you FAIL"
- Interdiction explicite des célébrations longues

---

## 📊 Impact attendu

- ✅ **0 messages dupliqués** grâce au cooldown de 20s
- ✅ **0 hallucinations** de patterns grâce aux règles explicites
- ✅ **Réponses < 15 mots** grâce à max_tokens 50

---

## 🚧 Notes pour ManyChat

Si le flag `skip` n'est pas supporté nativement par ManyChat, ajouter une condition :
- **If `skip = true` → Don't send message**

---

## 🔗 Liens

- [Session documentation](./../docs/sessions/2025-01-02-dm-fixes-duplicates-hallucinations.md)
- [DM Automation V2](./../docs/27-DM-AUTOMATION-V2.md)

