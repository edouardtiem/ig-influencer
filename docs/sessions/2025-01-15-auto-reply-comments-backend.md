# 💬 Auto-Reply Comments — Backend Development

**Date** : 15 janvier 2025  
**Durée** : ~2h  
**Status** : ✅ Backend terminé, ManyChat AI utilisé à la place du webhook

---

## 🎯 Objectif

Développer le backend pour l'auto-reply aux commentaires Instagram via ManyChat + Claude AI.

---

## ✅ Ce qui a été fait

### 1. Backend API Endpoint
- ✅ Créé `/api/comment/reply` (POST)
- ✅ Intégration Claude Sonnet pour génération réponses
- ✅ Détection spam (patterns: liens, crypto, promotions)
- ✅ Validation des réponses (longueur max 15 mots, pas de Fanvue)
- ✅ Prévention doublons (check `comment_id` unique)
- ✅ Logging Supabase (table `elena_comment_replies`)

### 2. Base de données
- ✅ Migration SQL créée : `008_elena_comment_replies.sql`
- ✅ Table avec indexes pour performance
- ✅ Tracking des replies envoyées/skippées

### 3. Tests
- ✅ Test endpoint local : OK
- ✅ Test réponse anglaise : "thanks babe 🖤"
- ✅ Test réponse française : "paris! et toi? 🖤"
- ✅ Test emoji-only : "🖤"
- ✅ Test spam detection : skip=true ✅

### 4. ManyChat Setup
- ✅ Guide ManyChat fourni
- ✅ Configuration webhook expliquée
- ✅ Variables ManyChat mappées
- ⚠️ **Finalement** : Utilisation de ManyChat AI natif (plus simple)

---

## 📁 Fichiers créés/modifiés

### Backend
- `app/src/app/api/comment/reply/route.ts` (nouveau)
- `app/supabase/migrations/008_elena_comment_replies.sql` (nouveau)

### Documentation
- `roadmap/in-progress/IP-005-auto-reply-comments.md` (mis à jour)
- `docs/sessions/2025-01-15-auto-reply-comments-backend.md` (ce fichier)

---

## 🔧 Architecture Backend

### Endpoint : `POST /api/comment/reply`

**Request Body** :
```json
{
  "comment_id": "string (required)",
  "comment_text": "string (required)",
  "username": "string (required)",
  "user_id": "string (optional)",
  "post_id": "string (optional)",
  "post_caption": "string (optional)"
}
```

**Response** :
```json
{
  "success": true,
  "response": "merci 🖤",
  "skip": false,
  "skip_reason": null
}
```

### Prompt Elena (Comment Style)
- Max 1-2 phrases
- Max 10 mots
- Style commentaire Instagram (pas DM)
- Pas de mention Fanvue
- Détection langue (FR/EN)

### Spam Detection
Patterns détectés :
- Liens (http, www, .com)
- Crypto/scam keywords
- Promotions (link in bio, f4f, etc.)
- Messages numériques uniquement

---

## 🚧 Décision finale

**ManyChat AI utilisé** au lieu du webhook custom car :
- ✅ Plus simple à configurer
- ✅ Intégration Claude native ManyChat
- ✅ Pas besoin de délai 5min (géré automatiquement)
- ✅ Interface ManyChat plus intuitive

**Backend disponible** si besoin futur :
- Endpoint fonctionnel et testé
- Peut être utilisé pour d'autres cas d'usage
- Table Supabase prête pour analytics

---

## 📋 À faire (si besoin webhook custom)

Si on veut utiliser notre webhook à la place de ManyChat AI :

1. **ManyChat Flow** :
   - Trigger: "User comments on post/reel"
   - Delay: 5 minutes
   - External Request → `/api/comment/reply`
   - Response mapping: `$.response` → `elena_reply`
   - **Problème** : ManyChat ne permet pas "Reply to Comment" comme action dans le flow (seulement au trigger level)

2. **Solution alternative** :
   - Public Reply simple au trigger (statique)
   - DM personnalisé via notre webhook (dans le flow)

---

## 🐛 Limitations découvertes

1. **ManyChat Public Reply** :
   - Se configure uniquement au trigger level
   - Ne peut pas utiliser variables dynamiques après webhook
   - Réponses statiques ou variables simples seulement

2. **Timing** :
   - Public Reply se déclenche AVANT le flow
   - Impossible d'attendre le webhook pour la reply publique

---

## 💡 Notes importantes

- **ManyChat AI** est la solution recommandée pour comment replies
- **Backend webhook** reste disponible pour autres cas (DM, autres triggers)
- **Table Supabase** peut tracker les replies ManyChat AI si on ajoute un webhook ManyChat → notre API pour logging

---

## 📊 Métriques (futures)

Une fois ManyChat AI actif, on peut tracker :
- Nombre de replies/jour
- Taux de réponse
- Engagement rate sur posts avec replies

---

*Session terminée — ManyChat AI configuré pour comment replies*
