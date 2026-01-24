# ✅ DONE-054 — DM System: Fixes Complets (Story Replies + Timeout + Validator)

**Date** : 4 janvier 2025  
**Version** : v2.37.4  
**Statut** : ✅ Terminé

---

## 🎯 Objectif

Résoudre plusieurs problèmes critiques du système DM :
1. Story replies ne déclenchaient pas de réponse
2. Webhook timeout → ManyChat utilisait des réponses en cache
3. Story replies → Elena demandait "which one?" au lieu de fermer

---

## ✅ Ce qui a été fait

### 1. Fix Story Replies Payload Parsing
- Recherche du texte dans plusieurs champs (`story_reply.text`, `message.text`, etc.)
- Logging payload complet pour debug
- Skip au lieu d'erreur si pas de texte trouvé

### 2. Fix Webhook Timeout
- Retiré délai 15-35s du webhook (Vercel timeout 10s)
- Ajouté `suggested_delay_seconds` dans la réponse
- Délai maintenant géré dans ManyChat (12s configuré)

### 3. Fix Story Replies — Never Ask "Which One?"
- Section `## 📸 STORY REPLIES` dans le prompt
- Instructions : PRETEND to know which story, use as closing opportunity
- `which one`, `which photo`, `which story` ajoutés aux FORBIDDEN_WORDS

---

## 📁 Fichiers modifiés

- `app/src/app/api/dm/webhook/route.ts` : Parsing multi-champs, retrait délai
- `app/src/lib/elena-dm.ts` : Instructions story replies, forbidden words

---

## 📊 Impact

| Problème | Avant | Après |
|----------|-------|-------|
| **Story replies** | ❌ Pas capturées | ✅ Capturées |
| **Webhook timeout** | ❌ Cache | ✅ Répond en ~2s |
| **"Which one?"** | ❌ Bot-like | ✅ Prétend savoir |

---

## 🔗 Liens

- [Session doc](./docs/sessions/2025-01-04-dm-fixes-complete.md)
- [Commits](https://github.com/edouardtiem/ig-influencer/compare/1abcbc7...53d0442)

---

**Next** : Monitorer story replies, analyser conversions

