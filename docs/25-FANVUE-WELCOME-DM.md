# 📬 Fanvue Welcome DM System

> Auto-send welcome DM with teaser photo to new free followers

**Status**: Ready to deploy  
**Date**: 29 décembre 2024

---

## 🎯 Objectif

Convertir les followers gratuits en abonnés payants via un DM automatique de bienvenue avec une photo teaser.

---

## 🏗️ Architecture

```
New follower → Fanvue Webhook → /api/fanvue/webhook → Send DM (text + photo)
```

---

## 📁 Fichiers

| Fichier | Description |
|---------|-------------|
| `app/src/app/api/fanvue/webhook/route.ts` | Endpoint webhook |
| `app/src/lib/fanvue.ts` | Fonctions `sendMessage()`, `sendWelcomeDM()` |
| `app/src/config/fanvue-welcome.ts` | Message + photo URL |

---

## ⚙️ Configuration

### 1. Variables d'environnement

Ajouter dans `.env.local` et GitHub Secrets :

```bash
# Fanvue OAuth (déjà configuré)
FANVUE_CLIENT_ID=xxx
FANVUE_CLIENT_SECRET=xxx
FANVUE_ACCESS_TOKEN=xxx
FANVUE_REFRESH_TOKEN=xxx

# Webhook (nouveau)
FANVUE_WEBHOOK_SECRET=xxx  # Obtenir depuis Fanvue Dashboard
```

### 2. Configurer le Webhook dans Fanvue Dashboard

1. Aller sur [Fanvue Developer Dashboard](https://api.fanvue.com)
2. Section **Webhooks**
3. Ajouter un nouveau webhook :
   - **URL** : `https://ig-influencer.vercel.app/api/fanvue/webhook`
   - **Events** : `follower.created`
4. Copier le **Webhook Secret** → ajouter dans `FANVUE_WEBHOOK_SECRET`

### 3. Déployer sur Vercel

```bash
git add -A
git commit -m "feat(fanvue): welcome DM for new followers"
git push
```

Le webhook sera automatiquement disponible après déploiement.

---

## 💬 Message de Bienvenue

**Texte** (modifiable dans `fanvue-welcome.ts`) :

```
Hey! 💋 Thanks for following me here...

This is where I share the things I can't post anywhere else.

Want to see more? Subscribe and you won't be disappointed... 😏
```

**Photo** : Teaser sexy (pas le contenu premium)

---

## 🔄 Flow

1. **Nouveau follower gratuit** sur Fanvue
2. **Fanvue envoie webhook** `follower.created` 
3. **Notre endpoint** reçoit l'event
4. **Vérifie la signature** (sécurité)
5. **Envoie DM** via Fanvue API (texte + photo)
6. **Follower reçoit** le message de bienvenue

---

## 🧪 Test

### Test manuel de l'endpoint

```bash
curl -X POST https://ig-influencer.vercel.app/api/fanvue/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"follower.created","data":{"user_id":"test123","username":"testuser"}}'
```

### Vérifier l'endpoint

```bash
curl https://ig-influencer.vercel.app/api/fanvue/webhook
# Retourne: { "status": "Fanvue webhook endpoint", "events": [...] }
```

---

## 📊 Events supportés

| Event | Action |
|-------|--------|
| `follower.created` | Envoie welcome DM avec photo teaser |
| `subscriber.created` | Log uniquement (pour l'instant) |

---

## 🔗 Liens

- [Fanvue API Docs](https://api.fanvue.com/docs)
- [Session Fanvue OAuth](./sessions/2024-12-26-fanvue-oauth.md)
- [Fanvue Daily System](./sessions/2024-12-29-fanvue-daily-system.md)

---

*Créé le 29 décembre 2024*

