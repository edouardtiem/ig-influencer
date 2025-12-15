# Session 15 Décembre 2024 — Mise en place Cron Jobs

## 🎯 Objectif de la session

Mettre en place l'automatisation des posts Instagram (3x/jour) via cron jobs gratuits.

---

## ✅ Ce qui a été fait

### 1. Suppression de Make.com

- **Supprimé** `app/src/lib/make.ts`
- **Mis à jour** `auto-post/route.ts` pour utiliser `instagram.ts` directement
- **Mis à jour** `test-publish/route.ts`
- **Mis à jour** la documentation (12-DEPLOYMENT.md, QUICKSTART.md, 04-IMPLEMENTATION.md)

### 2. Tentative cron-job.org

- Créé 3 cron jobs (morning, midday, evening)
- **Problème** : Limite de 30s timeout sur le plan gratuit (génération prend ~90s)

### 3. Migration vers GitHub Actions

- **Créé** `.github/workflows/auto-post.yml`
- Horaires programmés :
  - Morning: `30 5 * * *` (5h30 UTC = 6h30 Paris)
  - Midday: `30 10 * * *` (10h30 UTC = 11h30 Paris)
  - Evening: `0 17 * * *` (17h00 UTC = 18h00 Paris)
- Supporte le déclenchement manuel avec choix du slot
- Timeout de 5 minutes (largement suffisant)

### 4. Secrets GitHub configurés

| Secret | Description |
|--------|-------------|
| `VERCEL_APP_URL` | `https://ig-influencer.vercel.app` |
| `CRON_SECRET` | Token d'authentification pour l'API |

### 5. Fix Cloudinary

- **Problème** : Instagram Graph API n'accepte pas les images base64, seulement les URLs publiques
- **Solution** : Ajout de l'upload Cloudinary avant publication Instagram
- Workflow : Génération → Cloudinary → Instagram

### 6. Fix nombre de références

- **Problème** : Payload trop gros (6 images × 6MB = ~40MB en base64)
- **Solution** : Limité à 3 images de référence au lieu de 6

---

## ⚠️ À corriger (prochaine session)

### Erreur "Location not found: home_kitchen"

Le calendrier (`calendar.ts`) référence des lieux qui n'existent pas dans `locations.ts` :
- `home_kitchen` n'existe pas

**Solution** : Soit ajouter les lieux manquants, soit mettre à jour le calendrier.

---

## 📁 Fichiers modifiés

```
app/src/app/api/auto-post/route.ts    # Import instagram + cloudinary upload
app/src/app/api/test-publish/route.ts # Import instagram direct
app/src/lib/nanobanana.ts             # Limité à 3 références
app/src/lib/make.ts                   # SUPPRIMÉ
.github/workflows/auto-post.yml       # NOUVEAU - GitHub Actions
docs/12-DEPLOYMENT.md                 # Mis à jour (sans Make)
docs/QUICKSTART.md                    # Mis à jour (sans Make)
docs/04-IMPLEMENTATION.md             # Mis à jour (sans Make)
```

---

## 🔐 Variables d'environnement Vercel

À vérifier/ajouter sur Vercel :

| Variable | Status |
|----------|--------|
| `REPLICATE_API_TOKEN` | ✅ |
| `CLOUDINARY_CLOUD_NAME` | ✅ |
| `CLOUDINARY_API_KEY` | ✅ |
| `CLOUDINARY_API_SECRET` | ✅ |
| `INSTAGRAM_ACCESS_TOKEN` | ✅ Ajouté |
| `INSTAGRAM_ACCOUNT_ID` | ✅ Ajouté |
| `CRON_SECRET` | ✅ Ajouté |
| `PERPLEXITY_API_KEY` | ✅ |
| `MILA_BASE_FACE_URL` | ✅ |
| `MILA_REFERENCE_URLS` | ✅ |

---

## 🚀 Prochaines étapes

1. **Corriger** l'erreur "Location not found: home_kitchen"
2. **Tester** un cycle complet : GitHub Action → Génération → Cloudinary → Instagram
3. **Vérifier** que le post apparaît sur Instagram
4. **Activer** les cron jobs automatiques (ils tourneront aux horaires définis)

---

## 📊 Architecture finale

```
GitHub Actions (cron schedule)
    ↓
POST /api/auto-post?slot=morning|midday|evening
    ↓
1. Calendar détermine lieu + contenu
    ↓
2. Nano Banana Pro génère image (~60-90s)
    ↓
3. Cloudinary héberge l'image (URL publique)
    ↓
4. Perplexity génère caption
    ↓
5. Instagram Graph API publie
    ↓
✅ Post publié !
```

---

**Durée session** : ~2h
**Status** : En cours (reste à corriger erreur lieu)

*15 décembre 2024*
