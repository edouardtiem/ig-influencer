# 🔧 Fix DM — Duplicates, Hallucinations, Long Responses

**Date** : 2 janvier 2025  
**Durée** : ~1h

---

## 🎯 Objectif

Corriger 3 problèmes critiques identifiés dans les screenshots de conversations DM :
1. **Messages dupliqués** — Elena envoie la même réponse 2-3 fois
2. **Hallucinations de patterns** — Elena invente des répétitions et les célèbre bizarrement
3. **Réponses trop longues/bizarres** — Messages de 50+ mots avec célébrations excessives

---

## ✅ Ce qui a été fait cette session

1. **Fix #1 : Messages dupliqués**
   - Ajout d'un **cooldown de 20 secondes** après chaque réponse envoyée
   - Vérification du même message entrant dans les 30 secondes (au lieu de 10s)
   - Retour de `skip: true` dans le webhook pour que ManyChat n'envoie rien
   - Logique : Si on a déjà répondu à ce contact dans les 20s → skip

2. **Fix #2 : Hallucinations de patterns répétitifs**
   - Ajout de règles **explicitement interdites** dans le prompt système
   - Interdiction totale des mots : "twice", "double", "doppio", "identical", "same", "again"
   - Interdiction de célébrer les répétitions ("perfect identical!", "BUENAS NOCHES x2!")
   - Interdiction de citer des IDs techniques (asset_id, message IDs)
   - Message clair : "These behaviors make you look like a weird bot. Just be NORMAL."

3. **Fix #3 : Réponses trop longues/bizarres**
   - Réduction `max_tokens` : 80 → **50** (force des réponses plus courtes)
   - Renforcement du prompt : "If you write more than 15 words, you FAIL"
   - Interdiction des "ALL CAPS excitement" et "long celebratory messages"
   - Ajout dans le context prompt : "NO caps excitement. NO celebrations. Be NORMAL."

---

## 📁 Fichiers créés/modifiés

- `app/src/lib/elena-dm.ts` (modifié)
  - Lignes 998-1057 : Nouvelle logique de déduplication avec cooldown
  - Lignes 180-184 : Renforcement règles anti-hallucination
  - Lignes 165-179 : Ajout règles longueur + interdictions explicites
  - Ligne 874 : Réduction max_tokens 80→50
  - Ligne 869 : Renforcement prompt longueur

- `app/src/app/api/dm/webhook/route.ts` (modifié)
  - Lignes 55-66 : Ajout check `skip` flag pour ManyChat
  - Retour `{ skip: true }` quand cooldown/dedup actif

---

## 🔍 Détails techniques

### Fix #1 : Cooldown System

**Avant** :
- Vérifiait seulement si le même message arrivait dans les 10s
- Retournait la réponse cached → causait des duplicates

**Après** :
- **Check 1** : Même message dans les 30s → retourne `skip: true`
- **Check 2** : Cooldown de 20s après chaque réponse → retourne `skip: true`
- ManyChat ne doit pas envoyer de message si `skip: true`

### Fix #2 : Anti-Hallucination Rules

**Règles ajoutées** :
```
🚫 ABSOLUTELY FORBIDDEN BEHAVIORS (INSTANT FAIL)
- NEVER celebrate repetitions ("perfect identical!", "twice!", "doppio!")
- NEVER mention words like: "twice", "double", "doppio", "identical", "same", "again"
- NEVER comment on message patterns or frequencies
- NEVER act excited about someone repeating something
- NEVER quote message IDs, asset IDs, or technical details
```

### Fix #3 : Length Constraints

**Changements** :
- `max_tokens: 80` → `max_tokens: 50`
- Prompt renforcé : "If you write more than 15 words, you FAIL"
- Interdiction explicite des célébrations longues

---

## 🚧 En cours (non terminé)

- Aucun

---

## 📋 À faire prochaine session

- [ ] Tester en production que les duplicates sont bien bloqués
- [ ] Vérifier que ManyChat respecte le flag `skip: true` (sinon ajouter condition)
- [ ] Monitorer les réponses pour confirmer qu'elles sont < 15 mots
- [ ] Vérifier qu'il n'y a plus d'hallucinations de patterns

---

## 🐛 Bugs découverts

- **Aucun nouveau bug** — Les fixes sont préventifs

---

## 💡 Idées notées

- **ManyChat condition** : Si le flag `skip` n'est pas supporté nativement, ajouter une condition dans ManyChat : "If skip = true → Don't send message"

---

## 📝 Notes importantes

- Le cooldown de 20s peut sembler long, mais c'est nécessaire pour éviter les duplicates quand ManyChat envoie plusieurs webhooks rapidement
- Les règles anti-hallucination sont très explicites pour forcer Claude à ne pas inventer
- La réduction à 50 tokens devrait garantir des réponses < 15 mots (1 token ≈ 0.75 mots)

---

## 🔗 Liens

- [DM Automation V2](./27-DM-AUTOMATION-V2.md)
- [DM Automation System](./24-DM-AUTOMATION-SYSTEM.md)

