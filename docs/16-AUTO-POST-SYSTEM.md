# 16 - Système d'Auto-Post Automatisé

> Documentation complète des systèmes de publication automatique Instagram via GitHub Actions

---

## 📋 Vue d'ensemble

Le projet dispose de **4 systèmes d'auto-post automatisés** qui fonctionnent via GitHub Actions :

### Mila (@mila.aurorae)

| Système | Format | Fréquence | Horaires |
|---------|--------|-----------|----------|
| **Carousel Auto-Post** | 3 photos carrousel | **Variable selon jour** | Voir calendrier ci-dessous |
| **Vacation Reels** | Vidéo slideshow 9s | **4x/semaine** | Mer, Jeu, Sam, Dim à 19h |

#### 📅 Calendrier optimisé Mila (basé sur analytics)

**Carousels :**

| Jour | Posts | Horaires Paris | Engagement |
|------|-------|----------------|------------|
| **Lundi** | 2 | 12h30, 21h | 📉 -38% (low effort) |
| **Mardi** | 3 | 8h30, 17h, 21h15 | 📊 Moyen |
| **Mercredi** | 3 | 8h30, 17h, 21h15 | 📊 Moyen |
| **Jeudi** | 3 | 8h30, 17h, 21h15 | 📊 Moyen+ |
| **Vendredi** | 3 | 12h30, 19h, 21h15 | 📊 Prépa weekend |
| **Samedi** | 4 | 11h, 17h, 21h, 23h | 🔥 +60% |
| **Dimanche** | 4 | 11h, 17h, 21h, 23h | 🔥 +55% |

**Reels (optimisés)** : Mer 19h, Jeu 19h, Sam 19h 🔥, Dim 19h 🔥

**Total Mila : 22 carousels + 4 reels = 26 posts/semaine** 🚀

---

### Elena (@elenav.paris)

| Système | Format | Fréquence | Horaires |
|---------|--------|-----------|----------|
| **Elena Carousel Auto-Post** | 3 photos carrousel | 5x/jour | 9h, 12h30, 19h, 21h30, 23h |
| **Elena Vacation Reels** | Vidéo slideshow 9s | **4x/semaine** | Mer, Jeu, Sam, Dim à 21h |

**Reels Elena (optimisés)** : Mer 21h, Jeu 21h, Sam 21h 🔥, Dim 21h 🔥

**Total Elena : 35 carousels + 4 reels = 39 posts/semaine** 🌟

**Note** : Les slots d'Elena sont décalés vs Mila pour éviter la cannibalisation. Reels à 21h (vs 19h Mila)

---

## 🎠 Système 1 : Carousel Auto-Post

### Description

Génère et publie automatiquement un carrousel de 3 photos lifestyle de Mila.

### Fichiers

| Fichier | Description |
|---------|-------------|
| `app/scripts/carousel-post.mjs` | Script principal |
| `.github/workflows/auto-post.yml` | GitHub Action |

### Slots disponibles

| Slot | Heure Paris | UTC (hiver) | Lieux |
|------|-------------|-------------|-------|
| `morning` | 8h30 | 7h30 | home_bedroom |
| `late_morning` | 11h-12h30 | 10h-11h30 | paris_cafe, paris_street |
| `afternoon` | 17h-19h | 16h-18h | home_living_room, paris_cafe |
| `evening` | 21h-21h15 | 20h-20h15 | home_bedroom, home_living_room |
| `night` | 23h | 22h | home_bedroom (weekend only) |

### Pipeline technique

```
GitHub Actions (cron schedule)
    ↓
node scripts/carousel-post.mjs [slot]
    ↓
1. Sélection lieu + tenue + 3 actions (basé sur slot)
    ↓
2. Photo 1 (Hero) - Nano Banana Pro 4:5 (~60s)
    ↓ Upload Cloudinary
3. Photo 2 - avec Photo 1 en scene ref (~60s)
    ↓ Upload Cloudinary
4. Photo 3 - avec Photo 1 en scene ref (~60s)
    ↓ Upload Cloudinary
5. Génération caption
    ↓
6. Instagram Graph API - Carousel publish
    ↓
✅ Carrousel 3 photos publié !
```

### Commandes

