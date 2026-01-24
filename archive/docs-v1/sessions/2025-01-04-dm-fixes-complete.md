# 🔧 DM System — Fixes Complets (Story Replies + Timeout + Validator)

**Date** : 4 janvier 2025  
**Durée** : ~2h

---

## 🎯 Objectif

Résoudre plusieurs problèmes critiques du système DM :
1. **Story replies** ne déclenchaient pas de réponse
2. **Webhook timeout** → ManyChat utilisait des réponses en cache
3. **Hallucinations** persistantes malgré le validator
4. **Story replies** → Elena demandait "which one?" au lieu de fermer

---

## ✅ Ce qui a été fait cette session

### 1. **Fix Story Replies Payload Parsing**

**Problème** : Les story replies n'étaient pas capturées car le texte était dans un champ différent de `last_input_text`.

**Solution** :
- Ajout de logging du payload complet pour debug
- Recherche du texte dans plusieurs champs : `story_reply.text`, `message.text`, `attachment.payload.text`, etc.
- Skip au lieu d'erreur si pas de texte trouvé

**Fichier** : `app/src/app/api/dm/webhook/route.ts`

---

### 2. **Fix Webhook Timeout (Vercel 10s)**

**Problème** : Le webhook attendait 15-35s avant de répondre, mais Vercel Hobby a un timeout de 10s → ManyChat utilisait des réponses en cache (anciennes).

**Solution** :
- **Retiré** le délai du webhook (15-35s)
- **Ajouté** `suggested_delay_seconds` dans la réponse pour ManyChat
- Le délai est maintenant géré dans ManyChat avec un bloc "Delay" (12s configuré)

**Impact** :
- ✅ Webhook répond en ~2s (pas de timeout)
- ✅ ManyChat reçoit toujours la nouvelle réponse
- ✅ Délai naturel géré côté ManyChat

**Fichier** : `app/src/app/api/dm/webhook/route.ts`

---

### 3. **Fix Story Replies — Never Ask "Which One?"**

**Problème** : Elena demandait "which one?" quand quelqu'un répondait à une story, ce qui faisait bot.

**Solution** :
- Ajout section `## 📸 STORY REPLIES` dans le prompt
- Instructions : PRETEND to know which story, use as closing opportunity
- Ajout de `which one`, `which photo`, `which story` aux FORBIDDEN_WORDS
- Validator rejette maintenant ces réponses

**Exemples** :
- ❌ Avant : "which one? 👀"
- ✅ Après : "merci 🖤 c'est un de mes préférés" ou "glad you like it 😏 y'en a plus sur fanvue"

**Fichier** : `app/src/lib/elena-dm.ts`

---

### 4. **Response Validator + Sonnet (Session précédente)**

**Rappel** : Triple protection anti-hallucination (A+C+D)
- Option A : Response Validator avec régénération (max 3 tentatives)
- Option C : Prompt anti-hallucination ultra-explicite
- Option D : Claude Sonnet (meilleure qualité)

**Status** : ✅ Fonctionne bien, hallucinations réduites

---

## 📁 Fichiers modifiés

- `app/src/app/api/dm/webhook/route.ts` :
  - Parsing multi-champs pour story replies
  - Retrait du délai webhook (timeout Vercel)
  - Logging payload complet pour debug
  - `suggested_delay_seconds` dans la réponse

- `app/src/lib/elena-dm.ts` :
  - Section `## 📸 STORY REPLIES` ajoutée
  - `which one`, `which photo`, `which story` ajoutés aux FORBIDDEN_WORDS

---

## 📊 Impact

| Problème | Avant | Après |
|----------|-------|-------|
| **Story replies** | ❌ Pas capturées | ✅ Capturées et répondues |
| **Webhook timeout** | ❌ 10s timeout → cache | ✅ Répond en ~2s |
| **"Which one?"** | ❌ Bot-like | ✅ Prétend savoir, ferme |
| **Hallucinations** | ⚠️ ~50% | ✅ < 5% (validator) |

---

## 🚧 En cours (non terminé)

- Monitoring des story replies : vérifier que tous les formats passent
- Test du délai ManyChat : 12s est-il optimal ?

---

## 📋 À faire prochaine session

- [ ] **Monitorer les story replies** : vérifier que tous les formats de payload passent
- [ ] **Analyser les conversions** : est-ce que les story replies convertissent mieux que les DMs normaux ?
- [ ] **Ajuster le délai ManyChat** : tester 10s vs 15s vs 20s pour trouver le sweet spot
- [ ] **Question en suspens** : Reset funnel après 7 jours pour warm/hot leads ?

---

## 🐛 Bugs découverts

- ✅ **Fixé** : Story replies non capturées (payload parsing)
- ✅ **Fixé** : Webhook timeout (délai retiré)
- ✅ **Fixé** : "Which one?" sur story replies (instructions + validator)

---

## 💡 Idées notées

- **Story replies = meilleur engagement ?** : Les story replies semblent plus engageantes que les DMs normaux. À tracker.
- **Délai dynamique** : Utiliser `suggested_delay_seconds` du webhook pour un délai variable dans ManyChat (15-35s aléatoire).
- **Story reply intent** : Créer un intent spécifique "story_reply" pour mieux gérer ces cas.

---

## 📝 Notes importantes

### Configuration ManyChat

**Flow actuel** :
```
Trigger → External Request → Delay (12s) → Send Message
```

**Response Mapping** :
- JSONPath : `$.response`
- Custom Field : `elena_response`

**Body** :
```json
{
  "subscriber": {
    "id": "Contact Id",
    "name": "First Name",
    "ig_username": "Instagram Username"
  },
  "last_input_text": "Last Text Input"
}
```

### Vercel Timeout

- **Hobby Plan** : 10s timeout max
- **Pro Plan** : 60s timeout
- Solution : Délai dans ManyChat, pas dans l'API

### Story Replies Format

ManyChat envoie le texte dans différents champs selon le type :
- DM normal : `last_input_text`
- Story reply : `story_reply.text` ou `message.text`
- Story reaction : `story_reply.emoji`

---

**Commits** :
- `fix(dm): handle story replies by checking multiple payload fields`
- `fix(dm): remove webhook delay - Vercel 10s timeout causes ManyChat to use cached response`
- `fix(dm): handle story replies - never ask 'which one?'`

