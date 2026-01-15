# 📝 SESSION — Fanvue OAuth 2.0 + PKCE Integration

**Date** : 26 Décembre 2024  
**Durée** : ~2h  
**Status** : ✅ Complété

---

## 🎯 Objectif

Configurer l'API Fanvue avec OAuth 2.0 pour permettre l'upload automatique de contenu premium et la gestion des fans.

---

## ✅ Ce qui a été fait

### 1. Configuration OAuth Fanvue
- Création app OAuth sur Fanvue Developer Portal
- Configuration des redirect URIs (local + prod)
- Activation de tous les scopes (read/write)

### 2. Implémentation Client API
- `app/src/lib/fanvue.ts` — Client complet avec :
  - OAuth 2.0 + PKCE (obligatoire pour Fanvue)
  - Token management (access + refresh)
  - Fonctions API : getProfile, createPost, getAnalytics

### 3. Endpoints OAuth
- `GET /api/oauth/auth` — Initie le flow OAuth avec PKCE
- `GET /api/oauth/callback` — Gère le callback et échange le code

### 4. Debugging & Fixes
- Fix URL auth : `/oauth2/auth` (pas `/oauth/authorize`)
- Fix URL token : `/oauth2/token` (pas `/oauth/token`)
- Fix auth method : `client_secret_basic` (credentials dans header)
- Implémentation PKCE complète avec stockage cookie sécurisé

---

## 📁 Fichiers créés/modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/src/lib/fanvue.ts` | Créé | Client API Fanvue OAuth 2.0 + PKCE |
| `app/src/app/api/oauth/auth/route.ts` | Créé | Endpoint initiation OAuth |
| `app/src/app/api/oauth/callback/route.ts` | Créé | Endpoint callback OAuth |
| `app/src/app/api/status/route.ts` | Modifié | Ajout status Fanvue |
| `app/env.example.txt` | Modifié | Variables Fanvue documentées |

---

## 🔧 Configuration Fanvue

### Credentials (Elena)
```
FANVUE_CLIENT_ID=43286efd-64ee-401a-898d-1409700ebaa5
FANVUE_CLIENT_SECRET=s-6u_4DRynKnBb8Fb1tLMop-pU
FANVUE_REDIRECT_URI=https://ig-influencer.vercel.app/api/oauth/callback
```

### Scopes activés
- `read:chat`, `read:creator`, `read:fan`, `read:insights`, `read:media`, `read:post`, `read:self`
- `write:chat`, `write:creator`, `write:media`, `write:post`
- System scopes auto-ajoutés : `openid`, `offline_access`, `offline`

### URLs OAuth
- Auth : `https://auth.fanvue.com/oauth2/auth`
- Token : `https://auth.fanvue.com/oauth2/token`
- API : `https://api.fanvue.com`

---

## 📚 Learnings

### PKCE obligatoire
Fanvue requiert PKCE (Proof Key for Code Exchange) pour tous les flows OAuth :
1. Générer `code_verifier` (random 32 bytes base64url)
2. Créer `code_challenge` = SHA256(code_verifier) base64url
3. Envoyer challenge avec auth request
4. Envoyer verifier avec token request

### client_secret_basic
Fanvue utilise `client_secret_basic` auth :
```javascript
const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
headers: { 'Authorization': `Basic ${basicAuth}` }
```

### Documentation
- Implementation Guide : https://api.fanvue.com/docs/authentication/implementation-guide
- Scopes : https://api.fanvue.com/docs/authentication/scopes

---

## 🚧 À faire

- [ ] Persister tokens dans Supabase (actuellement en mémoire)
- [ ] Tester createPost() avec pack Elena
- [ ] Implémenter webhooks Fanvue
- [ ] Auto-refresh token avant expiration

---

## 🔗 Références

- [Fanvue API Docs](https://api.fanvue.com/docs)
- [OAuth Implementation Guide](https://api.fanvue.com/docs/authentication/implementation-guide)
- [Fanvue Discord](https://discord.com/invite/dZe3tqVTq4)