```bash
# Test local (sans publier)
node scripts/carousel-post.mjs morning true
node scripts/carousel-post.mjs evening true

# Publication réelle
node scripts/carousel-post.mjs morning
node scripts/carousel-post.mjs afternoon
```

### Fallback prompts flaggés

Le système gère automatiquement les prompts bloqués par le safety filter :

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

---

## 🌟 Système 2 : Elena Carousel Auto-Post

### Description

Génère et publie automatiquement un carrousel de 3 photos lifestyle très sexy d'Elena.

### Fichiers

| Fichier | Description |
|---------|-------------|
| `app/scripts/carousel-post-elena.mjs` | Script principal |
| `.github/workflows/auto-post-elena.yml` | GitHub Action |

### Horaires (5x/jour — focus soir/nuit)

| Slot | Heure Paris | UTC (hiver) | Lieux |
|------|-------------|-------------|-------|
| `morning` | 9h00 | 8h00 | loft_bedroom, bathroom_luxe |
| `midday` | 12h30 | 11h30 | cafe_paris, loft_living |
| `evening` | 19h00 | 18h00 | loft_living, cafe_paris |
| `night` **PRIME** | 21h30 | 20h30 | loft_bedroom, loft_living |
| `late_night` | 23h00 | 22h00 | loft_bedroom, bathroom_luxe |

### Locations Elena

| Location | Description |
|----------|-------------|
| `loft_living` | Loft luxueux Paris 8e, grandes fenêtres, vue toits |
| `loft_bedroom` | Chambre élégante, literie blanche, vanity mirror |
| `bathroom_luxe` | Salle de bain marbre blanc, fixtures or |
| `cafe_paris` | Terrasse café chic, style haussmannien |
| `spa_luxe` | Spa/jacuzzi montagne ou indoor |

### Secrets GitHub requis

```
INSTAGRAM_ACCESS_TOKEN_ELENA
INSTAGRAM_ACCOUNT_ID_ELENA
ELENA_PRIMARY_FACE_URL
ELENA_FACE_REF_1
ELENA_FACE_REF_2
```

### Commandes

```bash
# Test local (sans publier)
node scripts/carousel-post-elena.mjs morning test
node scripts/carousel-post-elena.mjs night test

# Publication réelle
node scripts/carousel-post-elena.mjs morning
node scripts/carousel-post-elena.mjs night
```

---

## 🎬 Système 3 : Vacation Reels (Mila)

### Description

Génère et publie automatiquement un Reel vidéo (slideshow 9 secondes) sur un thème de vacances sexy.

### Fichiers

| Fichier | Description |
|---------|-------------|
| `app/scripts/vacation-reel-post.mjs` | Script principal |
| `.github/workflows/vacation-reel.yml` | GitHub Action |

### Horaire (optimisé)

**19h Paris** (18h UTC hiver) — **4x/semaine** (Mer, Jeu, Sam, Dim)

> ℹ️ Les reels performent +55-60% le weekend, d'où l'optimisation sur 4 jours au lieu de 7.

### Rotation des thèmes

Les 3 thèmes tournent automatiquement basé sur le jour de l'année :

| Thème | Settings | Outfits Sexy |
|-------|----------|--------------|
| **🎿 Ski** | Sauna chalet, jacuzzi montagne, salon cheminée | Peignoir épaules nues, bikini jacuzzi, pull oversized |
| **🏖️ Beach** | Plage sunset, beach club, eau cristalline | Bikini terracotta, coverup crochet, bikini vert |
| **🌆 City** | Rues Rome, rooftop Barcelona, balcon Paris | Robe dos nu, mini jupe + crop top, slip dress |

### Captions par thème

**Ski :**
- "Cette fois au sauna après le ski 🎿🔥"
- "Best part of skiing is the après-ski 🧖‍♀️"
- "Chalet vibes & hot chocolate 🏔️☕"

**Beach :**
- "Miss this view already 🌴"
- "Vitamin Sea loading ☀️🌊"
- "Paradise found 🏝️"

**City :**
- "Lost in the streets of Rome 🇮🇹"
- "Barcelona nights 🌃✨"
- "Paris, mon amour 🗼"

### Pipeline technique

