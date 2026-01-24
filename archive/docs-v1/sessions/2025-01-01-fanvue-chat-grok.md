# 📝 SESSION — Fanvue Chat Bot avec Grok + Fix Posts

**Date** : 1er janvier 2025  
**Durée** : ~1h30

---

## 🎯 Objectifs

1. ✅ Diagnostiquer pourquoi les posts Fanvue ne se postent pas
2. ✅ Ré-authentifier Fanvue (tokens expirés)
3. ✅ Implémenter chat bot Fanvue avec Grok AI
4. ✅ Préparer intégration Grok pour images NSFW

---

## ✅ Ce qui a été fait cette session

### 1. Diagnostic Posts Fanvue
- **Problème identifié** : Refresh token Fanvue expiré ("already used")
- **Solution** : Ré-authentification OAuth via Vercel prod
- **Fix API** : Mise à jour des paramètres API Fanvue :
  - `is_premium: true` → `audience: 'subscribers'`
  - `content` → `text`
  - `media_urls` → `mediaUrls`

### 2. Chat Bot Fanvue avec Grok
- **Lib Grok** (`app/src/lib/grok.ts`) :
  - Chat completions avec Grok-2
  - Image generation avec Grok Aurora (NSFW capable)
  - Personnalité Elena pour Fanvue
  - Détection de demandes de photos
  
- **Webhook Handler** (`app/src/app/api/fanvue/webhook/route.ts`) :
  - `message.created` → Répond avec Grok
  - `subscriber.created` → Message de remerciement
  - `tip.created` → Remerciement spécial
  - Génération d'images si demande de photo

### 3. Configuration
- ✅ Webhooks Fanvue activés (Message reçu, Nouveau follower, etc.)
- ✅ Variable `XAI_API_KEY` ajoutée à env.example
- ✅ Tokens Fanvue mis à jour dans .env.local et GitHub Secrets

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/src/lib/grok.ts` | Créé | Client xAI Grok (chat + images) |
| `app/src/app/api/fanvue/webhook/route.ts` | Modifié | Handler chat bot + events |
| `app/scripts/daily-fanvue-elena.mjs` | Modifié | Fix API params (audience/text/mediaUrls) |
| `app/scripts/test-fanvue-api.mjs` | Créé | Script de test API Fanvue |
| `app/env.example.txt` | Modifié | Ajout XAI_API_KEY |

---

## 🚧 En cours (non terminé)

- ⚠️ **Grok Images NSFW** : API créée mais pas encore testée
- ⚠️ **Webhook Secret** : À ajouter dans GitHub Secrets (`FANVUE_WEBHOOK_SECRET`)
- ⚠️ **XAI_API_KEY** : À ajouter dans GitHub Secrets pour prod

---

## 📋 À faire prochaine session

- [ ] Tester génération images NSFW avec Grok API
- [ ] Vérifier que le chat bot répond correctement en prod
- [ ] Optimiser prompts Elena pour Fanvue (plus flirty/mystérieuse)
- [ ] Ajouter rate limiting pour éviter spam API Grok
- [ ] Tester le workflow daily Fanvue (17h Paris)

---

## 🐛 Bugs découverts

1. **Nano Banana Pro bloque prompts** : Filtre NSFW activé sur les références Elena
   - Solution temporaire : Utiliser Grok pour images NSFW
   
2. **API Fanvue changée** : Paramètres mis à jour (`audience` au lieu de `is_premium`)

---

## 💡 Idées notées

- **Grok pour images NSFW** : Alternative à Nano Banana Pro pour contenu plus explicite
- **Chat contextuel** : Garder historique conversation pour meilleures réponses
- **A/B testing messages** : Tester différents styles de réponses Elena

---

## 📝 Notes importantes

### Tokens Fanvue
- **Access Token** : Expire après 1h, auto-refresh avec refresh token
- **Refresh Token** : Peut expirer si "already used" → ré-authentifier via OAuth

### Webhooks Fanvue
- **URL unique** : `https://ig-influencer.vercel.app/api/fanvue/webhook`
- **Events supportés** :
  - `follower.created` → Welcome DM
  - `message.created` → Chat bot Grok
  - `subscriber.created` → Thank you
  - `tip.created` → Special thank you

### Grok API
- **Chat** : `grok-2-latest` pour réponses texte
- **Images** : `grok-2-image` (Aurora) pour génération NSFW
- **Coût** : À vérifier pricing xAI (probablement payant par requête)

---

## 🔗 Références

- [Fanvue API Docs](https://api.fanvue.com/docs)
- [xAI Grok API](https://docs.x.ai/api)
- [Session Fanvue OAuth](./2024-12-26-fanvue-oauth.md)

---

**Commits** :
- `9501a3d` - fix(fanvue): update API params (text/mediaUrls/audience)
- `ddd78b6` - feat(fanvue): chat bot with Grok AI + image generation

