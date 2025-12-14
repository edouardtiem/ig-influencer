# 🚀 Guide de Déploiement — Mila Verne Auto-Post

## 📋 Prérequis

Avant de déployer, assure-toi d'avoir :

- [ ] Compte Vercel (https://vercel.com)
- [ ] Compte Replicate avec crédits (https://replicate.com)
- [ ] Compte Cloudinary (https://cloudinary.com)
- [ ] Page Facebook + Compte Instagram Pro Business connectés
- [ ] Token Instagram Graph API (permanent)
- [ ] (Optionnel) Compte Perplexity API (https://perplexity.ai)
- [ ] Compte cron-job.org (gratuit)

---

## 🔐 Variables d'Environnement

### Sur Vercel Dashboard → Settings → Environment Variables

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `REPLICATE_API_TOKEN` | Token API Replicate | ✅ Oui |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary | ✅ Oui |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | ✅ Oui |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | ✅ Oui |
| `INSTAGRAM_ACCESS_TOKEN` | Token permanent Instagram Graph API | ✅ Oui |
| `INSTAGRAM_ACCOUNT_ID` | ID du compte Instagram Business | ✅ Oui |
| `CRON_SECRET` | Secret pour auth cron jobs | ✅ Oui (prod) |
| `PERPLEXITY_API_KEY` | Clé API Perplexity | ❌ Optionnel |
| `MILA_BASE_FACE_URL` | URL portrait principal Mila | ✅ Oui |
| `MILA_REFERENCE_URLS` | URLs références Mila (comma-sep) | ✅ Oui |

### Générer CRON_SECRET

```bash
openssl rand -hex 32
```

---

## 🚀 Déploiement sur Vercel

### Option A : Via GitHub (Recommandé)

1. Push le projet sur GitHub
2. Sur Vercel : "New Project" → Import depuis GitHub
3. Framework : Next.js (auto-détecté)
4. Root Directory : `app`
5. Ajouter toutes les variables d'environnement
6. Deploy !

### Option B : Via CLI

```bash
cd app
npm i -g vercel
vercel login
vercel --prod
```

---

## ⏰ Configuration Cron Jobs

### Option A : Vercel Cron (Plan Pro requis)

Le fichier `vercel.json` est déjà configuré :

```json
{
  "crons": [
    {
      "path": "/api/auto-post",
      "schedule": "30 5 * * *"
    },
    {
      "path": "/api/auto-post?slot=midday", 
      "schedule": "30 10 * * *"
    },
    {
      "path": "/api/auto-post?slot=evening",
      "schedule": "0 17 * * *"
    }
  ]
}
```

**Horaires (UTC)** :
- 05:30 UTC = 06:30 Paris (morning)
- 10:30 UTC = 11:30 Paris (midday)
- 17:00 UTC = 18:00 Paris (evening)

### Option B : cron-job.org (Plan Gratuit)

Si tu n'as pas Vercel Pro, utilise cron-job.org :

1. Créer compte sur https://cron-job.org
2. Créer 3 cron jobs :

#### Cron 1 : Morning (6h30 Paris)

```
URL: https://ton-app.vercel.app/api/auto-post
Method: POST
Schedule: 30 5 * * * (5h30 UTC = 6h30 Paris hiver)
Headers:
  Authorization: Bearer TON_CRON_SECRET
  Content-Type: application/json
```

#### Cron 2 : Midday (11h30 Paris)

```
URL: https://ton-app.vercel.app/api/auto-post?slot=midday
Method: POST
Schedule: 30 10 * * * (10h30 UTC = 11h30 Paris hiver)
Headers:
  Authorization: Bearer TON_CRON_SECRET
```

#### Cron 3 : Evening (18h00 Paris)

```
URL: https://ton-app.vercel.app/api/auto-post?slot=evening
Method: POST
Schedule: 0 17 * * * (17h00 UTC = 18h00 Paris hiver)
Headers:
  Authorization: Bearer TON_CRON_SECRET
```

**Note** : Ajuster les heures UTC selon l'heure d'été/hiver.

---

## 🧪 Test du Déploiement

### 1. Vérifier le statut

```bash
curl https://ton-app.vercel.app/api/status
```

### 2. Tester auto-post (sans publier)

```bash
curl -X POST "https://ton-app.vercel.app/api/auto-post?test=true" \
  -H "Authorization: Bearer TON_CRON_SECRET"
```

### 3. Tester un slot spécifique

```bash
curl -X POST "https://ton-app.vercel.app/api/auto-post?test=true&slot=morning" \
  -H "Authorization: Bearer TON_CRON_SECRET"
```

### 4. Vérifier les trends Perplexity

```bash
curl https://ton-app.vercel.app/api/daily-trends
```

---

## 📊 Monitoring

### Logs Vercel

1. Vercel Dashboard → Ton projet → Logs
2. Filtrer par `/api/auto-post`
3. Vérifier les succès/erreurs

### Métriques à surveiller

| Métrique | Target | Alerte si |
|----------|--------|-----------|
| Temps génération | < 90s | > 120s |
| Taux succès | > 95% | < 90% |
| Coût Replicate | < $0.10/image | > $0.15/image |

---

## 🔧 Troubleshooting

### Erreur 401 Unauthorized

- Vérifier `CRON_SECRET` dans Vercel env vars
- Vérifier le header `Authorization: Bearer ...`

### Erreur génération image

- Vérifier crédits Replicate
- Vérifier URLs des références Mila
- Regarder logs Vercel pour détails

### Image pas publiée

- Vérifier `INSTAGRAM_ACCESS_TOKEN` valide (non expiré)
- Vérifier `INSTAGRAM_ACCOUNT_ID` correct
- Vérifier que l'image URL est publiquement accessible
- Regarder logs pour message d'erreur Instagram API

### Timeout (504)

- Les fonctions sont configurées pour 120s max
- Si timeout fréquent, Replicate peut être lent
- Réessayer plus tard

---

## 📅 Calendrier de Publication

| Slot | Heure Paris | Heure UTC | Contenu Type |
|------|-------------|-----------|--------------|
| Morning | 06:30 | 05:30 | Gym, Chambre (réveil) |
| Midday | 11:30 | 10:30 | Gym, Café |
| Evening | 18:00 | 17:00 | Salon, Chambre (cozy) |

---

## 🔄 Workflow Complet

```
Cron-job.org déclenche → /api/auto-post
         ↓
    Calendrier détermine slot + lieu
         ↓
    Génère content brief (tenue, action, props)
         ↓
    Nano Banana Pro génère image (~60-90s)
         ↓
    Perplexity génère caption + hashtags
         ↓
    Instagram Graph API publie directement
         ↓
    ✅ Post publié !
```

---

## 💰 Coûts Estimés

| Service | Coût/mois (3 posts/jour) |
|---------|--------------------------|
| Replicate | ~$15-25 |
| Vercel | $0 (Hobby) |
| Cloudinary | $0 (Free tier) |
| cron-job.org | $0 (Free) |
| Perplexity | $0-5 |
| Instagram API | $0 (Gratuit) |
| **Total** | **~$15-30/mois** |

---

*Dernière mise à jour : 4 décembre 2024*