```
GitHub Actions (cron 18h UTC = 19h Paris)
    ↓
node scripts/vacation-reel-post.mjs [theme]
    ↓
1. Déterminer thème du jour (rotation ski→beach→city)
    ↓
2. Photo 1 - Nano Banana Pro 9:16 vertical (~50s)
    ↓ Upload Cloudinary
3. Photo 2 - avec Photo 1 en scene ref (~60s)
    ↓ Upload Cloudinary
4. Photo 3 - avec Photo 1 en scene ref (~60s)
    ↓ Upload Cloudinary
5. FFmpeg slideshow (3 photos × 3s = 9s vidéo)
    ↓ Upload Cloudinary vidéo
6. Génération caption
    ↓
7. Instagram Graph API - Reel publish (media_type: REELS)
    ↓
✅ Reel vidéo publié !
```

### Création vidéo slideshow

Utilisation de **FFmpeg** (installé automatiquement dans GitHub Actions) :

```bash
ffmpeg -f concat -safe 0 -i list.txt \
  -vf "scale=1080:1920,fps=30" \
  -c:v libx264 -pix_fmt yuv420p \
  -t 9 output.mp4
```

**Paramètres vidéo :**
- Résolution : 1080×1920 (9:16 vertical)
- FPS : 30
- Durée : 9 secondes (3 photos × 3s)
- Codec : H.264 (compatible Instagram)

### Commandes

```bash
# Test local (sans publier)
node scripts/vacation-reel-post.mjs ski true
node scripts/vacation-reel-post.mjs beach true
node scripts/vacation-reel-post.mjs city true

# Publication réelle
node scripts/vacation-reel-post.mjs auto      # Rotation automatique
node scripts/vacation-reel-post.mjs ski       # Forcer thème ski
node scripts/vacation-reel-post.mjs beach     # Forcer thème beach
```

---

## 🌟 Système 4 : Elena Vacation Reels

### Description

Génère et publie automatiquement un Reel vidéo (slideshow 9 secondes) d'Elena sur un thème de vacances luxe.

### Fichiers

| Fichier | Description |
|---------|-------------|
| `app/scripts/vacation-reel-post-elena.mjs` | Script principal |
| `.github/workflows/vacation-reel-elena.yml` | GitHub Action |

### Horaire (optimisé)

**21h Paris** (20h UTC hiver) — **4x/semaine** (Mer, Jeu, Sam, Dim)

> ℹ️ Décalé de 2h vs Mila (19h) pour éviter la cannibalisation.

### Rotation des thèmes Elena

Les 3 thèmes tournent automatiquement basé sur le jour de l'année :

| Thème | Settings | Outfits Sexy |
|-------|----------|--------------|
| **♨️ Spa** | Spa alpin luxe, infinity pool neige, chalet fireplace | Maillot plongeant, bikini designer, pull cashmere |
| **🌆 City** | Rooftop Milan, rues Paris, piazza Rome | Silk dress décolleté, blazer cropped, top backless |
| **⛵ Yacht** | Deck yacht Méditerranée, bow sunset, lounge interior | Bikini blanc, sarong terracotta, coverup sheer |

### Captions par thème Elena

**Spa :**
- "Spa days in the Alps 🏔️✨"
- "This view > everything 🎿"
- "Après-ski is my sport ♨️"

**City :**
- "Milano nights 🇮🇹✨"
- "Paris mon amour 🗼"
- "Aperitivo hour is sacred 🥂"

**Yacht :**
- "Yacht life chose me ⛵"
- "Mediterranean state of mind 🌊"
- "Living the dream 🛥️"

### Commandes Elena

```bash
# Test local (sans publier)
node scripts/vacation-reel-post-elena.mjs spa true
node scripts/vacation-reel-post-elena.mjs city true
node scripts/vacation-reel-post-elena.mjs yacht true

# Publication réelle
node scripts/vacation-reel-post-elena.mjs auto      # Rotation automatique
node scripts/vacation-reel-post-elena.mjs spa       # Forcer thème spa
node scripts/vacation-reel-post-elena.mjs yacht     # Forcer thème yacht
```

---

## 🔧 Configuration GitHub Actions

### Secrets requis

Les secrets suivants doivent être configurés dans **GitHub → Settings → Secrets → Actions** :

