# ✅ DONE-043 — Fanvue Chat Bot avec Grok AI

**Date** : 1er janvier 2025  
**Version** : v2.34.0  
**Status** : ✅ Terminé

---

## 🎯 Objectif

Implémenter un chat bot automatique pour Fanvue qui répond aux messages des fans avec Grok AI, et génère des images NSFW si demandé.

---

## ✅ Ce qui a été fait

### 1. Fix Posts Fanvue
- **Problème** : Refresh token expiré → posts ne se publiaient pas
- **Solution** : Ré-authentification OAuth + mise à jour API params
- **Changements API** :
  - `is_premium: true` → `audience: 'subscribers'`
  - `content` → `text`
  - `media_urls` → `mediaUrls`

### 2. Chat Bot avec Grok
- **Lib Grok** (`app/src/lib/grok.ts`) :
  - Chat completions avec `grok-2-latest`
  - Image generation avec `grok-2-image` (Aurora, NSFW capable)
  - Personnalité Elena pour Fanvue (flirty, mystérieuse, française)
  - Détection de demandes de photos

### 3. Webhook Handler
- **Events supportés** :
  - `message.created` → Répond avec Grok
  - `subscriber.created` → Message de remerciement
  - `tip.created` → Remerciement spécial
  - Génération d'images si demande de photo

### 4. Configuration
- ✅ Webhooks Fanvue activés (Message reçu, Nouveau follower, etc.)
- ✅ Variable `XAI_API_KEY` ajoutée
- ✅ Tokens Fanvue mis à jour

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/src/lib/grok.ts` | Créé | Client xAI Grok (chat + images) |
| `app/src/app/api/fanvue/webhook/route.ts` | Modifié | Handler chat bot + events |
| `app/scripts/daily-fanvue-elena.mjs` | Modifié | Fix API params |
| `app/scripts/test-fanvue-api.mjs` | Créé | Script de test API |
| `app/env.example.txt` | Modifié | Ajout XAI_API_KEY |

---

## 🚧 À faire (prochaine session)

- [ ] Tester génération images NSFW avec Grok API
- [ ] Vérifier que le chat bot répond correctement en prod
- [ ] Optimiser prompts Elena pour Fanvue
- [ ] Ajouter rate limiting pour éviter spam API Grok
- [ ] Ajouter `XAI_API_KEY` dans GitHub Secrets

---

## 📝 Notes

### Tokens Fanvue
- Access Token expire après 1h, auto-refresh avec refresh token
- Si refresh token "already used" → ré-authentifier via OAuth

### Webhooks Fanvue
- URL unique : `https://ig-influencer.vercel.app/api/fanvue/webhook`
- Tous les events vont au même endpoint, switch sur `event.type`

### Grok API
- Chat : `grok-2-latest` pour réponses texte
- Images : `grok-2-image` (Aurora) pour génération NSFW
- Coût : À vérifier pricing xAI

---

## 🔗 Références

- [Session doc](./../docs/sessions/2025-01-01-fanvue-chat-grok.md)
- [Fanvue API Docs](https://api.fanvue.com/docs)
- [xAI Grok API](https://docs.x.ai/api)

---

**Commits** :
- `9501a3d` - fix(fanvue): update API params (text/mediaUrls/audience)
- `ddd78b6` - feat(fanvue): chat bot with Grok AI + image generation

