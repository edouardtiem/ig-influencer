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

---

## 🔥 Session 2 — Carousel Mode + Sexy Edition

### 7. Migration vers Carousel (3 photos par post)

- **Problème** : Single image posts ont moins d'engagement
- **Solution** : Carrousel de 3 photos avec scene consistency
- **Flow** :
  ```
  Photo 1 (Hero) → Upload Cloudinary → URL1
       ↓
  Photo 2 (using URL1 as scene ref) → Upload → URL2
       ↓
  Photo 3 (using URL1 as scene ref) → Upload → URL3
       ↓
  Publish carousel [URL1, URL2, URL3]
  ```

### 8. Migration script vers GitHub Actions

- **Problème** : Vercel Hobby plan = 60s timeout (3 images = ~4-5 min impossible)
- **Solution** : Script `carousel-post.mjs` qui tourne directement dans GitHub Actions (10 min timeout)
- **Fichier** : `app/scripts/carousel-post.mjs`

### 9. Secrets GitHub ajoutés

| Secret | Description |
|--------|-------------|
| `REPLICATE_API_TOKEN` | Token Replicate API |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |
| `INSTAGRAM_ACCESS_TOKEN` | Token Instagram Graph API |
| `INSTAGRAM_ACCOUNT_ID` | ID du compte Instagram |

### 10. Géolocalisation Instagram

- **Ajouté** `instagramLocationId` dans les locations
- **Paris 18e** : `101156775033710` (pour `home_bedroom`, `home_living_room`)
- Géotag automatique sur les posts home

### 11. Sexy Edition — Refonte complète

#### Nouveaux horaires (4 posts/jour)

| Slot | Heure Paris | UTC (hiver) | Lieux |
|------|-------------|-------------|-------|
| `morning` | 8h30 | 7h30 | home_bedroom |
| `late_morning` | 11h00 | 10h00 | paris_cafe, paris_street |
| `afternoon` | 17h00 | 16h00 | home_living_room, paris_cafe |
| `evening` | 21h15 | 20h15 | home_bedroom, home_living_room |

#### Nouveaux lieux

- ✅ `home_bedroom` — Paris 18e géotag
- ✅ `home_living_room` — Paris 18e géotag
- ✅ `paris_cafe` — Générique, pas de géotag
- ✅ `paris_street` — Générique, pas de géotag
- ❌ `nice_gym` — Supprimé
- ❌ `nice_old_town_cafe` — Supprimé

#### Nouvelles tenues (sexy mais filter-safe)

Avec références marques : Skims, Intimissimi, Savage x Fenty, Etam, Livy Paris, Alo Yoga, Lululemon, Sézane, Rouje

```
- fitted ribbed bodysuit Skims style, thin spaghetti straps
- oversized t-shirt slipping off shoulder, bare legs
- silk camisole Intimissimi style, thin delicate straps
- matching cotton underwear set Etam style
- fitted tank top no visible bra, natural silhouette
- oversized sweater falling off shoulder
- loose mens shirt unbuttoned showing décolleté
```

#### Nouvelles actions (suggestives)

```
- sitting on bed edge, sheets draped around
- lying on bed propped on elbow, body curved
- standing by window, silhouette backlit
- curled up on sofa, bare legs tucked
- lying on stomach, legs kicked up playfully
- taking mirror selfie with phone
```

#### Prompts optimisés

- **Mots français** : `sensualité naturelle`, `lumière tamisée`, `ambiance intime`
- **Style artistique** : `photographie lifestyle editorial`
- **Mila corrigée** : 22 ans (pas 25)

### 12. Fallback pour prompts flaggés

Système de retry à 3 niveaux quand un prompt est bloqué :

```
Prompt original (sexy)
     ↓ (si flagged E005)
Prompt safer (mots remplacés automatiquement)
     ↓ (si encore flagged)
Prompt minimal (loungewear cozy ultra safe)
```

**Remplacements automatiques** :

| Original | Safe |
|----------|------|
| `bare legs` | `legs visible` |
| `no visible bra` | `relaxed fit` |
| `bralette` | `soft top` |
| `panties` | `bottoms` |
| `slipping off` | `relaxed on` |
| `sensual` | `confident` |
| `intimate` | `cozy` |

---

## 📁 Fichiers modifiés/créés (Session 2)

```
app/scripts/carousel-post.mjs          # NOUVEAU - Script principal carousel
app/scripts/test-sexy-prompts.mjs      # NOUVEAU - Tests prompts sexy
.github/workflows/auto-post.yml        # Mis à jour - 4 slots, script direct
app/src/lib/nanobanana.ts              # Ajouté scene reference support
app/src/config/calendar.ts             # Export LOCATION_ACTIONS
app/vercel.json                        # Timeout 300s (pour Pro, non utilisé)
```

---

## 🧪 Tests effectués

### Prompts testés sur Nano Banana Pro

| Prompt | Résultat |
|--------|----------|
| Bodysuit + café fenêtre | ✅ Passé |
| Oversized sweater canapé | ✅ Passé |
| Mirror selfie tank top | ✅ Passé |
| Bedroom cozy morning (t-shirt) | ✅ Passé |
| Art boudoir sheer fabric | ❌ Bloqué |
| Wet t-shirt | ❌ Bloqué |
| Lingerie + bed explicit | ❌ Bloqué |

**Conclusion** : Les prompts "suggestifs mais pas explicites" passent. Éviter : `transparent`, `wet`, `barely covering`, `bralette + bed`.

---

## 📊 Architecture finale (Session 2)

```
GitHub Actions (cron 4x/jour)
    ↓
node scripts/carousel-post.mjs [slot]
    ↓
1. Sélection lieu + tenue + 3 actions
    ↓
2. Photo 1 (Hero) - Nano Banana Pro (~60s)
    ↓ Upload Cloudinary
3. Photo 2 - avec Photo 1 en scene ref (~60s)
    ↓ Upload Cloudinary
4. Photo 3 - avec Photo 1 en scene ref (~60s)
    ↓ Upload Cloudinary
5. Génération caption
    ↓
6. Instagram Graph API - Carousel publish
    ↓
✅ Carousel 3 photos publié !
```

---

**Durée totale session** : ~4h
**Status** : ✅ Complet — Prêt pour production

*15 décembre 2024*