#### Secrets communs

| Secret | Description |
|--------|-------------|
| `REPLICATE_API_TOKEN` | Token API Replicate (Nano Banana Pro) |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |

#### Secrets Mila

| Secret | Description |
|--------|-------------|
| `INSTAGRAM_ACCESS_TOKEN` | Token Instagram Graph API Mila |
| `INSTAGRAM_ACCOUNT_ID` | ID du compte Instagram Business Mila |

#### Secrets Elena

| Secret | Description |
|--------|-------------|
| `INSTAGRAM_ACCESS_TOKEN_ELENA` | Token Instagram Graph API Elena |
| `INSTAGRAM_ACCOUNT_ID_ELENA` | ID du compte Instagram Business Elena |
| `ELENA_PRIMARY_FACE_URL` | URL Cloudinary face ref principale |
| `ELENA_FACE_REF_1` | URL Cloudinary face ref secondaire 1 |
| `ELENA_FACE_REF_2` | URL Cloudinary face ref secondaire 2 |

### Déclencher manuellement

Les workflows peuvent être déclenchés manuellement depuis l'onglet **Actions** sur GitHub :

1. Aller sur `github.com/[user]/[repo]/actions`
2. Sélectionner le workflow (`Mila Auto Post`, `Elena Auto Post`, ou `Mila Vacation Reel`)
3. Cliquer **Run workflow**
4. Choisir les options (slot/theme, test mode)
5. Cliquer **Run workflow** (vert)

---

## 📊 Comparaison Carousel vs Reel

| Aspect | Carousel | Reel |
|--------|----------|------|
| **Format API** | `media_type: CAROUSEL` | `media_type: REELS` |
| **Média** | `image_url` × 3 | `video_url` (slideshow) |
| **Aspect ratio** | 4:5 (1080×1350) | 9:16 (1080×1920) |
| **Reach algorithme** | Bon | **Meilleur** (4x) |
| **Engagement** | Swipe manuel | Auto-play |
| **Durée génération** | ~3-4 min | ~5-6 min |
| **Dépendances** | Replicate, Cloudinary | + FFmpeg |

---

## 🛠️ Dépendances techniques

### Pour Carousel Auto-Post

```bash
npm install replicate
```

### Pour Vacation Reels

```bash
npm install replicate
# FFmpeg requis (installé automatiquement dans GitHub Actions)
sudo apt-get install -y ffmpeg
```

---

## 📁 Structure des fichiers générés

```
app/generated/
├── mila-carousel/                    # Carrousels auto-post
│   └── [images cloudinary]
└── vacation-reels/                   # Reels vacances
    ├── ski/
    │   ├── ski-1-[timestamp].jpg
    │   ├── ski-2-[timestamp].jpg
    │   ├── ski-3-[timestamp].jpg
    │   └── ski-reel-[timestamp].mp4
    ├── beach/
    │   └── ...
    └── city/
        └── ...
```

---

## 🔍 Debugging

### Logs GitHub Actions

1. Aller sur l'onglet **Actions**
2. Cliquer sur le run qui a échoué
3. Développer le step `Generate and Post Carousel/Reel`
4. Analyser les logs

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Missing REPLICATE_API_TOKEN` | Secret non configuré | Ajouter le secret dans GitHub |
| `Prompt flagged as sensitive` | Safety filter | Le fallback devrait gérer automatiquement |
| `Instagram API error` | Token expiré | Régénérer le token (voir 12-DEPLOYMENT.md) |
| `FFmpeg not found` | FFmpeg non installé | Ajouter step `apt-get install ffmpeg` |
| `Video processing timeout` | Instagram lent | Augmenter `maxWaitMs` (défaut 5min) |

---

## 🚀 Évolutions futures

- [ ] Ajouter musique trending aux Reels (Instagram API)
- [ ] Stories automatiques (5-10/jour)
- [ ] A/B testing des captions
- [ ] Analytics automatiques post-publication
- [x] ~~Nouveaux thèmes vacances (spa, yacht, safari...)~~ — Elena a spa, yacht, city
- [ ] Reels vidéo AI (Kling/Minimax au lieu de slideshow)

---

*Dernière mise à jour : 18 décembre 2024*




